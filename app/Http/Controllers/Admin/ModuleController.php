<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Module;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ModuleController extends Controller
{
    public function index(): Response
    {
        $modules = Module::withCount('users')
            ->orderBy('created_at')
            ->get()
            ->map(fn ($m) => [
                'id'          => $m->id,
                'name'        => $m->name,
                'slug'        => $m->slug,
                'description' => $m->description,
                'price'       => $m->price,
                'isActive'    => (bool) $m->is_active,
                'usersCount'  => $m->users_count,
            ]);

        return Inertia::render('Admin/Modules', ['modules' => $modules]);
    }

    public function update(Request $request, string $id): RedirectResponse
    {
        $data = $request->validate([
            'name'        => 'sometimes|string|max:100',
            'description' => 'sometimes|string|max:500',
            'price'       => 'sometimes|numeric|min:0',
            'is_active'   => 'sometimes|boolean',
        ]);

        Module::findOrFail($id)->update($data);
        return back();
    }
}
