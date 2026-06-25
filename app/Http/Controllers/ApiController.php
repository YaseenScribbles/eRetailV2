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

        $newToken = $user->createToken('vigilance');
        $newToken->accessToken->expires_at = $expiresAt;
        $newToken->accessToken->save();

        return response()->json([
            'token'      => $newToken->plainTextToken,
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

        $sql = "SELECT BM.BillId bill_id, BM.BillNo bill_no, BM.BillDt bill_date, CAST(BM.BillTime AS TIME) bill_time,
                DX.total_qty, DX.gross_amount total_amount,
                CAST(ROUND(BM.DisAmt, 2) AS DECIMAL(18,2)) disc_amount, CAST(ROUND(BM.TotAmt - (DX.gross_amount - BM.DisAmt), 2) AS DECIMAL(18,2)) round_off, CAST(ROUND(BM.TotAmt, 2) AS DECIMAL(18,2)) final_amount, C.CustomerName customer,
                DX.tax_amount, CAST(ROUND(BM.TotAmt - DX.tax_amount, 2) AS DECIMAL(18,2)) taxable, DX.bill_mode
                FROM BillMaster BM
                INNER JOIN Customers C ON C.CustomerID = BM.CustomerID
                INNER JOIN (
                    SELECT D.BillID,
                        SUM(D.Qty) total_qty,
                        CAST(ROUND(SUM(D.Qty * D.ORATE), 2) AS DECIMAL(18,2)) gross_amount,
                        CAST(ROUND(SUM(IIF(D.Rate > T.Val,
                            D.Amount - (100.0 / (100.0 + T.Mx)) * D.Amount,
                            D.Amount - (100.0 / (100.0 + T.Mn)) * D.Amount)), 2) AS DECIMAL(18,2)) tax_amount,
                        CASE MIN(D.BillMode) WHEN 0 THEN 'Normal' WHEN 1 THEN 'Exchange' WHEN 2 THEN 'Return' END bill_mode
                    FROM BillDetails D
                    INNER JOIN BillMaster BM2 ON BM2.BillId = D.BillID
                    INNER JOIN ProductAttributes A ON A.PluId = D.PluId
                    INNER JOIN ProductTax T ON A.DeptId = T.DeptId AND A.CatId = T.CatId AND A.MaterialId = T.MatId AND T.IsUpdated = BM2.IsUpdated
                    WHERE D.Qty <> 0
                    GROUP BY D.BillID
                ) DX ON DX.BillID = BM.BillId
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

        $sql .= " ORDER BY bill_date DESC, bill_id DESC";

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
