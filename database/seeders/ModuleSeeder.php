<?php

namespace Database\Seeders;

use App\Models\Module;
use Illuminate\Database\Seeder;

class ModuleSeeder extends Seeder
{
    public function run(): void
    {
        Module::updateOrCreate(
            ['id' => 'module-breakfast-10day'],
            [
                'name'        => '10-Day Breakfast Plan',
                'slug'        => 'breakfast-10-day',
                'description' => 'Build a morning routine with 10 simple, nutritious breakfasts.',
                'price'       => 0,
                'is_active'   => true,
            ]
        );
    }
}
