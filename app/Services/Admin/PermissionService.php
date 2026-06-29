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

    public function create(array $data): Permission
    {
        return $this->permissionRepository->create([
            'name' => $data['name'],
            'slug' => Str::slug($data['name']),
            'description' => $data['description'] ?? null,
        ]);
    }

    public function update(Permission $permission, array $data): void
    {
        $this->permissionRepository->update($permission, [
            'name' => $data['name'],
            'slug' => Str::slug($data['name']),
            'description' => $data['description'] ?? null,
        ]);
    }
}
