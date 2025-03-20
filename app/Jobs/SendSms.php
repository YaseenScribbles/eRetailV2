<?php

namespace App\Jobs;

use App\Models\SMSDetail;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Http;

class SendSms implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $baseUrl;
    protected $phones;
    protected $masterId;

    public function __construct($baseUrl, $phones, $masterId)
    {
        $this->baseUrl = $baseUrl;
        $this->phones = $phones;
        $this->masterId = $masterId;
    }

    public function handle()
    {
        foreach ($this->phones as $phone) {
            $url = str_replace('@PhNo', $phone, $this->baseUrl);

            try {
                $response = Http::get($url);
                $status = $response->successful();
            } catch (\Exception $e) {
                $status = false;
            }

            SMSDetail::create([
                'master_id' => $this->masterId,
                'mobile' => $phone,
                'status' => $status,
            ]);
        }
    }
}
