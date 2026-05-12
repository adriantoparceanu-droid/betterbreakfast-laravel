<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UserProgress extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'user_id', 'current_day', 'completed_days', 'selected_recipes',
        'used_recipe_ids', 'check_ins', 'pantry_checked', 'default_servings',
        'foundation_checked', 'foundation_done', 'force_reset',
    ];

    protected function casts(): array
    {
        return [
            'completed_days'     => 'array',
            'selected_recipes'   => 'array',
            'used_recipe_ids'    => 'array',
            'check_ins'          => 'array',
            'pantry_checked'     => 'array',
            'foundation_checked' => 'array',
            'foundation_done'    => 'boolean',
            'force_reset'        => 'boolean',
            'updated_at'         => 'datetime',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
