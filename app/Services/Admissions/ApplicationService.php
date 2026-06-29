<?php

namespace App\Services\Admissions;

use App\Mail\Admissions\PortalPasswordMail;
use App\Models\Applicant;
use App\Models\ApplicantPersonalData;
use App\Models\EnrollmentPeriod;
use App\Repositories\ApplicationRepository;
use App\Repositories\PortalCredentialRepository;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

/**
 * Business logic for the public-facing online application form (LES, JHS, SHS).
 *
 * submitLES/submitJHS/submitSHS share the same six-step write flow via
 * submitApplication() below. The only behavioral difference preserved from the
 * original controller is that LES checks for a duplicate application first;
 * JHS and SHS do not (this mirrors the original ApplicationController exactly).
 */
class ApplicationService
{
    public function __construct(
        private readonly ApplicationRepository $applicationRepository,
        private readonly PortalCredentialRepository $portalCredentialRepository,
    ) {
    }

    public function indexData(): array
    {
        $applications = $this->applicationRepository->allWithPersonalData()->map(function (Applicant $application) {
            return [
                'id' => $application->id,
                'application_number' => $application->application_number,
                'application_date' => $application->application_date,
                'application_status' => $application->application_status,
                'strand' => $application->strand,
                'last_name' => $application->personalData->last_name ?? null,
                'first_name' => $application->personalData->first_name ?? null,
                'middle_name' => $application->personalData->middle_name ?? null,
                'gender' => $application->personalData->gender ?? null,
                'email' => $application->personalData->email ?? null,
            ];
        });

        return ['applications' => $applications];
    }

    public function canAcceptApplications(): bool
    {
        return EnrollmentPeriod::hasOpenApplicationPeriod();
    }

    public function checkEmail(string $email): array
    {
        $exists = $this->applicationRepository->userEmailExists($email)
            || $this->applicationRepository->personalDataEmailExists($email);

        return [
            'exists' => $exists,
            'message' => $exists ? 'This email is already registered.' : 'Email is available.',
        ];
    }

    public function isDuplicateApplication(array $data): bool
    {
        $firstName = Str::lower(trim((string) ($data['first_name'] ?? '')));
        $lastName = Str::lower(trim((string) ($data['last_name'] ?? '')));
        $middleName = ! empty($data['middle_name']) ? Str::lower(trim((string) $data['middle_name'])) : null;

        return $this->applicationRepository->isDuplicateApplication(
            $firstName,
            $lastName,
            $middleName,
            $data['date_of_birth'] ?? null,
            trim((string) ($data['school_year'] ?? ''))
        );
    }

    public function submitLES(array $data, Request $request): array
    {
        if ($this->isDuplicateApplication($data)) {
            return ['duplicate' => true];
        }

        $this->submitApplication($data, $request);

        return ['duplicate' => false];
    }

    public function submitJHS(array $data, Request $request): array
    {
        $this->submitApplication($data, $request);

        return ['duplicate' => false];
    }

    public function submitSHS(array $data, Request $request): array
    {
        $this->submitApplication($data, $request);

        return ['duplicate' => false];
    }

    private function submitApplication(array $data, Request $request): void
    {
        $application = DB::transaction(function () use ($data, $request) {
            $personalData = $this->saveApplicantPersonalData($data, $request);
            $this->applicationRepository->updateOrCreateFamilyBackground($personalData, $this->buildFamilyPayload($data));
            $this->applicationRepository->replaceSiblings($personalData, $this->decodeJsonOrArray($data['siblings'] ?? null));

            $application = $this->applicationRepository->createApplicant($this->buildApplicationPayload($data, $personalData));

            foreach ($this->decodeJsonOrArray($data['schools'] ?? null) as $school) {
                if (is_array($school) && ! empty($school['school_name'])) {
                    $this->applicationRepository->createEducationalBackground($application, $school);
                }
            }

            $this->storeApplicationDocuments($application, $personalData, $request);

            return $application;
        });

        try {
            $this->dispatchPortalCredentials($application);
        } catch (\Exception $e) {
            Log::error('Failed to send portal credentials after submission: ' . $e->getMessage());
        }
    }

