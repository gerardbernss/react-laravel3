<?php

use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('can create roles and permissions', function () {
    $role = Role::create([
        'name' => 'Test Admin',
        'slug' => 'test-admin',
        'description' => 'Test admin role',
        'is_active' => true,
    ]);

    $permission = Permission::create([
        'name' => 'Test Permission',
        'slug' => 'test-permission',
        'description' => 'Test permission',
    ]);

    expect($role)->toBeInstanceOf(Role::class);
    expect($permission)->toBeInstanceOf(Permission::class);
    expect($role->name)->toBe('Test Admin');
    expect($permission->name)->toBe('Test Permission');
});

it('can assign permissions to roles', function () {
    $role = Role::create([
        'name' => 'Test Role',
        'slug' => 'test-role',
        'description' => 'Test role',
        'is_active' => true,
    ]);

    $permission = Permission::create([
        'name' => 'Test Permission',
        'slug' => 'test-permission',
        'description' => 'Test permission',
    ]);

    $role->givePermissionTo($permission);

    expect($role->hasPermission('test-permission'))->toBeTrue();
    expect($role->permissions)->toHaveCount(1);
});

it('can assign roles to users', function () {
    $user = User::factory()->create();

    $role = Role::create([
        'name' => 'Test Role',
        'slug' => 'test-role',
        'description' => 'Test role',
        'is_active' => true,
    ]);

    $user->assignRole($role);

    expect($user->hasRole('test-role'))->toBeTrue();
    expect($user->roles)->toHaveCount(1);
});

it('can check user permissions through roles', function () {
    $user = User::factory()->create();

    $role = Role::create([
        'name' => 'Test Role',
        'slug' => 'test-role',
        'description' => 'Test role',
        'is_active' => true,
    ]);

    $permission = Permission::create([
        'name' => 'Test Permission',
        'slug' => 'test-permission',
        'description' => 'Test permission',
    ]);

    $role->givePermissionTo($permission);
    $user->assignRole($role);

    expect($user->hasPermission('test-permission'))->toBeTrue();
    expect($user->hasRole('test-role'))->toBeTrue();
});

it('can check if user is admin', function () {
    $user = User::factory()->create();

    $adminRole = Role::create([
        'name' => 'Admin',
        'slug' => 'admin',
        'description' => 'Admin role',
        'is_active' => true,
    ]);

    $user->assignRole($adminRole);

    expect($user->isAdmin())->toBeTrue();
    expect($user->isSuperAdmin())->toBeFalse();
});

it('can check if user is super admin', function () {
    $user = User::factory()->create();

    $superAdminRole = Role::create([
        'name' => 'Super Admin',
        'slug' => 'super-admin',
        'description' => 'Super admin role',
        'is_active' => true,
    ]);

    $user->assignRole($superAdminRole);

    expect($user->isSuperAdmin())->toBeTrue();
    expect($user->isAdmin())->toBeTrue(); // Super admin is also admin
});
