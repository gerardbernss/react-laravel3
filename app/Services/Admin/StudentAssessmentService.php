<?php

namespace App\Services\Admin;

use App\Models\Applicant;
use App\Models\StudentAssessment;
use App\Models\StudentPayment;
use App\Repositories\ApplicantAssessmentRepository;
use App\Repositories\ApplicantRepository;
use App\Repositories\EnrollmentPeriodRepository;
use App\Repositories\StudentAssessmentRepository;
use App\Repositories\StudentPaymentRepository;
use App\Repositories\StudentRepository;
use Illuminate\Support\Facades\Auth;

class StudentAssessmentService
{
    public function __construct(
        private StudentAssessmentRepository $studentAssessmentRepository,
        private EnrollmentPeriodRepository $enrollmentPeriodRepository,
        private ApplicantAssessmentRepository $applicantAssessmentRepository,
        private StudentRepository $studentRepository,
        private ApplicantRepository $applicantRepository,
        private StudentPaymentRepository $studentPaymentRepository,
    ) {
    }

    /**
     * Returns all assessments for the current enrollment period: both student assessments and pending applicant assessments,
     * merged and sorted newest first, along with available school years and the currently open student enrollment period.
     */
    public function indexData(): array
    {
        $period = $this->enrollmentPeriodRepository->currentOrLatest();

        $studentAssessments = $this->studentAssessmentRepository->assessmentsForPeriod($period)
            ->map(fn ($a) => $this->studentAssessmentRow($a));

        $applicantAssessments = $this->applicantAssessmentRepository->pendingForPeriod($period)
            ->map(fn ($a) => $this->applicantAssessmentRow($a));

        $assessments = $studentAssessments->concat($applicantAssessments)->sortByDesc('id')->values();
        $openStudentPeriod = $this->enrollmentPeriodRepository->openForStudents();

        return [
            'assessments' => $assessments,
            'schoolYears' => $this->studentAssessmentRepository->distinctSchoolYearsDesc(),
            'openStudentPeriod' => $openStudentPeriod ? [
                'id' => $openStudentPeriod->id,
                'school_year' => $openStudentPeriod->school_year,
                'semester' => $openStudentPeriod->semester,
            ] : null,
        ];
    }

    /**
     * Returns the full assessment detail including fee breakdown, discount totals, payment history, and student info.
     */
    public function showData(StudentAssessment $assessment): array
    {
        $this->studentAssessmentRepository->loadDetailRelations($assessment);

        return ['assessment' => $this->assessmentDetail($assessment)];
    }

    /**
     * Records a new payment against an assessment and recalculates its status (finalized → partial → paid).
     * Returns an error if the assessment is already fully paid, or a success message indicating full or partial payment.
     */
    public function processPayment(StudentAssessment $assessment, array $data): array
    {
        if ($assessment->status === 'paid') {
            return ['error' => 'This assessment has already been fully paid.'];
        }

        $this->studentPaymentRepository->create([
            'assessment_id' => $assessment->id,
            'amount_paid' => $data['amount_paid'],
            'payment_method' => $data['payment_method'],
            'reference_number' => $data['reference_number'] ?? null,
            'payment_date' => $data['payment_date'],
            'notes' => $data['notes'] ?? null,
            'processed_by' => Auth::id(),
        ]);

        $this->recalculateAssessmentStatus($assessment);
        $assessment->refresh();

        return ['message' => $assessment->status === 'paid'
            ? 'Payment recorded. Student is now fully enrolled.'
            : 'Partial payment recorded successfully.'];
    }

    /**
     * Updates an existing payment record and recalculates the assessment's payment status.
     */
    public function updatePayment(StudentAssessment $assessment, StudentPayment $payment, array $data): void
    {
        $this->studentPaymentRepository->update($payment, $data);
        $this->recalculateAssessmentStatus($assessment);
        $assessment->refresh();
    }

