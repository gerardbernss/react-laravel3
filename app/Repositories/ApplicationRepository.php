<?php

namespace App\Repositories;

use App\Models\Applicant;
use App\Models\ApplicantFamilyBackground;
use App\Models\ApplicantPersonalData;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;

class ApplicationRepository
{
    /**
     * Returns all applicants with their personal data eager-loaded.
     */
    public function allWithPersonalData(): Collection
    {
        return Applicant::with(['personalData'])->get();
    }

    /**
     * Returns true if a staff/admin user account already uses this email address.
     */
    public function userEmailExists(string $email): bool
    {
        return User::where('email', $email)->exists();
    }

    /**
     * Returns true if the email matches any applicant's primary or alternate email — used to prevent duplicate registrations.
     */
    public function personalDataEmailExists(string $email): bool
    {
        return ApplicantPersonalData::where('email', $email)
            ->orWhere('alt_email', $email)
            ->exists();
    }

    /**
     * Returns true if another applicant with the same name and birthdate already has an application for the same school year.
     * The name comparison is case-insensitive.
     */
    public function isDuplicateApplication(string $firstName, string $lastName, ?string $middleName, ?string $birthDate, ?string $schoolYear): bool
    {
        return ApplicantPersonalData::whereRaw('LOWER(first_name) = ?', [$firstName])
            ->whereRaw('LOWER(last_name) = ?', [$lastName])
            ->where(function ($query) use ($middleName) {
                if ($middleName) {
                    $query->whereRaw('LOWER(middle_name) = ?', [$middleName]);
                } else {
                    $query->whereNull('middle_name')->orWhere('middle_name', '');
                }
            })
            ->where('date_of_birth', $birthDate)
            ->whereHas('applications', function ($query) use ($schoolYear) {
                $query->where('school_year', $schoolYear);
            })
            ->exists();
    }

    /**
     * Finds an applicant's personal data record by their primary email, or returns null if not found.
     */
    public function findPersonalDataByEmail(?string $email): ?ApplicantPersonalData
    {
        return ApplicantPersonalData::where('email', $email)->first();
    }

    /**
     * Creates and returns a new applicant personal data record.
     */
    public function createPersonalData(array $data): ApplicantPersonalData
    {
        return ApplicantPersonalData::create($data);
    }

    /**
     * Updates an applicant's personal data record with the given fields.
     */
    public function updatePersonalData(ApplicantPersonalData $personalData, array $data): void
    {
        $personalData->update($data);
    }

    /**
     * Saves the storage path of an uploaded doctor's note to the personal data record.
     */
    public function saveDoctorsNotePath(ApplicantPersonalData $personalData, string $path): void
    {
        $personalData->doctors_note_file = $path;
        $personalData->save();
    }

    /**
     * Creates or updates the family background record linked to the given personal data.
     */
    public function updateOrCreateFamilyBackground(ApplicantPersonalData $personalData, array $data): void
    {
        $personalData->familyBackground()->updateOrCreate(
            ['applicant_personal_data_id' => $personalData->id],
            $data
        );
    }

    /**
     * Deletes all existing sibling records for the applicant and re-inserts the supplied list.
     * Skips entries that have no sibling_full_name.
     */
    public function replaceSiblings(ApplicantPersonalData $personalData, array $siblings): void
    {
        $personalData->siblings()->delete();

        foreach ($siblings as $sibling) {
            if (is_array($sibling) && ! empty($sibling['sibling_full_name'])) {
                $personalData->siblings()->create([
                    'sibling_full_name' => $sibling['sibling_full_name'],
                    'sibling_grade_level' => $sibling['sibling_grade_level'] ?? null,
                    'sibling_id_number' => $sibling['sibling_id_number'] ?? null,
                ]);
            }
        }
    }

    /**
     * Returns the applicant with the highest application number starting with the given letter prefix — used to generate the next sequential number.
     */
    public function lastApplicationNumberWithPrefix(string $letter): ?Applicant
    {
        return Applicant::where('application_number', 'like', $letter . '%')
            ->orderBy('application_number', 'desc')
            ->first();
    }

    /**
     * Returns true if an application with the given number already exists — used as a uniqueness check before inserting.
     */
    public function applicationNumberExists(string $number): bool
    {
        return Applicant::where('application_number', $number)->exists();
    }

    /**
     * Creates and returns a new applicant record, bypassing mass-assignment guards via forceCreate.
     */
    public function createApplicant(array $data): Applicant
    {
        return Applicant::forceCreate($data);
    }

    /**
     * Adds a single school record to the applicant's educational background history.
     */
    public function createEducationalBackground(Applicant $application, array $school): void
    {
        $application->educationalBackground()->create([
            'school_name' => $school['school_name'],
            'school_address' => $school['school_address'] ?? null,
            'from_grade' => $school['from_grade'] ?? null,
            'to_grade' => $school['to_grade'] ?? null,
            'from_year' => $school['from_year'] ?? null,
            'to_year' => $school['to_year'] ?? null,
            'honors_awards' => $school['honors_awards'] ?? null,
            'general_average' => $school['general_average'] ?? null,
            'class_rank' => $school['class_rank'] ?? null,
            'class_size' => $school['class_size'] ?? null,
        ]);
    }

    /**
     * Creates the document record for an application with the given file paths.
     */
    public function createDocuments(Applicant $application, array $uploads): void
    {
        $application->documents()->create($uploads);
    }

    /**
     * Updates specific fields on an existing family background record.
     */
    public function updateFamilyBackgroundFields(ApplicantFamilyBackground $familyBackground, array $data): void
    {
        $familyBackground->update($data);
    }

    /**
     * Deletes all existing educational background rows for the application and re-inserts the supplied list.
     * Skips entries that have no school_name.
     */
    public function replaceEducationalBackground(Applicant $application, array $schools): void
    {
        $application->educationalBackground()->delete();

        foreach ($schools as $school) {
            if (! empty($school['school_name'])) {
                $application->educationalBackground()->create($school);
            }
        }
    }

    /**
     * Creates or updates the document record for the application with the given file path data.
     */
    public function updateOrCreateDocuments(Applicant $application, array $data): void
    {
        $application->documents()->updateOrCreate(['applicant_id' => $application->id], $data);
    }
}
