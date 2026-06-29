<?php

namespace App\Repositories;

use App\Models\Applicant;
use App\Models\ApplicantPersonalData;
use App\Models\PortalCredential;
use Illuminate\Database\Eloquent\Collection;

class PortalCredentialRepository
{
    /**
     * Find a portal credential by either the linked personal data email or the username.
     */
    public function findByEmailOrUsername(string $emailOrUsername): ?PortalCredential
    {
        return PortalCredential::with('personalData')
            ->where(function ($query) use ($emailOrUsername) {
                $query->whereHas('personalData', function ($q) use ($emailOrUsername) {
                    $q->where('email', $emailOrUsername);
                })->orWhere('username', $emailOrUsername);
            })
            ->first();
    }

    public function findByUsername(string $username): ?PortalCredential
    {
        return PortalCredential::where('username', $username)->first();
    }

    public function findByApplicantId(int $applicantId): ?PortalCredential
    {
        return PortalCredential::where('applicant_id', $applicantId)->first();
    }

    public function allWithRelations(): Collection
    {
        return PortalCredential::with(['personalData', 'application'])
            ->orderBy('created_at', 'desc')
            ->get();
    }

    public function applicantsWithPersonalData(): Collection
    {
        return Applicant::with('applicantPersonalData')->get();
    }

    public function findPersonalDataOrFail(int $id): ApplicantPersonalData
    {
        return ApplicantPersonalData::findOrFail($id);
    }

    public function usernameExists(string $username): bool
    {
        return PortalCredential::where('username', $username)->exists();
    }

    public function create(array $data): PortalCredential
    {
        return PortalCredential::create($data);
    }

    public function update(PortalCredential $credential, array $data): void
    {
        $credential->update($data);
    }

    public function loadRelations(PortalCredential $credential): PortalCredential
    {
        return $credential->load(['personalData', 'application']);
    }

    public function statistics(): array
    {
        return [
            'total_credentials' => PortalCredential::count(),
            'total_activated' => PortalCredential::where('is_activated', true)->count(),
            'total_suspended' => PortalCredential::whereNotNull('access_suspended_at')->count(),
            'credentials_sent' => PortalCredential::whereNotNull('credentials_sent_at')->count(),
            'password_changed' => PortalCredential::where('password_changed', true)->count(),
            'with_logins' => PortalCredential::whereNotNull('last_login_at')->count(),
        ];
    }

    public function recordLogin(PortalCredential $credential): void
    {
        $credential->recordLogin();
    }

    public function incrementLoginAttempts(PortalCredential $credential): void
    {
        $credential->incrementLoginAttempts();
    }
}
