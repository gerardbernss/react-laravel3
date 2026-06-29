<?php
namespace App\Services\Admissions;

use App\Mail\Admissions\EmailConfirmationMail;
use App\Mail\Admissions\FinalResultMail;
use App\Mail\Admissions\ResendPortalPasswordMail;
use App\Models\Applicant;
use App\Models\ApplicantPersonalData;
use App\Models\StudentAssessment;
use App\Repositories\ApplicantAssessmentRepository;
use App\Repositories\ApplicantRepository;
use App\Repositories\ApplicationRepository;
use App\Repositories\EnrollmentPeriodRepository;
use App\Repositories\ExamResultRepository;
use App\Repositories\PortalCredentialRepository;
use App\Repositories\StudentAssessmentRepository;
use App\Repositories\StudentRepository;
use App\Services\Student\CopyApplicantDataService;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

/**
 * ApplicantService
 *
 * Centralises all write operations for the applicant admissions flow.
 * Every public method wraps its work in a DB transaction so that a failure
 * at any step (e.g. a document upload error) rolls back all preceding writes
 * and leaves the database in a clean state.
 *
 * The six steps executed for every create/update are:
 *   1. Personal Data      — upsert by email to avoid duplicates
 *   2. Family Background  — upsert via updateOrCreate
 *   3. Siblings           — delete-and-recreate (simplest sync strategy)
 *   4. Application Info   — create or update the Applicant row
 *   5. Educational Background — delete-and-recreate
 *   6. Documents          — store new file uploads, skip unchanged
 */
class ApplicantService
{
    public function __construct(
        private ApplicantRepository $applicantRepository,
        private PortalCredentialRepository $portalCredentialRepository,
        private ApplicationRepository $applicationRepository,
        private EnrollmentPeriodRepository $enrollmentPeriodRepository,
        private ExamResultRepository $examResultRepository,
        private StudentRepository $studentRepository,
        private StudentAssessmentRepository $studentAssessmentRepository,
        private ApplicantAssessmentRepository $applicantAssessmentRepository,
    ) {
    }

    /**
     * Build the flattened applicant rows for the management table.
     */
    public function indexData(): array
    {
        $period = $this->enrollmentPeriodRepository->currentOrLatest();

        $applications = $this->applicantRepository->allForPeriod($period)->map(fn ($application) => [
            'id' => $application->id,
            'application_number' => $application->application_number,
            'application_date' => $application->application_date,
            'application_status' => $application->application_status,
            'strand' => $application->strand,
            'personal_data_id' => $application->personalData->id ?? null,
            'last_name' => $application->personalData->last_name ?? null,
            'first_name' => $application->personalData->first_name ?? null,
            'middle_name' => $application->personalData->middle_name ?? null,
            'gender' => $application->personalData->gender ?? null,
            'email' => $application->personalData->email ?? null,
        ]);

        return ['applications' => $applications];
    }

    /**
     * Build the detail-view payload for a single applicant.
     */
    public function showData(int $id): array
    {
        $application = $this->applicantRepository->findWithShowRelations($id);
        $examResult = $this->examResultRepository->findForPersonalData($application->applicant_personal_data_id);

        return [
            'applicant' => $application,
            'examResult' => $examResult ? [
                'applicant_number' => $examResult->applicant_number,
                'exam_date' => $examResult->exam_date?->toDateString(),
                'exam_time' => $examResult->exam_time,
                'exam_venue' => $examResult->exam_venue,
                'math_score' => $examResult->math_score,
                'english_score' => $examResult->english_score,
                'science_score' => $examResult->science_score,
                'total_score' => $examResult->total_score,
                'percentage_score' => $examResult->percentage_score,
                'result' => $examResult->result,
                'ranking' => $examResult->ranking,
            ] : null,
        ];
    }

    /**
     * Build the pre-populated edit-form payload for an applicant.
     */
    public function editData(int $id): array
    {
        return ['applicant' => $this->applicantRepository->findWithEditRelations($id)];
    }

    /**
     * Load an applicant with the relations update() needs before validation context is built.
     */
    public function findForUpdate(int $id): Applicant
    {
        return $this->applicantRepository->findWithUpdateRelations($id);
    }

