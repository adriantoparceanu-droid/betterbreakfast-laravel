<?php

use App\Http\Controllers\Api\AnalyticsController;
use App\Http\Controllers\Api\ExploreController;
use App\Http\Controllers\Api\ProgressController;
use App\Http\Controllers\Api\RecipeController;
use App\Http\Controllers\Api\SyncController;
use Illuminate\Support\Facades\Route;

// Recipes — public (needed for offline first-load fallback)
Route::get('/recipes', [RecipeController::class, 'index']);

// Authenticated API endpoints
Route::middleware('auth')->group(function () {
    Route::get('/user/progress',  [ProgressController::class, 'show']);
    Route::put('/user/progress',  [ProgressController::class, 'update']);
    Route::post('/sync',          [SyncController::class,     'store']);
    Route::get('/explore',        [ExploreController::class,  'index']);
    Route::post('/analytics',     [AnalyticsController::class,'store'])->withoutMiddleware('auth');
});
