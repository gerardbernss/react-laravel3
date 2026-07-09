<?php

namespace App\Services\Admin;

use App\Models\Permission;
use App\Repositories\PermissionRepository;
use Illuminate\Support\Str;

class PermissionService
{
    public function __construct(private PermissionRepository $permissionRepository)
    {
    }

    /**
     * Creates a new permission; uses the provided slug if given, otherwise derives it from the name.
     */
    public function create(array $data): Permission
    {
        return $this->permissionRepository->create([
            'name' => $data['name'],
            'slug' => ! empty($data['slug']) ? $data['slug'] : Str::slug($data['name']),
            'description' => $data['description'] ?? null,
        ]);
    }

    /**
     * Updates a permission's name, description, and slug; uses the provided slug if given, otherwise derives it from the name.
     */
    public function update(Permission $permission, array $data): void
    {
        $this->permissionRepository->update($permission, [
            'name' => $data['name'],
            'slug' => ! empty($data['slug']) ? $data['slug'] : Str::slug($data['name']),
            'description' => $data['description'] ?? null,
        ]);
    }
}