    /**
     * Delete an applicant and all associated data (see class-level notes on the
     * shared-personal-data deletion strategy).
     */
    public function destroyApplicant(int $id): void
    {
        DB::transaction(function () use ($id) {
            $application = $this->applicantRepository->findWithDestroyRelations($id);

            if ($application->documents) {
                $this->applicantRepository->deleteDocumentFiles([
                    $application->documents->certificate_of_enrollment,
                    $application->documents->birth_certificate,
                    $application->documents->latest_report_card_front,
                    $application->documents->latest_report_card_back,
                ]);
                $this->applicantRepository->deleteDocumentsRecord($application);
            }

            $personalData = $application->personalData;
            $otherAppsCount = $personalData
                ? $this->applicantRepository->otherApplicationsCount($personalData, $id)
                : 0;

            if ($personalData && $otherAppsCount === 0) {
                $this->applicantRepository->deletePersonalDataCascade($personalData->id);
            } else {
                $this->applicantRepository->deleteEducationalBackgroundAndApplication($application);
            }
        });
    }

    /**
     * Map an evaluation intent word to an application_status and persist it.
     */
    public function evaluateApplicant(int $id, string $evaluation, ?string $remarks): array
    {
        $statusMap = [
            'approve' => 'For Exam',
            'revise' => 'For Revision',
            'reject' => 'Rejected',
        ];

        $applicant = $this->applicantRepository->findOrFail($id);
        $this->applicantRepository->update($applicant, [
            'application_status' => $statusMap[$evaluation],
            'remarks' => $remarks,
        ]);

        return [
            'application_status' => $applicant->application_status,
            'remarks' => $applicant->remarks,
        ];
    }

    /**
     * Build the payload for the dedicated enrollment/payment page.
     */
    public function enrollPageData(int $id): array
    {
        $applicant = $this->applicantRepository->findWithPersonalDataAndAssessment($id);
        $assessment = $applicant->assessment;

        return [
            'applicant' => [
                'id' => $applicant->id,
                'application_number' => $applicant->application_number,
                'application_status' => $applicant->application_status,
                'year_level' => $applicant->year_level,
                'school_year' => $applicant->school_year,
                'semester' => $applicant->semester,
                'name' => trim(
                    ($applicant->personalData->last_name ?? '') . ', ' .
                    ($applicant->personalData->first_name ?? '') . ' ' .
                    ($applicant->personalData->middle_name ?? '')
                ),
            ],
            'assessment' => $assessment ? [
                'assessment_number' => $assessment->assessment_number,
                'school_year' => $assessment->school_year,
                'semester' => $assessment->semester,
                'total_tuition' => (float) $assessment->total_tuition,
                'total_misc_fees' => (float) $assessment->total_misc_fees,
                'total_lab_fees' => (float) $assessment->total_lab_fees,
                'total_other_fees' => (float) $assessment->total_other_fees,
                'gross_amount' => (float) $assessment->gross_amount,
                'net_amount' => (float) $assessment->net_amount,
                'minimum_amount' => (float) $assessment->minimum_amount,
                'status' => $assessment->status,
            ] : null,
        ];
    }

