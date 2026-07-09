<?php

namespace App\Repositories;

use App\Models\Permission;
use App\Models\Role;
use Illuminate\Database\Eloquent\Collection;

class RoleRepository
{
    /**
     * Finds a role by its slug, or returns null if not found.
     */
    public function findBySlug(string $slug): ?Role
    {
        return Role::where('slug', $slug)->first();
    }

    /**
     * Returns all roles with their permissions and assigned users eager-loaded — used for the roles index page.
     */
    public function allWithPermissionsAndUsers(): Collection
    {
        return Role::with(['permissions', 'users'])->get();
    }

    /**
     * Eager-loads the role's permissions and assigned users onto the model — used for the role detail/show page.
     */
    public function loadPermissionsAndUsers(Role $role): Role
    {
        return $role->load(['permissions', 'users']);
    }

    /**
     * Eager-loads only the role's permissions onto the model — used when users are not needed.
     */
    public function loadPermissions(Role $role): Role
    {
        return $role->load('permissions');
    }

    /**
     * Returns all active roles — used to populate role assignment dropdowns.
     */
    public function allActive(): Collection
    {
        return Role::where('is_active', true)->get();
    }

    /**
     * Finds a role by ID or throws a ModelNotFoundException if not found.
     */
    public function findOrFail(int $id): Role
    {
        return Role::findOrFail($id);
    }

    /**
     * Creates and returns a new role record.
     */
    public function create(array $data): Role
    {
        return Role::create($data);
    }

    /**
     * Updates the given role with the supplied data.
     */
    public function update(Role $role, array $data): void
    {
        $role->update($data);
    }

    /**
     * Deletes the given role record.
     */
    public function delete(Role $role): void
    {
        $role->delete();
    }

    /**
     * Replaces the role's current permission set with the given list of IDs, adding new ones and removing any not in the list.
     */
    public function syncPermissions(Role $role, array $permissionIds): void
    {
        $role->syncPermissions($permissionIds);
    }

    /**
     * Grants a single permission to the role.
     */
    public function givePermissionTo(Role $role, Permission $permission): void
    {
        $role->givePermissionTo($permission);
    }

    /**
     * Revokes a single permission from the role.
     */
    public function revokePermissionTo(Role $role, Permission $permission): void
    {
        $role->revokePermissionTo($permission);
    }
}
