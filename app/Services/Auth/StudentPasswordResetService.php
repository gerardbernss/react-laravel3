<?php

namespace App\Services\Auth;

use App\Repositories\PasswordResetTokenRepository;
use App\Repositories\PortalCredentialRepository;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class StudentPasswordResetService
{
    public function __construct(
        private PortalCredentialRepository $portalCredentialRepository,
        private PasswordResetTokenRepository $passwordResetTokenRepository,
    ) {
    }

    /**
     * Validates the reset token for a student portal credential and saves the new password.
     * Throws if the credential is not found, the token doesn't match, or it has expired (older than 60 minutes).
     *
     * @throws ValidationException
     */
    public function execute(string $emailOrUsername, string $token, string $password): void
    {
        $credential = $this->portalCredentialRepository->findByEmailOrUsername($emailOrUsername);

        if (! $credential) {
            throw ValidationException::withMessages([
                'email' => ['We could not find a student portal account with that email address.'],
            ]);
        }

        $email = $credential->getEmailForPasswordReset();
        $resetRecord = $this->passwordResetTokenRepository->findForEmail($email);

        if (! $resetRecord || ! Hash::check($token, $resetRecord->token)) {
            throw ValidationException::withMessages([
                'email' => ['This password reset token is invalid.'],
            ]);
        }

        if (now()->diffInMinutes($resetRecord->created_at) > 60) {
            throw ValidationException::withMessages([
                'email' => ['This password reset token has expired.'],
            ]);
        }

        $this->portalCredentialRepository->update($credential, [
            'temporary_password' => Hash::make($password),
            'password_changed' => true,
        ]);

        $this->passwordResetTokenRepository->deleteForEmail($email);

        event(new PasswordReset($credential));
    }
}
