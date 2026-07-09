<?php

namespace App\Repositories;

use App\Models\Permission;
use Illuminate\Database\Eloquent\Collection;

class PermissionRepository
{
    /**
     * Returns all permissions.
     */
    public function all(): Collection
    {
        return Permission::all();
    }

    /**
     * Finds a permission by ID or throws a ModelNotFoundException if not found.
     */
    public function findOrFail(int $id): Permission
    {
        return Permission::findOrFail($id);
    }

    /**
     * Returns all permissions with a `roles_count` appended — used to show how many roles hold each permission in the index table.
     */
    public function allWithRoleCount(): Collection
    {
        return Permission::withCount('roles')->get();
    }

    /**
     * Eager-loads the permission's roles and each role's users onto the model — used for the permission detail/show page.
     */
    public function loadRolesWithUsers(Permission $permission): Permission
    {
        return $permission->load(['roles.users']);
    }

    /**
     * Creates and returns a new permission record.
     */
    public function create(array $data): Permission
    {
        return Permission::create($data);
    }

    /**
     * Updates the given permission with the supplied data.
     */
    public function update(Permission $permission, array $data): void
    {
        $permission->update($data);
    }

    /**
     * Deletes the given permission record.
     */
    public function delete(Permission $permission): void
    {
        $permission->delete();
    }
}
