<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ReceivedController extends Controller
{
    public function show(Request $request)
    {
        $shopIds = $request->user()->shops;
        $shopIdArray = explode(',', $shopIds);
        $shops = DB::table('shops as s')
            ->whereIn('s.shopid', $shopIdArray)
            ->select('s.shopid', 's.shopname')
            ->get();
        $result = session('received_report', []);
        session()->forget('received_report');

        $reportStyle = session('report_style', '');
        session()->forget('report_style');


        return Inertia::render('Received', ['shops' => $shops, 'result' => $result, 'reportStyle' => $reportStyle]);
    }

    public function report(Request $request)
    {
        $data =  $request->validate([
            'report' => 'required',
            'shop_id' => 'required',
            'start_date' => 'required',
            'end_date' => 'required'
        ]);

        if ($data['report'] == "summary") {
            $sql = "SELECT M.Id id,M.DeliveryCode delivery_code,CONVERT(DATE,M.DeliveryDate) date,
            SUM(D.Quantity) quantity, SUM(D.Quantity * D.CostPrice) cp, SUM(D.Quantity * D.RetailPrice) rp
            FROM ReceivedMaster M
            INNER JOIN ReceivedDetails D ON M.Id = D.Id AND CONVERT(DATE,M.DeliveryDate) BETWEEN '{$data['start_date']}' AND '{$data['end_date']}'";

            if ($data['shop_id'] > 0) {
                $sql .= " AND M.DeliveryTo = {$data['shop_id']}";
            }

            $sql .= " INNER JOIN ProductMaster P ON P.PluID = D.PluID
            GROUP BY M.Id,M.DeliveryCode,M.DeliveryDate
            ORDER BY M.Id DESC";
            session(['report_style' => 'summary']);
            $result = DB::select($sql);
        }


        if ($data['report'] == "details") {

            $sql = "SELECT M.DeliveryCode delivery_code,CONVERT(DATE,M.DeliveryDate) date,
            P.Plucode barcode, D.Quantity quantity, D.Quantity * D.CostPrice cp,D.Quantity * D.RetailPrice rp
            FROM ReceivedMaster M
            INNER JOIN ReceivedDetails D ON M.Id = D.Id AND CONVERT(DATE,M.DeliveryDate) BETWEEN '{$data['start_date']}' AND '{$data['end_date']}'";

            if ($data['shop_id'] > 0) {
                $sql .= " AND M.DeliveryTo = {$data['shop_id']}";
            }

            $sql .= " INNER JOIN ProductMaster P ON P.PluID = D.PluID
            ORDER BY M.Id DESC";

            session(['report_style' => 'details']);
            $result = DB::select($sql);
        }

        session(['received_report' => $result]);

        return redirect()->route('received');
    }
}