    /**
     * Removes a payment record and recalculates the assessment's payment status.
     */
    public function deletePayment(StudentAssessment $assessment, StudentPayment $payment): void
    {
        $this->studentPaymentRepository->delete($payment);
        $this->recalculateAssessmentStatus($assessment);
    }

    /**
     * Recalculates and saves the assessment's payment status without making any payment changes.
     * Useful for fixing assessments whose status has drifted out of sync.
     */
    public function syncStatus(StudentAssessment $assessment): void
    {
        $this->recalculateAssessmentStatus($assessment);
    }

    /**
     * Updates the minimum required payment amount for an assessment and recalculates its status.
     */
    public function updateMinimumAmount(StudentAssessment $assessment, array $data): void
    {
        $this->studentAssessmentRepository->updateAssessment($assessment, $data);
        $this->recalculateAssessmentStatus($assessment);
    }

    /**
     * Returns a diagnostic snapshot of an assessment and its linked student/application records.
     * Used to troubleshoot enrollment status mismatches in development or support contexts.
     */
    public function debugStatus(StudentAssessment $assessment): array
    {
        $assessment->refresh();
        $student = $assessment->student;

        return [
            'assessment_id' => $assessment->id,
            'student_id' => $assessment->student_id,
            'total_paid' => $assessment->total_paid,
            'minimum_required' => $assessment->minimum_required,
            'minimum_amount_col' => $assessment->minimum_amount,
            'net_amount' => $assessment->net_amount,
            'payment_plan' => $assessment->payment_plan,
            'student_found' => $student ? true : false,
            'student_apd_id' => $student?->applicant_personal_data_id,
            'student_aai_id' => $student?->applicant_id,
            'student_enroll' => $student?->enrollment_status,
            'portal_cred' => $student?->portalCredential ? [
                'id' => $student->portalCredential->id,
                'aai_id' => $student->portalCredential->applicant_id,
            ] : null,
            'application_via_student' => $student?->application?->id,
            'application_via_portal' => $student?->portalCredential?->application?->id,
            'application_via_apd' => $student
                ? $this->applicantRepository->findByPersonalDataId($student->applicant_personal_data_id)?->id
                : null,
            'application_status' => $student?->application?->application_status
                ?? $student?->portalCredential?->application?->application_status,
        ];
    }

    /**
     * Recalculates the assessment status (finalized / partial / paid) based on total paid vs net amount.
     * Also updates the linked student's enrollment status and application status to match:
     * Active + Enrolled when the minimum is met, Pending + Pending when it is not.
     */
    private function recalculateAssessmentStatus(StudentAssessment $assessment): void
    {
        $assessment->refresh();
        $totalPaid = round($assessment->total_paid, 2);
        $netAmount = round((float) $assessment->net_amount, 2);
        $minimumRequired = round($assessment->minimum_required, 2);

        $newStatus = match (true) {
            $totalPaid >= $netAmount => 'paid',
            $totalPaid > 0 => 'partial',
            default => 'finalized',
        };

        $this->studentAssessmentRepository->updateAssessment($assessment, ['status' => $newStatus]);

        $student = $assessment->student;
        if (! $student) {
            return;
        }

        $application = $this->resolveApplication($student);

        if ($application && ! $student->applicant_id) {
            $this->studentRepository->updateStudent($student, ['applicant_id' => $application->id]);
        }

        if ($totalPaid >= $minimumRequired) {
            $this->studentRepository->updateStudent($student, ['enrollment_status' => 'Active']);
            if ($application) {
                $this->applicantRepository->update($application, ['application_status' => 'Enrolled']);
            }
        } elseif ($application?->application_status === 'Enrolled') {
            $this->studentRepository->updateStudent($student, ['enrollment_status' => 'Pending']);
            $this->applicantRepository->update($application, ['application_status' => 'Pending']);
        }
    }

    /**
     * Finds the applicant record linked to a student, trying direct relation, portal credential, and personal data ID in that order.
     */
    private function resolveApplication($student): ?Applicant
    {
        return $student->application
            ?? $student->portalCredential?->application
            ?? $this->applicantRepository->findByPersonalDataId($student->applicant_personal_data_id);
    }

