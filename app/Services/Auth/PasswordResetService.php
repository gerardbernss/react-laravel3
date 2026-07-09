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
     * Validates the reset token, saves the new password, and fires the PasswordReset event.
     *
     * @return string Laravel's password broker status constant (e.g. Password::PASSWORD_RESET on success)
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
