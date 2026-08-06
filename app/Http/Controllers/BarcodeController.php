<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class BarcodeController extends Controller
{
    // TEMPORARY: query-level timing instrumentation for diagnosing slow
    // multi-product loads. Remove once the bottleneck is identified/fixed.
    private function timedSelect(string $label, string $sql): array
    {
        $start = microtime(true);
        $result = DB::select($sql);
        $ms = round((microtime(true) - $start) * 1000, 1);
        Log::info("[BarcodeReport timing] {$label}: {$ms}ms, " . count($result) . ' rows');
        return $result;
    }

    public function index()
    {
        $productsSql = "SELECT CatalogId, Catalog FROM TSCatalog";
        $products = DB::select($productsSql);

        $summary = session('barcode_summary', []);
        session()->forget('barcode_summary');
        $delivery = session('barcode_delivery', []);
        session()->forget('barcode_delivery');
        $location_report = session('barcode_location_report', []);
        session()->forget('barcode_location_report');
        $product_summary = session('barcode_product_summary', []);
        session()->forget('barcode_product_summary');
        return inertia('Barcode', compact('summary', 'delivery', 'products', 'location_report', 'product_summary'));
    }

    public function report(Request $request)
    {
        $data = $request->validate([
            'barcode' => 'nullable|string|exists:productmaster,plucode',
            'product_ids' => 'nullable|array',
            'product_ids.*' => 'integer|exists:tscatalog,catalogid',
            'include_delivery' => 'nullable|boolean',
        ]);

        $barcode = $data['barcode'] ?? null;
        $productIds = $data['product_ids'] ?? [];
        $includeDelivery = $data['include_delivery'] ?? false;

        if (!$barcode && empty($productIds)) {
            return back()->withErrors(['barcode' => 'Please fill / select one']);
        }

        $requestStart = microtime(true);

        if ($barcode) {
            $summary = $this->getBarcodeSummary($barcode);
            session(['barcode_summary' => $summary]);
        }
        if ($includeDelivery) {
            $delivery = $this->getDelivery($barcode, $productIds);
            session(['barcode_delivery' => $delivery]);
        }
        $productSearchRows = $this->getProductSearchData($barcode, $productIds);
        $locationReport = $this->buildLocationReport($productSearchRows);
        session(['barcode_location_report' => $locationReport]);
        $productSummary = $this->buildProductSummary($productSearchRows);
        session(['barcode_product_summary' => $productSummary]);

        $totalMs = round((microtime(true) - $requestStart) * 1000, 1);
        Log::info("[BarcodeReport timing] TOTAL: {$totalMs}ms, product_count=" . count($productIds));

        return to_route('barcode');
    }


    public function getBarcodeSummary($barcode)
    {
        try {
            //code...
            $sql = "SELECT P.Plucode [Barcode], P.Pluname [Desc], P.ID [Size],
            V.VendorName [Supplier], GD.GRNNo, CONVERT(DATE, GD.GRNDt) GRNDt, GM.InvNo,
            CONVERT(DATE, GM.InvDt) InvDt, P.HSNCode, A.Department, A.Category, A.Style, A.Pattern,
            A.Material, A.Color, A.Sleeve, A.Brand, A.Catalog
            FROM ProductMaster P
            INNER JOIN GRNDetails GD ON P.PluID = GD.PluID
            INNER JOIN GRNMaster GM ON GM.GrnNo = GD.GRNNo
            INNER JOIN Vendors V ON V.VendorID = P.VendorID
            INNER JOIN ProductAttributes A ON A.PluId = P.PluID
            WHERE P.Plucode = '$barcode'";

            $report = $this->timedSelect('getBarcodeSummary', $sql);

            return $report;
        } catch (\Throwable $th) {
            //throw $th;
            return [];
        }
    }

    // Intersects the shops the user is permitted to see with shops currently
    // marked active in ShopSettings, so inactive shops don't add load to
    // per-shop queries. Falls back to '0' (matches nothing) if that leaves
    // no shops, so callers never build an invalid empty IN ().
    private function getActiveShopIds(): string
    {
        $userShopIds = array_map('intval', explode(',', auth()->user()->shops));
        $activeShopIds = array_column(DB::select('SELECT ShopId FROM ShopSettings WHERE Active = 1'), 'ShopId');
        $shopIds = array_intersect($userShopIds, $activeShopIds);

        return $shopIds ? implode(',', $shopIds) : '0';
    }

    public function getDelivery($barcode, $product_ids)
    {
        try {
            //code...
            $shop_ids = $this->getActiveShopIds();
            $sql = "SELECT DM.DeliveryCode, S2.ShopName [From], S1.ShopName [To], SUM(DD.Quantity) Qty,
            CONVERT(DATE, DM.DeliveryDate) [DeliveryDate],
            CONVERT(DATE, RM.DeliveryDate) [ReceivedDate]
            FROM DeliveryDetails DD
            INNER JOIN ProductMaster P ON P.PluID = DD.PluID
            INNER JOIN DeliveryMaster DM ON DM.Id = DD.Id
            INNER JOIN ReceivedMaster RM ON DM.DeliveryCode = RM.DeliveryCode
            INNER JOIN Shops S1 ON S1.ShopID = DM.DeliveryTo AND S1.ShopId IN ($shop_ids)
            INNER JOIN Shops S2 ON S2.ShopID = DM.DeliveryFrom
            INNER JOIN ProductAttributes A ON A.PluId = DD.PluId";

            if ($barcode) {
                $sql .= " WHERE P.Plucode = '$barcode'";
            } else {
                $ids = implode(',', array_map('intval', $product_ids));
                $sql .= " WHERE A.CatalogId IN ($ids)";
            }

            $sql  .= " GROUP BY DM.DeliveryCode, S2.ShopName, S1.ShopName, DM.DeliveryDate, RM.DeliveryDate ORDER BY DM.DeliveryDate DESC";

            $report = $this->timedSelect('getDelivery', $sql);

            return $report;
        } catch (\Throwable $th) {
            //throw $th;
            return [];
        }
    }

    // Single source for both Location Report and Product Summary — one row
    // per PluID+ShopID. Same shape as V_ProductSearch, but inlined here
    // instead of querying that view: a plain view can't take parameters, so
    // its CTEs had to fully aggregate GRNDetails/BillDetails/v_stockpos for
    // EVERY product before the outer WHERE filtered it down — same cost
    // whether 1 product or 500 were selected. Joining every CTE to a
    // FilteredProducts CTE up front forces the product/shop filter to apply
    // before aggregation instead of after.
    public function getProductSearchData($barcode, $product_ids)
    {
        try {
            $shop_ids = $this->getActiveShopIds();
            $productFilter = $barcode
                ? "P.Plucode = '$barcode'"
                : "A.CatalogId IN (" . implode(',', array_map('intval', $product_ids)) . ")";

            $sql = "WITH FilteredProducts AS (
                SELECT A.PluId, A.CatalogId, A.Catalog
                FROM ProductAttributes A
                INNER JOIN ProductMaster P ON P.PluID = A.PluId
                WHERE $productFilter
            ),
            PurchaseData AS (
                SELECT D.PluID, FP.CatalogId, FP.Catalog, SUM(D.Qty) Qty
                FROM GRNDetails D
                INNER JOIN FilteredProducts FP ON D.PluID = FP.PluId
                GROUP BY D.PluID, FP.CatalogId, FP.Catalog
            ),
            SalesData AS (
                SELECT D.ShopID, D.PluID, SUM(D.Qty) Qty, SUM(D.Amount) Amount
                FROM BillDetails D
                INNER JOIN FilteredProducts FP ON D.PluID = FP.PluId
                WHERE D.ShopID IN ($shop_ids)
                GROUP BY D.ShopID, D.PluID
            ),
            StockData AS (
                SELECT S.location_id, S.pluid, S.stock
                FROM v_stockpos S
                INNER JOIN FilteredProducts FP ON S.pluid = FP.PluId
                WHERE S.location_id IN ($shop_ids)
            ),
            ReceivedData AS (
                SELECT D.PluID, M.DeliveryTo, MIN(M.DeliveryDate) Date
                FROM ReceivedMaster M
                INNER JOIN ReceivedDetails D ON M.Id = D.Id
                INNER JOIN FilteredProducts FP ON D.PluID = FP.PluId
                WHERE M.DeliveryTo IN ($shop_ids)
                GROUP BY D.PluID, M.DeliveryTo
            ),
            DeliveryData AS (
                SELECT PluID, SUM(NetQty) DeliveredQty
                FROM (
                    SELECT DD.PluID, SUM(DD.Quantity) NetQty
                    FROM DeliveryDetails DD
                    INNER JOIN DeliveryMaster DM ON DM.Id = DD.Id
                    INNER JOIN FilteredProducts FP ON DD.PluID = FP.PluId
                    WHERE DM.DeliveryTo IN ($shop_ids)
                    GROUP BY DD.PluID
                    UNION ALL
                    SELECT DD.PluID, -SUM(DD.Quantity) NetQty
                    FROM DeliveryDetails DD
                    INNER JOIN DeliveryMaster DM ON DM.Id = DD.Id
                    INNER JOIN FilteredProducts FP ON DD.PluID = FP.PluId
                    WHERE DM.DeliveryFrom IN ($shop_ids)
                    GROUP BY DD.PluID
                ) NetDeliveries
                GROUP BY PluID
            )
            SELECT P.PluID, P.CatalogId, P.Catalog,
                   R.DeliveryTo [ShopID], SH.ShopName,
                   ISNULL(S.Qty,0) [SalesQty], ISNULL(S.Amount,0) [SalesAmount],
                   ISNULL(ST.stock,0) Stock, R.Date [FirstDeliveredDate],
                   ISNULL(DV.DeliveredQty,0) [DeliveredQty]
            FROM PurchaseData P
            INNER JOIN ReceivedData R ON R.PluID = P.PluID
            INNER JOIN Shops SH ON SH.ShopID = R.DeliveryTo
            LEFT JOIN SalesData S ON R.PluID = S.PluID AND R.DeliveryTo = S.ShopID
            LEFT JOIN StockData ST ON R.PluID = ST.pluid AND ST.location_id = R.DeliveryTo
            LEFT JOIN DeliveryData DV ON DV.PluID = R.PluID";

            return $this->timedSelect('getProductSearchData', $sql);
        } catch (\Throwable $th) {
            //throw $th;
            return [];
        }
    }

    // Aggregates the shared dataset per Catalog+Shop (Purchase is
    // deliberately excluded — it's location-agnostic, see buildProductSummary).
    public function buildLocationReport(array $rows)
    {
        $grouped = [];
        foreach ($rows as $r) {
            $key = $r->CatalogId . '|' . $r->ShopName;
            if (!isset($grouped[$key])) {
                $grouped[$key] = [
                    'CatalogId' => $r->CatalogId,
                    'Catalog' => $r->Catalog,
                    'ShopName' => $r->ShopName,
                    'Stock' => 0,
                    'SalesQty' => 0,
                    'SalesAmount' => 0,
                    'FirstDeliveredDate' => null,
                    'DaysSinceFirstDelivery' => null,
                ];
            }
            $grouped[$key]['Stock'] += $r->Stock ?? 0;
            $grouped[$key]['SalesQty'] += $r->SalesQty ?? 0;
            $grouped[$key]['SalesAmount'] += $r->SalesAmount ?? 0;
            if ($r->FirstDeliveredDate !== null) {
                if (
                    $grouped[$key]['FirstDeliveredDate'] === null ||
                    $r->FirstDeliveredDate < $grouped[$key]['FirstDeliveredDate']
                ) {
                    $grouped[$key]['FirstDeliveredDate'] = $r->FirstDeliveredDate;
                }
            }
        }

        $today = new \DateTime('today');
        foreach ($grouped as &$row) {
            if ($row['FirstDeliveredDate'] !== null) {
                $delivered = new \DateTime($row['FirstDeliveredDate']);
                $delivered->setTime(0, 0, 0);
                $row['DaysSinceFirstDelivery'] = $today->diff($delivered)->days;
            }
        }

        return array_values($grouped);
    }

    // Aggregates the shared dataset per Catalog, across all shops. Delivered
    // qty is repeated per shop a PluID was received at (one DeliveryData row
    // fanned out by ReceivedData in V_ProductSearch), so it's summed once
    // per distinct PluID rather than once per row to avoid overcounting.
    public function buildProductSummary(array $rows)
    {
        $grouped = [];
        $seenDeliveredPlu = [];
        foreach ($rows as $r) {
            if (!isset($grouped[$r->CatalogId])) {
                $grouped[$r->CatalogId] = [
                    'CatalogId' => $r->CatalogId,
                    'Catalog' => $r->Catalog,
                    'DeliveredQty' => 0,
                    'SalesQty' => 0,
                    'SalesAmount' => 0,
                    'Stock' => 0,
                ];
            }
            $grouped[$r->CatalogId]['SalesQty'] += $r->SalesQty ?? 0;
            $grouped[$r->CatalogId]['SalesAmount'] += $r->SalesAmount ?? 0;
            $grouped[$r->CatalogId]['Stock'] += $r->Stock ?? 0;

            if (!isset($seenDeliveredPlu[$r->PluID])) {
                $seenDeliveredPlu[$r->PluID] = true;
                $grouped[$r->CatalogId]['DeliveredQty'] += $r->DeliveredQty ?? 0;
            }
        }

        return array_values($grouped);
    }
}