    private function saveApplicantPersonalData(array $data, Request $request): ApplicantPersonalData
    {
        $personalData = $this->applicationRepository->findPersonalDataByEmail($data['email'] ?? null);
        $payload = $this->buildPersonalDataPayload($data);

        if ($personalData) {
            $this->applicationRepository->updatePersonalData($personalData, $payload);
        } else {
            $personalData = $this->applicationRepository->createPersonalData($payload);
        }

        if (! $personalData || ! $personalData->id) {
            throw new \Exception('Failed to create or retrieve Personal Data ID.');
        }

        if ($request->hasFile('doctors_note_file')) {
            $this->storeDoctorsNote($personalData, $request);
        }

        return $personalData;
    }

    private function storeDoctorsNote(ApplicantPersonalData $personalData, Request $request): void
    {
        $lastName = strtoupper(preg_replace('/[^A-Za-z0-9]/', '', $personalData->last_name));
        $firstName = strtoupper(preg_replace('/[^A-Za-z0-9]/', '', $personalData->first_name));
        $file = $request->file('doctors_note_file');
        $filename = "{$personalData->id}_{$lastName}_{$firstName}_DOCTORS_NOTE." . $file->getClientOriginalExtension();
        $path = $file->storeAs('documents/doctors_notes', $filename, 'public');

        $this->applicationRepository->saveDoctorsNotePath($personalData, $path);
    }

    private function storeApplicationDocuments(Applicant $application, ApplicantPersonalData $personalData, Request $request): void
    {
        $lastName = strtoupper(preg_replace('/[^A-Za-z0-9]/', '', $personalData->last_name));
        $firstName = strtoupper(preg_replace('/[^A-Za-z0-9]/', '', $personalData->first_name));
        $filePrefix = $application->application_number;

        $fileKeys = [
            'certificate_of_enrollment' => 'COE',
            'birth_certificate' => 'BIRTHCERTIFICATE',
            'latest_report_card_front' => 'REPORTCARD_FRONT',
            'latest_report_card_back' => 'REPORTCARD_BACK',
        ];

        $uploads = [];
        foreach ($fileKeys as $fileKey => $docType) {
            if ($request->hasFile($fileKey)) {
                $file = $request->file($fileKey);
                $filename = "{$filePrefix}_{$lastName}_{$firstName}_{$docType}." . $file->getClientOriginalExtension();
                $uploads[$fileKey] = $file->storeAs('documents', $filename, 'public');
            }
        }

        if (! empty($uploads)) {
            $this->applicationRepository->createDocuments($application, $uploads);
        }
    }

    private function buildPersonalDataPayload(array $data): array
    {
        return [
            'last_name' => $data['last_name'] ?? null,
            'first_name' => $data['first_name'] ?? null,
            'middle_name' => $data['middle_name'] ?? null,
            'suffix' => $data['suffix'] ?? null,
            'learner_reference_number' => $data['learner_reference_number'] ?? null,
            'gender' => $data['gender'] ?? null,
            'citizenship' => $data['citizenship'] ?? null,
            'religion' => $data['religion'] ?? null,
            'date_of_birth' => $data['date_of_birth'] ?? null,
            'place_of_birth' => $data['place_of_birth'] ?? null,
            'has_sibling' => filter_var($data['has_sibling'] ?? null, FILTER_VALIDATE_BOOLEAN),
            'email' => $data['email'] ?? null,
            'alt_email' => $data['alt_email'] ?? null,
            'mobile_number' => $data['mobile_number'] ?? null,
            'present_street' => $data['present_street'] ?? null,
            'present_brgy' => $data['present_brgy'] ?? null,
            'present_city' => $data['present_city'] ?? null,
            'present_province' => $data['present_province'] ?? null,
            'present_zip' => $data['present_zip'] ?? null,
            'permanent_street' => $data['permanent_street'] ?? null,
            'permanent_brgy' => $data['permanent_brgy'] ?? null,
            'permanent_city' => $data['permanent_city'] ?? null,
            'permanent_province' => $data['permanent_province'] ?? null,
            'permanent_zip' => $data['permanent_zip'] ?? null,
            'stopped_studying' => $data['stopped_studying'] ?: 'No',
            'accelerated' => $data['accelerated'] ?: 'No',
            'health_conditions' => $this->formatHealthConditions($data['health_conditions'] ?? null),
            'has_doctors_note' => filter_var($data['has_doctors_note'] ?? null, FILTER_VALIDATE_BOOLEAN),
        ];
    }

