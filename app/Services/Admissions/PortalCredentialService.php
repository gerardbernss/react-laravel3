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

    public function suspend(PortalCredential $credential): void
    {
        $this->portalCredentialRepository->update($credential, ['access_status' => 'Suspended', 'login_attempts' => 0]);
    }

    public function reactivate(PortalCredential $credential): void
    {
        $this->portalCredentialRepository->update($credential, ['access_status' => 'Active', 'login_attempts' => 0]);
    }

    public function statistics(): array
    {
        return $this->portalCredentialRepository->statistics();
    }

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
