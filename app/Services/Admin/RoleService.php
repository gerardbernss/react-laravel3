<?php

namespace App\Services\Admin;

use App\Models\Role;
use App\Repositories\PermissionRepository;
use App\Repositories\RoleRepository;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class RoleService
{
    public function __construct(
        private RoleRepository $roleRepository,
        private PermissionRepository $permissionRepository,
    ) {
    }

    /**
     * Creates a new role with an auto-generated slug and optionally assigns the given permissions to it.
     */
    public function create(array $data): Role
    {
        return DB::transaction(function () use ($data) {
            $role = $this->roleRepository->create([
                'name' => $data['name'],
                'slug' => Str::slug($data['name']),
                'description' => $data['description'] ?? null,
                'is_active' => $data['is_active'],
            ]);

            if (! empty($data['permissions'])) {
                $this->roleRepository->syncPermissions($role, $data['permissions']);
            }

            return $role;
        });
    }

    /**
     * Updates a role's details and re-syncs its permissions in a single transaction.
     */
    public function update(Role $role, array $data): void
    {
        DB::transaction(function () use ($role, $data) {
            $this->roleRepository->update($role, [
                'name' => $data['name'],
                'slug' => Str::slug($data['name']),
                'description' => $data['description'] ?? null,
                'is_active' => $data['is_active'],
            ]);

            if (! empty($data['permissions'])) {
                $this->roleRepository->syncPermissions($role, $data['permissions']);
            }
        });
    }

    /**
     * Grants a single permission to a role.
     */
    public function assignPermission(Role $role, int $permissionId): void
    {
        $this->roleRepository->givePermissionTo($role, $this->permissionRepository->findOrFail($permissionId));
    }

    /**
     * Revokes a single permission from a role.
     */
    public function removePermission(Role $role, int $permissionId): void
    {
        $this->roleRepository->revokePermissionTo($role, $this->permissionRepository->findOrFail($permissionId));
    }
}