    /**
     * Formats a student assessment as a flat index row with amounts, status, and student identity fields.
     */
    private function studentAssessmentRow(StudentAssessment $a): array
    {
        return [
            'id' => $a->id,
            'type' => 'student',
            'assessment_number' => $a->assessment_number,
            'school_year' => $a->school_year,
            'semester' => $a->semester,
            'status' => $a->status,
            'gross_amount' => (float) $a->gross_amount,
            'total_discounts' => (float) $a->total_discounts,
            'net_amount' => (float) $a->net_amount,
            'total_paid' => $a->total_paid,
            'balance' => $a->remaining_balance,
            'student_name' => $a->student?->personalData
                ? $a->student->personalData->last_name . ', ' . $a->student->personalData->first_name
                : '—',
            'student_id_number' => $a->student?->student_id_number ?? '—',
            'grade_level' => $a->student?->current_year_level ?? '—',
            'applicant_id' => null,
        ];
    }

    /**
     * Formats a pending applicant assessment as an index row, marking it as 'for_enrollment' status with zero payments.
     */
    private function applicantAssessmentRow($a): array
    {
        return [
            'id' => $a->id,
            'type' => 'applicant',
            'assessment_number' => $a->assessment_number,
            'school_year' => $a->school_year,
            'semester' => $a->semester,
            'status' => 'for_enrollment',
            'gross_amount' => (float) $a->gross_amount,
            'total_discounts' => 0,
            'net_amount' => (float) $a->net_amount,
            'total_paid' => 0,
            'balance' => (float) $a->net_amount,
            'student_name' => $a->applicant?->personalData
                ? $a->applicant->personalData->last_name . ', ' . $a->applicant->personalData->first_name
                : '—',
            'student_id_number' => '—',
            'grade_level' => $a->applicant?->year_level ?? '—',
            'applicant_id' => $a->applicant?->id,
        ];
    }

    /**
     * Builds the full assessment detail payload including fee category totals, discount/balance figures, payment history, and linked student info.
     */
    private function assessmentDetail(StudentAssessment $assessment): array
    {
        return [
            'id' => $assessment->id,
            'assessment_number' => $assessment->assessment_number,
            'school_year' => $assessment->school_year,
            'semester' => $assessment->semester,
            'status' => $assessment->status,
            'total_tuition' => (float) $assessment->total_tuition,
            'total_misc_fees' => (float) $assessment->total_misc_fees,
            'total_lab_fees' => (float) $assessment->total_lab_fees,
            'total_other_fees' => (float) $assessment->total_other_fees,
            'gross_amount' => (float) $assessment->gross_amount,
            'total_discounts' => (float) $assessment->total_discounts,
            'prior_balance' => (float) $assessment->prior_balance,
            'net_amount' => (float) $assessment->net_amount,
            'payment_plan' => $assessment->payment_plan ?? 'full',
            'minimum_amount' => $assessment->minimum_required,
            'total_paid' => $assessment->total_paid,
            'balance' => $assessment->remaining_balance,
            'finalized_at' => $assessment->finalized_at?->format('F d, Y'),
            'student' => $assessment->student ? [
                'student_id' => $assessment->student->student_id_number,
                'name' => $assessment->student->personalData
                    ? trim($assessment->student->personalData->last_name . ', '
                        . $assessment->student->personalData->first_name . ' '
                        . ($assessment->student->personalData->middle_name ?? ''))
                    : '—',
                'grade_level' => $assessment->student->current_year_level,
                'school_year' => $assessment->student->current_school_year,
            ] : null,
            'payments' => $assessment->payments->map(fn ($p) => [
                'id' => $p->id,
                'amount_paid' => (float) $p->amount_paid,
                'payment_method' => $p->payment_method,
                'reference_number' => $p->reference_number,
                'payment_date' => $p->payment_date->format('M d, Y'),
                'notes' => $p->notes,
                'processed_by' => $p->processedBy?->name ?? '—',
            ]),
        ];
    }
}
