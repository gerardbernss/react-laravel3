<?php

use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    // Run the seeder to set up roles and permissions
    $this->seed(\Database\Seeders\RolePermissionSeeder::class);
});

it('can view permissions index with proper permission', function () {
    $admin = User::where('email', 'admin@example.com')->first();
    $this->actingAs($admin);

    $response = $this->get('/permissions');
    $response->assertSuccessful();
    $response->assertInertia(fn ($page) => $page->component('Permissions/Index'));
});

it('can create a new permission', function () {
    $admin = User::where('email', 'admin@example.com')->first();
    $this->actingAs($admin);

    $permissionData = [
        'name' => 'Test Permission',
        'description' => 'A test permission for testing purposes',
    ];

    $response = $this->post('/permissions', $permissionData);
    $response->assertRedirect('/permissions');
    
    $this->assertDatabaseHas('permissions', [
        'name' => 'Test Permission',
        'slug' => 'test-permission',
        'description' => 'A test permission for testing purposes',
    ]);
});

it('can update an existing permission', function () {
    $admin = User::where('email', 'admin@example.com')->first();
    $this->actingAs($admin);

    $permission = Permission::first();
    
    $updateData = [
        'name' => 'Updated Permission Name',
        'description' => 'Updated description',
    ];

    $response = $this->put("/permissions/{$permission->id}", $updateData);
    $response->assertRedirect('/permissions');
    
    $this->assertDatabaseHas('permissions', [
        'id' => $permission->id,
        'name' => 'Updated Permission Name',
        'slug' => 'updated-permission-name',
        'description' => 'Updated description',
    ]);
});

it('can delete a permission', function () {
    $admin = User::where('email', 'admin@example.com')->first();
    $this->actingAs($admin);

    $permission = Permission::first();
    
    $response = $this->delete("/permissions/{$permission->id}");
    $response->assertRedirect('/permissions');
    
    $this->assertDatabaseMissing('permissions', [
        'id' => $permission->id,
    ]);
});

it('ensures permission system is working correctly', function () {
    $user = User::where('email', 'user@example.com')->first();
    $admin = User::where('email', 'admin@example.com')->first();
    
    // Regular user should not have create-permissions
    expect($user->hasPermission('create-permissions'))->toBeFalse();
    
    // Admin should have create-permissions
    expect($admin->hasPermission('create-permissions'))->toBeTrue();
    
    // Regular user should have view-permissions
    expect($user->hasPermission('view-permissions'))->toBeTrue();
});

it('validates permission creation data', function () {
    $admin = User::where('email', 'admin@example.com')->first();
    $this->actingAs($admin);

    $response = $this->post('/permissions', []);
    $response->assertSessionHasErrors(['name']);
});

it('prevents duplicate permission names', function () {
    $admin = User::where('email', 'admin@example.com')->first();
    $this->actingAs($admin);

    $permissionData = [
        'name' => 'View Users', // This already exists from seeder
        'description' => 'Test description',
    ];

    $response = $this->post('/permissions', $permissionData);
    $response->assertSessionHasErrors(['name']);
});