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
    /**
     * Finds a user by email address, or returns null if not found.
     */
    public function findByEmail(string $email): ?User
    {
        return User::where('email', $email)->first();
    }

    /**
     * Finds a user by their Google OAuth ID, or returns null if not found.
     */
    public function findByGoogleId(string $googleId): ?User
    {
        return User::where('google_id', $googleId)->first();
    }

    /**
     * Creates a new user from a Google OAuth profile, marking the email as already verified and setting a random password since login is via Google.
     */
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

    /**
     * Returns all users with their roles eager-loaded.
     */
    public function allWithRoles(): Collection
    {
        return User::with(['roles', 'role'])->get();
    }

    /**
     * Eager-loads roles onto the user model.
     */
    public function loadRoles(User $user): User
    {
        return $user->load(['roles', 'role']);
    }

    /**
     * Creates and returns a new user record.
     */
    public function create(array $data): User
    {
        return User::create($data);
    }

    /**
     * Updates the given user record with the supplied data.
     */
    public function update(User $user, array $data): void
    {
        $user->update($data);
    }

    /**
     * Deletes the given user record.
     */
    public function delete(User $user): void
    {
        $user->delete();
    }

    /**
     * Replaces the user's entire role set with the given role IDs.
     */
    public function syncRoles(User $user, array $roleIds): void
    {
        $user->roles()->sync($roleIds);
    }

    /**
     * Assigns a single role to the user without removing existing roles.
     */
    public function assignRole(User $user, Role $role): void
    {
        $user->assignRole($role);
    }

    /**
     * Removes a single role from the user.
     */
    public function removeRole(User $user, Role $role): void
    {
        $user->removeRole($role);
    }

    /**
     * Returns all users with the "faculty" role, sorted by name, with only id and name selected — used to populate faculty dropdowns.
     */
    public function getFacultyUsers(): Collection
    {
        return User::whereHas('roles', fn ($q) => $q->where('slug', 'faculty'))
            ->orderBy('name')
            ->get(['id', 'name']);
    }

    /**
     * Updates the user's profile fields and clears email_verified_at if the email address has changed.
     */
    public function saveProfile(User $user, array $data): void
    {
        $user->fill($data);
        if ($user->isDirty('email')) {
            $user->email_verified_at = null;
        }
        $user->save();
    }

    /**
     * Sets a new hashed password on the user and rotates the remember token to invalidate any active sessions.
     */
    public function resetPassword(User $user, string $password): void
    {
        $user->forceFill([
            'password' => Hash::make($password),
            'remember_token' => Str::random(60),
        ])->save();
    }
}
