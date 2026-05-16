<?php

namespace Tests\Feature;

use App\Models\Module;
use App\Models\User;
use App\Models\UserProgress;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * End-to-end workflow: registration → onboarding → Foundation Day → 10-day cycle → restart × 2
 *
 * NOTE: Foundation Day checkbox enforcement is 100% frontend (Zustand).
 * These tests cover server-side routes and the /api/user/progress + /api/user/reset-plan APIs.
 *
 * PATTERN: use $this->be($user) ONCE per test method, then call
 * $this->get/post/putJson... without chaining actingAs — this keeps the
 * session ID stable across multiple requests in the same test.
 * For routes under single.device middleware, call withDevice($user) first
 * to set a known bb_device_id cookie for all requests in the test.
 * Single-request tests with no current_session_id auto-register the device.
 */
class UserWorkflowTest extends TestCase
{
    use RefreshDatabase;

    private string $deviceToken = 'test-device-00000000-0000-0000-0000-000000000001';

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private function createModule(): Module
    {
        return Module::create([
            'id'          => 'module-breakfast-10day',
            'name'        => '10-Day Breakfast Plan',
            'slug'        => 'breakfast-10-day',
            'description' => 'Test',
            'price'       => 9.99,
            'is_active'   => true,
        ]);
    }

    private function grantAccess(User $user, Module $module): void
    {
        DB::table('user_modules')->insert([
            'user_id'      => $user->id,
            'module_id'    => $module->id,
            'purchased_at' => now(),
        ]);
    }

    /**
     * Set a known device token on a user and register it as the default cookie
     * for all subsequent requests in this test method. Required for multi-request
     * tests on routes protected by the single.device middleware.
     *
     * Uses withUnencryptedCookies so the raw UUID passes through EncryptCookies
     * (bb_device_id is excluded from encryption). withCredentials() ensures
     * the cookie is included in JSON requests (putJson/postJson/getJson).
     */
    private function withDevice(User $user): void
    {
        $user->update(['current_session_id' => $this->deviceToken]);
        $this->withUnencryptedCookies(['bb_device_id' => $this->deviceToken]);
        $this->withCredentials();
    }

    /** All required Foundation Day step IDs (from FoundationDay.tsx) */
    private function requiredSteps(): array
    {
        return [
            'hard-boil-eggs', 'cook-chicken', 'cook-quinoa',
            'wash-leafy-greens', 'wash-fresh-herbs', 'wash-hardy-veg',
            'squeeze-lemon', 'extract-pomegranate',
        ];
    }

    private function allSteps(): array
    {
        return [...$this->requiredSteps(), 'make-vinaigrette'];
    }

    // ─── Registration & access ────────────────────────────────────────────────

    public function test_registration_redirects_to_purchase(): void
    {
        $response = $this->post('/register', [
            'username'              => 'newuser',
            'email'                 => 'newuser@example.com',
            'password'              => 'password123',
            'password_confirmation' => 'password123',
            'privacy_policy'        => '1',
        ]);

        $response->assertRedirect(route('purchase'));
        $this->assertAuthenticated();
    }

    public function test_registration_sets_current_session_id(): void
    {
        $this->post('/register', [
            'username'              => 'newuser',
            'email'                 => 'newuser@example.com',
            'password'              => 'password123',
            'password_confirmation' => 'password123',
            'privacy_policy'        => '1',
        ]);

        $user = User::where('email', 'newuser@example.com')->first();
        $this->assertNotNull($user->current_session_id);
    }

    public function test_user_with_access_and_no_progress_redirects_to_onboarding(): void
    {
        $module = $this->createModule();
        $user   = User::factory()->create();
        $this->grantAccess($user, $module);

        $this->actingAs($user)->get(route('purchase'))
            ->assertRedirect(route('onboarding'));
    }

    public function test_user_with_access_and_existing_progress_redirects_to_staples(): void
    {
        $module = $this->createModule();
        $user   = User::factory()->create();
        $this->grantAccess($user, $module);
        UserProgress::create(['user_id' => $user->id, 'default_servings' => 2]);

        $this->actingAs($user)->get(route('purchase'))
            ->assertRedirect(route('staples'));
    }

    // ─── Onboarding ───────────────────────────────────────────────────────────

    public function test_onboarding_saves_servings_and_redirects_to_staples(): void
    {
        $module = $this->createModule();
        $user   = User::factory()->create();
        $this->grantAccess($user, $module);

        $this->actingAs($user)->post('/onboarding', ['defaultServings' => 2])
            ->assertRedirect(route('staples'));

        $progress = UserProgress::where('user_id', $user->id)->first();
        $this->assertNotNull($progress);
        $this->assertEquals(2, $progress->default_servings);
        $this->assertFalse($progress->foundation_done); // onboarding does NOT set foundation_done
    }

