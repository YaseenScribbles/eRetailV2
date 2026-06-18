<?php

namespace App\Http\Controllers;

use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class ApiController extends Controller
{
    public function issueToken(Request $request)
    {
        $credentials = $request->validate([
            'email'    => 'required|email',
            'password' => 'required',
        ]);

        if (!Auth::attempt($credentials)) {
            return response()->json(['message' => 'Invalid credentials.'], 401);
        }

        $user = Auth::user();

        if (!$user->api_only) {
            Auth::logout();
            return response()->json(['message' => 'Invalid credentials.'], 401);
        }
        $expiryMinutes = config('sanctum.expiration');
        $expiresAt = Carbon::now()->addMinutes($expiryMinutes);
        $token = $user->createToken('vigilance')->plainTextToken;

        return response()->json([
            'token'      => $token,
            'expires_at' => $expiresAt->toIso8601String(),
        ]);
    }

    public function revokeToken(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Token revoked.']);
    }

    public function sales(Request $request)
    {
        $data = $request->validate([
            'shop_id'    => 'required|integer|min:1',
            'start_date' => 'required|date',
            'end_date'   => 'required|date|after_or_equal:start_date',
        ]);

        $user = $request->user();
        $allowedShops = array_map('intval', explode(',', $user->shops));

        if (!in_array((int) $data['shop_id'], $allowedShops)) {
            return response()->json(['message' => 'Access denied for this location.'], 403);
        }

        $restrictedFromDate = null;
        if ($user->sale_report !== 'ALL') {
            $setting = DB::select("SELECT tookoverat FROM shopsettings WHERE shopid = ?", [$data['shop_id']]);
            $restrictedFromDate = $setting ? $setting[0]->tookoverat : null;
        }

        $sql = "SELECT BM.BillId bill_id, BM.BillNo bill_no, BM.BillDt bill_date,
                BM.TotQty total_qty, BM.TotAmt + BM.DisAmt total_amount,
                BM.DisAmt disc_amount, BM.TotAmt final_amount, C.CustomerName customer
                FROM BillMaster BM
                INNER JOIN Customers C ON C.CustomerID = BM.CustomerID
                WHERE BM.ShopId = ?
                AND BM.BillDt BETWEEN ? AND ?";

        $bindings = [$data['shop_id'], $data['start_date'], $data['end_date']];

        if ($restrictedFromDate) {
            if ($user->sale_report === 'ESSA') {
                $sql .= " AND BM.BillDt >= ?";
            } else {
                $sql .= " AND BM.BillDt < ?";
            }
            $bindings[] = $restrictedFromDate;
        }

        $sql .= " ORDER BY BM.BillDt DESC";

        $sales = DB::select($sql, $bindings);

        return response()->json([
            'shop_id'    => $data['shop_id'],
            'start_date' => $data['start_date'],
            'end_date'   => $data['end_date'],
            'count'      => count($sales),
            'data'       => $sales,
        ]);
    }
}
