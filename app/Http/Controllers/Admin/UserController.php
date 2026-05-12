<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Module;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    public function index(): Response
    {
        $users = User::with('modules')
            ->orderByRaw("role = 'admin' DESC")
            ->orderByDesc('created_at')
            ->get()
            ->map(fn ($u) => [
                'id'        => $u->id,
                'username'  => $u->username,
                'email'     => $u->email,
                'role'      => $u->role,
                'hasAccess' => $u->modules->contains(fn ($m) => $m->slug === 'breakfast-10-day'),
                'createdAt' => $u->created_at->toIso8601String(),
            ]);

        return Inertia::render('Admin/Users', ['users' => $users]);
    }

    public function grantAccess(int $userId): RedirectResponse
    {
        $module = Module::where('slug', 'breakfast-10-day')->firstOrFail();
        DB::table('user_modules')->insertOrIgnore([
            'user_id'      => $userId,
            'module_id'    => $module->id,
            'purchased_at' => now(),
        ]);
        return back();
    }

    public function revokeAccess(int $userId): RedirectResponse
    {
        $module = Module::where('slug', 'breakfast-10-day')->firstOrFail();
        DB::table('user_modules')
            ->where('user_id', $userId)
            ->where('module_id', $module->id)
            ->delete();
        return back();
    }

    public function toggleRole(Request $request, int $userId): RedirectResponse
    {
        abort_if($userId === $request->user()->id, 403, 'Cannot change your own role.');

        $user = User::findOrFail($userId);
        $user->update(['role' => $user->role === 'admin' ? 'user' : 'admin']);

        return back();
    }

    public function destroy(Request $request, int $userId): RedirectResponse
    {
        abort_if($userId === $request->user()->id, 403, 'Cannot delete your own account.');

        User::findOrFail($userId)->delete();
        return back();
    }
}
