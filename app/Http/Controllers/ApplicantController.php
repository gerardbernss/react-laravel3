<?php
namespace App\Http\Controllers;

use App\Mail\EmailConfirmationMail;
use App\Mail\FinalResultMail;
use App\Mail\PortalPasswordMail;
use App\Models\ApplicantApplicationInfo;
use App\Models\ApplicantPersonalData;
use App\Models\PortalCredential;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;

/**
 * ApplicantController - Admin Portal
 *
 * Manages applicant data for administrators, including creating, updating, and viewing
 * applications. This controller handles the complete lifecycle of student applications
 * from submission through enrollment, including document management and email notifications.
 *
 * Key Features:
 * - Full CRUD operations for applicant records
 * - Manual and automatic application number generation
 * - Multi-step application data handling (personal, family, educational background)
 * - Document upload and storage management
 * - Email notifications (confirmation, results, portal credentials)
 * - Student record creation upon enrollment
 *
 * @package App\Http\Controllers
 */
class ApplicantController extends Controller
{
    /**
     * Display all applications with flattened personal data
     *
     * Retrieves all applications with their associated personal data and formats them
     * into a flat structure for easier frontend consumption. Used in the admin dashboard
     * to display a list of all applicants.
     *
     * @return \Inertia\Response Renders the Admissions/Index page with application data
     */
    public function index()
    {
        // Performance Optimization: Select only necessary columns to reduce database load and memory usage.
        // This avoids fetching large fields like addresses and health conditions that are not needed for the list view.
        $applications = ApplicantApplicationInfo::select([
            'id',
            'application_number',
            'application_date',
            'application_status',
            'strand',
            'applicant_personal_data_id'
        ])
        ->with([
            'personalData:id,last_name,first_name,middle_name,gender,email',
        ])->get();

        $flattenedApplications = $applications->map(function ($application) {
            return [
                'id'                 => $application->id,
                'application_number' => $application->application_number,
                'application_date'   => $application->application_date,
                'application_status' => $application->application_status,
                'strand'             => $application->strand,

                // Personal Data
                'personal_data_id'   => $application->personalData->id ?? null,
                'last_name'          => $application->personalData->last_name ?? null,
                'first_name'         => $application->personalData->first_name ?? null,
                'middle_name'        => $application->personalData->middle_name ?? null,
                'gender'             => $application->personalData->gender ?? null,
                'email'              => $application->personalData->email ?? null,
            ];
        });

        return Inertia::render('Admissions/Index', [
            'applications' => $flattenedApplications,
        ]);
    }

    /**
     * Display a single applicant with full details
     *
     * Retrieves a complete applicant record including all related data:
     * personal information, family background, siblings, educational history,
     * and uploaded documents. Used in the applicant detail view.
     *
     * @param int $id The applicant application info ID
     * @return \Inertia\Response Renders the Admissions/Show page with complete applicant data
     * @throws \Illuminate\Database\Eloquent\ModelNotFoundException If application not found
     */
    public function show($id)
    {
        $application = ApplicantApplicationInfo::with([
            'personalData.familyBackground',
            'personalData.siblings',
            'educationalBackground',
            'documents',
        ])->findOrFail($id);

        return Inertia::render('Admissions/Show', [
            'applicant' => $application,
        ]);
    }

    /**
     * Render the create applicant form page
     *
     * Displays the form for administrators to manually add a new applicant.
     * This is different from the public application forms used by prospective students.
     *
     * @return \Inertia\Response Renders the Admissions/AddApplicant form
     */
    public function create()
    {
        return Inertia::render('Admissions/AddApplicant');
    }

    /**
     * Determine the application number prefix based on year level
     *
     * Assigns a letter prefix for the application number based on the educational level:
     * - 'E' for Elementary (Kindergarten through Grade 6)
     * - 'H' for High School (Grade 7 through Grade 12, covering both JHS and SHS)
     *
     * The method handles various input formats including numeric grades, text-based
     * grade levels, and edge cases to ensure consistent categorization.
     *
     * @param mixed $yearLevel The year/grade level (e.g., "Grade 7", "Kindergarten", "11")
     * @return string The prefix letter ('E' or 'H')
     */
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

        $last = ApplicantApplicationInfo::where('application_number', 'like', $letter . '%', true)
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