    public function test_onboarding_rejects_invalid_servings(): void
    {
        $user = User::factory()->create();
        $this->withDevice($user);
        $this->be($user);

        $this->post('/onboarding', ['defaultServings' => 0])
            ->assertSessionHasErrors('defaultServings');

        $this->post('/onboarding', ['defaultServings' => 9])
            ->assertSessionHasErrors('defaultServings');
    }

    // ─── Route access ─────────────────────────────────────────────────────────

    public function test_module_gated_routes_return_200_with_access(): void
    {
        $module = $this->createModule();
        $user   = User::factory()->create();
        $this->grantAccess($user, $module);
        $this->withDevice($user);
        $this->be($user);

        foreach (['today', 'plan', 'staples', 'foundation-day'] as $route) {
            $this->get(route($route))->assertStatus(200);
        }
    }

    public function test_module_gated_routes_redirect_to_purchase_without_access(): void
    {
        $user = User::factory()->create();
        $this->withDevice($user);
        $this->be($user);

        foreach (['today', 'plan', 'staples'] as $route) {
            $this->get(route($route))->assertRedirect(route('purchase'));
        }
    }

    // ─── Foundation Day — via progress API ───────────────────────────────────

    public function test_foundation_day_initial_state_is_false(): void
    {
        $module = $this->createModule();
        $user   = User::factory()->create();
        $this->grantAccess($user, $module);
        UserProgress::create(['user_id' => $user->id]);

        $this->actingAs($user)->getJson('/api/user/progress')
            ->assertOk()
            ->assertJsonPath('data.foundationDone', false)
            ->assertJsonPath('data.foundationChecked', []);
    }

    public function test_foundation_day_required_steps_stored_via_api(): void
    {
        $module = $this->createModule();
        $user   = User::factory()->create();
        $this->grantAccess($user, $module);
        $steps  = $this->requiredSteps();

        $this->actingAs($user)->putJson('/api/user/progress', [
            'foundationChecked' => $steps,
        ])->assertOk();

        $progress = UserProgress::where('user_id', $user->id)->first();
        $this->assertEquals($steps, $progress->foundation_checked);
        $this->assertFalse($progress->foundation_done);
    }

    public function test_foundation_day_complete_with_all_steps(): void
    {
        $module = $this->createModule();
        $user   = User::factory()->create();
        $this->grantAccess($user, $module);

        $this->actingAs($user)->putJson('/api/user/progress', [
            'foundationChecked' => $this->allSteps(),
            'foundationDone'    => true,
        ])->assertOk();

        $progress = UserProgress::where('user_id', $user->id)->first();
        $this->assertTrue($progress->foundation_done);
        $this->assertCount(count($this->allSteps()), $progress->foundation_checked);
    }

    // ─── 10-day cycle via API ─────────────────────────────────────────────────

    public function test_full_10_day_cycle_via_api(): void
    {
        $module = $this->createModule();
        $user   = User::factory()->create();
        $this->grantAccess($user, $module);
        $this->withDevice($user);
        $this->be($user);

        $completedDays   = range(1, 10);
        $selectedRecipes = array_combine(range(1, 10), array_map(fn ($d) => "recipe-{$d}", range(1, 10)));
        $checkIns        = array_combine(range(1, 10), array_fill(0, 10, 'full'));

        $this->putJson('/api/user/progress', [
            'completedDays'   => $completedDays,
            'selectedRecipes' => $selectedRecipes,
            'usedRecipeIds'   => array_values($selectedRecipes),
            'checkIns'        => $checkIns,
            'currentDay'      => 11,
        ])->assertOk();

        $progress = UserProgress::where('user_id', $user->id)->first();
        $this->assertCount(10, $progress->completed_days);
        $this->assertEquals(11, $progress->current_day);
        $this->assertCount(10, $progress->used_recipe_ids);
    }

    // ─── Reset plan ───────────────────────────────────────────────────────────

    public function test_reset_plan_clears_cycle_data(): void
    {
        $module = $this->createModule();
        $user   = User::factory()->create();
        $this->grantAccess($user, $module);

        UserProgress::create([
            'user_id'          => $user->id,
            'current_day'      => 11,
            'completed_days'   => range(1, 10),
            'selected_recipes' => ['1' => 'recipe-1'],
            'used_recipe_ids'  => ['recipe-1'],
            'default_servings' => 2,
            'foundation_done'  => true,
        ]);

        $this->actingAs($user)->postJson('/api/user/reset-plan')->assertOk();

        $progress = $user->fresh()->progress;
        $this->assertEquals(1,  $progress->current_day);
        $this->assertEquals([], $progress->completed_days);
        $this->assertEquals([], $progress->selected_recipes);
        $this->assertEquals([], $progress->used_recipe_ids);
        $this->assertFalse($progress->foundation_done);
        $this->assertEquals([], $progress->foundation_checked);
        $this->assertEquals(2,  $progress->default_servings); // preserved
    }

