<?php
namespace App\Http\Controllers;

use App\Models\ApplicantApplicationInfo;
use App\Models\ApplicantPersonalData;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Response;
use Illuminate\Support\Str;
use Inertia\Inertia;

class ApplicantController2 extends Controller
{

    /**
     * Show the application type selection page
     */
    public function start()
    {
        return Inertia::render('Applications/Start');
    }

// Display all applications with full relationships.
    public function index()
    {
        $applications = ApplicantApplicationInfo::with([
            'personalData',
        ])->get();

        $flattenedApplications = $applications->map(function ($application) {
            return [
                'id'                 => $application->id,
                'application_number' => $application->application_number,
                'application_date'   => $application->application_date,
                'application_status' => $application->application_status,
                'strand'             => $application->strand,

                // Personal Data
                'last_name'          => $application->personalData->last_name ?? null,
                'first_name'         => $application->personalData->first_name ?? null,
                'middle_name'        => $application->personalData->middle_name ?? null,
                'sex'                => $application->personalData->sex ?? null,
                'email'              => $application->personalData->email ?? null,
            ];
        }
        );

        return Inertia::render('Applications/Index', [
            'applications' => $flattenedApplications,
        ]);
    }

//Display a single applicant with full details.
    public function show($id)
    {
        $application = ApplicantApplicationInfo::with([
            'personalData.familyBackground',
            'personalData.siblings',
            'educationalBackground',
            'documents',
        ])->findOrFail($id);

        return response()->json($application);
    }

/**
 * Show LES application form
 */
    public function createLES()
    {
        return Inertia::render('Applications/AddLES');
    }

    /**
     * Show JHS application form
     */
    public function createJHS()
    {
        return Inertia::render('Applications/AddJHS');
    }

    /**
     * Show SHS application form
     */
    public function createSHS()
    {
        return Inertia::render('Applications/AddSHS');
    }

// Store a new application and all related records.
    private function getApplicationPrefixLetter($yearLevel): string
    {
        // normalize to string (handles integers too)
        $normalized = Str::of((string) $yearLevel)->lower()->trim()->__toString();

        // 1) If it contains a number, use that number
        if (preg_match('/\d+/', $normalized, $m)) {
            $num = (int) $m[0];
            if ($num >= 0 && $num <= 6) {
                return 'E';
            }
            if ($num >= 7 && $num <= 12) {
                return 'H';
            }
        }

        // 2) Kindergarten / nursery variants -> Elementary (E)
        if (Str::contains($normalized, ['kindergarten', 'kinder', 'kg', 'k'])) {
            return 'E';
        }

        // 3) Highschool keywords that don't contain digits
        if (Str::contains($normalized, ['grade 7', 'grade 8', 'grade 9', 'grade 10', 'grade 11', 'grade 12'])) {
            return 'H';
        }

        // 4) If it mentions "grade" but no digit (unlikely), assume E as a safe default
        if (Str::contains($normalized, 'grade')) {
            return 'E';
        }

        // 5) Final fallback — keep E (you can change this if you prefer)
        return 'E';
    }