    /**
     * Enroll an Exam Passed applicant and record their initial payment.
     * Creates Student + StudentAssessment + StudentPayment in one transaction.
     */
    public function enrollApplicant(int $id, array $data): void
    {
        $applicant = $this->applicantRepository->findWithPersonalDataAndAssessment($id);
        $applicantAssessment = $applicant->assessment;

        abort_if(! in_array($applicant->application_status, ['Exam Passed', 'Pending Enrollment']), 422, 'Applicant is not eligible for enrollment.');
        abort_if(! $applicantAssessment, 422, 'No assessment found. Applicant must complete the enrollment wizard first.');

        DB::transaction(function () use ($applicant, $applicantAssessment, $data) {
            $personalData = $applicant->personalData;

            $student = $this->studentRepository->createStudent([
                'applicant_personal_data_id' => $personalData->id,
                'applicant_id' => $applicant->id,
                'enrollment_status' => 'Active',
                'enrollment_date' => now(),
                'current_year_level' => $applicant->year_level,
                'current_semester' => $applicant->semester ?? 'First Semester',
                'current_school_year' => $applicant->school_year,
            ]);

            $studentAssessment = $this->studentAssessmentRepository->create([
                'student_id' => $student->id,
                'assessment_number' => StudentAssessment::generateAssessmentNumber($applicant->school_year),
                'school_year' => $applicantAssessment->school_year,
                'semester' => $applicantAssessment->semester,
                'total_tuition' => $applicantAssessment->total_tuition,
                'total_misc_fees' => $applicantAssessment->total_misc_fees,
                'total_lab_fees' => $applicantAssessment->total_lab_fees,
                'total_other_fees' => $applicantAssessment->total_other_fees,
                'gross_amount' => $applicantAssessment->gross_amount,
                'total_discounts' => $applicantAssessment->total_discounts,
                'net_amount' => $applicantAssessment->net_amount,
                'payment_plan' => 'installment',
                'minimum_amount' => $applicantAssessment->minimum_amount,
                'mode_of_payment' => 'cash',
                'status' => 'finalized',
                'generated_at' => now(),
                'finalized_at' => now(),
                'finalized_by' => Auth::id(),
            ]);

            $this->studentAssessmentRepository->createPayment([
                'assessment_id' => $studentAssessment->id,
                'amount_paid' => $data['amount_paid'],
                'payment_method' => 'cash',
                'payment_date' => now()->toDateString(),
                'notes' => $data['notes'] ?? null,
                'processed_by' => Auth::id(),
            ]);

            $totalPaid = (float) $data['amount_paid'];
            $net = (float) $applicantAssessment->net_amount;
            $newStatus = $totalPaid >= $net ? 'paid' : ($totalPaid > 0 ? 'partial' : 'finalized');
            $this->studentAssessmentRepository->updateAssessment($studentAssessment, ['status' => $newStatus]);

            $this->applicantAssessmentRepository->update($applicantAssessment, ['status' => 'paid']);
            $this->applicantRepository->update($applicant, ['application_status' => 'Enrolled']);

            app(CopyApplicantDataService::class)->execute($student);
        });
    }

    /**
     * Send the final admission result email to an applicant.
     */
    public function sendFinalResult(int $id): array
    {
        return $this->sendEmail($id, function ($application) {
            Mail::to($application->personalData->email)->send(new FinalResultMail($application));
        }, 'Final result email sent successfully.');
    }

    /**
     * Send an application receipt / confirmation email.
     */
    public function sendConfirmationEmail(int $id): array
    {
        return $this->sendEmail($id, function ($application) {
            Mail::to($application->personalData->email)->send(new EmailConfirmationMail($application));
        }, 'Confirmation email sent successfully.');
    }

    /**
     * Generate (or regenerate) portal credentials and email them to the applicant.
     * See class-level notes on the credential lifecycle.
     */
    public function sendPortalPassword(int $id): array
    {
        try {
            $application = $this->applicantRepository->findWithPersonalData($id);

            if (! $application->personalData?->email) {
                return ['success' => false, 'message' => 'Applicant email not found.', 'status' => 400];
            }

            $credential = $this->portalCredentialRepository->findByApplicantId($application->id);
            $temporaryPassword = Str::random(12);

            if (! $credential) {
                $username = $application->personalData->email;

                if ($this->portalCredentialRepository->usernameExists($username)) {
                    return ['success' => false, 'message' => 'Portal credentials already exist for this email address.', 'status' => 400];
                }

                $credential = $this->portalCredentialRepository->create([
                    'applicant_personal_data_id' => $application->applicant_personal_data_id,
                    'applicant_id' => $application->id,
                    'username' => $username,
                    'temporary_password' => bcrypt($temporaryPassword),
                    'credentials_generated_at' => now(),
                ]);
            } else {
                $this->portalCredentialRepository->update($credential, [
                    'temporary_password' => bcrypt($temporaryPassword),
                ]);
            }

            $credential->load('personalData');

            Mail::to($application->personalData->email)
                ->send(new ResendPortalPasswordMail($credential, $temporaryPassword));

            $this->portalCredentialRepository->update($credential, [
                'credentials_sent_at' => now(),
                'sent_via' => 'email',
            ]);

            return ['success' => true, 'message' => 'Portal credentials emailed successfully.'];
        } catch (\Exception $e) {
            Log::error('Failed to send portal password email: ' . $e->getMessage());

            return ['success' => false, 'message' => 'Failed to send email. Please try again.', 'status' => 500];
        }
    }

