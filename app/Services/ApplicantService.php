<?php
namespace App\Services;

use App\Models\ApplicantApplicationInfo;
use App\Models\ApplicantPersonalData;
use App\Models\Student;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ApplicantService
{
    public function createApplicant(array $data, $request): ApplicantApplicationInfo
    {
        return DB::transaction(function () use ($data, $request) {
            // 1. Personal Data
            $personalData = $this->handlePersonalData($data, $request);

            // 2. Family Background
            $this->handleFamilyBackground($personalData, $data);

            // 3. Siblings
            $this->handleSiblings($personalData, $data);

            // 4. Application Info
            $application = $this->handleApplicationInfo($personalData, $data);

            // 5. Educational Background
            $this->handleEducationalBackground($application, $data);

            // 6. Documents
            $this->handleDocuments($application, $personalData, $request);

            return $application;
        });
    }

    public function updateApplicant(ApplicantApplicationInfo $application, array $data, $request): ApplicantApplicationInfo
    {
        return DB::transaction(function () use ($application, $data, $request) {
            // 1. Personal Data
            $personalData = $this->handlePersonalData($data, $request, $application->personalData);

            // 2. Family Background
            $this->handleFamilyBackground($personalData, $data);

            // 3. Siblings
            $this->handleSiblings($personalData, $data);

            // 4. Application Info (Update)
            $this->updateApplicationInfo($application, $data);

            // 5. Educational Background
            $this->handleEducationalBackground($application, $data);

            // 5.5 Handle Enrollment (Student Record)
            if (($data['application_status'] ?? '') === 'Enrolled') {
                $this->handleEnrollment($application);
            }

            // 6. Documents (Update/Add new)
            $this->handleDocuments($application, $personalData, $request);

            return $application;
        });
    }

    private function handlePersonalData(array $data, $request, ?ApplicantPersonalData $existing = null): ApplicantPersonalData
    {
        // If not provided explicit existing record, try to find by email
        if (! $existing) {
            $existing = ApplicantPersonalData::where('email', $data['email'])->first();
        }

        $payload = [
            'last_name'                => $data['last_name'],
            'first_name'               => $data['first_name'],
            'middle_name'              => $data['middle_name'] ?? null,
            'suffix'                   => $data['suffix'] ?? null,
            'learner_reference_number' => $data['learner_reference_number'] ?? null,
            'gender'                   => $data['gender'],
            'citizenship'              => $data['citizenship'],
            'religion'                 => $data['religion'] ?? null,
            'date_of_birth'            => $data['date_of_birth'],
            'place_of_birth'           => $data['place_of_birth'],
            'has_sibling'              => filter_var($data['has_sibling'] ?? false, FILTER_VALIDATE_BOOLEAN),
            'email'                    => $data['email'],
            'alt_email'                => $data['alt_email'] ?? null,
            'mobile_number'            => $data['mobile_number'],
            'present_street'           => $data['present_street'] ?? null,
            'present_brgy'             => $data['present_brgy'] ?? null,
            'present_city'             => $data['present_city'] ?? null,
            'present_province'         => $data['present_province'] ?? null,
            'present_zip'              => $data['present_zip'] ?? null,
            'permanent_street'         => $data['permanent_street'] ?? null,
            'permanent_brgy'           => $data['permanent_brgy'] ?? null,
            'permanent_city'           => $data['permanent_city'] ?? null,
            'permanent_province'       => $data['permanent_province'] ?? null,
            'permanent_zip'            => $data['permanent_zip'] ?? null,
            'stopped_studying'         => $data['stopped_studying'] ?? 'No',
            'accelerated'              => $data['accelerated'] ?? 'No',
            'health_conditions'        => $this->formatHealthConditions($data['health_conditions'] ?? null),
            'has_doctors_note'         => filter_var($data['has_doctors_note'] ?? false, FILTER_VALIDATE_BOOLEAN),
        ];

        if ($existing) {
            $existing->update($payload);
        } else {
            $existing = ApplicantPersonalData::create($payload);
        }

        // Handle Doctors Note File
        if ($request->hasFile('doctors_note_file')) {
            $file      = $request->file('doctors_note_file');
            $lastName  = $this->sanitizeFileName($existing->last_name);
            $firstName = $this->sanitizeFileName($existing->first_name);

            $filename = "{$existing->id}_{$lastName}_{$firstName}_DOCTORS_NOTE." . $file->getClientOriginalExtension();
            $path     = $file->storeAs('documents/doctors_notes', $filename, 'public');

            $existing->doctors_note_file = $path;
            $existing->save();
        }

        return $existing;
    }

    private function handleFamilyBackground(ApplicantPersonalData $personalData, array $data): void
    {
        $payload = [
            'father_lname'              => $data['father_lname'] ?? null,
            'father_fname'              => $data['father_fname'] ?? null,
            'father_mname'              => $data['father_mname'] ?? null,
            'father_living'             => $data['father_living'] ?? null,
            'father_citizenship'        => $data['father_citizenship'] ?? null,
            'father_religion'           => $data['father_religion'] ?? null,
            'father_highest_educ'       => $data['father_highest_educ'] ?? null,
            'father_occupation'         => $data['father_occupation'] ?? null,
            'father_income'             => $data['father_income'] ?? null,
            'father_business_emp'       => $data['father_business_emp'] ?? null,
            'father_business_address'   => $data['father_business_address'] ?? null,
            'father_contact_no'         => $data['father_contact_no'] ?? null,
            'father_email'              => $data['father_email'] ?? null,
            'father_slu_employee'       => filter_var($data['father_slu_employee'] ?? false, FILTER_VALIDATE_BOOLEAN),
            'father_slu_dept'           => $data['father_slu_dept'] ?? null,
            'mother_lname'              => $data['mother_lname'] ?? null,
            'mother_fname'              => $data['mother_fname'] ?? null,
            'mother_mname'              => $data['mother_mname'] ?? null,
            'mother_living'             => $data['mother_living'] ?? null,
            'mother_citizenship'        => $data['mother_citizenship'] ?? null,
            'mother_religion'           => $data['mother_religion'] ?? null,
            'mother_highest_educ'       => $data['mother_highest_educ'] ?? null,
            'mother_occupation'         => $data['mother_occupation'] ?? null,
            'mother_income'             => $data['mother_income'] ?? null,
            'mother_business_emp'       => $data['mother_business_emp'] ?? null,
            'mother_business_address'   => $data['mother_business_address'] ?? null,
            'mother_contact_no'         => $data['mother_contact_no'] ?? null,
            'mother_email'              => $data['mother_email'] ?? null,
            'mother_slu_employee'       => filter_var($data['mother_slu_employee'] ?? false, FILTER_VALIDATE_BOOLEAN),
            'mother_slu_dept'           => $data['mother_slu_dept'] ?? null,
            'guardian_lname'            => $data['guardian_lname'] ?? null,
            'guardian_fname'            => $data['guardian_fname'] ?? null,
            'guardian_mname'            => $data['guardian_mname'] ?? null,
            'guardian_relationship'     => $data['guardian_relationship'] ?? null,
            'guardian_citizenship'      => $data['guardian_citizenship'] ?? null,
            'guardian_religion'         => $data['guardian_religion'] ?? null,
            'guardian_highest_educ'     => $data['guardian_highest_educ'] ?? null,
            'guardian_occupation'       => $data['guardian_occupation'] ?? null,
            'guardian_income'           => $data['guardian_income'] ?? null,
            'guardian_business_emp'     => $data['guardian_business_emp'] ?? null,
            'guardian_business_address' => $data['guardian_business_address'] ?? null,
            'guardian_contact_no'       => $data['guardian_contact_no'] ?? null,
            'guardian_email'            => $data['guardian_email'] ?? null,
            'guardian_slu_employee'     => filter_var($data['guardian_slu_employee'] ?? false, FILTER_VALIDATE_BOOLEAN),
            'guardian_slu_dept'         => $data['guardian_slu_dept'] ?? null,
            'emergency_contact_name'    => $data['emergency_contact_name'],
            'emergency_relationship'    => $data['emergency_relationship'],
            'emergency_home_phone'      => $data['emergency_home_phone'] ?? null,
            'emergency_mobile_phone'    => $data['emergency_mobile_phone'],
            'emergency_email'           => $data['emergency_email'] ?? null,
        ];

        $personalData->familyBackground()->updateOrCreate(
            ['applicant_personal_data_id' => $personalData->id],
            $payload
        );
    }

    private function handleSiblings(ApplicantPersonalData $personalData, array $data): void
    {
        $personalData->siblings()->delete();
        $siblings = $this->decodeJsonOrArray($data['siblings'] ?? []);

        if (is_array($siblings)) {
            foreach ($siblings as $sibling) {
                if (is_array($sibling) && ! empty($sibling['sibling_full_name'])) {
                    $personalData->siblings()->create([
                        'sibling_full_name'   => $sibling['sibling_full_name'],
                        'sibling_grade_level' => $sibling['sibling_grade_level'] ?? null,
                        'sibling_id_number'   => $sibling['sibling_id_number'] ?? null,
                    ]);
                }
            }
        }
    }

    private function handleApplicationInfo(ApplicantPersonalData $personalData, array $data): ApplicantApplicationInfo
    {
        $studentCategory = $this->determineStudentCategory($data['year_level']);

        // Handle Application Number
        if (! empty($data['application_number'])) {
            $applicationNumber = strtoupper(trim($data['application_number']));
            if (ApplicantApplicationInfo::where('application_number', $applicationNumber)->exists()) {
                throw new \Exception("The application number '$applicationNumber' is already taken.");
            }
        } else {
            $applicationNumber = $this->generateApplicationNumber($data['year_level']);
        }

        return ApplicantApplicationInfo::forceCreate([
            'applicant_personal_data_id' => $personalData->id,
            'application_number'         => $applicationNumber,
            'application_date'           => $data['application_date'],
            'application_status'         => $data['application_status'] ?? 'Pending',
            'school_year'                => $data['school_year'],
            'semester'                   => $data['semester'] ?? null,
            'student_category'           => $studentCategory,
            'year_level'                 => $data['year_level'],
            'strand'                     => $data['strand'] ?? null,
            'classification'             => $data['classification'] ?? null,
            'learning_mode'              => $data['learning_mode'] ?? null,
            'accomplished_by_name'       => $data['accomplished_by_name'] ?? null,
            'application_type'           => $data['application_type'] ?? 'Onsite', // Default to Onsite if not passed (though Controller2 passes 'Online')
        ]);
    }

    private function updateApplicationInfo(ApplicantApplicationInfo $application, array $data): void
    {
        $studentCategory = $this->determineStudentCategory($data['year_level']);

        $payload = [
            'application_date'     => $data['application_date'],
            'application_status'   => $data['application_status'],
            'school_year'          => $data['school_year'],
            'semester'             => $data['semester'] ?? null,
            'student_category'     => $studentCategory,
            'year_level'           => $data['year_level'],
            'strand'               => $data['strand'] ?? null,
            'classification'       => $data['classification'] ?? null,
            'learning_mode'        => $data['learning_mode'] ?? null,
            'accomplished_by_name' => $data['accomplished_by_name'] ?? null,
        ];

        // Handle application number update
        if (! empty($data['application_number']) && $data['application_number'] !== $application->application_number) {
            $manualNumber = strtoupper(trim($data['application_number']));

            if (ApplicantApplicationInfo::where('application_number', $manualNumber)
                ->where('id', '!=', $application->id)
                ->exists()) {
                throw new \Exception("The application number '$manualNumber' is already taken.");
            }

            $payload['application_number'] = $manualNumber;
        }

        $application->update($payload);
    }

    private function handleEducationalBackground(ApplicantApplicationInfo $application, array $data): void
    {
        $application->educationalBackground()->delete();
        $schools = $this->decodeJsonOrArray($data['schools'] ?? []);

        if (is_array($schools)) {
            foreach ($schools as $school) {
                if (is_array($school) && ! empty($school['school_name'])) {
                    $application->educationalBackground()->create([
                        'school_name'     => $school['school_name'],
                        'school_address'  => $school['school_address'] ?? null,
                        'from_grade'      => $school['from_grade'] ?? null,
                        'to_grade'        => $school['to_grade'] ?? null,
                        'from_year'       => $school['from_year'] ?? null,
                        'to_year'         => $school['to_year'] ?? null,
                        'honors_awards'   => $school['honors_awards'] ?? null,
                        'general_average' => $school['general_average'] ?? null,
                        'class_rank'      => $school['class_rank'] ?? null,
                        'class_size'      => $school['class_size'] ?? null,
                    ]);
                }
            }
        }
    }

    private function handleDocuments(ApplicantApplicationInfo $application, ApplicantPersonalData $personalData, $request): void
    {
        $lastName   = $this->sanitizeFileName($personalData->last_name);
        $firstName  = $this->sanitizeFileName($personalData->first_name);
        $filePrefix = $application->application_number;

        $uploads  = [];
        $fileKeys = [
            'certificate_of_enrollment' => 'COE',
            'birth_certificate'         => 'BIRTHCERTIFICATE',
            'latest_report_card_front'  => 'REPORTCARD_FRONT',
            'latest_report_card_back'   => 'REPORTCARD_BACK',
        ];

        // If documents record exists, we might need to update it?
        // Actually, the original code doesn't seem to update existing records gracefully, it just creates if not empty.
        // But since it's one-to-one (hasOne), we should probably use updateOrCreate or update if exists.
        // The original code uses `$application->documents()->create($uploads)`.

        // Let's check if documents already exist
        $documents = $application->documents;

        foreach ($fileKeys as $fileKey => $docType) {
            if ($request->hasFile($fileKey)) {
                $file              = $request->file($fileKey);
                $extension         = $file->getClientOriginalExtension();
                $filename          = "{$filePrefix}_{$lastName}_{$firstName}_{$docType}.{$extension}";
                $path              = $file->storeAs('documents', $filename, 'public');
                $uploads[$fileKey] = $path;
            }
        }

        if (! empty($uploads)) {
            $application->documents()->updateOrCreate(
                ['applicant_application_info_id' => $application->id],
                $uploads
            );
        }
    }

    private function handleEnrollment(ApplicantApplicationInfo $application): void
    {
        $student = Student::where('application_id', $application->id)
            ->orWhere('applicant_personal_data_id', $application->personalData->id)
            ->first();

        if (! $student) {
            $student                             = new Student();
            $student->applicant_personal_data_id = $application->personalData->id;
            $student->application_id             = $application->id; // Assuming we want to link it
            $student->enrollment_date            = now();
            $student->save();
        } else {
            $student->applicant_personal_data_id = $application->personalData->id;
            // Preserve the existing enrollment_date
            if (! $student->application_id) {
                $student->application_id = $application->id;
            }
            $student->save();
        }
    }

    // Helper Methods

    private function determineStudentCategory($yearLevel): ?string
    {
        if (in_array($yearLevel, ['Kindergarten', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6'])) {
            return 'LES';
        } elseif (in_array($yearLevel, ['Grade 7', 'Grade 8', 'Grade 9', 'Grade 10'])) {
            return 'JHS';
        } elseif (in_array($yearLevel, ['Grade 11', 'Grade 12'])) {
            return 'SHS';
        }
        return null;
    }

    private function getApplicationPrefixLetter($yearLevel): string
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

    private function generateApplicationNumber(string $yearLevel): string
    {
        $letter = $this->getApplicationPrefixLetter($yearLevel);

        $last = ApplicantApplicationInfo::where('application_number', 'like', $letter . '%')
            ->orderBy('application_number', 'desc')
            ->first();

        if ($last) {
            $lastSeq = (int) substr($last->application_number, 1);
            $nextSeq = $lastSeq + 1;
        } else {
            $nextSeq = 1;
        }

        if ($nextSeq < 10000) {
            $numberPart = str_pad($nextSeq, 4, '0', STR_PAD_LEFT);
        } else {
            $numberPart = (string) $nextSeq;
        }

        return $letter . $numberPart;
    }

    private function formatHealthConditions($input)
    {
        if (is_array($input)) {
            $filtered = array_filter($input, fn($item) => ! is_null($item) && $item !== '');
            return empty($filtered) ? 'None' : json_encode($filtered);
        }
        return ($input === null || $input === '') ? 'None' : $input;
    }

    private function sanitizeFileName(string $name): string
    {
        return strtoupper(preg_replace('/[^A-Za-z0-9]/', '', $name));
    }

    private function decodeJsonOrArray($input)
    {
        return is_string($input) ? json_decode($input, true) : $input;
    }
}
