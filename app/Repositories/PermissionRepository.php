<?php

namespace App\Repositories;

use App\Models\Permission;
use Illuminate\Database\Eloquent\Collection;

class PermissionRepository
{
    public function all(): Collection
    {
        return Permission::all();
    }

    public function findOrFail(int $id): Permission
    {
        return Permission::findOrFail($id);
    }

    public function allWithRoleCount(): Collection
    {
        return Permission::withCount('roles')->get();
    }

    public function loadRolesWithUsers(Permission $permission): Permission
    {
        return $permission->load(['roles.users']);
    }

    public function create(array $data): Permission
    {
        return Permission::create($data);
    }

    public function update(Permission $permission, array $data): void
    {
        $permission->update($data);
    }

    public function delete(Permission $permission): void
    {
        $permission->delete();
    }
}