    private function buildFamilyPayload(array $data): array
    {
        return [
            'father_lname' => $data['father_lname'] ?? null,
            'father_fname' => $data['father_fname'] ?? null,
            'father_mname' => $data['father_mname'] ?? null,
            'father_living' => $data['father_living'] ?? null,
            'father_citizenship' => $data['father_citizenship'] ?? null,
            'father_religion' => $data['father_religion'] ?? null,
            'father_highest_educ' => $data['father_highest_educ'] ?? null,
            'father_occupation' => $data['father_occupation'] ?? null,
            'father_income' => $data['father_income'] ?? null,
            'father_business_emp' => $data['father_business_emp'] ?? null,
            'father_business_address' => $data['father_business_address'] ?? null,
            'father_contact_no' => $data['father_contact_no'] ?? null,
            'father_email' => $data['father_email'] ?? null,
            'father_slu_employee' => filter_var($data['father_slu_employee'] ?? null, FILTER_VALIDATE_BOOLEAN),
            'father_slu_dept' => $data['father_slu_dept'] ?? null,
            'mother_lname' => $data['mother_lname'] ?? null,
            'mother_fname' => $data['mother_fname'] ?? null,
            'mother_mname' => $data['mother_mname'] ?? null,
            'mother_living' => $data['mother_living'] ?? null,
            'mother_citizenship' => $data['mother_citizenship'] ?? null,
            'mother_religion' => $data['mother_religion'] ?? null,
            'mother_highest_educ' => $data['mother_highest_educ'] ?? null,
            'mother_occupation' => $data['mother_occupation'] ?? null,
            'mother_income' => $data['mother_income'] ?? null,
            'mother_business_emp' => $data['mother_business_emp'] ?? null,
            'mother_business_address' => $data['mother_business_address'] ?? null,
            'mother_contact_no' => $data['mother_contact_no'] ?? null,
            'mother_email' => $data['mother_email'] ?? null,
            'mother_slu_employee' => filter_var($data['mother_slu_employee'] ?? null, FILTER_VALIDATE_BOOLEAN),
            'mother_slu_dept' => $data['mother_slu_dept'] ?? null,
            'guardian_lname' => $data['guardian_lname'] ?? null,
            'guardian_fname' => $data['guardian_fname'] ?? null,
            'guardian_mname' => $data['guardian_mname'] ?? null,
            'guardian_relationship' => $data['guardian_relationship'] ?? null,
            'guardian_citizenship' => $data['guardian_citizenship'] ?? null,
            'guardian_religion' => $data['guardian_religion'] ?? null,
            'guardian_highest_educ' => $data['guardian_highest_educ'] ?? null,
            'guardian_occupation' => $data['guardian_occupation'] ?? null,
            'guardian_income' => $data['guardian_income'] ?? null,
            'guardian_business_emp' => $data['guardian_business_emp'] ?? null,
            'guardian_business_address' => $data['guardian_business_address'] ?? null,
            'guardian_contact_no' => $data['guardian_contact_no'] ?? null,
            'guardian_email' => $data['guardian_email'] ?? null,
            'guardian_slu_employee' => filter_var($data['guardian_slu_employee'] ?? null, FILTER_VALIDATE_BOOLEAN),
            'guardian_slu_dept' => $data['guardian_slu_dept'] ?? null,
            'emergency_contact_name' => $data['emergency_contact_name'] ?? null,
            'emergency_relationship' => $data['emergency_relationship'] ?? null,
            'emergency_home_phone' => $data['emergency_home_phone'] ?? null,
            'emergency_mobile_phone' => $data['emergency_mobile_phone'] ?? null,
            'emergency_email' => $data['emergency_email'] ?? null,
        ];
    }