    /**
     * Shared email-sending helper used by sendFinalResult() and sendConfirmationEmail().
     */
    private function sendEmail(int $id, callable $sendAction, string $successMessage): array
    {
        try {
            $application = $this->applicantRepository->findWithPersonalData($id);

            if (! $application->personalData?->email) {
                return ['success' => false, 'message' => 'Applicant email not found.', 'status' => 400];
            }

            $sendAction($application);

            return ['success' => true, 'message' => $successMessage];
        } catch (\Exception $e) {
            Log::error('Failed to send email: ' . $e->getMessage());

            return ['success' => false, 'message' => 'Failed to send email. Please try again.', 'status' => 500];
        }
    }

    /**
     * Create a brand-new applicant with all related data.
     *
     * Runs all six steps inside a single transaction. Returns the newly
     * created Applicant model on success, or throws on any failure.
     */
    public function createApplicant(array $data, $request): Applicant
    {
        return DB::transaction(function () use ($data, $request) {
            $personalData = $this->handlePersonalData($data, $request);           // Step 1
            $this->handleFamilyBackground($personalData, $data);                  // Step 2
            $this->handleSiblings($personalData, $data);                          // Step 3
            $application = $this->handleApplicationInfo($personalData, $data);    // Step 4
            $this->handleEducationalBackground($application, $data);              // Step 5
            $this->handleDocuments($application, $personalData, $request);        // Step 6

            return $application;
        });
    }

    /**
     * Update an existing applicant with potentially changed data.
     *
     * Identical six-step flow to createApplicant(). Additionally, when the
     * status is being changed to 'Enrolled', step 5.5 creates (or links) the
     * corresponding Student record.
     */
    public function updateApplicant(Applicant $application, array $data, $request): Applicant
    {
        return DB::transaction(function () use ($application, $data, $request) {
            $personalData = $this->handlePersonalData($data, $request, $application->personalData); // Step 1
            $this->handleFamilyBackground($personalData, $data);                                    // Step 2
            $this->handleSiblings($personalData, $data);                                            // Step 3
            $this->updateApplicationInfo($application, $data);                                      // Step 4

            $this->handleEducationalBackground($application, $data);                                // Step 5

            // Step 5.5 — Promote to enrolled student when status changes to Enrolled.
            if (($data['application_status'] ?? '') === 'Enrolled') {
                $this->handleEnrollment($application);
            }

            $this->handleDocuments($application, $personalData, $request);                         // Step 6

            return $application;
        });
    }

    /**
     * Upsert personal data for an applicant.
     *
     * Deduplication strategy: if no existing record is provided (create flow),
     * we look up an existing ApplicantPersonalData row by email address. This
     * prevents duplicate personal-data rows when the same person applies more
     * than once. If no match is found, a new row is created.
     *
     * A doctor's note file (optional) is handled inline here because it belongs
     * directly to the personal data record rather than the documents table.
     */
    private function handlePersonalData(array $data, $request, ?ApplicantPersonalData $existing = null): ApplicantPersonalData
    {
        if (! $existing) {
            // Try to reuse an existing personal data row for the same email.
            $existing = $this->applicationRepository->findPersonalDataByEmail($data['email']);
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
            $this->applicationRepository->updatePersonalData($existing, $payload);
        } else {
            $existing = $this->applicationRepository->createPersonalData($payload);
        }

        // Store the doctor's note PDF/image if one was uploaded in this request.
        if ($request->hasFile('doctors_note_file')) {
            $file      = $request->file('doctors_note_file');
            $lastName  = $this->sanitizeFileName($existing->last_name);
            $firstName = $this->sanitizeFileName($existing->first_name);

            $filename = "{$existing->id}_{$lastName}_{$firstName}_DOCTORS_NOTE." . $file->getClientOriginalExtension();
            $path     = $file->storeAs('documents/doctors_notes', $filename, 'public');

            $this->applicationRepository->saveDoctorsNotePath($existing, $path);
        }

        return $existing;
    }

