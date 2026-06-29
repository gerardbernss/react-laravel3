<?php

namespace App\Services\Auth;

use App\Models\PortalCredential;
use App\Notifications\StudentResetPasswordNotification;
use App\Repositories\PasswordResetTokenRepository;
use App\Repositories\PortalCredentialRepository;
use App\Repositories\UserRepository;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

/**
 * Sends a password reset link, checking both regular users and student portal accounts.
 */
class PasswordResetLinkService
{
    public function __construct(
        private UserRepository $userRepository,
        private PortalCredentialRepository $portalCredentialRepository,
        private PasswordResetTokenRepository $passwordResetTokenRepository,
    ) {
    }

    /**
     * @throws \Illuminate\Validation\ValidationException
     */
    public function execute(string $email): void
    {
        if ($this->userRepository->findByEmail($email)) {
            $this->sendUserResetLink($email);

            return;
        }

        $credential = $this->portalCredentialRepository->findByEmailOrUsername($email);

        if ($credential) {
            $this->sendStudentResetLink($credential);

            return;
        }

        throw ValidationException::withMessages([
            'email' => ['We could not find an account with that email address.'],
        ]);
    }

    private function sendUserResetLink(string $email): void
    {
        $status = Password::sendResetLink(['email' => $email]);

        if ($status !== Password::RESET_LINK_SENT) {
            throw ValidationException::withMessages(['email' => [__($status)]]);
        }
    }

    private function sendStudentResetLink(PortalCredential $credential): void
    {
        $token = Str::random(64);
        $email = $credential->getEmailForPasswordReset();

        $this->passwordResetTokenRepository->deleteForEmail($email);
        $this->passwordResetTokenRepository->create($email, Hash::make($token));

        $credential->notify(new StudentResetPasswordNotification($token));
    }
}
