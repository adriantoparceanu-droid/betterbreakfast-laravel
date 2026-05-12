<?php

use App\Http\Controllers\OnboardingController;
use App\Http\Controllers\TodayController;
use App\Http\Controllers\PlanController;
use App\Http\Controllers\StaplesController;
use App\Http\Controllers\SwapController;
use App\Http\Controllers\CompleteController;
use App\Http\Controllers\Admin\CategoryController as AdminCategory;
use App\Http\Controllers\Admin\DashboardController as AdminDashboard;
use App\Http\Controllers\Admin\UserController as AdminUser;
use App\Http\Controllers\Admin\RecipeController as AdminRecipe;
use App\Http\Controllers\Admin\ModuleController as AdminModule;
use App\Http\Controllers\Admin\IngredientController as AdminIngredient;
use App\Http\Controllers\Admin\StatsController as AdminStats;
use App\Http\Controllers\ExploreController;
use App\Http\Controllers\PurchaseController;
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

    // Purchase gate — accessible before module access
    Route::get('/purchase', [PurchaseController::class, 'show'])->name('purchase');

    // Explore — accessible without module access (premium category browser)
    Route::get('/explore', [ExploreController::class, 'show'])->name('explore');

    // Module-gated routes
    Route::middleware('module.access')->group(function () {
        Route::get('/today',              [TodayController::class,   'show'])->name('today');
        Route::get('/plan',               [PlanController::class,    'show'])->name('plan');
        Route::get('/staples',            [StaplesController::class, 'show'])->name('staples');
        Route::get('/swap/{day}',         [SwapController::class,    'show'])->name('swap');
        Route::get('/complete/{day}',     [CompleteController::class,'show'])->name('complete');
    });
});

// ─── Admin ────────────────────────────────────────────────────────────────────

Route::middleware(['auth', 'admin'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/',            [AdminDashboard::class, 'index'])->name('dashboard');

    Route::get('/users',                                               [AdminUser::class, 'index'])->name('users');
    Route::post('/users/{userId}/grant',                               [AdminUser::class, 'grantAccess'])->name('users.grant');
    Route::delete('/users/{userId}/revoke',                            [AdminUser::class, 'revokeAccess'])->name('users.revoke');
    Route::post('/users/{userId}/categories/{categoryId}/grant',       [AdminUser::class, 'grantCategoryAccess'])->name('users.categories.grant');
    Route::delete('/users/{userId}/categories/{categoryId}/revoke',    [AdminUser::class, 'revokeCategoryAccess'])->name('users.categories.revoke');
    Route::patch('/users/{userId}/role',                               [AdminUser::class, 'toggleRole'])->name('users.role');
    Route::delete('/users/{userId}',                                   [AdminUser::class, 'destroy'])->name('users.destroy');

    Route::get('/recipes',                     [AdminRecipe::class, 'index'])->name('recipes');
    Route::get('/recipes/create',              [AdminRecipe::class, 'create'])->name('recipes.create');
    Route::get('/recipes/{id}/edit',           [AdminRecipe::class, 'edit'])->name('recipes.edit');
    Route::post('/recipes',                    [AdminRecipe::class, 'store'])->name('recipes.store');
    Route::put('/recipes/{id}',                [AdminRecipe::class, 'update'])->name('recipes.update');
    Route::delete('/recipes/{id}',             [AdminRecipe::class, 'destroy'])->name('recipes.destroy');
    Route::patch('/recipes/{id}/toggle',       [AdminRecipe::class, 'toggleActive'])->name('recipes.toggle');

    Route::get('/ingredients',                 [AdminIngredient::class, 'index'])->name('ingredients');
    Route::post('/ingredients',                [AdminIngredient::class, 'store'])->name('ingredients.store');
    Route::patch('/ingredients/{id}',          [AdminIngredient::class, 'update'])->name('ingredients.update');
    Route::delete('/ingredients/{id}',         [AdminIngredient::class, 'destroy'])->name('ingredients.destroy');
    Route::post('/ingredients/seed',           [AdminIngredient::class, 'seedFromRecipes'])->name('ingredients.seed');

    Route::get('/modules',                     [AdminModule::class, 'index'])->name('modules');
    Route::patch('/modules/{id}',              [AdminModule::class, 'update'])->name('modules.update');

    Route::get('/categories',                  [AdminCategory::class, 'index'])->name('categories');
    Route::post('/categories',                 [AdminCategory::class, 'store'])->name('categories.store');
    Route::patch('/categories/{id}',           [AdminCategory::class, 'update'])->name('categories.update');
    Route::patch('/categories/{id}/toggle',    [AdminCategory::class, 'toggleActive'])->name('categories.toggle');
    Route::delete('/categories/{id}',          [AdminCategory::class, 'destroy'])->name('categories.destroy');

    Route::get('/stats',                       [AdminStats::class, 'index'])->name('stats');
});

require __DIR__ . '/auth.php';
