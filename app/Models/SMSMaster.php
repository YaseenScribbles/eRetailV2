<?php

namespace App\Models;

use App\Traits\AutoIncrementId;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SMSMaster extends Model
{
    use HasFactory;
    use AutoIncrementId;

    protected $fillable = [
        'template',
        'shop_id',
        'user_id',
    ];

    protected $table = "sms_master";
    public $incrementing = false;
}
