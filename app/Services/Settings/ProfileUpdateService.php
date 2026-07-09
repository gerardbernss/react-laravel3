<?php

namespace App\Services\Settings;

use App\Models\User;
use App\Repositories\UserRepository;

class ProfileUpdateService
{
    public function __construct(private UserRepository $userRepository) {}

    /**
     * Saves the user's updated profile details (name, email, etc.).
     */
    public function execute(User $user, array $data): void
    {
        $this->userRepository->saveProfile($user, $data);
    }
}
