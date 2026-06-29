<?php

namespace App\Repositories;

use App\Models\Applicant;
use App\Models\ApplicantFamilyBackground;
use App\Models\ApplicantPersonalData;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;

class ApplicationRepository
{
    public function allWithPersonalData(): Collection
    {
        return Applicant::with(['personalData'])->get();
    }

    public function userEmailExists(string $email): bool
    {
        return User::where('email', $email)->exists();
    }

    public function personalDataEmailExists(string $email): bool
    {
        return ApplicantPersonalData::where('email', $email)
            ->orWhere('alt_email', $email)
            ->exists();
    }

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

    public function findPersonalDataByEmail(?string $email): ?ApplicantPersonalData
    {
        return ApplicantPersonalData::where('email', $email)->first();
    }

    public function createPersonalData(array $data): ApplicantPersonalData
    {
        return ApplicantPersonalData::create($data);
    }

    public function updatePersonalData(ApplicantPersonalData $personalData, array $data): void
    {
        $personalData->update($data);
    }

    public function saveDoctorsNotePath(ApplicantPersonalData $personalData, string $path): void
    {
        $personalData->doctors_note_file = $path;
        $personalData->save();
    }

    public function updateOrCreateFamilyBackground(ApplicantPersonalData $personalData, array $data): void
    {
        $personalData->familyBackground()->updateOrCreate(
            ['applicant_personal_data_id' => $personalData->id],
            $data
        );
    }

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

    public function lastApplicationNumberWithPrefix(string $letter): ?Applicant
    {
        return Applicant::where('application_number', 'like', $letter . '%')
            ->orderBy('application_number', 'desc')
            ->first();
    }

    public function applicationNumberExists(string $number): bool
    {
        return Applicant::where('application_number', $number)->exists();
    }

    public function createApplicant(array $data): Applicant
    {
        return Applicant::forceCreate($data);
    }

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

    public function createDocuments(Applicant $application, array $uploads): void
    {
        $application->documents()->create($uploads);
    }

    public function updateFamilyBackgroundFields(ApplicantFamilyBackground $familyBackground, array $data): void
    {
        $familyBackground->update($data);
    }

    public function replaceEducationalBackground(Applicant $application, array $schools): void
    {
        $application->educationalBackground()->delete();

        foreach ($schools as $school) {
            if (! empty($school['school_name'])) {
                $application->educationalBackground()->create($school);
            }
        }
    }

    public function updateOrCreateDocuments(Applicant $application, array $data): void
    {
        $application->documents()->updateOrCreate(['applicant_id' => $application->id], $data);
    }
}
