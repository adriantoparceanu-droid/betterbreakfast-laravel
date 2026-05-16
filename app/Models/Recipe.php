<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Recipe extends Model
{
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id', 'name', 'image', 'base_servings',
        'ingredients', 'steps', 'substitutions', 'why_this_works',
        'nutrition', 'tags', 'is_active', 'sort_order', 'module_id', 'category_id',
        'translations',
    ];

    protected function casts(): array
    {
        return [
            'ingredients'  => 'array',
            'steps'        => 'array',
            'nutrition'    => 'array',
            'tags'         => 'array',
            'translations' => 'array',
            'is_active'    => 'boolean',
        ];
    }

    public function module()
    {
        return $this->belongsTo(Module::class);
    }

    public function category()
    {
        return $this->belongsTo(RecipeCategory::class, 'category_id');
    }
}
