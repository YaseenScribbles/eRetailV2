<?php

namespace App\Traits;

use Illuminate\Support\Facades\DB;

trait AutoIncrementId {
    protected static function bootAutoIncrementId()
    {
        static::creating(function ($model) {
            $table = $model->getTable();
            $maxId = DB::table($table)->max('id') ?? 0;
            $model->id = $maxId + 1;
        });
    }
}
