<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class BarcodeController extends Controller
{
    public function index()
    {
        $productsSql = "SELECT CatalogId, Catalog FROM TSCatalog";
        $products = DB::select($productsSql);

        $summary = session('barcode_summary', []);
        session()->forget('barcode_summary');
        $stock = session('barcode_stock', []);
        session()->forget('barcode_stock');
        $sales = session('barcode_sales', []);
        session()->forget('barcode_sales');
        $delivery = session('barcode_delivery', []);
        session()->forget('barcode_delivery');
        return inertia('Barcode', compact('summary', 'stock', 'sales', 'delivery', 'products'));
    }

    public function report(Request $request)
    {
        $data = $request->validate([
            'barcode' => 'nullable|string|exists:productmaster,plucode',
            'product_id' => 'nullable|numeric|exists:tscatalog,catalogid'
        ]);

        if ($request->barcode) {
            $summary = $this->getBarcodeSummary($data['barcode']);
            session(['barcode_summary' => $summary]);
        }
        $stock = $this->getStock($data['barcode'], $data['product_id']);
        session(['barcode_stock' => $stock]);
        $sales = $this->getSales($data['barcode'], $data['product_id']);
        session(['barcode_sales' => $sales]);
        $delivery = $this->getDelivery($data['barcode'], $data['product_id']);
        session(['barcode_delivery' => $delivery]);

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

            $report = DB::select($sql);

            return $report;
        } catch (\Throwable $th) {
            //throw $th;
            return [];
        }
    }

    public function getStock($barcode, $product_id)
    {
        try {
            //code...
            $shop_ids = auth()->user()->shops;

            $dynamic_columns = $barcode
            ? "PM.CostPrice, PM.RetailPrice"
            : "SUM(ST.stock * PM.CostPrice) AS CostPrice, SUM(ST.stock * PM.RetailPrice) AS RetailPrice";

            $sql = "SELECT S.ShopName, SUM(ST.stock) stock, $dynamic_columns
            FROM v_stockpos ST
            INNER JOIN ProductMaster P ON P.PluID = ST.pluid
            INNER JOIN Shops S ON S.ShopID = ST.location_id AND S.ShopId IN ($shop_ids)
            INNER JOIN PriceMaster PM ON PM.PluId = P.PluId AND PM.ShopId = ST.location_id
            INNER JOIN ProductAttributes A ON A.PluId = ST.PluId";

            if ($barcode) {
                $sql .= " WHERE P.Plucode = '$barcode' GROUP BY S.ShopName, PM.CostPrice, PM.RetailPrice";
            } else {
                $sql .= " WHERE A.CatalogId = $product_id GROUP BY S.ShopName";
            }

            Log::info($sql);

            $report = DB::select($sql);

            return $report;
        } catch (\Throwable $th) {
            //throw $th;
            return [];
        }
    }

    public function getSales($barcode, $product_id)
    {
        try {
            //code...
            $shop_ids = auth()->user()->shops;
            $sql = "SELECT S.ShopName, SUM(BD.Qty) Sales, SUM(BD.Amount) Amount
            FROM BillDetails BD
            INNER JOIN ProductMaster P ON P.PluID = BD.pluid
            INNER JOIN Shops S ON S.ShopID = BD.ShopID AND S.ShopId IN ($shop_ids)
            INNER JOIN ProductAttributes A ON A.PluId = BD.PluId";


            if ($barcode) {
                $sql .= " WHERE P.Plucode = '$barcode'";
            } else {
                $sql .= " WHERE A.CatalogId = $product_id";
            }

            $sql .= " GROUP BY S.ShopName";

            $report = DB::select($sql);

            return $report;
        } catch (\Throwable $th) {
            //throw $th;
            return [];
        }
    }

    public function getDelivery($barcode, $product_id)
    {
        try {
            //code...
            $shop_ids = auth()->user()->shops;
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
                $sql .= " WHERE A.CatalogId = $product_id";
            }

            $sql  .= " GROUP BY DM.DeliveryCode, S2.ShopName, S1.ShopName, DM.DeliveryDate, RM.DeliveryDate ORDER BY DM.DeliveryDate DESC";

            $report = DB::select($sql);

            return $report;
        } catch (\Throwable $th) {
            //throw $th;
            return [];
        }
    }
}
