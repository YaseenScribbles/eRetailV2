<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class InvoiceController extends Controller
{
    //

    public function show(Request $request)
    {
        $result = session('invoice_report', []);
        session()->forget('invoice_report');

        return Inertia::render('Invoice', ['result' => $result]);
    }

    public function report(Request $request)
    {
        $data = $request->validate([
            'from_date' => 'required|string',
            'to_date' => 'required|string',
            'destination' => 'required|string',
            'f_year' => 'required|string'
        ]);
        $buyers = auth()->user()->buyer_id;

        $sqlconnection = "";
        if ($data['f_year'] === "2324") {
            $sqlconnection = "sqlsrv2";
        } else {
            $sqlconnection = "sqlsrv3";
        }

        if ($data['destination']) {

            $sql = "SELECT IM.InvoiceNo invoiceno,IM.InvoiceDate invoicedate,BL.bname [product],BL.bsize [size],
            BL.hsn [hsn],ID.Qty [quantity],ID.Rate [rate],ID.Qty * ID.Rate [amount], IM.Discount [discperc],
            (ID.Qty * ID.Rate * IM.Discount) / 100 [discount],
            (ID.Qty * ID.Rate) - ((ID.Qty * ID.Rate * IM.Discount) / 100) taxable,
            SUM(TD.Value) [gstperc],
            ((ID.Qty * ID.Rate) - ((ID.Qty * ID.Rate * IM.Discount) / 100)) * (SUM(TD.Value) / 100) [gst],
            ((ID.Qty * ID.Rate) - ((ID.Qty * ID.Rate * IM.Discount) / 100)) +
            (((ID.Qty * ID.Rate) - ((ID.Qty * ID.Rate * IM.Discount) / 100)) * (SUM(TD.Value) / 100)) [nett]
            FROM InvoiceMaster IM
            INNER JOIN InvoiceDetails ID ON IM.InvoiceID = ID.InvoiceID AND IM.BuyerID in ($buyers) AND IM.InvoiceDate BETWEEN '{$data['from_date']}' AND '{$data['to_date']}'
            AND IM.Destination = '{$data['destination']}'
            INNER JOIN brandlist BL ON BL.detid = ID.DetID
            INNER JOIN TaxMaster TM ON TM.TaxID = IM.TaxID
            INNER JOIN TaxDetails TD ON TD.TaxID = TM.TaxID
            GROUP BY IM.InvoiceNo,IM.InvoiceDate,BL.bname,BL.bsize,
            BL.hsn,ID.Qty,ID.Rate, IM.Discount
            ORDER BY IM.InvoiceNo";

            $result = DB::connection($sqlconnection)->select($sql);
        }
        session(['invoice_report' => $result]);

        return to_route('invoice');
    }
}