    private function buildApplicationPayload(array $data, ApplicantPersonalData $personalData): array
    {
        $yearLevel = $data['year_level'] ?? null;

        return [
            'applicant_personal_data_id' => $personalData->id,
            'application_number' => $this->resolveApplicationNumber($data, $yearLevel),
            'application_date' => $data['application_date'] ?? null,
            'application_status' => 'Pending',
            'school_year' => $data['school_year'] ?? null,
            'semester' => $data['semester'] ?? null,
            'student_category' => $this->determineStudentCategory($yearLevel),
            'year_level' => $yearLevel,
            'strand' => $data['strand'] ?? null,
            'classification' => $data['classification'] ?? null,
            'learning_mode' => $data['learning_mode'] ?? null,
            'accomplished_by_name' => $data['accomplished_by_name'] ?? null,
            'application_type' => 'Online',
        ];
    }

    private function resolveApplicationNumber(array $data, ?string $yearLevel): string
    {
        if (! empty($data['application_number'])) {
            $manualNumber = strtoupper(trim($data['application_number']));

            if ($this->applicationRepository->applicationNumberExists($manualNumber)) {
                throw new \Exception("The application number '$manualNumber' is already taken.");
            }

            return $manualNumber;
        }

        return $this->generateApplicationNumber($yearLevel);
    }

    private function determineStudentCategory(?string $yearLevel): ?string
    {
        if (in_array($yearLevel, ['Kindergarten', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6'])) {
            return 'LES';
        }

        if (in_array($yearLevel, ['Grade 7', 'Grade 8', 'Grade 9', 'Grade 10'])) {
            return 'JHS';
        }

        if (in_array($yearLevel, ['Grade 11', 'Grade 12'])) {
            return 'SHS';
        }

        return null;
    }

    private function getApplicationPrefixLetter(?string $yearLevel): string
    {
        $normalized = Str::of((string) $yearLevel)->lower()->trim()->__toString();

        if (preg_match('/\d+/', $normalized, $m)) {
            $num = (int) $m[0];
            if ($num >= 0 && $num <= 6) {
                return 'E';
            }
            if ($num >= 7 && $num <= 12) {
                return 'H';
            }
        }

        if (Str::contains($normalized, ['kindergarten', 'kinder', 'kg', 'k'])) {
            return 'E';
        }

        if (Str::contains($normalized, ['grade 7', 'grade 8', 'grade 9', 'grade 10', 'grade 11', 'grade 12'])) {
            return 'H';
        }

        if (Str::contains($normalized, 'grade')) {
            return 'E';
        }

        return 'E';
    }

    private function generateApplicationNumber(?string $yearLevel): string
    {
        $letter = $this->getApplicationPrefixLetter($yearLevel);
        $last = $this->applicationRepository->lastApplicationNumberWithPrefix($letter);

        $nextSeq = $last ? ((int) substr($last->application_number, 1)) + 1 : 1;
        $numberPart = $nextSeq < 10000 ? str_pad((string) $nextSeq, 4, '0', STR_PAD_LEFT) : (string) $nextSeq;

        return $letter . $numberPart;
    }

    private function formatHealthConditions($input)
    {
        if (is_array($input)) {
            $filtered = array_filter($input, fn ($item) => ! is_null($item) && $item !== '');

            return empty($filtered) ? 'None' : json_encode($filtered);
        }

        return ($input === null || $input === '') ? 'None' : $input;
    }

    private function decodeJsonOrArray($value): array
    {
        $decoded = is_string($value) ? json_decode($value, true) : $value;

        return is_array($decoded) ? $decoded : [];
    }

    private function dispatchPortalCredentials(Applicant $applicant): void
    {
        $email = $applicant->personalData?->email;
        if (! $email) {
            return;
        }

        $temporaryPassword = Str::random(12);

        $credential = $this->portalCredentialRepository->create([
            'applicant_personal_data_id' => $applicant->applicant_personal_data_id,
            'applicant_id' => $applicant->id,
            'username' => $email,
            'temporary_password' => bcrypt($temporaryPassword),
            'credentials_generated_at' => now(),
        ]);

        $credential = $this->portalCredentialRepository->loadRelations($credential);

        Mail::to($email)->send(new PortalPasswordMail($credential, $temporaryPassword));

        $this->portalCredentialRepository->update($credential, [
            'credentials_sent_at' => now(),
            'sent_via' => 'email',
        ]);
    }
}
