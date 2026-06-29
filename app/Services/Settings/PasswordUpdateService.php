<?php

namespace App\Services\Settings;

use App\Models\User;
use App\Repositories\UserRepository;
use Illuminate\Support\Facades\Hash;

class PasswordUpdateService
{
    public function __construct(private UserRepository $userRepository) {}

    public function execute(User $user, string $newPassword): void
    {
        $this->userRepository->update($user, [
            'password' => Hash::make($newPassword),
        ]);
    }
}