    /**
     * Upsert the family background record for a personal data entry.
     *
     * Uses updateOrCreate keyed on applicant_personal_data_id so repeated
     * calls are idempotent — the second call updates instead of inserting.
     */
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

        $this->applicationRepository->updateOrCreateFamilyBackground($personalData, $payload);
    }

    /**
     * Sync sibling records for an applicant.
     *
     * Delete-and-recreate is simpler than diffing the incoming list against
     * existing rows — siblings are a small set and referential integrity is
     * not a concern here. Only rows with a non-empty sibling_full_name are
     * persisted so blank form entries are discarded silently.
     */
    private function handleSiblings(ApplicantPersonalData $personalData, array $data): void
    {
        $siblings = $this->decodeJsonOrArray($data['siblings'] ?? []);

        $this->applicationRepository->replaceSiblings($personalData, is_array($siblings) ? $siblings : []);
    }

    /**
     * Create the Applicant row and link it to the personal data record.
     *
     * Resolves the student category from year level, then either uses the
     * manually provided application number (validated for uniqueness) or
     * auto-generates a sequential one with the appropriate E/H prefix.
     */
    private function handleApplicationInfo(ApplicantPersonalData $personalData, array $data): Applicant
    {
        $studentCategory = $this->determineStudentCategory($data['year_level']);

        if (! empty($data['application_number'])) {
            $applicationNumber = strtoupper(trim($data['application_number']));
            if ($this->applicantRepository->applicationNumberExists($applicationNumber)) {
                throw new \Exception("The application number '$applicationNumber' is already taken.");
            }
        } else {
            $applicationNumber = $this->generateApplicationNumber($data['year_level']);
        }

        return $this->applicantRepository->create([
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
            'application_type'           => $data['application_type'] ?? 'Onsite',
        ]);
    }

    /**
     * Update the Applicant row's mutable fields.
     *
     * application_number can be changed manually as long as it doesn't clash
     * with another record. forceCreate is not used here because the row
     * already exists.
     */
    private function updateApplicationInfo(Applicant $application, array $data): void
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

        // Only update the application number if a new one was supplied and it
        // differs from the current value (to avoid a needless uniqueness check).
        if (! empty($data['application_number']) && $data['application_number'] !== $application->application_number) {
            $manualNumber = strtoupper(trim($data['application_number']));

            if ($this->applicantRepository->applicationNumberExistsExcept($manualNumber, $application->id)) {
                throw new \Exception("The application number '$manualNumber' is already taken.");
            }

            $payload['application_number'] = $manualNumber;
        }

        $this->applicantRepository->update($application, $payload);
    }

    /**
     * Sync previous school records for an applicant.
     *
     * Same delete-and-recreate pattern used for siblings. Only entries with
     * a non-empty school_name are stored.
     */
    private function handleEducationalBackground(Applicant $application, array $data): void
    {
        $schools = $this->decodeJsonOrArray($data['schools'] ?? []);

        $this->applicantRepository->replaceEducationalBackground($application, is_array($schools) ? $schools : []);
    }

    /**
     * Store newly uploaded document files and link them to the applicant.
     *
     * Files are named deterministically:
     *   {APPLICATION_NUMBER}_{LASTNAME}_{FIRSTNAME}_{DOCTYPE}.{ext}
     *
     * Only files present in the current request are processed; existing paths
     * are preserved via updateOrCreate so a partial re-upload doesn't wipe
     * previously saved documents.
     */
    private function handleDocuments(Applicant $application, ApplicantPersonalData $personalData, $request): void
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

        foreach ($fileKeys as $fileKey => $docType) {
            if ($request->hasFile($fileKey)) {
                $file              = $request->file($fileKey);
                $extension         = $file->getClientOriginalExtension();
                $filename          = "{$filePrefix}_{$lastName}_{$firstName}_{$docType}.{$extension}";
                $path              = $file->storeAs('documents', $filename, 'public');
                $uploads[$fileKey] = $path;
            }
        }

        // Only write to the DB when at least one new file was uploaded.
        if (! empty($uploads)) {
            $this->applicantRepository->createOrUpdateDocuments($application, $uploads);
        }
    }

    /**
     * Create or link a Student record when an applicant is marked Enrolled.
     *
     * Looks for an existing Student row by either application_id or
     * applicant_personal_data_id (handles edge cases where a student record
     * was created through a different flow). If none exists, creates one.
     */
    private function handleEnrollment(Applicant $application): void
    {
        $student = $this->studentRepository->findForEmail($application->id, $application->personalData->id);

        if (! $student) {
            $student = $this->studentRepository->createStudent([
                'applicant_personal_data_id' => $application->personalData->id,
                'application_id' => $application->id,
                'enrollment_date' => now(),
            ]);
        } else {
            $payload = ['applicant_personal_data_id' => $application->personalData->id];

            // Preserve the original enrollment_date; only backfill application_id
            // if the existing record is missing it.
            if (! $student->application_id) {
                $payload['application_id'] = $application->id;
            }

            $this->studentRepository->updateStudent($student, $payload);
        }

        app(CopyApplicantDataService::class)->execute($student);
    }

    // ─── Helper Methods ───────────────────────────────────────────────────────

    /**
     * Map a year level string to one of the three student categories.
     *
     * LES — Lower Elementary School (Kinder–Grade 6)
     * JHS — Junior High School      (Grade 7–10)
     * SHS — Senior High School      (Grade 11–12)
     */
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

    /**
     * Return the single-letter prefix used in application numbers.
     *
     * 'E' — Elementary (Grades 1–6, Kindergarten)
     * 'H' — High School (Grades 7–12)
     *
     * Numeric grade extraction is attempted first (most reliable), with string
     * keyword matching as a fallback for non-numeric inputs like "Kindergarten".
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

    /**
     * Generate the next sequential application number for a given year level.
     *
     * Format: {prefix}{4-digit sequence}  e.g. E0001, H0042
     *
     * Finds the highest existing number with the same prefix and increments it.
     * The sequence is zero-padded to 4 digits up to 9999; beyond that it
     * grows naturally (E10000, E10001, …).
     */
    private function generateApplicationNumber(string $yearLevel): string
    {
        $letter = $this->getApplicationPrefixLetter($yearLevel);

        $last = $this->applicantRepository->lastApplicationNumberWithPrefix($letter);

        $nextSeq = $last ? ((int) substr($last->application_number, 1)) + 1 : 1;

        $numberPart = $nextSeq < 10000
            ? str_pad($nextSeq, 4, '0', STR_PAD_LEFT)
            : (string) $nextSeq;

        return $letter . $numberPart;
    }

    /**
     * Normalise health condition data for storage.
     *
     * Arrays are filtered of nulls/empty strings and JSON-encoded.
     * An empty array or null input is stored as the literal string 'None'
     * so the column is never empty — making NULL checks unnecessary downstream.
     */
    private function formatHealthConditions($input)
    {
        if (is_array($input)) {
            $filtered = array_filter($input, fn($item) => ! is_null($item) && $item !== '');
            return empty($filtered) ? 'None' : json_encode($filtered);
        }
        return ($input === null || $input === '') ? 'None' : $input;
    }

    /**
     * Strip non-alphanumeric characters from a name for use in filenames.
     * Result is uppercased, e.g. "De la Cruz" → "DELACRUZ".
     */
    private function sanitizeFileName(string $name): string
    {
        return strtoupper(preg_replace('/[^A-Za-z0-9]/', '', $name));
    }

    /**
     * Accept either a JSON string or a plain PHP array and always return an array.
     * Handles the inconsistency between multipart form data (JSON string) and
     * direct array inputs (e.g. from tests or API calls).
     */
    private function decodeJsonOrArray($input)
    {
        return is_string($input) ? json_decode($input, true) : $input;
    }
}
