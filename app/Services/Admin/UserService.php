<?php

namespace App\Services\Admin;

use App\Models\User;
use App\Repositories\RoleRepository;
use App\Repositories\UserRepository;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class UserService
{
    public function __construct(
        private UserRepository $userRepository,
        private RoleRepository $roleRepository,
    ) {
    }

    public function create(array $data): User
    {
        return DB::transaction(function () use ($data) {
            $user = $this->userRepository->create([
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => Hash::make($data['password']),
                'role_id' => $data['role_id'] ?? null,
            ]);

            $this->userRepository->syncRoles($user, $this->resolveRoleIds($data));

            return $user;
        });
    }

    public function update(User $user, array $data): void
    {
        DB::transaction(function () use ($user, $data) {
            $updateData = [
                'name' => $data['name'],
                'email' => $data['email'],
                'role_id' => $data['role_id'] ?? null,
            ];

            if (! empty($data['password'])) {
                $updateData['password'] = Hash::make($data['password']);
            }

            $this->userRepository->update($user, $updateData);

            $this->userRepository->syncRoles($user, $this->resolveRoleIds($data));
        });
    }

    public function assignRole(User $user, int $roleId): void
    {
        $this->userRepository->assignRole($user, $this->roleRepository->findOrFail($roleId));
    }

    public function removeRole(User $user, int $roleId): void
    {
        $this->userRepository->removeRole($user, $this->roleRepository->findOrFail($roleId));
    }

    private function resolveRoleIds(array $data): array
    {
        $roleIds = collect($data['roles'] ?? []);

        if (! empty($data['role_id'])) {
            $roleIds->push((int) $data['role_id']);
        }

        return $roleIds->unique()->all();
    }
}
