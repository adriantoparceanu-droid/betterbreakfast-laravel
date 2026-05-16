<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use HasFactory, Notifiable;

    protected $fillable = ['username', 'email', 'password', 'role', 'current_session_id'];

    protected $hidden = ['password', 'remember_token'];

    protected function casts(): array
    {
        return [
            'password' => 'hashed',
        ];
    }

    public function progress()
    {
        return $this->hasOne(UserProgress::class);
    }

    public function syncItems()
    {
        return $this->hasMany(SyncQueue::class);
    }

    public function analytics()
    {
        return $this->hasMany(AnalyticsEvent::class);
    }

    public function modules()
    {
        return $this->belongsToMany(Module::class, 'user_modules')
            ->withPivot('purchased_at');
    }

    public function categories()
    {
        return $this->belongsToMany(RecipeCategory::class, 'user_categories', 'user_id', 'category_id')
            ->withPivot('purchased_at');
    }

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }
}
