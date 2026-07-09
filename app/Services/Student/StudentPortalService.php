<?php

namespace App\Services\Student;

use App\Models\Applicant;
use App\Models\ApplicantPersonalData;
use App\Models\Attendance;
use App\Models\PortalCredential;
use App\Models\Student;
use App\Repositories\AnnouncementRepository;
use App\Repositories\ApplicantAssessmentRepository;
use App\Repositories\ApplicantRepository;
use App\Repositories\ApplicationRepository;
use App\Repositories\DiscountTypeRepository;
use App\Repositories\EnrollmentPeriodRepository;
use App\Repositories\FeeRepository;
use App\Repositories\PortalCredentialRepository;
use App\Repositories\ProgramRepository;
use App\Repositories\StudentAssessmentRepository;
use App\Repositories\StudentPortalRepository;
use App\Repositories\StudentRepository;
use App\Models\StudentAssessment;
use App\Models\StudentPayment;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class StudentPortalService
{
    public function __construct(
        private readonly AnnouncementRepository $announcementRepository,
        private readonly ApplicantAssessmentRepository $applicantAssessmentRepository,
        private readonly ApplicantRepository $applicantRepository,
        private readonly ApplicationRepository $applicationRepository,
        private readonly DiscountTypeRepository $discountTypeRepository,
        private readonly EnrollmentPeriodRepository $enrollmentPeriodRepository,
        private readonly FeeRepository $feeRepository,
        private readonly PortalCredentialRepository $portalCredentialRepository,
        private readonly ProgramRepository $programRepository,
        private readonly StudentAssessmentRepository $studentAssessmentRepository,
        private readonly StudentPortalRepository $studentPortalRepository,
        private readonly StudentRepository $studentRepository,
    ) {}

    /**
     * Returns true if the portal credential is linked to an enrolled student record (as opposed to a pure applicant).
     */
    public function hasStudentRecord(PortalCredential $student): bool
    {
        return (bool) $student->personalData?->student;
    }

    /**
     * Builds the props array for the applicant dashboard: announcements, personal data summary, application status, and exam schedule.
     */
    public function applicantDashboardData(PortalCredential $student): array
    {
        $personalData = $student->personalData;
        $application = $student->application;
        $examAssignment = $application ? $this->studentPortalRepository->examAssignmentWithSchedule($application) : null;
        $examSchedule = $examAssignment?->examSchedule;

        return [
            'announcements' => $this->announcementRepository->getActiveForAudience('applicants'),
            'student' => [
                'id' => $student->id,
                'username' => $student->username,
                'password_changed' => $student->password_changed,
            ],
            'personalData' => $this->formatPersonalDataSummary($personalData),
            'application' => $application ? [
                'id' => $application->id,
                'application_number' => $application->application_number,
                'school_year' => $application->school_year,
                'semester' => $application->semester,
                'grade_level' => $application->year_level,
                'strand' => $application->strand,
                'student_category' => $application->student_category,
                'application_status' => $application->application_status,
                'date_applied' => $application->application_date,
                'examination_date' => $application->examination_date,
                'remarks' => $application->remarks,
            ] : null,
            'examSchedule' => $examSchedule ? [
                'name' => $examSchedule->name,
                'exam_type' => $examSchedule->exam_type,
                'exam_date' => $examSchedule->exam_date?->format('Y-m-d'),
                'start_time' => $examSchedule->start_time,
                'end_time' => $examSchedule->end_time,
                'instructions' => $examSchedule->instructions,
                'room_name' => $examSchedule->examinationRoom?->name,
                'room_building' => $examSchedule->examinationRoom?->building,
                'room_floor' => $examSchedule->examinationRoom?->floor,
                'status' => $examAssignment->status,
            ] : null,
        ];
    }

    /**
     * Builds the props array for the enrolled student dashboard: announcements, login timestamps, personal data summary, and student record basics.
     */
    public function dashboardData(PortalCredential $student): array
    {
        $personalData = $student->personalData;
        $studentRecord = $personalData?->student;
        $application = $student->application;

        return [
            'announcements' => $this->announcementRepository->getActiveForAudience('students'),
            'student' => [
                'id' => $student->id,
                'username' => $student->username,
                'password_changed' => $student->password_changed,
                'first_login_at' => $student->first_login_at,
                'last_login_at' => $student->last_login_at,
            ],
            'personalData' => $this->formatPersonalDataSummary($personalData),
            'application' => $application ? [
                'id' => $application->id,
                'application_number' => $application->application_number,
                'school_year' => $application->school_year,
                'semester' => $application->semester,
                'grade_level' => $application->year_level,
                'strand' => $application->strand,
                'student_category' => $application->student_category,
                'application_status' => $application->application_status,
            ] : null,
            'studentRecord' => [
                'id' => $studentRecord->id,
                'student_id_number' => $studentRecord->student_id_number,
                'enrollment_status' => $studentRecord->enrollment_status,
                'enrollment_date' => $studentRecord->enrollment_date,
            ],
        ];
    }

    /**
     * Returns a minimal name/email subset of personal data — just enough for dashboard headers.
     */
    private function formatPersonalDataSummary(?ApplicantPersonalData $personalData): ?array
    {
        if (! $personalData) {
            return null;
        }

        return [
            'id' => $personalData->id,
            'first_name' => $personalData->first_name,
            'last_name' => $personalData->last_name,
            'middle_name' => $personalData->middle_name,
            'suffix' => $personalData->suffix,
            'email' => $personalData->email,
        ];
    }

    /**
     * Returns the full personal info payload for the applicant's profile page: personal data, family background, siblings, educational background, and documents.
     */
    public function applicantPersonalInfoData(PortalCredential $student): array
    {
        $personalData = $student->personalData;
        $application = $student->application;
        $familyBg = $personalData?->familyBackground;
        $siblings = $personalData?->siblings ?? collect();
        $eduBg = $application?->educationalBackground ?? collect();
        $documents = $application?->documents;

        return [
            'personalData' => $personalData ? [
                'first_name' => $personalData->first_name,
                'last_name' => $personalData->last_name,
                'middle_name' => $personalData->middle_name,
                'suffix' => $personalData->suffix,
                'gender' => $personalData->gender,
                'citizenship' => $personalData->citizenship,
                'religion' => $personalData->religion,
                'date_of_birth' => $personalData->date_of_birth?->format('Y-m-d'),
                'place_of_birth' => $personalData->place_of_birth,
                'learner_reference_number' => $personalData->learner_reference_number,
                'email' => $personalData->email,
                'alt_email' => $personalData->alt_email,
                'mobile_number' => $personalData->mobile_number,
                'present_street' => $personalData->present_street,
                'present_brgy' => $personalData->present_brgy,
                'present_city' => $personalData->present_city,
                'present_province' => $personalData->present_province,
                'present_zip' => $personalData->present_zip,
                'permanent_street' => $personalData->permanent_street,
                'permanent_brgy' => $personalData->permanent_brgy,
                'permanent_city' => $personalData->permanent_city,
                'permanent_province' => $personalData->permanent_province,
                'permanent_zip' => $personalData->permanent_zip,
                'stopped_studying' => $personalData->stopped_studying,
                'accelerated' => $personalData->accelerated,
                'health_conditions' => $personalData->health_conditions ?? [],
                'has_doctors_note' => $personalData->has_doctors_note,
                'doctors_note_file' => $personalData->doctors_note_file,
            ] : null,
            'familyBackground' => $familyBg ? [
                'father_lname' => $familyBg->father_lname,
                'father_fname' => $familyBg->father_fname,
                'father_mname' => $familyBg->father_mname,
                'father_living' => $familyBg->father_living,
                'father_citizenship' => $familyBg->father_citizenship,
                'father_religion' => $familyBg->father_religion,
                'father_highest_educ' => $familyBg->father_highest_educ,
                'father_occupation' => $familyBg->father_occupation,
                'father_income' => $familyBg->father_income,
                'father_business_emp' => $familyBg->father_business_emp,
                'father_business_address' => $familyBg->father_business_address,
                'father_contact_no' => $familyBg->father_contact_no,
                'father_email' => $familyBg->father_email,
                'father_slu_employee' => $familyBg->father_slu_employee,
                'father_slu_dept' => $familyBg->father_slu_dept,
                'mother_lname' => $familyBg->mother_lname,
                'mother_fname' => $familyBg->mother_fname,
                'mother_mname' => $familyBg->mother_mname,
                'mother_living' => $familyBg->mother_living,
                'mother_citizenship' => $familyBg->mother_citizenship,
                'mother_religion' => $familyBg->mother_religion,
                'mother_highest_educ' => $familyBg->mother_highest_educ,
                'mother_occupation' => $familyBg->mother_occupation,
                'mother_income' => $familyBg->mother_income,
                'mother_business_emp' => $familyBg->mother_business_emp,
                'mother_business_address' => $familyBg->mother_business_address,
                'mother_contact_no' => $familyBg->mother_contact_no,
                'mother_email' => $familyBg->mother_email,
                'mother_slu_employee' => $familyBg->mother_slu_employee,
                'mother_slu_dept' => $familyBg->mother_slu_dept,
                'guardian_lname' => $familyBg->guardian_lname,
                'guardian_fname' => $familyBg->guardian_fname,
                'guardian_mname' => $familyBg->guardian_mname,
                'guardian_relationship' => $familyBg->guardian_relationship,
                'guardian_citizenship' => $familyBg->guardian_citizenship,
                'guardian_religion' => $familyBg->guardian_religion,
                'guardian_highest_educ' => $familyBg->guardian_highest_educ,
                'guardian_occupation' => $familyBg->guardian_occupation,
                'guardian_income' => $familyBg->guardian_income,
                'guardian_business_emp' => $familyBg->guardian_business_emp,
                'guardian_business_address' => $familyBg->guardian_business_address,
                'guardian_contact_no' => $familyBg->guardian_contact_no,
                'guardian_email' => $familyBg->guardian_email,
                'guardian_slu_employee' => $familyBg->guardian_slu_employee,
                'guardian_slu_dept' => $familyBg->guardian_slu_dept,
                'emergency_contact_name' => $familyBg->emergency_contact_name,
                'emergency_relationship' => $familyBg->emergency_relationship,
                'emergency_home_phone' => $familyBg->emergency_home_phone,
                'emergency_mobile_phone' => $familyBg->emergency_mobile_phone,
                'emergency_email' => $familyBg->emergency_email,
            ] : null,
            'siblings' => $siblings->map(fn ($s) => [
                'sibling_full_name' => $s->sibling_full_name,
                'sibling_grade_level' => $s->sibling_grade_level,
                'sibling_id_number' => $s->sibling_id_number,
            ])->values()->toArray(),
            'educationalBackground' => $eduBg->map(fn ($e) => [
                'school_name' => $e->school_name,
                'school_address' => $e->school_address,
                'from_grade' => $e->from_grade,
                'to_grade' => $e->to_grade,
                'from_year' => $e->from_year,
                'to_year' => $e->to_year,
                'honors_awards' => $e->honors_awards,
                'general_average' => $e->general_average,
                'class_rank' => $e->class_rank,
                'class_size' => $e->class_size,
            ])->values()->toArray(),
            'documents' => $documents ? [
                'certificate_of_enrollment' => $documents->certificate_of_enrollment,
                'birth_certificate' => $documents->birth_certificate,
                'latest_report_card_front' => $documents->latest_report_card_front,
                'latest_report_card_back' => $documents->latest_report_card_back,
            ] : null,
        ];
    }

    /**
     * Saves edits to the applicant's personal data, family background, siblings, educational history, and uploaded documents in a single transaction.
     * Returns `['ok' => true]` on success or `['ok' => false, 'errors' => [...]]` on failure.
     */
    public function updateApplicantPersonalInfo(PortalCredential $student, array $data): array
    {
        $personalData = $student->personalData;

        if (! $personalData) {
            return ['ok' => false, 'errors' => ['error' => 'Personal data not found.']];
        }

        $application = $student->application;

        DB::transaction(function () use ($data, $personalData, $application) {
            $healthConditions = $data['health_conditions'] ?? [];

            $pdUpdate = collect($data)->only([
                'email', 'alt_email', 'mobile_number',
                'present_street', 'present_brgy', 'present_city', 'present_province', 'present_zip',
                'permanent_street', 'permanent_brgy', 'permanent_city', 'permanent_province', 'permanent_zip',
                'stopped_studying', 'accelerated',
            ])->toArray();
            $pdUpdate['health_conditions'] = ! empty($healthConditions) ? $healthConditions : null;
            $pdUpdate['has_doctors_note'] = filter_var($data['has_doctors_note'] ?? false, FILTER_VALIDATE_BOOLEAN);

            if (! empty($data['doctors_note_file'])) {
                $pdUpdate['doctors_note_file'] = $data['doctors_note_file']->store('documents/doctors_notes', 'public');
            }

            $this->applicationRepository->updatePersonalData($personalData, $pdUpdate);

            $fbData = collect($data)->only([
                'father_lname', 'father_fname', 'father_mname', 'father_living',
                'father_citizenship', 'father_religion', 'father_highest_educ',
                'father_occupation', 'father_income', 'father_business_emp', 'father_business_address',
                'father_contact_no', 'father_email', 'father_slu_dept',
                'mother_lname', 'mother_fname', 'mother_mname', 'mother_living',
                'mother_citizenship', 'mother_religion', 'mother_highest_educ',
                'mother_occupation', 'mother_income', 'mother_business_emp', 'mother_business_address',
                'mother_contact_no', 'mother_email', 'mother_slu_dept',
                'guardian_lname', 'guardian_fname', 'guardian_mname', 'guardian_relationship',
                'guardian_citizenship', 'guardian_religion', 'guardian_highest_educ',
                'guardian_occupation', 'guardian_income', 'guardian_business_emp', 'guardian_business_address',
                'guardian_contact_no', 'guardian_email', 'guardian_slu_dept',
                'emergency_contact_name', 'emergency_relationship',
                'emergency_home_phone', 'emergency_mobile_phone', 'emergency_email',
            ])->toArray();
            $fbData['father_slu_employee'] = ($data['father_slu_employee'] ?? null) === 'true';
            $fbData['mother_slu_employee'] = ($data['mother_slu_employee'] ?? null) === 'true';
            $fbData['guardian_slu_employee'] = ($data['guardian_slu_employee'] ?? null) === 'true';

            $this->applicationRepository->updateOrCreateFamilyBackground($personalData, $fbData);
            $this->applicationRepository->replaceSiblings($personalData, $data['siblings'] ?? []);

            if ($application) {
                $this->applicationRepository->replaceEducationalBackground($application, $data['schools'] ?? []);

                $docFields = [
                    'certificate_of_enrollment' => 'COE',
                    'birth_certificate' => 'BIRTHCERTIFICATE',
                    'latest_report_card_front' => 'REPORTCARD_FRONT',
                    'latest_report_card_back' => 'REPORTCARD_BACK',
                ];
                $docData = [];
                foreach ($docFields as $field => $label) {
                    if (! empty($data[$field])) {
                        $file = $data[$field];
                        $ext = $file->getClientOriginalExtension();
                        $last = preg_replace('/[^A-Z0-9]/', '', strtoupper($personalData->last_name));
                        $first = preg_replace('/[^A-Z0-9]/', '', strtoupper($personalData->first_name));
                        $appNum = preg_replace('/[^A-Z0-9]/', '', strtoupper($application->application_number ?? 'APP'));
                        $docData[$field] = $file->storeAs('documents', "{$appNum}_{$last}_{$first}_{$label}.{$ext}", 'public');
                    }
                }
                if (! empty($docData)) {
                    $this->applicationRepository->updateOrCreateDocuments($application, $docData);
                }
            }
        });

        return ['ok' => true];
    }

    /**
     * Returns the props for the applicant's enrollment page: personal data, application details, applicable fees, available discounts, and any pre-generated assessment subjects.
     */
    public function applicantEnrollmentData(PortalCredential $student): array
    {
        $personalData = $student->personalData;
        $application = $student->application;

        $fees = $application ? $this->getApplicableFees($application->year_level, $application->school_year) : [];
        $availableDiscounts = $this->getAvailableDiscounts($student);

        $assessmentSubjects = $application
            ? $this->studentPortalRepository->assessmentSubjectsFor($application)
                ->map(fn ($s) => [
                    'code' => $s->subject->code,
                    'name' => $s->subject->name,
                    'type' => $s->subject->type,
                    'units' => $s->units,
                ])
                ->values()
            : [];

        return [
            'personalData' => $this->formatPersonalDataResponse($personalData),
            'application' => $this->formatApplicationResponse($application),
            'fees' => $fees,
            'availableDiscounts' => $availableDiscounts,
            'enrollmentOpen' => $this->enrollmentPeriodRepository->hasOpenApplicantPeriod(),
            'assessmentNumber' => $application?->assessment?->assessment_number,
            'assessmentSubjects' => $assessmentSubjects,
        ];
    }

    /**
     * Generates a fee assessment for an applicant who has passed the exam, computing totals by category and attaching the matching subjects.
     * Idempotent — returns early if an assessment already exists.
     */
    public function generateApplicantAssessment(PortalCredential $student): array
    {
        $application = $student->application;

        if (! $application || ! in_array($application->application_status, ['Exam Passed', 'Pending Enrollment'])) {
            return ['ok' => false, 'errors' => ['error' => 'Not eligible for enrollment.']];
        }

        if ($this->studentPortalRepository->applicantAssessmentExists($application)) {
            return ['ok' => true, 'message' => 'Assessment already generated.'];
        }

        // getApplicableFees() already multiplies per-unit fees by the program's
        // credit units, so the amounts here must be summed as-is — multiplying
        // again would double-apply the unit count.
        $fees = $this->getApplicableFees($application->year_level, $application->school_year);

        $calc = fn (string $cat) => collect($fees)
            ->filter(fn ($f) => $f['category'] === $cat)
            ->sum(fn ($f) => $f['amount']);

        $tTuition = $calc('tuition');
        $tMisc = $calc('miscellaneous');
        $tLab = $calc('laboratory');
        $tOther = $calc('special');
        $gross = $tTuition + $tMisc + $tLab + $tOther;
        $minimum = round($gross * 0.30, 2);
        $semester = $application->semester ?? 'First Semester';

        $assessment = $this->studentPortalRepository->createApplicantAssessment([
            'applicant_id' => $application->id,
            'assessment_number' => $this->applicantAssessmentRepository->generateAssessmentNumber($application->school_year),
            'school_year' => $application->school_year,
            'semester' => $semester,
            'total_tuition' => $tTuition,
            'total_misc_fees' => $tMisc,
            'total_lab_fees' => $tLab,
            'total_other_fees' => $tOther,
            'gross_amount' => $gross,
            'total_discounts' => 0,
            'net_amount' => $gross,
            'minimum_amount' => $minimum,
            'mode_of_payment' => 'cash',
            'status' => 'pending',
            'generated_at' => now(),
        ]);

        $subjects = $this->studentPortalRepository->subjectsForAssessment($application->year_level, $application->strand, $semester);

        $this->studentPortalRepository->attachAssessmentSubjects(
            $assessment,
            $subjects->map(fn ($s) => ['subject_id' => $s->id, 'units' => $s->units])->all()
        );

        return ['ok' => true, 'message' => 'Assessment generated.'];
    }

    /**
     * Returns the full enrollment wizard props for an enrolled student: assessment totals, payment status, applicable fees, prior balance, and enrollment period open/closed flag.
     */
    public function enrollmentData(PortalCredential $student): array
    {
        $personalData = $student->personalData;
        $application = $student->application;
        $studentRecord = $personalData?->student;
        $familyBackground = $personalData?->familyBackground;

        // Use the current open enrollment period as the target so that when a
        // new semester opens the student sees the correct status/wizard.
        $currentPeriod = $this->enrollmentPeriodRepository->currentOfType('student');
        $targetYear = $currentPeriod?->school_year ?? $application?->school_year;
        $targetSem = $currentPeriod?->semester ?? $application?->semester ?? 'First Semester';

        $assessment = null;
        $hasAssessment = false;
        if ($studentRecord && $targetYear) {
            $assessment = $this->studentAssessmentRepository->findForStudentPeriod($studentRecord->id, $targetYear, $targetSem);
            $hasAssessment = $assessment !== null;
        }

        $isEnrolled = $hasAssessment
            && $assessment
            && (
                (float) $assessment->total_paid >= (float) $assessment->minimum_required
                || in_array($assessment->status, ['paid', 'partial'])
            );

        $awaitingPayment = $hasAssessment && ! $isEnrolled;

        $fees = (! $hasAssessment && $application && $targetYear)
            ? $this->getApplicableFees($application->year_level, $targetYear, $application->strand ?? '')
            : [];

        $priorBalance = (! $hasAssessment && $studentRecord && $targetYear)
            ? $this->getStudentPriorBalance($studentRecord->id, $targetYear, $targetSem)
            : 0.0;

        return [
            'student' => $this->formatStudentResponse($student),
            'personalData' => $this->formatPersonalDataResponse($personalData),
            'application' => $this->formatApplicationResponse($application),
            'studentRecord' => $this->formatStudentRecordResponse($studentRecord),
            'isEnrolled' => $isEnrolled,
            'awaitingPayment' => $awaitingPayment,
            'fees' => $fees,
            'priorBalance' => $priorBalance,
            'enrollmentOpen' => $targetYear ? $this->enrollmentPeriodRepository->isOpenFor($targetYear, $targetSem, 'student') : false,
            'targetYear' => $targetYear,
            'targetSemester' => $targetSem,
            'familyBackground' => $familyBackground ? [
                'emergency_contact_name' => $familyBackground->emergency_contact_name,
                'emergency_mobile_phone' => $familyBackground->emergency_mobile_phone,
            ] : null,
            'assessment' => $assessment ? [
                'assessment_number' => $assessment->assessment_number,
                'school_year' => $assessment->school_year,
                'semester' => $assessment->semester,
                'total_tuition' => (float) $assessment->total_tuition,
                'total_misc_fees' => (float) $assessment->total_misc_fees,
                'total_lab_fees' => (float) $assessment->total_lab_fees,
                'total_other_fees' => (float) $assessment->total_other_fees,
                'gross_amount' => (float) $assessment->gross_amount,
                'total_discounts' => (float) $assessment->total_discounts,
                'prior_balance' => (float) $assessment->prior_balance,
                'net_amount' => (float) $assessment->net_amount,
                'status' => $assessment->status,
                'mode_of_payment' => $assessment->mode_of_payment,
                'payment_plan' => $assessment->payment_plan ?? 'full',
                'minimum_amount' => $assessment->minimum_required,
                'total_paid' => $assessment->total_paid,
                'finalized_at' => $assessment->finalized_at?->format('F d, Y'),
            ] : null,
        ];
    }

    /**
     * Returns the student's current block section and its subject list, using the latest enrollment record regardless of school year.
     */
    public function mySectionData(PortalCredential $student): array
    {
        $personalData = $student->personalData;
        $studentRecord = $personalData?->student;
        $application = $student->application;

        // A student only ever has one current section, so take the latest
        // enrollment rather than matching an exact school_year/semester —
        // those are derived from independent sources (enrollment period type
        // 'student', vs. the applicant's own record) that can legitimately
        // diverge from whichever block section the student was actually
        // placed into.
        $enrollment = $studentRecord
            ? $this->studentPortalRepository->latestSectionEnrollment($studentRecord->id)
            : null;

        $blockSection = $enrollment?->blockSection;

        $currentPeriod = $this->enrollmentPeriodRepository->currentOfType('student');
        $targetYear = $enrollment?->school_year ?? $currentPeriod?->school_year ?? $application?->school_year;
        $targetSem = $enrollment?->semester ?? $currentPeriod?->semester ?? $application?->semester ?? 'First Semester';

        return [
            'targetYear' => $targetYear,
            'targetSemester' => $targetSem,
            'blockSection' => $blockSection ? [
                'name' => $blockSection->name,
                'code' => $blockSection->code,
                'grade_level' => $blockSection->grade_level,
                'strand' => $blockSection->strand,
                'adviser' => $blockSection->adviser,
                'room' => $blockSection->room,
            ] : null,
            'subjects' => $blockSection
                ? $blockSection->subjects->map(fn ($s) => [
                    'code' => $s->code,
                    'name' => $s->name,
                    'units' => $s->units,
                    'type' => $s->type,
                ])->toArray()
                : [],
        ];
    }

    /**
     * Returns the student's full statement of account: all assessments with their payment history, plus running totals for billed, paid, and current balance.
     */
    public function statementOfAccountData(PortalCredential $student): array
    {
        $studentRecord = $student->personalData?->student;

        $assessments = $studentRecord
            ? $this->studentPortalRepository->assessmentsWithPaymentsForStudent($studentRecord->id)
            : collect();

        $statement = $assessments->map(fn (StudentAssessment $a) => [
            'id' => $a->id,
            'assessment_number' => $a->assessment_number,
            'school_year' => $a->school_year,
            'semester' => $a->semester,
            'status' => $a->status,
            'total_tuition' => (float) $a->total_tuition,
            'total_misc_fees' => (float) $a->total_misc_fees,
            'total_lab_fees' => (float) $a->total_lab_fees,
            'total_other_fees' => (float) $a->total_other_fees,
            'gross_amount' => (float) $a->gross_amount,
            'total_discounts' => (float) $a->total_discounts,
            'prior_balance' => (float) $a->prior_balance,
            'net_amount' => (float) $a->net_amount,
            'total_paid' => $a->total_paid,
            'balance' => $a->remaining_balance,
            'finalized_at' => $a->finalized_at?->format('F d, Y'),
            'payments' => $a->payments
                ->sortBy('payment_date')
                ->map(fn (StudentPayment $p) => [
                    'id' => $p->id,
                    'amount_paid' => (float) $p->amount_paid,
                    'payment_method' => $p->payment_method,
                    'reference_number' => $p->reference_number,
                    'payment_date' => $p->payment_date->format('M d, Y'),
                    'notes' => $p->notes,
                ])
                ->values(),
        ])->values();

        $totalBilled = $statement->sum('net_amount');
        $totalPaid = $statement->sum('total_paid');
        $currentBalance = $statement->isNotEmpty() ? (float) $statement->last()['balance'] : 0.0;

        return [
            'statement' => $statement,
            'totalBilled' => $totalBilled,
            'totalPaid' => $totalPaid,
            'currentBalance' => $currentBalance,
        ];
    }

    /**
     * Returns the active fees for the given grade level and school year, with per-unit fees already multiplied by the program's credit-unit load.
     * Falls back to the latest available school year's fees if none exist for the requested year.
     */
    private function getApplicableFees(string $gradeLevel, ?string $schoolYear, string $strand = ''): array
    {
        $schoolLevel = $this->getStudentCategory($gradeLevel);

        $fees = $schoolYear ? $this->feeRepository->applicableActive($schoolLevel, $schoolYear) : collect();

        if ($fees->isEmpty()) {
            $latestYear = $this->feeRepository->maxActiveSchoolYear();
            $fees = $latestYear ? $this->feeRepository->applicableActive($schoolLevel, $latestYear) : collect();
        }

        // Resolve credit units for per-unit fees (same logic as EnrollmentPeriodController)
        $units = 0;
        if ($strand && preg_match('/\(([A-Z]+)\)/', $strand, $m)) {
            $units = $this->programRepository->activeMaxLoadForCode($m[1]);
        }
        if (! $units) {
            $units = $this->programRepository->activeMaxLoadForCode($schoolLevel);
        }

        return $fees->map(fn ($fee) => [
            'id' => $fee->id,
            'name' => $fee->name,
            'code' => $fee->code,
            'category' => $fee->category,
            'is_per_unit' => $fee->is_per_unit,
            'amount' => $fee->is_per_unit ? (float) $fee->amount * $units : (float) $fee->amount,
        ])->toArray();
    }

    /**
     * Returns all active discount types, filtering out the SIBLING discount for students who have no enrolled sibling.
     */
    private function getAvailableDiscounts(PortalCredential $student): array
    {
        return $this->discountTypeRepository->allActive()
            ->filter(function ($discount) use ($student) {
                if ($discount->code === 'SIBLING') {
                    return $this->hasEnrolledSibling($student);
                }

                return true;
            })
            ->values()
            ->map(fn ($discount) => [
                'id' => $discount->id,
                'name' => $discount->name,
                'code' => $discount->code,
                'discount_type' => $discount->discount_type,
                'value' => (float) $discount->value,
                'applies_to' => $discount->applies_to,
            ])->toArray();
    }

    /**
     * Returns the unpaid balance carried forward from the student's most recent prior-semester assessment, or 0 if there is none.
     */
    private function getStudentPriorBalance(int $studentId, string $targetYear, string $targetSem): float
    {
        $previous = $this->studentAssessmentRepository->latestExcludingPeriod($studentId, $targetYear, $targetSem);

        return $previous?->remaining_balance ?? 0.0;
    }

    /**
     * Returns true if any of the student's listed siblings is currently enrolled (checked by student ID number first, then by full name).
     * Uses at most 2 queries regardless of how many siblings are listed.
     */
    private function hasEnrolledSibling(PortalCredential $student): bool
    {
        $siblings = $student->personalData?->siblings ?? collect();

        if ($siblings->isEmpty()) {
            return false;
        }

        // Collect all sibling IDs and full names upfront, then check in bulk
        // (2 queries max regardless of sibling count, instead of up to 2 per sibling).
        $ids = $siblings->pluck('sibling_id_number')->filter()->values()->all();
        $names = $siblings->pluck('sibling_full_name')->filter()->map(fn ($n) => trim($n))->values()->all();

        if (! empty($ids) && $this->studentRepository->hasAnyActiveSiblingByIds($ids)) {
            return true;
        }

        if (! empty($names) && $this->studentRepository->hasAnyActiveSiblingByFullNames($names)) {
            return true;
        }

        return false;
    }

    /**
     * Returns the minimal portal credential fields (id, username) needed by frontend pages.
     */
    private function formatStudentResponse(PortalCredential $student): array
    {
        return [
            'id' => $student->id,
            'username' => $student->username,
        ];
    }

    /**
     * Returns personal data fields needed for enrollment/info pages — more complete than the summary but excludes family and education data.
     */
    private function formatPersonalDataResponse(?ApplicantPersonalData $personalData): ?array
    {
        if (! $personalData) {
            return null;
        }

        return [
            'id' => $personalData->id,
            'first_name' => $personalData->first_name,
            'last_name' => $personalData->last_name,
            'middle_name' => $personalData->middle_name,
            'email' => $personalData->email,
            'mobile_number' => $personalData->mobile_number,
            'present_street' => $personalData->present_street,
            'present_brgy' => $personalData->present_brgy,
            'present_city' => $personalData->present_city,
            'present_province' => $personalData->present_province,
            'present_zip' => $personalData->present_zip,
        ];
    }

    /**
     * Returns the application fields used across enrollment and dashboard pages, including the resolved student category (LES/JHS/SHS).
     */
    private function formatApplicationResponse(?Applicant $application): ?array
    {
        if (! $application) {
            return null;
        }

        return [
            'id' => $application->id,
            'application_number' => $application->application_number,
            'school_year' => $application->school_year,
            'semester' => $application->semester,
            'grade_level' => $application->year_level,
            'student_type' => $application->student_category,
            'student_category' => $this->getStudentCategory($application->year_level),
            'application_status' => $application->application_status,
            'date_applied' => $application->application_date,
            'exam_status' => $application->exam_status,
            'exam_date' => $application->examination_date,
            'preferred_payment_plan' => $application->preferred_payment_plan,
            'preferred_payment_mode' => $application->preferred_payment_mode,
        ];
    }

    /**
     * Returns the key student record fields (ID number, enrollment status, year level) needed by portal pages.
     */
    private function formatStudentRecordResponse(?Student $studentRecord): ?array
    {
        if (! $studentRecord) {
            return null;
        }

        return [
            'id' => $studentRecord->id,
            'student_id' => $studentRecord->student_id_number,
            'enrollment_status' => $studentRecord->enrollment_status,
            'enrollment_date' => $studentRecord->enrollment_date,
            'current_year_level' => $studentRecord->current_year_level,
            'current_school_year' => $studentRecord->current_school_year,
        ];
    }

    /**
     * Maps a grade level string to its school category code: LES (Grades 1–6), JHS (Grades 7–10), SHS (Grades 11–12), or 'all' for unrecognised values.
     */
    private function getStudentCategory(string $gradeLevel): string
    {
        if (str_contains($gradeLevel, 'Grade 1') || str_contains($gradeLevel, 'Grade 2') ||
            str_contains($gradeLevel, 'Grade 3') || str_contains($gradeLevel, 'Grade 4') ||
            str_contains($gradeLevel, 'Grade 5') || str_contains($gradeLevel, 'Grade 6')) {
            return 'LES';
        }

        if (str_contains($gradeLevel, 'Grade 7') || str_contains($gradeLevel, 'Grade 8') ||
            str_contains($gradeLevel, 'Grade 9') || str_contains($gradeLevel, 'Grade 10')) {
            return 'JHS';
        }

        if (str_contains($gradeLevel, 'Grade 11') || str_contains($gradeLevel, 'Grade 12')) {
            return 'SHS';
        }

        return 'all';
    }

    /**
     * SHS: extract code from strand "(ABM)", "(HUMSS)", etc.
     * JHS / LES: match by student_category code.
     */
    private function resolveProgram(Applicant $application)
    {
        $strand = $application->strand ?? null;

        if ($strand) {
            $codeMap = [
                'Science, Technology, Engineering and Mathematics' => 'STEM',
                'Accountancy, Business and Management' => 'ABM',
                'Humanities and Social Sciences' => 'HUMSS',
            ];
            $code = $codeMap[$strand] ?? $strand;
            $program = $this->programRepository->findActiveByCode($code);
            if ($program) {
                return $program;
            }
        }

        return $this->programRepository->findActiveByCode($application->student_category);
    }

    /**
     * Confirms a student's self-enrollment: creates or updates the student record, marks the application as Enrolled, and mirrors applicant data into student tables — all in a single transaction.
     * Used for the "confirm enrollment" flow where payment has already been handled separately.
     */
    public function confirmEnrollment(PortalCredential $student): array
    {
        $personalData = $student->personalData;
        $application = $student->application;

        if (! $application) {
            return ['ok' => false, 'errors' => ['error' => 'No application found.']];
        }

        $currentPeriod = $this->enrollmentPeriodRepository->currentOfType('student');
        $targetYear = $currentPeriod?->school_year ?? $application->school_year;
        $targetSem = $currentPeriod?->semester ?? $application->semester ?? 'First Semester';

        if (! $this->enrollmentPeriodRepository->isOpenFor($targetYear, $targetSem, 'student')) {
            return ['ok' => false, 'errors' => ['error' => 'Enrollment is currently closed for this semester.']];
        }

        if (strtolower($application->application_status) === 'enrolled') {
            return ['ok' => false, 'errors' => ['error' => 'You are already enrolled.']];
        }

        // Wrap all writes in a single transaction: student record upsert,
        // application status update, and the full data-copy into student tables
        // must all succeed together or roll back together.
        DB::transaction(function () use ($personalData, $application) {
            $studentRecord = $personalData->student;

            if (! $studentRecord) {
                $studentRecord = $this->studentRepository->createStudent([
                    'applicant_personal_data_id' => $personalData->id,
                    'applicant_id' => $application->id,
                    'enrollment_status' => 'Active',
                    'enrollment_date' => now(),
                    'current_year_level' => $application->year_level,
                    'current_school_year' => $application->school_year,
                ]);
            } else {
                $this->studentRepository->updateStudent($studentRecord, [
                    'enrollment_status' => 'Active',
                    'enrollment_date' => now(),
                ]);
            }

            $this->applicantRepository->update($application, ['application_status' => 'Enrolled']);

            // Mirrors applicant_* snapshot tables into student_* tables on enrollment.
            app(CopyApplicantDataService::class)->execute($studentRecord);
        });

        return ['ok' => true, 'message' => 'Congratulations! Your enrollment has been confirmed successfully.'];
    }

    /**
     * Processes the online enrollment wizard submission: creates the student record, generates a fee assessment with prior-balance carry-over, sets the application to Pending, and mirrors applicant data — all in one transaction.
     * Used when the student submits their enrollment form and will pay at the Finance Office.
     */
    public function processEnrollment(PortalCredential $student, array $data): array
    {
        $personalData = $student->personalData;
        $application = $student->application;

        if (! $application) {
            return ['ok' => false, 'errors' => ['error' => 'No application found.']];
        }

        $currentPeriod = $this->enrollmentPeriodRepository->currentOfType('student');
        $targetYear = $currentPeriod?->school_year ?? $application->school_year;
        $targetSem = $currentPeriod?->semester ?? $application->semester ?? 'First Semester';

        if (! $this->enrollmentPeriodRepository->isOpenFor($targetYear, $targetSem, 'student')) {
            return ['ok' => false, 'errors' => ['error' => 'Enrollment is currently closed for this semester.']];
        }

        $studentRecord = $personalData?->student;
        $alreadySubmitted = $studentRecord
            && $this->studentAssessmentRepository->existsForStudentPeriod($studentRecord->id, $targetYear, $targetSem);

        if ($alreadySubmitted) {
            return ['ok' => false, 'errors' => ['error' => 'Your fee assessment has already been submitted.']];
        }

        // Wrap the entire enrollment write sequence in a transaction:
        // student record, fee assessment, application status, and data copy
        // must all commit together or not at all.
        DB::transaction(function () use ($personalData, $application, $studentRecord, $targetYear, $targetSem, $data) {
            if (! $studentRecord) {
                $studentRecord = $this->studentRepository->createStudent([
                    'applicant_personal_data_id' => $personalData->id,
                    'applicant_id' => $application->id,
                    'enrollment_status' => 'Pending',
                    'enrollment_date' => now(),
                    'current_year_level' => $application->year_level,
                    'current_semester' => $targetSem,
                    'current_school_year' => $targetYear,
                ]);
            } else {
                $this->studentRepository->updateStudent($studentRecord, [
                    'enrollment_status' => 'Pending',
                    'enrollment_date' => now(),
                    'applicant_id' => $studentRecord->applicant_id ?? $application->id,
                    'current_year_level' => $application->year_level,
                    'current_semester' => $targetSem,
                    'current_school_year' => $targetYear,
                ]);
            }

            $existingAssessment = $this->studentAssessmentRepository->findForStudentPeriod($studentRecord->id, $targetYear, $targetSem);

            if (! $existingAssessment) {
                $assessmentFees = $this->getApplicableFees($application->year_level, $targetYear);
                $assessmentProgram = $this->resolveProgram($application);
                $assessmentUnits = $assessmentProgram?->max_load ?? 0;

                $calcTotal = fn (string $cat) => collect($assessmentFees)
                    ->filter(fn ($f) => $f['category'] === $cat)
                    ->sum(fn ($f) => $f['is_per_unit'] ? $f['amount'] * $assessmentUnits : $f['amount']);

                $tTuition = $calcTotal('tuition');
                $tMisc = $calcTotal('miscellaneous');
                $tLab = $calcTotal('laboratory');
                $tOther = $calcTotal('special');
                $gross = $tTuition + $tMisc + $tLab + $tOther;
                $net = (float) ($data['total_amount'] ?? 0);
                $discount = max(0, $gross - $net);
                $paymentPlan = $data['payment_plan'] ?? 'full';

                $priorBalance = $this->getStudentPriorBalance($studentRecord->id, $targetYear, $targetSem);
                $netWithPrior = $net + $priorBalance;

                $minimumAmount = $paymentPlan === 'installment'
                    ? round($net * 0.30 + $priorBalance, 2)
                    : $netWithPrior;

                $this->studentAssessmentRepository->create([
                    'student_id' => $studentRecord->id,
                    'assessment_number' => $this->studentAssessmentRepository->generateAssessmentNumber($targetYear),
                    'school_year' => $targetYear,
                    'semester' => $targetSem,
                    'total_tuition' => $tTuition,
                    'total_misc_fees' => $tMisc,
                    'total_lab_fees' => $tLab,
                    'total_other_fees' => $tOther,
                    'gross_amount' => $gross,
                    'total_discounts' => $discount,
                    'net_amount' => $netWithPrior,
                    'prior_balance' => $priorBalance,
                    'payment_plan' => $paymentPlan,
                    'minimum_amount' => $minimumAmount,
                    'mode_of_payment' => $data['mode_of_payment'] ?? null,
                    'status' => 'finalized',
                    'generated_at' => now(),
                    'finalized_at' => now(),
                ]);
            }

            $this->applicantRepository->update($application, ['application_status' => 'Pending']);

            app(CopyApplicantDataService::class)->execute($studentRecord);
        });

        return ['ok' => true, 'message' => 'Enrollment confirmed! Please proceed to the Finance Office to complete your payment.'];
    }

    /**
     * Updates the payment mode on the student's latest assessment, provided it hasn't been fully paid yet.
     */
    public function changePaymentMode(PortalCredential $student, array $data): array
    {
        $studentRecord = $student->personalData?->student;

        if (! $studentRecord) {
            return ['ok' => false, 'errors' => ['payment_mode' => 'No student record found.']];
        }

        $assessment = $this->studentAssessmentRepository->latestForStudent($studentRecord->id);

        if (! $assessment || $assessment->status === 'paid') {
            return ['ok' => false, 'errors' => ['payment_mode' => 'Cannot update payment mode once fully paid.']];
        }

        $this->studentAssessmentRepository->updateAssessment($assessment, ['mode_of_payment' => $data['mode_of_payment']]);

        return ['ok' => true];
    }

    /**
     * Returns the personal info and family background fields shown on the enrolled student's profile page (a narrower view than the applicant version).
     */
    public function personalInfoData(PortalCredential $student): array
    {
        $personalData = $student->personalData;
        $familyBackground = $personalData?->familyBackground;

        return [
            'student' => [
                'id' => $student->id,
                'username' => $student->username,
            ],
            'personalData' => $personalData ? [
                'id' => $personalData->id,
                'first_name' => $personalData->first_name,
                'last_name' => $personalData->last_name,
                'middle_name' => $personalData->middle_name,
                'suffix' => $personalData->suffix,
                'gender' => $personalData->gender,
                'citizenship' => $personalData->citizenship,
                'religion' => $personalData->religion,
                'date_of_birth' => $personalData->date_of_birth,
                'place_of_birth' => $personalData->place_of_birth,
                'email' => $personalData->email,
                'alt_email' => $personalData->alt_email,
                'mobile_number' => $personalData->mobile_number,
                'present_street' => $personalData->present_street,
                'present_brgy' => $personalData->present_brgy,
                'present_city' => $personalData->present_city,
                'present_province' => $personalData->present_province,
                'present_zip' => $personalData->present_zip,
                'permanent_street' => $personalData->permanent_street,
                'permanent_brgy' => $personalData->permanent_brgy,
                'permanent_city' => $personalData->permanent_city,
                'permanent_province' => $personalData->permanent_province,
                'permanent_zip' => $personalData->permanent_zip,
            ] : null,
            'familyBackground' => $familyBackground ? [
                'father_fname' => $familyBackground->father_fname,
                'father_lname' => $familyBackground->father_lname,
                'father_occupation' => $familyBackground->father_occupation,
                'father_contact_no' => $familyBackground->father_contact_no,
                'father_email' => $familyBackground->father_email,
                'mother_fname' => $familyBackground->mother_fname,
                'mother_lname' => $familyBackground->mother_lname,
                'mother_occupation' => $familyBackground->mother_occupation,
                'mother_contact_no' => $familyBackground->mother_contact_no,
                'mother_email' => $familyBackground->mother_email,
                'guardian_fname' => $familyBackground->guardian_fname,
                'guardian_lname' => $familyBackground->guardian_lname,
                'guardian_relationship' => $familyBackground->guardian_relationship,
                'guardian_occupation' => $familyBackground->guardian_occupation,
                'guardian_contact_no' => $familyBackground->guardian_contact_no,
                'guardian_email' => $familyBackground->guardian_email,
            ] : null,
        ];
    }

    /**
     * Saves contact and address edits for an enrolled student, and updates emergency contact details in the family background record.
     */
    public function updatePersonalInfo(PortalCredential $student, array $data): array
    {
        $personalData = $student->personalData;

        if (! $personalData) {
            return ['ok' => false, 'errors' => ['error' => 'Personal data not found.']];
        }

        $this->applicationRepository->updatePersonalData(
            $personalData,
            collect($data)->except(['emergency_contact_name', 'emergency_mobile_phone'])->toArray()
        );

        $familyBackground = $personalData->familyBackground;
        if ($familyBackground) {
            $this->applicationRepository->updateFamilyBackgroundFields($familyBackground, [
                'emergency_contact_name' => $data['emergency_contact_name'] ?? $familyBackground->emergency_contact_name,
                'emergency_mobile_phone' => $data['emergency_mobile_phone'] ?? $familyBackground->emergency_mobile_phone,
            ]);
        }

        return ['ok' => true];
    }

    /**
     * Returns the portal credential fields needed to render the change-password form, including whether the default password has been changed yet.
     */
    public function changePasswordFormData(PortalCredential $student): array
    {
        return [
            'student' => [
                'id' => $student->id,
                'username' => $student->username,
                'password_changed' => $student->password_changed,
            ],
        ];
    }

    /**
     * Verifies the current password then saves a new hashed password and marks the credential as password-changed.
     */
    public function changePassword(PortalCredential $student, array $data): array
    {
        if (! Hash::check($data['current_password'], $student->temporary_password)) {
            return ['ok' => false, 'errors' => ['current_password' => 'The current password is incorrect.']];
        }

        $this->portalCredentialRepository->update($student, [
            'temporary_password' => Hash::make($data['password']),
            'password_changed' => true,
        ]);

        return ['ok' => true];
    }

    /**
     * Returns the student's enrolled subjects with their schedule, room, teacher, and grade status for the current semester.
     */
    public function scheduleData(PortalCredential $student): array
    {
        $studentRecord = $student->personalData?->student;

        $enrollment = $studentRecord
            ? $this->studentPortalRepository->latestEnrollmentWithSubjects($studentRecord->id)
            : null;

        $subjects = $enrollment
            ? $enrollment->enrollmentSubjects->map(fn ($es) => [
                'subject_code' => $es->subject?->code,
                'subject_name' => $es->subject?->name,
                'units' => $es->units,
                'schedule' => $es->schedule,
                'room' => $es->room,
                'teacher' => $es->teacher,
                'grade_status' => $es->grade_status,
            ])->values()
            : [];

        return [
            'student' => $this->formatStudentResponse($student),
            'isEnrolled' => $studentRecord !== null,
            'enrollment' => $enrollment ? [
                'school_year' => $enrollment->school_year,
                'semester' => $enrollment->semester,
                'year_level' => $enrollment->year_level,
                'student_category' => $enrollment->student_category,
                'status' => $enrollment->status,
            ] : null,
            'subjects' => $subjects,
        ];
    }

    /**
     * Only Absent and Late records are surfaced — Present/Excused rows are
     * not actionable by the student and would add noise to the table.
     */
    public function attendanceData(PortalCredential $student): array
    {
        $studentRecord = $student->personalData?->student;

        $enrollment = $studentRecord
            ? $this->studentPortalRepository->latestEnrollment($studentRecord->id)
            : null;

        $attendance = $enrollment
            ? $this->studentPortalRepository->attendanceForEnrollment($enrollment->id)
                ->map(fn ($a) => [
                    'id' => $a->id,
                    'subject_code' => $a->subject?->code,
                    'subject_name' => $a->subject?->name,
                    'date' => $a->date->format('Y-m-d'),
                    'status' => $a->status,
                    'remarks' => $a->remarks,
                    'reason' => $a->reason,
                ])
                ->values()
                ->toArray()
            : [];

        return [
            'student' => $this->formatStudentResponse($student),
            'isEnrolled' => $studentRecord !== null,
            'enrollment' => $enrollment ? [
                'school_year' => $enrollment->school_year,
                'semester' => $enrollment->semester,
                'year_level' => $enrollment->year_level,
            ] : null,
            'attendance' => $attendance,
        ];
    }

    /**
     * Ownership is verified by checking that the attendance row belongs to the
     * student's own enrollment — students cannot annotate other students' records.
     */
    public function canAnnotateAttendance(PortalCredential $student, Attendance $attendance): bool
    {
        $studentRecord = $student->personalData?->student;
        $enrollment = $studentRecord ? $this->studentPortalRepository->latestEnrollment($studentRecord->id) : null;

        return $enrollment !== null && $attendance->student_enrollment_id === $enrollment->id;
    }

    /**
     * Saves the student's written reason for an absence or late mark on their attendance record.
     */
    public function updateAttendanceReason(Attendance $attendance, ?string $reason): void
    {
        $this->studentPortalRepository->updateAttendance($attendance, ['reason' => $reason]);
    }
}
