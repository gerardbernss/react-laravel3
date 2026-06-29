<?php

namespace App\Services\Auth;

use App\Notifications\StudentResetPasswordNotification;
use App\Repositories\PasswordResetTokenRepository;
use App\Repositories\PortalCredentialRepository;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class StudentPasswordResetLinkService
{
    public function __construct(
        private PortalCredentialRepository $portalCredentialRepository,
        private PasswordResetTokenRepository $passwordResetTokenRepository,
    ) {
    }

    /**
     * @throws \Illuminate\Validation\ValidationException
     */
    public function execute(string $emailOrUsername): void
    {
        $credential = $this->portalCredentialRepository->findByEmailOrUsername($emailOrUsername);

        if (! $credential) {
            throw ValidationException::withMessages([
                'email' => ['We could not find a student portal account with that email address.'],
            ]);
        }

        $token = Str::random(64);
        $email = $credential->getEmailForPasswordReset();

        $this->passwordResetTokenRepository->deleteForEmail($email);
        $this->passwordResetTokenRepository->create($email, Hash::make($token));

        $credential->notify(new StudentResetPasswordNotification($token));
    }
}
