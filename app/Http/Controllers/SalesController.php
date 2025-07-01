<?php

namespace App\Http\Controllers;


use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class SalesController extends Controller
{
    public function show(Request $request)
    {
        $shopIds = $request->user()->shops;
        $shopIdArray = explode(',', $shopIds);
        $shops = DB::table('shops as s')
            ->whereIn('s.shopid', $shopIdArray)
            ->select('s.shopid', 's.shopname')
            ->get();
        $result = session('sales_report_result', []);
        session()->forget('sales_report_result');
        $reportStyle = session('report_style', '');
        session()->forget('report_style');

        return Inertia::render('Sales', ['shops' => $shops, 'result' => $result, 'reportStyle' => $reportStyle]);
    }

    public function report(Request $request)
    {
        $data =  $request->validate([
            'report' => 'required',
            'shop_id' => 'required',
            'start_date' => 'required',
            'end_date' => 'required'
        ]);

        $restricted_from_date = '';

        if ($data['shop_id'] > 0) {
            if (auth()->user()->sale_report !== 'ALL') {
                $query = "select tookoverat from shopsettings where shopid = {$data['shop_id']}";
                $restricted_from_date = DB::select($query);
                if ($restricted_from_date) {
                    $restricted_from_date = $restricted_from_date[0]->tookoverat;
                } else {
                    $restricted_from_date = '';
                }
            };
        }

        if ($data['report'] == "summary") {
            $sql = "SELECT BM.BillId bill_id,BM.BillNo bill_no,BM.BillDt bill_date,BM.TotQty total_qty,BM.TotAmt + BM.DisAmt total_amount,
            BM.DisAmt disc_amount,BM.TotAmt final_amount,C.CustomerName customer
            FROM BillMaster BM
            INNER JOIN Customers C ON C.CustomerID = BM.CustomerID";

            if ($data['shop_id'] > 0) {
                $sql .= " AND BM.ShopId = {$data['shop_id']}";
            }

            $sql .= " WHERE BM.BillDt BETWEEN '{$data['start_date']}' AND '{$data['end_date']}'";

            if ($restricted_from_date) {
                if (auth()->user()->sale_report === 'ESSA') {
                    $sql .= " AND BM.BillDt >= '{$restricted_from_date}'";
                } else {
                    $sql .= " AND BM.BillDt < '{$restricted_from_date}'";
                }
            }

            session(['report_style' => 'summary']);
            $result = DB::select($sql);
        }

        if ($data['report'] == "payment") {
            $sql = "SELECT BillDt bill_date,ISNULL(CASH,0) cash,
            ISNULL(CARD,0) card,ISNULL(UPI,0) upi, ISNULL(CASH,0) + ISNULL(CARD,0) + ISNULL(UPI,0) total
            FROM
            (SELECT P.BillDt,P.PaymentDesc, Paid-Refund Amount
            FROM BillPayments P
            WHERE P.BillDt BETWEEN '{$data['start_date']}' AND '{$data['end_date']}'";

            if ($restricted_from_date) {
                if (auth()->user()->sale_report === 'ESSA') {
                    $sql .= " AND P.BillDt >= '{$restricted_from_date}'";
                } else {
                    $sql .= " AND P.BillDt < '{$restricted_from_date}'";
                }
            }

            if ($data['shop_id'] > 0) {
                $sql .= " AND P.ShopId = {$data['shop_id']}";
            }

            $sql .= ") t
            PIVOT (
                    SUM(Amount)
                    FOR PaymentDesc IN (
                    [CASH],
                    [CARD],
                    [UPI])
                    ) AS pivot_table ORDER BY BillDt DESC";

            session(['report_style' => 'payment']);
            $result = DB::select($sql);
        }

        if ($data['report'] == "details") {

            $sql = "SELECT M.BillNo bill_no,M.BillDt bill_date, P.Plucode barcode,
            P.Pluname + '-' + P.ID description, D.Qty sale_qty,ROUND(D.Qty * PM.CostPrice,2) cost_price,
            D.Qty * D.ORate mrp,D.DisAmt discount,D.amount sale_price,P.HSNCode hsn_code,IIF(D.Rate > 1000, '12', '5') tax_perc,
            IIF(D.Rate > 1000,
            ROUND(D.Amount - ((CAST(100 AS FLOAT)/ CAST(112 AS FLOAT)) * D.Amount),2),
            ROUND(D.Amount- ((CAST(100 AS FLOAT)/ CAST(105 AS FLOAT)) * D.Amount),2)) sale_tax,
            IIF(D.Rate > 1000,
            ROUND(100 * (((CAST(100 AS FLOAT)/ CAST(112 AS FLOAT)) * D.Amount) - (D.Qty * PM.CostPrice))/(D.Qty * PM.CostPrice),2),
            ROUND(100 * (((CAST(100 AS FLOAT)/ CAST(105 AS FLOAT)) * D.Amount) - (D.Qty * PM.CostPrice))/(D.Qty * PM.CostPrice),2))  profit_perc
            FROM BillMaster M
            INNER JOIN BillDetails D ON M.BillID = D.BillID AND M.BillDt BETWEEN '{$data['start_date']}' AND '{$data['end_date']}' AND D.Qty <> 0
            INNER JOIN ProductMaster P ON P.PluID = D.PluID
            INNER JOIN PriceMaster PM ON PM.PluId = D.PluId AND PM.ShopId = {$data['shop_id']}";

            if ($data['shop_id'] > 0) {
                $sql .= " AND M.ShopId ={$data['shop_id']}";
            }

            if ($restricted_from_date) {
                if (auth()->user()->sale_report === 'ESSA') {
                    $sql .= " AND M.BillDt >= '{$restricted_from_date}'";
                } else {
                    $sql .= " AND M.BillDt < '{$restricted_from_date}'";
                }
            }

            $sql .= " ORDER BY M.BillNo";

            session(['report_style' => 'details']);
            $result = DB::select($sql);
        }

        session(['sales_report_result' => $result]);

        return redirect()->route('sales');
    }

    public function delete(Request $request)
    {
        $request->validate([
            'bill_id' => 'required|exists:billmaster,billid',
            'shop_id' => 'required|exists:shops,shopid'
        ]);

        try {
            //code...
            DB::beginTransaction();
            DB::statement("exec sp_InsertIntoDeletedTables ?,?", [$request->bill_id, $request->shop_id]);
            DB::statement("exec sp_DeleteBillById ?,?", [$request->bill_id, $request->shop_id]);
            DB::commit();
            return back()->with('message', 'Bill removed');
        } catch (\Throwable $th) {
            //throw $th;
            DB::rollBack();
            return back()->with('message', $th->getMessage());
        }
    }

    public function oldPayment(Request $request)
    {
        $request->validate([
            'bill_id' => 'required|exists:billmaster,billid',
            'shop_id' => 'required|exists:shops,shopid'
        ]);

        $oldPayment = DB::select("
        SELECT
            SUM(CASE WHEN PaymentDesc = 'CASH' THEN Paid - Refund ELSE 0 END) AS CASH,
            SUM(CASE WHEN PaymentDesc = 'CARD' THEN Paid ELSE 0 END) AS CARD,
            SUM(CASE WHEN PaymentDesc = 'UPI' THEN Paid ELSE 0 END) AS UPI
        FROM BillPayments
        WHERE BillID = ? AND ShopID = ?", [$request->bill_id, $request->shop_id]);

        return response()->json([
            'oldPayment' => $oldPayment[0] ?? ['CASH' => 0, 'CARD' => 0, 'UPI' => 0]
        ]);
    }

    public function paymentUpdate(Request $request)
    {
        $request->validate([
            'bill_id' => 'required|exists:billmaster,billid',
            'shop_id' => 'required|exists:shops,shopid',
            'payment' => 'required|array',
        ]);

        try {
            DB::beginTransaction();

            $old = DB::table('BillPayments')
                ->where('BillID', $request->bill_id)
                ->where('ShopID', $request->shop_id)
                ->select('TermId', 'BillDt')
                ->first();

            DB::table('BillPayments')
                ->where('BillID', $request->bill_id)
                ->where('ShopID', $request->shop_id)
                ->delete();

            $sNo = 1;

            foreach ($request->payment as $mode => $amount) {
                if (empty($amount)) continue;

                $paymentId = match ($mode) {
                    'cash' => '1',
                    'card' => '2',
                    'upi' => '3',
                };

                DB::table('BillPayments')->insert([
                    'BillID'       => $request->bill_id,
                    'ShopID'       => $request->shop_id,
                    'PaymentID'    => $paymentId,
                    'PaymentDesc'  => strtoupper($mode),
                    'Paid'         => $amount,
                    'Refund'       => 0,
                    'RefNo'        => auth()->user()->name,
                    'RefDt'        => now(),
                    'Sno'          => $sNo++,
                    'TermID'       => $old->TermId ?? 1,
                    'BillDt'       => $old->BillDt ?? now(),
                    'IsUpdated'    => 0,
                    'WHID'         => 1,
                ]);
            }

            DB::commit();
            return back()->with('message', 'Payment updated successfully');
        } catch (\Throwable $th) {
            DB::rollBack();
            return back()->with('error', 'Update failed: ' . $th->getMessage());
        }
    }
}
