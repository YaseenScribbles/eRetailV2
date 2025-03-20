<?php

namespace App\Http\Controllers;

use App\Jobs\SendSms;
use App\Models\SMSDetail;
use App\Models\SMSMaster;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class SMSController extends Controller
{
    public function show(Request $request)
    {
        $shopIds = $request->user()->shops;
        $shopIdArray = explode(',', $shopIds);
        $shops = DB::table('shops as s')
            ->whereIn('s.shopid', $shopIdArray)
            ->select('s.shopid', 's.shopname')
            ->get();
        $templates = DB::table('sms_templates')->select('purpose', 'template')->get();
        $sms = DB::table('sms_master', 'sm')
            ->join('sms_details as sd', 'sd.master_id', '=', 'sm.id')
            ->join('shops as s', 's.shopid', '=', 'sm.shop_id')
            ->join('web_users as u', 'u.id', '=', 'sm.user_id')
            ->select(
                DB::raw("row_number() over(order by sm.id) as [s_no]"),
                'sm.id',
                's.shopname',
                'sm.template',
                DB::raw('u.name as [user]'),
                DB::raw('convert(varchar, sm.created_at, 34) as [date]'),
                DB::raw('count(sd.mobile) as [total]')
            )->groupBy('sm.id', 's.shopname', 'sm.template', 'u.name', 'sm.created_at')
            ->get();
        $message = session('message', "");

        return Inertia::render('SMS', compact('shops', 'templates', 'sms', 'message'));
    }

    public function testSms(Request $request)
    {
        $request->validate([
            'mobile' => 'required|string|size:10',
            'template' => 'required|string'
        ]);

        $template = $request->template;
        $mobile = $request->mobile;

        try {
            $smsApi = DB::table('settings')->where('param_name', 'SmsApi')->value('param_value');
            $smsApiPW = DB::table('settings')->where('param_name', 'SmsApiPW')->value('param_value');
            $smsApiUN = DB::table('settings')->where('param_name', 'SmsApiUN')->value('param_value');

            $url = str_replace(['@ID', '@Pwd', '@PhNo', '@Text'], [$smsApiUN, $smsApiPW, $mobile, $template], $smsApi);

            Http::get($url);
        } catch (\Throwable $th) {
            return back()->withErrors(['sms' => 'Failed to send SMS: ' . $th->getMessage()]);
        }

        session(['message' => $template]);

        return to_route('sms.show');
    }


    public function send(Request $request)
    {
        $request->validate([
            'template' => 'required|string',
            'shop_id' => 'required|exists:shops,shopid',
            'template_purpose' => 'required|string',
            'message' => 'required|string'
        ]);

        $message = $request->message;
        $shopId = $request->shop_id;

        try {
            $customers = DB::table('customers')
                ->where('locationid', $shopId)
                ->distinct()
                ->pluck('phone'); // Get only the phone numbers

            if ($customers->isEmpty()) {
                return back()->withErrors(['sms' => 'No customers found for the selected shop.']);
            }

            $smsApi = DB::table('settings')->where('param_name', 'SmsApi')->value('param_value');
            $smsApiPW = DB::table('settings')->where('param_name', 'SmsApiPW')->value('param_value');
            $smsApiUN = DB::table('settings')->where('param_name', 'SmsApiUN')->value('param_value');

            $baseUrl = str_replace(['@ID', '@Pwd', '@Text'], [$smsApiUN, $smsApiPW, $message], $smsApi);

            DB::beginTransaction();
            $master = SMSMaster::create([
                'template' => $request->template_purpose,
                'shop_id' => $request->shop_id,
                'user_id' => auth()->user()->id,
            ]);
            DB::commit();

            // Dispatch one job with the customer list
            dispatch(new SendSms($baseUrl, $customers, $master->id));

        } catch (\Throwable $th) {
            DB::rollBack();
            return back()->withErrors(['sms' => 'Failed to send SMS: ' . $th->getMessage()]);
        }

        return to_route('sms.show');
    }


}
