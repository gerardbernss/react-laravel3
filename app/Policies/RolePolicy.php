<?php

namespace App\Policies;

use App\Models\Role;
use App\Models\User;

class RolePolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return $user->hasPermission('view-roles');
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Role $role): bool
    {
        return $user->hasPermission('view-roles');
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->hasPermission('create-roles');
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Role $role): bool
    {
        // Prevent updating super-admin role unless user is super-admin
        if ($role->slug === 'super-admin' && ! $user->isSuperAdmin()) {
            return false;
        }

        return $user->hasPermission('update-roles');
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Role $role): bool
    {
        // Prevent deleting super-admin role
        if ($role->slug === 'super-admin') {
            return false;
        }

        return $user->hasPermission('delete-roles');
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, Role $role): bool
    {
        return $user->hasPermission('restore-roles');
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, Role $role): bool
    {
        // Prevent force deleting super-admin role
        if ($role->slug === 'super-admin') {
            return false;
        }

        return $user->hasPermission('force-delete-roles');
    }

    /**
     * Determine whether the user can assign permissions to the role.
     */
    public function assignPermission(User $user, Role $role): bool
    {
        // Prevent modifying super-admin role permissions unless user is super-admin
        if ($role->slug === 'super-admin' && ! $user->isSuperAdmin()) {
            return false;
        }

        return $user->hasPermission('assign-permissions');
    }

    /**
     * Determine whether the user can remove permissions from the role.
     */
    public function removePermission(User $user, Role $role): bool
    {
        // Prevent modifying super-admin role permissions unless user is super-admin
        if ($role->slug === 'super-admin' && ! $user->isSuperAdmin()) {
            return false;
        }

        return $user->hasPermission('remove-permissions');
    }
}
