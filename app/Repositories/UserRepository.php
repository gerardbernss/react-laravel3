<?php

namespace App\Repositories;

use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Laravel\Socialite\Contracts\User as SocialiteUser;

class UserRepository
{
    public function findByEmail(string $email): ?User
    {
        return User::where('email', $email)->first();
    }

    public function findByGoogleId(string $googleId): ?User
    {
        return User::where('google_id', $googleId)->first();
    }

    public function createFromGoogle(SocialiteUser $googleUser): User
    {
        return User::create([
            'name' => $googleUser->getName(),
            'email' => $googleUser->getEmail(),
            'google_id' => $googleUser->getId(),
            'avatar' => $googleUser->getAvatar(),
            'email_verified_at' => now(),
            'password' => bcrypt(str()->random(32)),
        ]);
    }

    public function allWithRoles(): Collection
    {
        return User::with(['roles', 'role'])->get();
    }

    public function loadRoles(User $user): User
    {
        return $user->load(['roles', 'role']);
    }

    public function create(array $data): User
    {
        return User::create($data);
    }

    public function update(User $user, array $data): void
    {
        $user->update($data);
    }

    public function delete(User $user): void
    {
        $user->delete();
    }

    public function syncRoles(User $user, array $roleIds): void
    {
        $user->roles()->sync($roleIds);
    }

    public function assignRole(User $user, Role $role): void
    {
        $user->assignRole($role);
    }

    public function removeRole(User $user, Role $role): void
    {
        $user->removeRole($role);
    }

    public function getFacultyUsers(): Collection
    {
        return User::whereHas('roles', fn ($q) => $q->where('slug', 'faculty'))
            ->orderBy('name')
            ->get(['id', 'name']);
    }

    public function saveProfile(User $user, array $data): void
    {
        $user->fill($data);
        if ($user->isDirty('email')) {
            $user->email_verified_at = null;
        }
        $user->save();
    }

    public function resetPassword(User $user, string $password): void
    {
        $user->forceFill([
            'password' => Hash::make($password),
            'remember_token' => Str::random(60),
        ])->save();
    }
}
