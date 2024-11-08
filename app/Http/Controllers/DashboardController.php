<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

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

        $stockSummarySql = "SELECT shop, cost, mrp, stock
        FROM v_stocksummary
        WHERE shopid in ($shop_id)";

        $stockSummary = DB::select($stockSummarySql);

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
            'stockSummary' => $stockSummary,
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

    public function report(Request $request)
    {
        $shop_id = $request->shop_id == 0 ? auth()->user()->shops : $request->shop_id;
        $from_date = $request->from_date;
        $to_date = $request->to_date;
        return Inertia::render('Dashboard', $this->getDashboardData($from_date, $to_date, $shop_id));
    }
}
