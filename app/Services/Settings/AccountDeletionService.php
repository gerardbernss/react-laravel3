<?php

namespace App\Services\Settings;

use App\Repositories\UserRepository;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AccountDeletionService
{
    public function __construct(private UserRepository $userRepository) {}

    /**
     * Logs the user out, deletes their account, then invalidates the session and rotates the CSRF token.
     */
    public function execute(Request $request): void
    {
        $user = $request->user();

        Auth::logout();

        $this->userRepository->delete($user);

        $request->session()->invalidate();
        $request->session()->regenerateToken();
    }
}
