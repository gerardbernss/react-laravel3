<?php

namespace App\Services\Auth;

use App\Models\User;
use App\Repositories\UserRepository;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Password;

class PasswordResetService
{
    public function __construct(private UserRepository $userRepository) {}

    /**
     * @return string The Password broker status string (e.g. Password::PasswordReset).
     */
    public function execute(Request $request): string
    {
        return Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function (User $user) use ($request) {
                $this->userRepository->resetPassword($user, $request->password);

                event(new PasswordReset($user));
            }
        );
    }
}
