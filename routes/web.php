<?php

use App\Http\Controllers\OnboardingController;
use App\Http\Controllers\TodayController;
use App\Http\Controllers\PlanController;
use App\Http\Controllers\StaplesController;
use App\Http\Controllers\SwapController;
use App\Http\Controllers\CompleteController;
use App\Http\Controllers\Admin\DashboardController as AdminDashboard;
use App\Http\Controllers\Admin\UserController as AdminUser;
use App\Http\Controllers\Admin\RecipeController as AdminRecipe;
use App\Http\Controllers\Admin\ModuleController as AdminModule;
use App\Http\Controllers\Admin\IngredientController as AdminIngredient;
use App\Http\Controllers\Admin\StatsController as AdminStats;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// ─── Public ───────────────────────────────────────────────────────────────────

Route::get('/', function () {
    return redirect()->route('login');
});

// ─── App (authenticated) ──────────────────────────────────────────────────────

Route::middleware('auth')->group(function () {
    Route::get('/onboarding', [OnboardingController::class, 'show'])->name('onboarding');
    Route::post('/onboarding', [OnboardingController::class, 'store']);

    Route::get('/today',   [TodayController::class,   'show'])->name('today');
    Route::get('/plan',    [PlanController::class,     'show'])->name('plan');
    Route::get('/staples', [StaplesController::class,  'show'])->name('staples');
    Route::get('/swap/{day}',      [SwapController::class,     'show'])->name('swap');
    Route::get('/complete/{day}',  [CompleteController::class, 'show'])->name('complete');
});

// ─── Admin ────────────────────────────────────────────────────────────────────

Route::middleware(['auth', 'admin'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/',            [AdminDashboard::class, 'index'])->name('dashboard');

    Route::get('/users',                       [AdminUser::class, 'index'])->name('users');
    Route::post('/users/{userId}/grant',       [AdminUser::class, 'grantAccess'])->name('users.grant');
    Route::delete('/users/{userId}/revoke',    [AdminUser::class, 'revokeAccess'])->name('users.revoke');
    Route::delete('/users/{userId}',           [AdminUser::class, 'destroy'])->name('users.destroy');

    Route::get('/recipes',                     [AdminRecipe::class, 'index'])->name('recipes');
    Route::post('/recipes',                    [AdminRecipe::class, 'store'])->name('recipes.store');
    Route::put('/recipes/{id}',                [AdminRecipe::class, 'update'])->name('recipes.update');
    Route::delete('/recipes/{id}',             [AdminRecipe::class, 'destroy'])->name('recipes.destroy');
    Route::patch('/recipes/{id}/toggle',       [AdminRecipe::class, 'toggleActive'])->name('recipes.toggle');

    Route::get('/ingredients',                 [AdminIngredient::class, 'index'])->name('ingredients');
    Route::post('/ingredients',                [AdminIngredient::class, 'store'])->name('ingredients.store');
    Route::patch('/ingredients/{id}',          [AdminIngredient::class, 'update'])->name('ingredients.update');
    Route::delete('/ingredients/{id}',         [AdminIngredient::class, 'destroy'])->name('ingredients.destroy');

    Route::get('/modules',                     [AdminModule::class, 'index'])->name('modules');
    Route::patch('/modules/{id}',              [AdminModule::class, 'update'])->name('modules.update');

    Route::get('/stats',                       [AdminStats::class, 'index'])->name('stats');
});

require __DIR__ . '/auth.php';
