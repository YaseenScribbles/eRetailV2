<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class CostVsSaleController extends Controller
{

    public function show(Request $request)
    {
        $shop_ids = auth()->user()->shops;
        $shops = DB::select("select shopid,shopname from shops where shopid in ({$shop_ids})");
        $report = session('report',[]);
        session()->forget('report');

        return Inertia::render('CvS', ['shops' => $shops, 'report' => $report]);
    }

    public function report(Request $request)
    {

        $data = $request->validate([
            'from_date' => 'required|string',
            'to_date' => 'required|string',
            'shop_id' => 'required|numeric',
        ]);
        $shop_ids = auth()->user()->shops;

        $sql = "SELECT s.shopname, ROUND(SUM(p.costprice * d.qty), 2) AS costvalue, ROUND(SUM(d.amount), 2) AS salevalue
        FROM billdetails d
        INNER JOIN billmaster m ON d.billid = m.billid
        AND m.billdt BETWEEN '{$data['from_date']}' AND '{$data['to_date']}'
        AND " . ($data['shop_id'] == 0 ? "m.shopid IN ($shop_ids)" : "m.shopid = {$data['shop_id']}") . "
        INNER JOIN pricemaster p ON p.shopid = m.shopid AND d.pluid = p.pluid
        INNER JOIN shops s ON s.shopid = m.shopid
        GROUP BY s.shopname";

        $data = DB::select($sql);

        session(['report' => $data]);
        return to_route('cvs');
    }
}
