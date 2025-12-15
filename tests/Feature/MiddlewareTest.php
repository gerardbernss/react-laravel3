<?php

use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('blocks access to users index without permission', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get('/users')
        ->assertForbidden();
});

it('allows access to users index with permission', function () {
    $user = User::factory()->create();

    // Create role and permission
    $role = Role::create([
        'name' => 'User Manager',
        'slug' => 'user-manager',
        'description' => 'Can manage users',
        'is_active' => true,
    ]);

    $permission = Permission::create([
        'name' => 'View Users',
        'slug' => 'view-users',
        'description' => 'Can view users',
    ]);

    $role->givePermissionTo($permission);
    $user->assignRole($role);

    $this->actingAs($user)
        ->get('/users')
        ->assertSuccessful();
});

it('blocks access to roles without permission', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get('/roles')
        ->assertForbidden();
});

it('allows access to roles with permission', function () {
    $user = User::factory()->create();

    // Create role and permission
    $role = Role::create([
        'name' => 'Role Manager',
        'slug' => 'role-manager',
        'description' => 'Can manage roles',
        'is_active' => true,
    ]);

    $permission = Permission::create([
        'name' => 'View Roles',
        'slug' => 'view-roles',
        'description' => 'Can view roles',
    ]);

    $role->givePermissionTo($permission);
    $user->assignRole($role);

    $this->actingAs($user)
        ->get('/roles')
        ->assertSuccessful();
});

it('redirects unauthenticated users to login', function () {
    $this->get('/users')
        ->assertRedirect('/login');
});
