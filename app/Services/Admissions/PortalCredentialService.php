<?php

namespace App\Services\Admissions;

use App\Mail\Admissions\PortalPasswordMail;
use App\Mail\Admissions\ResendPortalPasswordMail;
use App\Models\PortalCredential;
use App\Repositories\PortalCredentialRepository;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class PortalCredentialService
{
    public function __construct(private PortalCredentialRepository $portalCredentialRepository)
    {
    }

    /**
     * Creates portal credentials for an applicant using their email as the username,
     * generates a random temporary password, and emails the credentials to them.
     * Returns an error array if the applicant has no email or credentials already exist.
     */
    public function store(array $validated, ?int $userId): array
    {
        $personalData = $this->portalCredentialRepository->findPersonalDataOrFail($validated['applicant_personal_data_id']);

        if (empty($personalData->email)) {
            return ['error_field' => 'email', 'error_message' => 'The applicant does not have an email address. Please update their profile first.'];
        }

        $username = $personalData->email;

        if ($this->portalCredentialRepository->usernameExists($username)) {
            return ['error_field' => 'username', 'error_message' => 'Portal credentials already exist for this email address.'];
        }

        $temporaryPassword = Str::random(12);

        $credential = $this->portalCredentialRepository->create([
            'applicant_personal_data_id' => $validated['applicant_personal_data_id'],
            'applicant_id' => $validated['applicant_id'],
            'username' => $username,
            'temporary_password' => bcrypt($temporaryPassword),
            'credentials_generated_at' => now(),
            'created_by' => $userId,
        ]);

        $this->sendInitialCredentials($credential, $temporaryPassword);

        return ['credential' => $credential];
    }

    /**
     * Generates a new temporary password for an existing credential and emails it to the applicant.
     * Returns a success/failure result array.
     */
    public function send(PortalCredential $credential): array
    {
        if (! $credential->personalData || ! $credential->personalData->email) {
            return ['success' => false, 'message' => 'Applicant email not found.'];
        }

        try {
            $temporaryPassword = Str::random(12);

            $this->portalCredentialRepository->update($credential, [
                'temporary_password' => bcrypt($temporaryPassword),
                'credentials_sent_at' => now(),
                'sent_via' => 'email',
            ]);

            Mail::to($credential->personalData->email)
                ->send(new ResendPortalPasswordMail($credential, $temporaryPassword));

            return ['success' => true, 'message' => 'Portal password sent to applicant successfully.'];
        } catch (\Exception $e) {
            Log::error('Failed to send portal credentials: ' . $e->getMessage());

            return ['success' => false, 'message' => 'Failed to send credentials. Please try again.'];
        }
    }

    /**
     * Generates a fresh temporary password, increments the resend counter, and re-emails the credentials to the applicant.
     */
    public function resend(PortalCredential $credential): array
    {
        try {
            $newPassword = Str::random(12);

            $this->portalCredentialRepository->update($credential, [
                'temporary_password' => bcrypt($newPassword),
                'credentials_sent_at' => now(),
                'sent_via' => 'email',
                'resent_count' => ($credential->resent_count ?? 0) + 1,
            ]);

            if ($credential->personalData && $credential->personalData->email) {
                Mail::to($credential->personalData->email)
                    ->send(new ResendPortalPasswordMail($credential, $newPassword));
            }

            return ['success' => true, 'message' => 'New credentials generated and sent to applicant.'];
        } catch (\Exception $e) {
            Log::error('Failed to resend portal credentials: ' . $e->getMessage());

            return ['success' => false, 'message' => 'Failed to resend credentials. Please try again.'];
        }
    }

    /**
     * Suspends portal access for a credential and resets the login attempt counter.
     */
    public function suspend(PortalCredential $credential): void
    {
        $this->portalCredentialRepository->update($credential, ['access_status' => 'Suspended', 'login_attempts' => 0]);
    }

    /**
     * Restores portal access for a suspended credential and resets the login attempt counter.
     */
    public function reactivate(PortalCredential $credential): void
    {
        $this->portalCredentialRepository->update($credential, ['access_status' => 'Active', 'login_attempts' => 0]);
    }

    /**
     * Emails the initial portal login credentials to the applicant and records the sent timestamp.
     * Silently logs and swallows any mail failure so the credential creation itself is not rolled back.
     */
    private function sendInitialCredentials(PortalCredential $credential, string $temporaryPassword): void
    {
        try {
            if ($credential->personalData && $credential->personalData->email) {
                Mail::to($credential->personalData->email)
                    ->send(new PortalPasswordMail($credential, $temporaryPassword));

                $this->portalCredentialRepository->update($credential, [
                    'credentials_sent_at' => now(),
                    'sent_via' => 'email',
                ]);
            }
        } catch (\Exception $e) {
            Log::error('Failed to send portal credentials email: ' . $e->getMessage());
        }
    }
}
