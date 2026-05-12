<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class ProfileTest extends TestCase
{
    use RefreshDatabase;

    public function test_password_can_be_updated(): void
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->put('/password', [
                'current_password'      => 'password',
                'password'              => 'new-password-123',
                'password_confirmation' => 'new-password-123',
            ]);

        $response->assertSessionHasNoErrors();
        $this->assertTrue(Hash::check('new-password-123', $user->refresh()->password));
    }

    public function test_correct_password_must_be_provided_to_update_password(): void
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->put('/password', [
                'current_password'      => 'wrong-password',
                'password'              => 'new-password-123',
                'password_confirmation' => 'new-password-123',
            ]);

        $response->assertSessionHasErrors('current_password');
    }
}
