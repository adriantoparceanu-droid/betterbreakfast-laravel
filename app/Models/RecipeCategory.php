<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RecipeCategory extends Model
{
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = ['id', 'module_id', 'name', 'slug', 'description', 'price', 'sort_order', 'is_active', 'translations'];

    protected function casts(): array
    {
        return [
            'price'        => 'float',
            'is_active'    => 'boolean',
            'sort_order'   => 'integer',
            'translations' => 'array',
        ];
    }

    public function module()
    {
        return $this->belongsTo(Module::class);
    }

    public function recipes()
    {
        return $this->hasMany(Recipe::class, 'category_id');
    }

    public function users()
    {
        return $this->belongsToMany(User::class, 'user_categories', 'category_id', 'user_id')
            ->withPivot('purchased_at');
    }
}
