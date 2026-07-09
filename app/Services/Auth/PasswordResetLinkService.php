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
     * Sends a password reset link to the given email.
     * Checks staff users first, then student portal accounts.
     *
     * @throws ValidationException if no account is found for the email
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

    /**
     * Sends a standard Laravel password reset email to a staff user.
     *
     * @throws ValidationException if the mail broker fails to send
     */
    private function sendUserResetLink(string $email): void
    {
        $status = Password::sendResetLink(['email' => $email]);

        if ($status !== Password::RESET_LINK_SENT) {
            throw ValidationException::withMessages(['email' => [__($status)]]);
        }
    }

    /**
     * Creates a reset token and emails it to the student's portal account.
     */
    private function sendStudentResetLink(PortalCredential $credential): void
    {
        $token = Str::random(64);
        $email = $credential->getEmailForPasswordReset();

        $this->passwordResetTokenRepository->deleteForEmail($email);
        $this->passwordResetTokenRepository->create($email, Hash::make($token));

        $credential->notify(new StudentResetPasswordNotification($token));
    }
}
