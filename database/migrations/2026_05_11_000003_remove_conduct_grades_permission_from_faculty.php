<?php

use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        $faculty    = \App\Models\Role::where('slug', 'faculty')->first();
        $permission = \App\Models\Permission::where('slug', 'manage-conduct-grades')->first();

        if ($faculty && $permission) {
            $faculty->permissions()->detach($permission->id);
        }
    }

    public function down(): void
    {
        $faculty    = \App\Models\Role::where('slug', 'faculty')->first();
        $permission = \App\Models\Permission::where('slug', 'manage-conduct-grades')->first();

        if ($faculty && $permission) {
            $faculty->permissions()->syncWithoutDetaching([$permission->id]);
        }
    }
};
