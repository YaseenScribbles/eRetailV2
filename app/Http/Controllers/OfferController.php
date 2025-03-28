<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class OfferController extends Controller
{
    public function show(Request $request)
    {
        $shopIds = $request->user()->shops;
        $shopIdArray = explode(',', $shopIds);
        $shops = DB::table('shops as s')
            ->whereIn('s.shopid', $shopIdArray)
            ->select('s.shopid', 's.shopname')
            ->get();
        $result = session('offer_report_result', []);
        session()->forget('offer_report_result');
        return Inertia::render('Offer', compact('shops', 'result'));
    }

    public function report(Request $request)
    {
        $request->validate([
            'shop_id' => 'required|exists:shops,shopid'
        ]);

        $shopId = $request->shop_id;

        $result = DB::table('PriceMaster', 'P')
            ->join('v_stockpos as S', function ($join) {
                $join->on('S.pluid', '=', 'P.PluId')
                    ->on('S.location_id', '=', 'P.ShopId');
            })
            ->join('ProductMaster as M',  'M.PluId', '=', 'P.PluId')
            ->join('ProductAttributes as A', 'A.PluId', '=', 'P.PluId')
            ->where('P.ShopId', $shopId)
            ->where('P.Discount', '>', 0)
            ->where('S.stock', '>', 0)
            ->select([
                'M.Plucode as Barcode',
                'M.Pluname as Desc',
                'M.ID as Size',
                'P.CostPrice',
                'P.RetailPrice',
                'P.Discount',
                'S.Stock',
                'A.Department',
                'A.Category',
                'A.Material',
                'A.Catalog'
            ])
            ->orderBy('A.Catalog')
            ->orderBy('M.ID')
            ->get();

        session(['offer_report_result' => $result]);
        return redirect()->route('offer.show');
    }
}
