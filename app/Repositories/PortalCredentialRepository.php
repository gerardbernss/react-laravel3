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

    /**
     * Finds a portal credential by username, or returns null if not found.
     */
    public function findByUsername(string $username): ?PortalCredential
    {
        return PortalCredential::where('username', $username)->first();
    }

    /**
     * Finds the portal credential linked to the given applicant, or returns null if none exists.
     */
    public function findByApplicantId(int $applicantId): ?PortalCredential
    {
        return PortalCredential::where('applicant_id', $applicantId)->first();
    }

    /**
     * Returns all portal credentials with personal data and application eager-loaded, newest first.
     */
    public function allWithRelations(): Collection
    {
        return PortalCredential::with(['personalData', 'application'])
            ->orderBy('created_at', 'desc')
            ->get();
    }

    /**
     * Returns all applicants with their personal data eager-loaded — used to populate the credential creation dropdown.
     */
    public function applicantsWithPersonalData(): Collection
    {
        return Applicant::with('applicantPersonalData')->get();
    }

    /**
     * Finds applicant personal data by ID or throws a ModelNotFoundException if not found.
     */
    public function findPersonalDataOrFail(int $id): ApplicantPersonalData
    {
        return ApplicantPersonalData::findOrFail($id);
    }

    /**
     * Returns true if the given username is already taken by another portal credential.
     */
    public function usernameExists(string $username): bool
    {
        return PortalCredential::where('username', $username)->exists();
    }

    /**
     * Creates and returns a new portal credential record.
     */
    public function create(array $data): PortalCredential
    {
        return PortalCredential::create($data);
    }

    /**
     * Updates the given portal credential with the supplied data.
     */
    public function update(PortalCredential $credential, array $data): void
    {
        $credential->update($data);
    }

    /**
     * Eager-loads personal data and application onto the credential model.
     */
    public function loadRelations(PortalCredential $credential): PortalCredential
    {
        return $credential->load(['personalData', 'application']);
    }

    /**
     * Records the current timestamp as the credential's last login via the model's recordLogin() method.
     */
    public function recordLogin(PortalCredential $credential): void
    {
        $credential->recordLogin();
    }

    /**
     * Increments the failed login attempt counter on the credential — used for lockout logic.
     */
    public function incrementLoginAttempts(PortalCredential $credential): void
    {
        $credential->incrementLoginAttempts();
    }
}
