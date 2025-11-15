<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{

    public function getDashboardData($from_date, $to_date, $shop_id)
    {

        // Determine the date range based on input
        $fromDate = $from_date === '' ? 'convert(date, getdate())' : "'$from_date'";
        $toDate = $to_date === '' ? 'convert(date, getdate())' : "'$to_date'";

        $shopwiseSalesSql = "select S.ShopName shop,SUM(BM.TotQty) qty,SUM(BM.TotAmt) amount
        from BillMaster BM
        INNER JOIN Shops S ON BM.ShopID = S.ShopID AND BM.ShopId IN ($shop_id)
        where BM.BillDt BETWEEN $fromDate AND  $toDate
        GROUP BY S.ShopName";
        $shopwiseSales = DB::select($shopwiseSalesSql);

        $settlementSql = "SELECT A.shop, SUM(A.cash) cash, SUM(A.card) card, SUM(A.upi) upi
        FROM
        (SELECT S.ShopName shop,
        CASE WHEN BP.PaymentID = 1 THEN SUM(BP.Paid - BP.Refund) ELSE 0 END AS cash,
        CASE WHEN BP.PaymentID = 2 THEN SUM(BP.Paid - BP.Refund) ELSE 0 END AS card,
        CASE WHEN BP.PaymentID = 3 THEN SUM(BP.Paid - BP.Refund) ELSE 0 END AS upi
        FROM BillPayments BP
        INNER JOIN Shops S ON S.ShopID = BP.ShopID AND BP.ShopId IN ($shop_id)
        WHERE BP.BillDt between $fromDate AND  $toDate
        GROUP BY S.ShopName, BP.PaymentID) A
        GROUP BY A.shop";

        $settlement = DB::select($settlementSql);

        $top10ProductsSql = "SELECT TOP 10 A.Catalog product, SUM(BD.Qty) qty
        FROM BillDetails BD
        INNER JOIN ProductAttributes A ON A.PluId = BD.PluID
        AND BD.ShopId IN ($shop_id)
        AND BD.BillDt BETWEEN $fromDate AND  $toDate
        AND BD.Qty > 0
        GROUP BY A.Catalog
        ORDER BY qty DESC";

        $top10Products = DB::select($top10ProductsSql);

        $top10ReturnProductsSql = "SELECT TOP 10 A.Catalog product, SUM(BD.Qty) * -1 qty
        FROM BillDetails BD
        INNER JOIN ProductAttributes A ON A.PluId = BD.PluID
        AND BD.ShopId IN ($shop_id)
        AND BD.BillDt BETWEEN $fromDate AND  $toDate
        AND BD.Qty < 0
        GROUP BY A.Catalog
        ORDER BY qty DESC";

        $top10ReturnProducts = DB::select($top10ReturnProductsSql);

        // $stockSummarySql = "SELECT shop, cost, mrp, stock
        // FROM v_stocksummary
        // WHERE shopid in ($shop_id)";

        // $stockSummary = DB::select($stockSummarySql);

        $top10CategorySql = "SELECT TOP 10 A.Category category,SUM(BD.Qty) qty
        FROM BillDetails BD
        INNER JOIN ProductAttributes A ON A.PluId = BD.PluID
        AND BD.ShopId IN ($shop_id)
        AND BD.BillDt BETWEEN $fromDate AND  $toDate
        AND BD.Qty > 0
        GROUP BY A.Category
        ORDER BY qty DESC";

        $top10Category = DB::select($top10CategorySql);

        return [
            'shopwiseSales' => $shopwiseSales,
            'settlement' => $settlement,
            'top10Products' => $top10Products,
            'top10ReturnProducts' => $top10ReturnProducts,
            // 'stockSummary' => $stockSummary,
            'top10Category' => $top10Category,
            'user' => auth()->user()
        ];
    }

    public function show(Request $request)
    {
        $shop_id =  auth()->user()->shops;
        $from_date = $request->has('from_date') ?  $request->from_date : "";
        $to_date = $request->has('to_date') ?  $request->to_date : "";

        return Inertia::render('Dashboard', $this->getDashboardData($from_date, $to_date, $shop_id));
    }

    public function stockSummaryReport()
    {
        $shop_id = auth()->user()->shops;
        $stockSummarySql = "SELECT shop, cost, mrp, stock
        FROM v_stocksummary
        WHERE shopid in ($shop_id)";

        $stockSummary = DB::select($stockSummarySql);
        collect($stockSummary)->each(function ($item) {
            $item->cost = number_format($item->cost, 2, '.', '');
            $item->mrp = number_format($item->mrp, 2, '.', '');
            $item->stock = number_format($item->stock, 2, '.', '');
        });

        return response()->json(['stockSummary' => $stockSummary]);
        // return Response($stockSummary);
    }

    public function getSalesPersonSummary(Request $request)
    {
        $shop_id = auth()->user()->shops;
        $from_date = $request->has('from_date') ?  $request->from_date : "";
        $to_date = $request->has('to_date') ?  $request->to_date : "";

        $fromDate = $from_date === '' ? 'convert(date, getdate())' : "'$from_date'";
        $toDate = $to_date === '' ? 'convert(date, getdate())' : "'$to_date'";

        $salesPersonSummarySql = "SELECT SUBSTRING(S.ShopName, 7, (LEN(S.ShopName) - 5)) Shop, ISNULL(SP.Name, 'NOT GIVEN') [Person], SUM(BD.Qty) Qty, SUM(BD.Amount) Amount,
        SUM(
            CASE
                WHEN C.Type = 'PERCENT' THEN (BD.Amount * C.Value) / 100
                WHEN C.Type = 'VALUE' THEN BD.Qty * C.Value
                ELSE 0
            END
        ) [Earned]
        FROM BillDetails BD
        INNER JOIN Shops S ON S.ShopID = BD.ShopID
        LEFT JOIN BillSalePersons BSP ON BSP.BillId = BD.BillID AND BSP.PluId = BD.PluID AND BSP.ShopId = BD.ShopID
        LEFT JOIN SalesPersONs SP ON SP.ShopId = BD.ShopID AND SP.SPCode = BSP.SPID
        LEFT JOIN V_ActiveCommissionInfo C ON C.ShopId = BD.ShopID AND C.PluID = BD.PluID AND BD.BillDt BETWEEN C.BeginDate AND C.EndDate
        WHERE BD.BillDt BETWEEN $fromDate AND $toDate
        AND BD.ShopId IN ($shop_id)
        GROUP BY S.ShopName, SP.Name
        ORDER BY Qty DESC";

        $salesPersonSummary = DB::select($salesPersonSummarySql);

        collect($salesPersonSummary)->each(function ($item) {
            $item->Qty = (float) $item->Qty;
            $item->Amount =  number_format($item->Amount, 2, '.', '');
            $item->Earned = (float) $item->Earned;;
        });

        return response()->json(['salesPersons' => $salesPersonSummary]);
    }
}
