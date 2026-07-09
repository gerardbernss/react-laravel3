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

    /**
     * Creates a new user and syncs their roles in a single transaction.
     */
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

    /**
     * Updates a user's details and re-syncs their roles. Only updates the password if a new one is provided.
     */
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

    /**
     * Adds a single role to a user without affecting their other roles.
     */
    public function assignRole(User $user, int $roleId): void
    {
        $this->userRepository->assignRole($user, $this->roleRepository->findOrFail($roleId));
    }

    /**
     * Removes a single role from a user without affecting their other roles.
     */
    public function removeRole(User $user, int $roleId): void
    {
        $this->userRepository->removeRole($user, $this->roleRepository->findOrFail($roleId));
    }

    /**
     * Merges the 'roles' array and the single 'role_id' field into one deduplicated list of role IDs.
     * Handles the case where the form submits both a primary role and additional roles separately.
     */
    private function resolveRoleIds(array $data): array
    {
        $roleIds = collect($data['roles'] ?? []);

        if (! empty($data['role_id'])) {
            $roleIds->push((int) $data['role_id']);
        }

        return $roleIds->unique()->all();
    }
}
