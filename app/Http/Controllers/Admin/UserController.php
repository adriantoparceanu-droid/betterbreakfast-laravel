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
        $users = User::where('role', 'user')
            ->with('modules')
            ->orderByDesc('created_at')
            ->get()
            ->map(fn ($u) => [
                'id'        => $u->id,
                'username'  => $u->username,
                'email'     => $u->email,
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
        DB::table('user_modules')->where('user_id', $userId)->where('module_id', $module->id)->delete();
        return back();
    }

    public function destroy(int $userId): RedirectResponse
    {
        User::where('id', $userId)->where('role', 'user')->delete();
        return back();
    }
}
