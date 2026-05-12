<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SyncQueue extends Model
{
    public $timestamps = false;

    protected $fillable = ['user_id', 'type', 'payload', 'synced', 'retries'];

    protected function casts(): array
    {
        return [
            'payload'    => 'array',
            'synced'     => 'boolean',
            'created_at' => 'datetime',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
