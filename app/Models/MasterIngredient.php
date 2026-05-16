<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MasterIngredient extends Model
{
    protected $fillable = ['name', 'category', 'translations', 'calories_per_100g', 'protein_per_100g', 'fat_per_100g', 'carbs_per_100g', 'fiber_per_100g'];

    protected function casts(): array
    {
        return [
            'translations'      => 'array',
            'calories_per_100g' => 'float',
            'protein_per_100g'  => 'float',
            'fat_per_100g'      => 'float',
            'carbs_per_100g'    => 'float',
            'fiber_per_100g'    => 'float',
        ];
    }
}