    // Store a new application (ADMIN VERSION - includes manual application number)
    public function store(Request $request)
    {
        DB::beginTransaction();

        try {
            // STEP 1: Handle Personal Data
            $personalData = ApplicantPersonalData::query()->where('email', $request->email)->first();

            $personalPayload = [
                'last_name'                => $request->last_name,
                'first_name'               => $request->first_name,
                'middle_name'              => $request->middle_name,
                'suffix'                   => $request->suffix,
                'learner_reference_number' => $request->learner_reference_number,
                'gender'                   => $request->gender,
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
                $personalData->fill($personalPayload);
                $personalData->save();
            } else {
                $personalData = ApplicantPersonalData::create($personalPayload);
            }

            if (! $personalData || ! $personalData->id) {
                throw new \Exception("Failed to create or retrieve Personal Data ID.");
            }

            // STEP 2: Handle Family Background
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
                'emergency_contact_name'    => $request->emergency_contact_name,
                'emergency_relationship'    => $request->emergency_relationship,
                'emergency_home_phone'      => $request->emergency_home_phone,
                'emergency_mobile_phone'    => $request->emergency_mobile_phone,
                'emergency_email'           => $request->emergency_email,
            ];

            $personalData->familyBackground()->updateOrCreate(
                ['applicant_personal_data_id' => $personalData->id],
                $familyPayload
            );

            // STEP 3: Handle Siblings
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
                $studentCategory = null;
            }

            // STEP 4: Create Application - ADMIN CAN PROVIDE MANUAL APPLICATION NUMBER
            if ($request->application_number) {
                $manualNumber = strtoupper(trim($request->application_number));

                if (ApplicantApplicationInfo::query()->where('application_number', $manualNumber)->exists()) {
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
                'application_status'         => $request->application_status ?? 'Pending',
                'school_year'                => $request->school_year,
                'semester'                   => $request->semester,
                'student_category'           => $studentCategory,
                'year_level'                 => $request->year_level,
                'strand'                     => $request->strand,
                'classification'             => $request->classification,
                'learning_mode'              => $request->learning_mode,
                'accomplished_by_name'       => $request->accomplished_by_name,
                'application_type'           => 'Onsite',
            ]);

            // STEP 5: Educational Background
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

            // STEP 6: Handle Documents
            $lastName   = strtoupper(preg_replace('/[^A-Za-z0-9]/', '', $personalData->last_name));
            $firstName  = strtoupper(preg_replace('/[^A-Za-z0-9]/', '', $personalData->first_name));
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

