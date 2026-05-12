<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AnalyticsEvent extends Model
{
    public $timestamps = false;

    protected $fillable = ['user_id', 'anonymous_id', 'event', 'properties', 'synced'];

    protected function casts(): array
    {
        return [
            'properties' => 'array',
            'synced'     => 'boolean',
            'created_at' => 'datetime',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
