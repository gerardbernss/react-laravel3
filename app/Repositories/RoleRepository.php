<?php

namespace App\Repositories;

use App\Models\Permission;
use App\Models\Role;
use Illuminate\Database\Eloquent\Collection;

class RoleRepository
{
    public function findBySlug(string $slug): ?Role
    {
        return Role::where('slug', $slug)->first();
    }

    public function allWithPermissionsAndUsers(): Collection
    {
        return Role::with(['permissions', 'users'])->get();
    }

    public function loadPermissionsAndUsers(Role $role): Role
    {
        return $role->load(['permissions', 'users']);
    }

    public function loadPermissions(Role $role): Role
    {
        return $role->load('permissions');
    }

    public function allActive(): Collection
    {
        return Role::where('is_active', true)->get();
    }

    public function findOrFail(int $id): Role
    {
        return Role::findOrFail($id);
    }

    public function create(array $data): Role
    {
        return Role::create($data);
    }

    public function update(Role $role, array $data): void
    {
        $role->update($data);
    }

    public function delete(Role $role): void
    {
        $role->delete();
    }

    public function syncPermissions(Role $role, array $permissionIds): void
    {
        $role->syncPermissions($permissionIds);
    }

    public function givePermissionTo(Role $role, Permission $permission): void
    {
        $role->givePermissionTo($permission);
    }

    public function revokePermissionTo(Role $role, Permission $permission): void
    {
        $role->revokePermissionTo($permission);
    }
}
