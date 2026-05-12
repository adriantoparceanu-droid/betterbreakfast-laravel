<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Module extends Model
{
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = ['id', 'name', 'slug', 'description', 'price', 'is_active'];

    protected function casts(): array
    {
        return [
            'price'     => 'float',
            'is_active' => 'boolean',
        ];
    }

    public function recipes()
    {
        return $this->hasMany(Recipe::class);
    }

    public function users()
    {
        return $this->belongsToMany(User::class, 'user_modules')
            ->withPivot('purchased_at');
    }
}