            return redirect()->route('applicants.index')
                ->with('success', 'Applicant added successfully.');

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Application submission failed: ' . $e->getMessage());
            return back()->withErrors(['error' => 'Failed to submit: ' . $e->getMessage()])->withInput();
        }
    }

    // Edit, Update, and Destroy methods remain the same as ApplicantController2
    // Copy those methods here...

    public function edit($id)
    {
        $application = ApplicantApplicationInfo::with([
            'personalData',
            'personalData.familyBackground',
            'educationalBackground',
            'personalData.siblings',
            'documents',
        ])->findOrFail($id);

        return Inertia::render('Admissions/Edit', [
            'applicant' => $application,
        ]);
    }

    /*
    private function generateStudentIdNumber(string $studentCategory): string
    {
        // Determine prefix based on student category
        $prefix = match ($studentCategory) {
            'LES'   => 'E',
            'JHS'   => 'J',
            'SHS'   => 'S',
            default => 'S',
        };

        // Get the current year
        $year = date('Y');

        // Find the last student ID with this prefix and year
        $lastStudent = \App\Models\Student::where('student_id_number', 'like', $prefix . $year . '%')
            ->orderBy('student_id_number', 'desc')
            ->first();

        if ($lastStudent) {
            // Extract the sequence number from the last student ID
            $lastSeq = (int) substr($lastStudent->student_id_number, strlen($prefix . $year));
            $nextSeq = $lastSeq + 1;
        } else {
            $nextSeq = 1;
        }

        // Format: E2025-0001, J2025-0001, S2025-0001
        $sequenceNumber = str_pad($nextSeq, 4, '0', STR_PAD_LEFT);
        return $prefix . $year . '-' . $sequenceNumber;
    } */

    public function update(Request $request, $id)
    {
        DB::beginTransaction();

        try {
            $application = ApplicantApplicationInfo::with([
                'personalData.familyBackground',
                'personalData.siblings',
                'educationalBackground',
                'documents',
            ])->findOrFail($id);

            // STEP 1: Update Personal Data
            $personalPayload = [
                'last_name'                => $request->last_name,
                'first_name'               => $request->first_name,
                'middle_name'              => $request->middle_name,
                'suffix'                   => $request->suffix,
                'learner_reference_number' => $request->learner_reference_number,
                'gender'                   => $request->gender,
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

            $application->personalData->fill($personalPayload);
            $application->personalData->save();

            // STEP 2: Update Family Background
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
                'emergency_contact_name'    => $request->emergency_contact_name,
                'emergency_relationship'    => $request->emergency_relationship,
                'emergency_home_phone'      => $request->emergency_home_phone,
                'emergency_mobile_phone'    => $request->emergency_mobile_phone,
                'emergency_email'           => $request->emergency_email,
            ];

            $application->personalData->familyBackground()->updateOrCreate(
                ['applicant_personal_data_id' => $application->personalData->id],
                $familyPayload
            );

            // STEP 3: Update Siblings
            $application->personalData->siblings()->delete();
            $siblings = is_string($request->siblings) ? json_decode($request->siblings, true) : $request->siblings;

            if (is_array($siblings) && count($siblings) > 0) {
                foreach ($siblings as $sibling) {
                    if (is_array($sibling) && ! empty($sibling['sibling_full_name'])) {
                        $application->personalData->siblings()->create([
                            'sibling_full_name'   => $sibling['sibling_full_name'],
                            'sibling_grade_level' => $sibling['sibling_grade_level'] ?? null,
                            'sibling_id_number'   => $sibling['sibling_id_number'] ?? null,
                        ]);
                    }
                }
            }

            // STEP 4: Determine Student Category
            $yearLevel = $request->year_level;

            if (in_array($yearLevel, ['Kindergarten', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6'])) {
                $studentCategory = 'LES';
            } elseif (in_array($yearLevel, ['Grade 7', 'Grade 8', 'Grade 9', 'Grade 10'])) {
                $studentCategory = 'JHS';
            } elseif (in_array($yearLevel, ['Grade 11', 'Grade 12'])) {
                $studentCategory = 'SHS';
            } else {
                $studentCategory = null;
            }

            // STEP 5: Update Application Info
            $applicationPayload = [
                'application_date'     => $request->application_date,
                'application_status'   => $request->application_status,
                'school_year'          => $request->school_year,
                'semester'             => $request->semester,
                'student_category'     => $studentCategory,
                'year_level'           => $request->year_level,
                'strand'               => $request->strand,
                'classification'       => $request->classification,
                'learning_mode'        => $request->learning_mode,
                'accomplished_by_name' => $request->accomplished_by_name,
            ];

            // Handle application number update (only if provided and different)
            if ($request->application_number && $request->application_number !== $application->application_number) {
                $manualNumber = strtoupper(trim($request->application_number));

                if (ApplicantApplicationInfo::query()->where('application_number', $manualNumber)
                    ->where('id', '!=', $id)
                    ->exists()) {
                    throw new \Exception("The application number '$manualNumber' is already taken.");
                }

                $applicationPayload['application_number'] = $manualNumber;
            }

            $application->fill($applicationPayload);
            $application->save();

            // STEP 5.5: Handle Enrollment - Create Student Record if status is "Enrolled"
            // STEP 5.5: Handle Enrollment - Ensure Student Record Exists
            if ($request->application_status === 'Enrolled') {

                // Find student by either the application_id OR the applicant_personal_data_id
                $student = \App\Models\Student::where('application_id', $application->id)
                    ->orWhere('applicant_personal_data_id', $application->personalData->id)
                    ->first();

                // If no student exists, create a new one
                if (! $student) {
                    $student                             = new \App\Models\Student();
                    $student->applicant_personal_data_id = $application->personalData->id;
                    $student->enrollment_date            = now();

                    $student->save();
                } else {
                    // If student exists, ensure relationships are synced
                    $student->applicant_personal_data_id
                    = $application->personalData->id;
                    // Preserve the existing enrollment_date
                    $student->save();
                }
            }

            // STEP 6: Update Educational Background
            $application->educationalBackground()->delete();
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

            DB::commit();

            return redirect()->route('applicants.index')
                ->with('success', 'Applicant updated successfully.');

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Application update failed: ' . $e->getMessage());
            return back()->withErrors(['error' => 'Failed to update: ' . $e->getMessage()])->withInput();
        }
    }
    public function destroy($id)
    {
        DB::transaction(function () use ($id) {
            $application = ApplicantApplicationInfo::with(['documents', 'educationalBackground', 'personalData'])->findOrFail($id);

            // Delete document files from storage
            if ($application->documents) {
                $fileFields = [
                    'certificate_of_enrollment',
                    'birth_certificate',
                    'latest_report_card_front',
                    'latest_report_card_back',
                ];

                foreach ($fileFields as $field) {
                    if (! empty($application->documents->$field)) {
                        Storage::disk('public')->delete($application->documents->$field);
                    }
                }
                $application->documents()->delete();
            }

            // Check if Personal Data should be deleted
            $personalData = $application->personalData;

            // Count other applications for this person
            $otherAppsCount = 0;
            if ($personalData) {
                $otherAppsCount = $personalData->applications()->query()->where('id', '!=', $id)->count();
            }

            if ($personalData && $otherAppsCount === 0) {
                // If this is the only application, delete the person.
                // Cascading deletes will handle:
                // - Family Background
                // - Siblings
                // - Student record
                // - This Application Info
                // - Educational Background (via cascade from Application Info)

                ApplicantPersonalData::destroy($personalData->id);
            } else {
                // If there are other applications, or no personal data attached,
                // just delete this application and its direct children.

                // Delete educational backgrounds
                $application->educationalBackground()->delete();

                // Delete parent application
                ApplicantApplicationInfo::destroy($application->id);
            }
        });

        return redirect()
            ->route('applicants.index')
            ->with('success', 'Applicant deleted successfully');

    }

    public function sendFinalResult($id)
    {
        try {
            $application = ApplicantApplicationInfo::with('personalData')->findOrFail($id);

            if (! $application->personalData || ! $application->personalData->email) {
                return response()->json([
                    'message' => 'Applicant email not found.',
                ], 400);
            }

            Mail::to($application->personalData->email)->send(new FinalResultMail($application));
            return response()->json([
                'message' => 'Final result email sent successfully.',
            ], 200);
        } catch (\Exception $e) {
            Log::error('Failed to send final result email: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to send email: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function sendConfirmationEmail($id)
    {
        try {
            $application = ApplicantApplicationInfo::with('personalData')->findOrFail($id);

            if (! $application->personalData || ! $application->personalData->email) {
                return response()->json([
                    'message' => 'Applicant email not found.',
                ], 400);
            }

            Mail::to($application->personalData->email)->send(new EmailConfirmationMail($application));
            return response()->json([
                'message' => 'Confirmation email sent successfully.',
            ], 200);
        } catch (\Exception $e) {
            Log::error('Failed to send confirmation email: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to send email: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function sendPortalPassword($id)
    {
        try {
            $application = ApplicantApplicationInfo::with('personalData')->findOrFail($id);

            if (! $application->personalData) {
                return response()->json([
                    'message' => 'Applicant personal data not found.',
                ], 400);
            }

            if (! $application->personalData->email) {
                return response()->json([
                    'message' => 'Applicant email not found.',
                ], 400);
            }

            // Get or create portal credential
            $credential = PortalCredential::where('applicant_application_info_id', $application->id)->first();

            if (! $credential) {
                // Create new credential if doesn't exist
                $firstName = strtolower(Str::slug($application->personalData->first_name ?? 'applicant'));
                $lastName  = strtolower(Str::slug($application->personalData->last_name ?? ''));

                $username     = 'applicant.' . $firstName . (! empty($lastName) ? '.' . $lastName : '');
                $baseUsername = $username;
                $counter      = 1;

                while (PortalCredential::where('username', $username)->exists()) {
                    $username = $baseUsername . $counter;
                    $counter++;
                }

                $temporaryPassword = Str::random(12);

                $credential = PortalCredential::create([
                    'applicant_personal_data_id'    => $application->applicant_personal_data_id,
                    'applicant_application_info_id' => $application->id,
                    'username'                      => $username,
                    'temporary_password'            => bcrypt($temporaryPassword),
                    'credentials_generated_at'      => now(),
                ]);
            } else {
                // Generate new password for existing credential
                $temporaryPassword = Str::random(12);
                $credential->update([
                    'temporary_password' => bcrypt($temporaryPassword),
                ]);
            }

            // Reload credential to get relationships
            $credential->load('personalData');

            // Send the email with credentials
            Mail::to($application->personalData->email)->send(new PortalPasswordMail($credential, $temporaryPassword));

            // Update sent timestamp
            $credential->update([
                'credentials_sent_at' => now(),
                'sent_via'            => 'email',
            ]);

            return response()->json([
                'message' => 'Portal password email sent successfully.',
            ], 200);
        } catch (\Exception $e) {
            Log::error('Failed to send portal password email: ' . $e->getMessage() . ' - ' . $e->getTraceAsString());
            return response()->json([
                'message' => 'Failed to send email: ' . $e->getMessage(),
            ], 500);
        }
    }

}
