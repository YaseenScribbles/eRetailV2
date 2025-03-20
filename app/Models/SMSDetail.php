<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SMSDetail extends Model
{
    use HasFactory;

    protected $fillable = [
        'master_id',
        'mobile',
        'status'
    ];

    protected $table = 'sms_details';
    public $timestamps = false;
}