    private function generateApplicationNumber(string $yearLevel): string
    {
        $letter = $this->getApplicationPrefixLetter($yearLevel); // E or H

        // Find the last application starting with this letter
        $last = ApplicantApplicationInfo::where('application_number', 'like', $letter . '%')
            ->orderBy('application_number', 'desc')
            ->first();

        if ($last) {
            // Get numeric part after the first character
            $lastSeq = (int) substr($last->application_number, 1);
            $nextSeq = $lastSeq + 1;
        } else {
            $nextSeq = 1;
        }

        // For small numbers, keep 4-digit padding (E0001, E0002, ...)
        // Once it goes beyond 9999, it will naturally become E10000, E10001, etc.
        if ($nextSeq < 10000) {
            $numberPart = str_pad($nextSeq, 4, '0', STR_PAD_LEFT);
        } else {
            $numberPart = (string) $nextSeq; // no truncation, allow 5+ digits
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

    public function storeSHS(Request $request)
    {
        DB::beginTransaction();

        try {
            // STEP 1: Handle Personal Data (The Master Record)
            // Check if this person exists by email (Guest logic)
            $personalData = ApplicantPersonalData::where('email', $request->email)->first();

            $personalPayload = [

                'last_name'                => $request->last_name,
                'first_name'               => $request->first_name,
                'middle_name'              => $request->middle_name,
                'suffix'                   => $request->suffix,
                'learner_reference_number' => $request->learner_reference_number,
                'sex'                      => $request->sex,
                'citizenship'              => $request->citizenship,
                'religion'                 => $request->religion,
                'date_of_birth'            => $request->date_of_birth,
                'place_of_birth'           => $request->place_of_birth,
                'has_sibling'              => filter_var($request->has_sibling, FILTER_VALIDATE_BOOLEAN),
                'email'                    => $request->email,
                'alt_email'                => $request->alt_email,
                'mobile_number'            => $request->mobile_number,
                'present_street'           => $request->present_street,
                'present_brgy'             => $request->present_brgy,
                'present_city'             => $request->present_city,
                'present_province'         => $request->present_province,
                'present_zip'              => $request->present_zip,
                'permanent_street'         => $request->permanent_street,
                'permanent_brgy'           => $request->permanent_brgy,
                'permanent_city'           => $request->permanent_city,
                'permanent_province'       => $request->permanent_province,
                'permanent_zip'            => $request->permanent_zip,
                'stopped_studying'         => $request->stopped_studying ?: 'No',
                'accelerated'              => $request->accelerated ?: 'No',
                'health_conditions'        => $this->formatHealthConditions($request->health_conditions),
            ];

            if ($personalData) {
                // UPDATE existing person (Re-application scenario)
                $personalData->update($personalPayload);
            } else {
                // CREATE new person
                $personalData = ApplicantPersonalData::create($personalPayload);
            }
            if (! $personalData || ! $personalData->id) {
                throw new \Exception("Failed to create or retrieve Personal Data ID.");
            }

            // STEP 2: Handle Family Background (Linked to PERSON)
            // We update or create the family info for this person
            $familyPayload = [
                'father_lname'              => $request->father_lname,
                'father_fname'              => $request->father_fname,
                'father_mname'              => $request->father_mname,
                'father_living'             => $request->father_living,
                'father_citizenship'        => $request->father_citizenship,
                'father_religion'           => $request->father_religion,
                'father_highest_educ'       => $request->father_highest_educ,
                'father_occupation'         => $request->father_occupation,
                'father_income'             => $request->father_income,
                'father_business_emp'       => $request->father_business_emp,
                'father_business_address'   => $request->father_business_address,
                'father_contact_no'         => $request->father_contact_no,
                'father_email'              => $request->father_email,
                'father_slu_employee'       => filter_var($request->father_slu_employee, FILTER_VALIDATE_BOOLEAN),
                'father_slu_dept'           => $request->father_slu_dept,
                // ... Map all Mother and Guardian fields here ...
                'mother_lname'              => $request->mother_lname,
                'mother_fname'              => $request->mother_fname,
                'mother_mname'              => $request->mother_mname,
                'mother_living'             => $request->mother_living,
                'mother_citizenship'        => $request->mother_citizenship,
                'mother_religion'           => $request->mother_religion,
                'mother_highest_educ'       => $request->mother_highest_educ,
                'mother_occupation'         => $request->mother_occupation,
                'mother_income'             => $request->mother_income,
                'mother_business_emp'       => $request->mother_business_emp,
                'mother_business_address'   => $request->mother_business_address,
                'mother_contact_no'         => $request->mother_contact_no,
                'mother_email'              => $request->mother_email,
                'mother_slu_employee'       => filter_var($request->mother_slu_employee, FILTER_VALIDATE_BOOLEAN),
                'mother_slu_dept'           => $request->mother_slu_dept,

                'guardian_lname'            => $request->guardian_lname,
                'guardian_fname'            => $request->guardian_fname,
                'guardian_mname'            => $request->guardian_mname,
                'guardian_relationship'     => $request->guardian_relationship,
                'guardian_citizenship'      => $request->guardian_citizenship,
                'guardian_religion'         => $request->guardian_religion,
                'guardian_highest_educ'     => $request->guardian_highest_educ,
                'guardian_occupation'       => $request->guardian_occupation,
                'guardian_income'           => $request->guardian_income,
                'guardian_business_emp'     => $request->guardian_business_emp,
                'guardian_business_address' => $request->guardian_business_address,
                'guardian_contact_no'       => $request->guardian_contact_no,
                'guardian_email'            => $request->guardian_email,
                'guardian_slu_employee'     => filter_var($request->guardian_slu_employee, FILTER_VALIDATE_BOOLEAN),
                'guardian_slu_dept'         => $request->guardian_slu_dept,

                // (Add rest of mother/guardian fields from request)
                'emergency_contact_name'    => $request->emergency_contact_name,
                'emergency_relationship'    => $request->emergency_relationship,
                'emergency_home_phone'      => $request->emergency_home_phone,
                'emergency_mobile_phone'    => $request->emergency_mobile_phone,
                'emergency_email'           => $request->emergency_email,
            ];

            // Update or Create Family Record
            $personalData->familyBackground()->updateOrCreate(
                ['applicant_personal_data_id' => $personalData->id], // Match condition
                $familyPayload                                       // Update values
            );

            // STEP 3: Handle Siblings (Linked to PERSON)
            // For simplicity in re-application, we replace the list to ensure it's current
            $personalData->siblings()->delete();
            $siblings = is_string($request->siblings) ? json_decode($request->siblings, true) : $request->siblings;

            if (is_array($siblings) && count($siblings) > 0) {
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

            $yearLevel = $request->year_level;

            if (in_array($yearLevel, ['Kindergarten', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6'])) {
                $studentCategory = 'LES';
            } elseif (in_array($yearLevel, ['Grade 7', 'Grade 8', 'Grade 9', 'Grade 10'])) {
                $studentCategory = 'JHS';
            } elseif (in_array($yearLevel, ['Grade 11', 'Grade 12'])) {
                $studentCategory = 'SHS';
            } else {
                $studentCategory = null; // fallback
            }

            // STEP 4: Create Application Ticket (Always NEW for every attempt)
            $applicationNumber = $request->application_number
                ? strtoupper(trim($request->application_number)) // normalize input
                : $this->generateApplicationNumber($request->year_level);

            if ($request->application_number) {
                $manualNumber = strtoupper(trim($request->application_number));

                // Check if it's already used
                if (ApplicantApplicationInfo::where('application_number', $manualNumber)->exists()) {
                    throw new \Exception("The application number '$manualNumber' is already taken.");
                }

                $applicationNumber = $manualNumber;
            } else {
                $applicationNumber = $this->generateApplicationNumber($request->year_level);
            }

            $application = ApplicantApplicationInfo::forceCreate([
                'applicant_personal_data_id' => $personalData->id,
                'application_number'         => $applicationNumber,
                'application_date'           => $request->application_date,
                'application_status'         => 'Pending',
                'school_year'                => '2025-2026', // Ideally dynamic or from request
                'semester'                   => $request->semester,
                'student_category'           => $studentCategory,
                'year_level'                 => $request->year_level,
                'strand'                     => $request->strand,
                'classification'             => $request->classification,
                'learning_mode'              => $request->learning_mode,
                'accomplished_by_name'       => $request->accomplished_by_name,
                'application_type'           => 'Online',
            ]);

            // STEP 5: Educational Background (Linked to APPLICATION - Snapshot)
            $schools = is_string($request->schools) ? json_decode($request->schools, true) : $request->schools;

            if (is_array($schools) && count($schools) > 0) {
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

            // STEP 6: Handle Documents (Linked to APPLICATION - Versioned)
            $lastName  = strtoupper(preg_replace('/[^A-Za-z0-9]/', '', $personalData->last_name));
            $firstName = strtoupper(preg_replace('/[^A-Za-z0-9]/', '', $personalData->first_name));
            // Use Application Number or ID for uniqueness in filename
            $filePrefix = $application->application_number;

            $uploads  = [];
            $fileKeys = [
                'certificate_of_enrollment' => 'COE',
                'birth_certificate'         => 'BIRTHCERTIFICATE',
                'latest_report_card_front'  => 'REPORTCARD_FRONT',
                'latest_report_card_back'   => 'REPORTCARD_BACK',
            ];

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
                $application->documents()->create($uploads);
            }

            DB::commit();

            return Inertia::location(route('applications.success'));

        } catch (\Exception $e) {
            DB::rollBack();

            Log::error('Application submission failed: ' . $e->getMessage());
            return back()->withErrors(['error' => 'Failed to submit: ' . $e->getMessage()])->withInput();
        }
    }

    public function storeJHS(Request $request)
    {
        DB::beginTransaction();

        try {
            // STEP 1: Handle Personal Data (The Master Record)
            // Check if this person exists by email (Guest logic)
            $personalData = ApplicantPersonalData::where('email', $request->email)->first();

            $personalPayload = [

                'last_name'                => $request->last_name,
                'first_name'               => $request->first_name,
                'middle_name'              => $request->middle_name,
                'suffix'                   => $request->suffix,
                'learner_reference_number' => $request->learner_reference_number,
                'sex'                      => $request->sex,
                'citizenship'              => $request->citizenship,
                'religion'                 => $request->religion,
                'date_of_birth'            => $request->date_of_birth,
                'place_of_birth'           => $request->place_of_birth,
                'has_sibling'              => filter_var($request->has_sibling, FILTER_VALIDATE_BOOLEAN),
                'email'                    => $request->email,
                'alt_email'                => $request->alt_email,
                'mobile_number'            => $request->mobile_number,
                'present_street'           => $request->present_street,
                'present_brgy'             => $request->present_brgy,
                'present_city'             => $request->present_city,
                'present_province'         => $request->present_province,
                'present_zip'              => $request->present_zip,
                'permanent_street'         => $request->permanent_street,
                'permanent_brgy'           => $request->permanent_brgy,
                'permanent_city'           => $request->permanent_city,
                'permanent_province'       => $request->permanent_province,
                'permanent_zip'            => $request->permanent_zip,
                'stopped_studying'         => $request->stopped_studying ?: 'No',
                'accelerated'              => $request->accelerated ?: 'No',
                'health_conditions'        => $this->formatHealthConditions($request->health_conditions),
            ];

            if ($personalData) {
                // UPDATE existing person (Re-application scenario)
                $personalData->update($personalPayload);
            } else {
                // CREATE new person
                $personalData = ApplicantPersonalData::create($personalPayload);
            }
            if (! $personalData || ! $personalData->id) {
                throw new \Exception("Failed to create or retrieve Personal Data ID.");
            }

            // STEP 2: Handle Family Background (Linked to PERSON)
            // We update or create the family info for this person
            $familyPayload = [
                'father_lname'              => $request->father_lname,
                'father_fname'              => $request->father_fname,
                'father_mname'              => $request->father_mname,
                'father_living'             => $request->father_living,
                'father_citizenship'        => $request->father_citizenship,
                'father_religion'           => $request->father_religion,
                'father_highest_educ'       => $request->father_highest_educ,
                'father_occupation'         => $request->father_occupation,
                'father_income'             => $request->father_income,
                'father_business_emp'       => $request->father_business_emp,
                'father_business_address'   => $request->father_business_address,
                'father_contact_no'         => $request->father_contact_no,
                'father_email'              => $request->father_email,
                'father_slu_employee'       => filter_var($request->father_slu_employee, FILTER_VALIDATE_BOOLEAN),
                'father_slu_dept'           => $request->father_slu_dept,
                // ... Map all Mother and Guardian fields here ...
                'mother_lname'              => $request->mother_lname,
                'mother_fname'              => $request->mother_fname,
                'mother_mname'              => $request->mother_mname,
                'mother_living'             => $request->mother_living,
                'mother_citizenship'        => $request->mother_citizenship,
                'mother_religion'           => $request->mother_religion,
                'mother_highest_educ'       => $request->mother_highest_educ,
                'mother_occupation'         => $request->mother_occupation,
                'mother_income'             => $request->mother_income,
                'mother_business_emp'       => $request->mother_business_emp,
                'mother_business_address'   => $request->mother_business_address,
                'mother_contact_no'         => $request->mother_contact_no,
                'mother_email'              => $request->mother_email,
                'mother_slu_employee'       => filter_var($request->mother_slu_employee, FILTER_VALIDATE_BOOLEAN),
                'mother_slu_dept'           => $request->mother_slu_dept,

                'guardian_lname'            => $request->guardian_lname,
                'guardian_fname'            => $request->guardian_fname,
                'guardian_mname'            => $request->guardian_mname,
                'guardian_relationship'     => $request->guardian_relationship,
                'guardian_citizenship'      => $request->guardian_citizenship,
                'guardian_religion'         => $request->guardian_religion,
                'guardian_highest_educ'     => $request->guardian_highest_educ,
                'guardian_occupation'       => $request->guardian_occupation,
                'guardian_income'           => $request->guardian_income,
                'guardian_business_emp'     => $request->guardian_business_emp,
                'guardian_business_address' => $request->guardian_business_address,
                'guardian_contact_no'       => $request->guardian_contact_no,
                'guardian_email'            => $request->guardian_email,
                'guardian_slu_employee'     => filter_var($request->guardian_slu_employee, FILTER_VALIDATE_BOOLEAN),
                'guardian_slu_dept'         => $request->guardian_slu_dept,

                // (Add rest of mother/guardian fields from request)
                'emergency_contact_name'    => $request->emergency_contact_name,
                'emergency_relationship'    => $request->emergency_relationship,
                'emergency_home_phone'      => $request->emergency_home_phone,
                'emergency_mobile_phone'    => $request->emergency_mobile_phone,
                'emergency_email'           => $request->emergency_email,
            ];

            // Update or Create Family Record
            $personalData->familyBackground()->updateOrCreate(
                ['applicant_personal_data_id' => $personalData->id], // Match condition
                $familyPayload                                       // Update values
            );

            // STEP 3: Handle Siblings (Linked to PERSON)
            // For simplicity in re-application, we replace the list to ensure it's current
            $personalData->siblings()->delete();
            $siblings = is_string($request->siblings) ? json_decode($request->siblings, true) : $request->siblings;

            if (is_array($siblings) && count($siblings) > 0) {
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

            $yearLevel = $request->year_level;

            if (in_array($yearLevel, ['Kindergarten', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6'])) {
                $studentCategory = 'LES';
            } elseif (in_array($yearLevel, ['Grade 7', 'Grade 8', 'Grade 9', 'Grade 10'])) {
                $studentCategory = 'JHS';
            } elseif (in_array($yearLevel, ['Grade 11', 'Grade 12'])) {
                $studentCategory = 'SHS';
            } else {
                $studentCategory = null; // fallback
            }

            // STEP 4: Create Application Ticket (Always NEW for every attempt)
            $applicationNumber = $request->application_number
                ? strtoupper(trim($request->application_number)) // normalize input
                : $this->generateApplicationNumber($request->year_level);

            if ($request->application_number) {
                $manualNumber = strtoupper(trim($request->application_number));

                // Check if it's already used
                if (ApplicantApplicationInfo::where('application_number', $manualNumber)->exists()) {
                    throw new \Exception("The application number '$manualNumber' is already taken.");
                }

                $applicationNumber = $manualNumber;
            } else {
                $applicationNumber = $this->generateApplicationNumber($request->year_level);
            }

            $application = ApplicantApplicationInfo::forceCreate([
                'applicant_personal_data_id' => $personalData->id,
                'application_number'         => $applicationNumber,
                'application_date'           => $request->application_date,
                'application_status'         => 'Pending',
                'school_year'                => '2025-2026', // Ideally dynamic or from request
                'semester'                   => $request->semester,
                'student_category'           => $studentCategory,
                'year_level'                 => $request->year_level,
                'strand'                     => $request->strand,
                'classification'             => $request->classification,
                'learning_mode'              => $request->learning_mode,
                'accomplished_by_name'       => $request->accomplished_by_name,
                'application_type'           => 'Online',
            ]);

            // STEP 5: Educational Background (Linked to APPLICATION - Snapshot)
            $schools = is_string($request->schools) ? json_decode($request->schools, true) : $request->schools;

            if (is_array($schools) && count($schools) > 0) {
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

            // STEP 6: Handle Documents (Linked to APPLICATION - Versioned)
            $lastName  = strtoupper(preg_replace('/[^A-Za-z0-9]/', '', $personalData->last_name));
            $firstName = strtoupper(preg_replace('/[^A-Za-z0-9]/', '', $personalData->first_name));
            // Use Application Number or ID for uniqueness in filename
            $filePrefix = $application->application_number;

            $uploads  = [];
            $fileKeys = [
                'certificate_of_enrollment' => 'COE',
                'birth_certificate'         => 'BIRTHCERTIFICATE',
                'latest_report_card_front'  => 'REPORTCARD_FRONT',
                'latest_report_card_back'   => 'REPORTCARD_BACK',
            ];

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
                $application->documents()->create($uploads);
            }

            DB::commit();

            return Inertia::location(route('applications.success'));

        } catch (\Exception $e) {
            DB::rollBack();

            Log::error('Application submission failed: ' . $e->getMessage());
            return back()->withErrors(['error' => 'Failed to submit: ' . $e->getMessage()])->withInput();
        }
    }

    public function storeLES(Request $request)
    {
        DB::beginTransaction();

        try {
            // STEP 1: Handle Personal Data (The Master Record)
            // Check if this person exists by email (Guest logic)
            $personalData = ApplicantPersonalData::where('email', $request->email)->first();

            $personalPayload = [

                'last_name'                => $request->last_name,
                'first_name'               => $request->first_name,
                'middle_name'              => $request->middle_name,
                'suffix'                   => $request->suffix,
                'learner_reference_number' => $request->learner_reference_number,
                'sex'                      => $request->sex,
                'citizenship'              => $request->citizenship,
                'religion'                 => $request->religion,
                'date_of_birth'            => $request->date_of_birth,
                'place_of_birth'           => $request->place_of_birth,
                'has_sibling'              => filter_var($request->has_sibling, FILTER_VALIDATE_BOOLEAN),
                'email'                    => $request->email,
                'alt_email'                => $request->alt_email,
                'mobile_number'            => $request->mobile_number,
                'present_street'           => $request->present_street,
                'present_brgy'             => $request->present_brgy,
                'present_city'             => $request->present_city,
                'present_province'         => $request->present_province,
                'present_zip'              => $request->present_zip,
                'permanent_street'         => $request->permanent_street,
                'permanent_brgy'           => $request->permanent_brgy,
                'permanent_city'           => $request->permanent_city,
                'permanent_province'       => $request->permanent_province,
                'permanent_zip'            => $request->permanent_zip,
                'stopped_studying'         => $request->stopped_studying ?: 'No',
                'accelerated'              => $request->accelerated ?: 'No',
                'health_conditions'        => $this->formatHealthConditions($request->health_conditions),
            ];

            if ($personalData) {
                // UPDATE existing person (Re-application scenario)
                $personalData->update($personalPayload);
            } else {
                // CREATE new person
                $personalData = ApplicantPersonalData::create($personalPayload);
            }
            if (! $personalData || ! $personalData->id) {
                throw new \Exception("Failed to create or retrieve Personal Data ID.");
            }

            // STEP 2: Handle Family Background (Linked to PERSON)
            // We update or create the family info for this person
            $familyPayload = [
                'father_lname'              => $request->father_lname,
                'father_fname'              => $request->father_fname,
                'father_mname'              => $request->father_mname,
                'father_living'             => $request->father_living,
                'father_citizenship'        => $request->father_citizenship,
                'father_religion'           => $request->father_religion,
                'father_highest_educ'       => $request->father_highest_educ,
                'father_occupation'         => $request->father_occupation,
                'father_income'             => $request->father_income,
                'father_business_emp'       => $request->father_business_emp,
                'father_business_address'   => $request->father_business_address,
                'father_contact_no'         => $request->father_contact_no,
                'father_email'              => $request->father_email,
                'father_slu_employee'       => filter_var($request->father_slu_employee, FILTER_VALIDATE_BOOLEAN),
                'father_slu_dept'           => $request->father_slu_dept,
                // ... Map all Mother and Guardian fields here ...
                'mother_lname'              => $request->mother_lname,
                'mother_fname'              => $request->mother_fname,
                'mother_mname'              => $request->mother_mname,
                'mother_living'             => $request->mother_living,
                'mother_citizenship'        => $request->mother_citizenship,
                'mother_religion'           => $request->mother_religion,
                'mother_highest_educ'       => $request->mother_highest_educ,
                'mother_occupation'         => $request->mother_occupation,
                'mother_income'             => $request->mother_income,
                'mother_business_emp'       => $request->mother_business_emp,
                'mother_business_address'   => $request->mother_business_address,
                'mother_contact_no'         => $request->mother_contact_no,
                'mother_email'              => $request->mother_email,
                'mother_slu_employee'       => filter_var($request->mother_slu_employee, FILTER_VALIDATE_BOOLEAN),
                'mother_slu_dept'           => $request->mother_slu_dept,

                'guardian_lname'            => $request->guardian_lname,
                'guardian_fname'            => $request->guardian_fname,
                'guardian_mname'            => $request->guardian_mname,
                'guardian_relationship'     => $request->guardian_relationship,
                'guardian_citizenship'      => $request->guardian_citizenship,
                'guardian_religion'         => $request->guardian_religion,
                'guardian_highest_educ'     => $request->guardian_highest_educ,
                'guardian_occupation'       => $request->guardian_occupation,
                'guardian_income'           => $request->guardian_income,
                'guardian_business_emp'     => $request->guardian_business_emp,
                'guardian_business_address' => $request->guardian_business_address,
                'guardian_contact_no'       => $request->guardian_contact_no,
                'guardian_email'            => $request->guardian_email,
                'guardian_slu_employee'     => filter_var($request->guardian_slu_employee, FILTER_VALIDATE_BOOLEAN),
                'guardian_slu_dept'         => $request->guardian_slu_dept,

                // (Add rest of mother/guardian fields from request)
                'emergency_contact_name'    => $request->emergency_contact_name,
                'emergency_relationship'    => $request->emergency_relationship,
                'emergency_home_phone'      => $request->emergency_home_phone,
                'emergency_mobile_phone'    => $request->emergency_mobile_phone,
                'emergency_email'           => $request->emergency_email,
            ];

            // Update or Create Family Record
            $personalData->familyBackground()->updateOrCreate(
                ['applicant_personal_data_id' => $personalData->id], // Match condition
                $familyPayload                                       // Update values
            );

            // STEP 3: Handle Siblings (Linked to PERSON)
            // For simplicity in re-application, we replace the list to ensure it's current
            $personalData->siblings()->delete();
            $siblings = is_string($request->siblings) ? json_decode($request->siblings, true) : $request->siblings;

            if (is_array($siblings) && count($siblings) > 0) {
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

            $yearLevel = $request->year_level;

            if (in_array($yearLevel, ['Kindergarten', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6'])) {
                $studentCategory = 'LES';
            } elseif (in_array($yearLevel, ['Grade 7', 'Grade 8', 'Grade 9', 'Grade 10'])) {
                $studentCategory = 'JHS';
            } elseif (in_array($yearLevel, ['Grade 11', 'Grade 12'])) {
                $studentCategory = 'SHS';
            } else {
                $studentCategory = null; // fallback
            }

            // STEP 4: Create Application Ticket (Always NEW for every attempt)
            $applicationNumber = $request->application_number
                ? strtoupper(trim($request->application_number)) // normalize input
                : $this->generateApplicationNumber($request->year_level);

            if ($request->application_number) {
                $manualNumber = strtoupper(trim($request->application_number));

                // Check if it's already used
                if (ApplicantApplicationInfo::where('application_number', $manualNumber)->exists()) {
                    throw new \Exception("The application number '$manualNumber' is already taken.");
                }

                $applicationNumber = $manualNumber;
            } else {
                $applicationNumber = $this->generateApplicationNumber($request->year_level);
            }

            $application = ApplicantApplicationInfo::forceCreate([
                'applicant_personal_data_id' => $personalData->id,
                'application_number'         => $applicationNumber,
                'application_date'           => $request->application_date,
                'application_status'         => 'Pending',
                'school_year'                => '2025-2026', // Ideally dynamic or from request
                'semester'                   => $request->semester,
                'student_category'           => $studentCategory,
                'year_level'                 => $request->year_level,
                'strand'                     => $request->strand,
                'classification'             => $request->classification,
                'learning_mode'              => $request->learning_mode,
                'accomplished_by_name'       => $request->accomplished_by_name,
                'application_type'           => 'Online',
            ]);

            // STEP 5: Educational Background (Linked to APPLICATION - Snapshot)
            $schools = is_string($request->schools) ? json_decode($request->schools, true) : $request->schools;

            if (is_array($schools) && count($schools) > 0) {
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

            // STEP 6: Handle Documents (Linked to APPLICATION - Versioned)
            $lastName  = strtoupper(preg_replace('/[^A-Za-z0-9]/', '', $personalData->last_name));
            $firstName = strtoupper(preg_replace('/[^A-Za-z0-9]/', '', $personalData->first_name));
            // Use Application Number or ID for uniqueness in filename
            $filePrefix = $application->application_number;

            $uploads  = [];
            $fileKeys = [
                'certificate_of_enrollment' => 'COE',
                'birth_certificate'         => 'BIRTHCERTIFICATE',
                'latest_report_card_front'  => 'REPORTCARD_FRONT',
                'latest_report_card_back'   => 'REPORTCARD_BACK',
            ];

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
                $application->documents()->create($uploads);
            }

            DB::commit();

            return Inertia::location(route('applications.success'));

        } catch (\Exception $e) {
            DB::rollBack();

            Log::error('Application submission failed: ' . $e->getMessage());
            return back()->withErrors(['error' => 'Failed to submit: ' . $e->getMessage()])->withInput();
        }
    }

    public function success()
    {
        return Inertia::render('Applications/ApplicationSuccess');
    }

// Edit an existing application.
    public function edit($id)
    {
        $application = ApplicantApplicationInfo::with([
            'personalData',
            'familyBackground',
            'educationalBackground',
            'siblings',
            'documents',
        ])->findOrFail($id);

        return response()->json([
            'message' => 'Application retrieved successfully.',
            'data'    => $application,
        ]);
    }

    //Update application and related data.
    public function update(Request $request, $id)
    {
    }

    // Delete application and all related records.
    public function destroy($id)
    {

    }

}
