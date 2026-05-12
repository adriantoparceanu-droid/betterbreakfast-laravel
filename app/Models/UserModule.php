<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\Pivot;

class UserModule extends Pivot
{
    protected $table = 'user_modules';
    public $incrementing = false;
    public $timestamps = false;

    protected $fillable = ['user_id', 'module_id', 'purchased_at'];

    public function module()
    {
        return $this->belongsTo(Module::class);
    }
}