    public function test_reset_plan_preserves_default_servings(): void
    {
        $module = $this->createModule();
        $user   = User::factory()->create();
        $this->grantAccess($user, $module);
        UserProgress::create(['user_id' => $user->id, 'default_servings' => 3]);

        $this->actingAs($user)->postJson('/api/user/reset-plan')->assertOk();

        $this->assertEquals(3, $user->fresh()->progress->default_servings);
    }

    // ─── Second cycle (after restart) ─────────────────────────────────────────

    public function test_second_cycle_foundation_day_starts_clean(): void
    {
        $module = $this->createModule();
        $user   = User::factory()->create();
        $this->grantAccess($user, $module);
        $this->withDevice($user);
        $this->be($user);

        UserProgress::create([
            'user_id'          => $user->id,
            'current_day'      => 11,
            'completed_days'   => range(1, 10),
            'foundation_done'  => true,
            'default_servings' => 2,
        ]);

        $this->postJson('/api/user/reset-plan')->assertOk();

        $this->getJson('/api/user/progress')
            ->assertOk()
            ->assertJsonPath('data.foundationDone', false)
            ->assertJsonPath('data.foundationChecked', [])
            ->assertJsonPath('data.currentDay', 1)
            ->assertJsonPath('data.completedDays', []);
    }

    public function test_second_cycle_completes_correctly(): void
    {
        $module = $this->createModule();
        $user   = User::factory()->create();
        $this->grantAccess($user, $module);
        $this->withDevice($user);
        $this->be($user);

        // First cycle complete
        UserProgress::create([
            'user_id'          => $user->id,
            'current_day'      => 11,
            'completed_days'   => range(1, 10),
            'default_servings' => 1,
        ]);
        $this->postJson('/api/user/reset-plan')->assertOk();

        // Second cycle: Foundation Day
        $this->putJson('/api/user/progress', [
            'foundationChecked' => $this->allSteps(),
            'foundationDone'    => true,
        ])->assertOk();

        // Second cycle: complete all 10 days
        $this->putJson('/api/user/progress', [
            'completedDays' => range(1, 10),
            'currentDay'    => 11,
        ])->assertOk();

        $progress = $user->fresh()->progress;
        $this->assertCount(10, $progress->completed_days);
        $this->assertTrue($progress->foundation_done);
    }

    // ─── Single device enforcement ────────────────────────────────────────────

    public function test_login_sets_current_session_id(): void
    {
        $user = User::factory()->create(['password' => bcrypt('password123')]);

        $this->post('/login', ['login' => $user->email, 'password' => 'password123']);

        $this->assertNotNull($user->fresh()->current_session_id);
    }

    public function test_logout_clears_current_session_id(): void
    {
        $user = User::factory()->create(['current_session_id' => 'active-session']);

        $this->actingAs($user)->post('/logout');

        $this->assertNull($user->fresh()->current_session_id);
    }

    public function test_different_device_is_blocked_from_web_routes(): void
    {
        $module = $this->createModule();
        $user   = User::factory()->create(['current_session_id' => 'other-device-session']);
        $this->grantAccess($user, $module);

        // actingAs without bb_device_id cookie — no cookie + DB has different token → blocked
        $this->actingAs($user)->get(route('today'))
            ->assertRedirect(route('login'));
    }

    public function test_different_device_is_blocked_from_api(): void
    {
        $module = $this->createModule();
        $user   = User::factory()->create(['current_session_id' => 'other-device-session']);
        $this->grantAccess($user, $module);

        $this->actingAs($user)->getJson('/api/user/progress')
            ->assertStatus(401);
    }

    public function test_admin_reset_sentinel_forces_relogin(): void
    {
        $module = $this->createModule();
        $user   = User::factory()->create(['current_session_id' => '__admin_reset__']);
        $this->grantAccess($user, $module);

        $this->actingAs($user)->get(route('today'))
            ->assertRedirect(route('login'));
    }

    public function test_new_user_without_session_id_gets_registered_on_first_access(): void
    {
        $module = $this->createModule();
        $user   = User::factory()->create(['current_session_id' => null]);
        $this->grantAccess($user, $module);

        $this->actingAs($user)->get(route('staples'))->assertStatus(200);

        $this->assertNotNull($user->fresh()->current_session_id);
    }

    public function test_admin_bypasses_single_device_check(): void
    {
        $admin = User::factory()->create([
            'role'               => 'admin',
            'current_session_id' => 'some-other-session',
        ]);

        $this->actingAs($admin)->get(route('admin.dashboard'))
            ->assertStatus(200);
    }

    public function test_admin_can_reset_device_for_user(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $user  = User::factory()->create(['current_session_id' => 'active-session']);

        $this->actingAs($admin)->post(route('admin.users.reset-device', ['userId' => $user->id]));

        $this->assertEquals('__admin_reset__', $user->fresh()->current_session_id);
    }
}
