<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Recipe extends Model
{
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id', 'name', 'image', 'base_servings',
        'ingredients', 'steps', 'nutrition', 'tags',
        'is_active', 'sort_order', 'module_id',
    ];

    protected function casts(): array
    {
        return [
            'ingredients'  => 'array',
            'steps'        => 'array',
            'nutrition'    => 'array',
            'tags'         => 'array',
            'is_active'    => 'boolean',
        ];
    }

    public function module()
    {
        return $this->belongsTo(Module::class);
    }
}
