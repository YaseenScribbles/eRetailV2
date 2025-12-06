<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class StockController extends Controller
{
    public function show(Request $request)
    {
        $shopIds = $request->user()->shops;
        $shopIdArray = explode(',', $shopIds);
        $shops = DB::table('shops as s')
            ->whereIn('s.shopid', $shopIdArray)
            ->select('s.shopid', 's.shopname')
            ->get();
        $result = session('stock_report', []);
        $reportStyle = session('report_style', '');
        session()->forget('stock_report');
        session()->forget('report_style');

        return Inertia::render('Stock', ['shops' => $shops, 'result' => $result, 'report_style' => $reportStyle]);
    }

    public function report(Request $request)
    {

        $data =  $request->validate([
            'report' => 'required',
            'shop_id' => 'required',
        ]);


        if ($data['report'] == "summary") {

            $sql = "SELECT LEFT(A.Department,DATALENGTH(A.Department) - 4 ) + '-' + A.Category product,SUM(ST.stock) stock,
            SUM(ST.stock * PM.CostPrice) cp,SUM(ST.stock * PM.RetailPrice) rp
            FROM V_STOCKPOS ST
            INNER JOIN PriceMaster PM ON PM.PluId = ST.Pluid AND PM.ShopId = {$data['shop_id']}
            INNER JOIN SHOPS S ON S.ShopID = ST.location_id";

            if ($data['shop_id'] > 0) {
                $sql .= " AND S.ShopId = {$data['shop_id']}";
            }
            $sql .= " INNER JOIN ProductAttributes A ON A.PluId = ST.PluID
            GROUP BY A.Department,A.Category";

            $result = DB::select($sql);
            session(['report_style' => 'summary']);
        }
        if ($data['report'] == "details") {

            $sql = "SELECT A.Department department, A.Category category, A.Type type,
            P.Plucode barcode,P.Pluname description,P.Id size,ST.stock stock,PM.CostPrice cp,PM.RetailPrice rp,SUM(ST.stock * PM.CostPrice) totcp,
            SUM(ST.stock * PM.RetailPrice) totrp, COALESCE(D.[Days], 0) [days]
            FROM V_STOCKPOS ST
            INNER JOIN PriceMaster PM ON PM.PluId = ST.PluID AND PM.ShopId = {$data['shop_id']} AND ST.stock > 0
            INNER JOIN SHOPS S ON S.ShopID = ST.location_id";

            if ($data['shop_id'] > 0) {
                $sql .= " AND S.ShopId = {$data['shop_id']}";
            }

            $sql .= " INNER JOIN PRODUCTMASTER P ON P.PluID = ST.pluid
            INNER JOIN ProductAttributes A ON A.PluId = P.PluID
            LEFT JOIN DueDays D ON ST.location_id = D.ShopId AND ST.PluId = D.PLuId
            GROUP BY A.Department,A.Category,A.Type,P.Plucode,ST.Stock,PM.CostPrice,PM.RetailPrice,P.Pluname,P.Id,D.[Days]";

            $result = DB::select($sql);
            session(['report_style' => 'details']);
        }

        session(['stock_report' => $result]);

        return redirect()->route('stock');
    }
}
