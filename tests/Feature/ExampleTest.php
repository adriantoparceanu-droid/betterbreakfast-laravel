<?php

namespace Tests\Feature;

use App\Models\Module;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class ExampleTest extends TestCase
{
    use RefreshDatabase;

    public function test_root_redirects_guests_to_login(): void
    {
        $response = $this->get('/');

        $response->assertRedirect(route('login'));
    }

    public function test_authenticated_user_without_module_access_is_redirected_to_purchase(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->get(route('today'));

        $response->assertRedirect(route('purchase'));
    }

    public function test_authenticated_user_with_module_access_can_access_today(): void
    {
        $module = Module::create([
            'id'          => 'module-breakfast-10day',
            'name'        => '10-Day Breakfast Plan',
            'slug'        => 'breakfast-10-day',
            'description' => 'Test module',
            'price'       => 9.99,
            'is_active'   => true,
        ]);

        $user = User::factory()->create();

        DB::table('user_modules')->insert([
            'user_id'      => $user->id,
            'module_id'    => $module->id,
            'purchased_at' => now(),
        ]);

        $response = $this->actingAs($user)->get(route('today'));

        $response->assertStatus(200);
    }
}
