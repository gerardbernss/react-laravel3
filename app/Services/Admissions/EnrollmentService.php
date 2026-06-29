<?php

namespace App\Services\Admissions;

use App\Models\Applicant;
use App\Models\EnrollmentPeriod;
use App\Repositories\ApplicantRepository;
use App\Repositories\AssessmentDiscountRepository;
use App\Repositories\DiscountTypeRepository;
use App\Repositories\EmployeeRepository;
use App\Repositories\EnrollmentAuditLogRepository;
use App\Repositories\FeeRepository;
use App\Repositories\ProgramRepository;
use App\Repositories\StudentAssessmentRepository;
use App\Repositories\StudentRepository;
use App\Services\Student\CopyApplicantDataService;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

/**
 * Business logic for the enrollment dashboard, onsite enrollment wizard, and
 * applicant enrollment lifecycle (enroll / revert / withdraw / audit log / report).
 */
class EnrollmentService
{
    private const STRAND_CODE_MAP = [
        'Science, Technology, Engineering and Mathematics' => 'STEM',
        'Accountancy, Business and Management' => 'ABM',
        'Humanities and Social Sciences' => 'HUMSS',
    ];

    public function __construct(
        private readonly ApplicantRepository $applicantRepository,
        private readonly StudentRepository $studentRepository,
        private readonly DiscountTypeRepository $discountTypeRepository,
        private readonly EmployeeRepository $employeeRepository,
        private readonly ProgramRepository $programRepository,
        private readonly FeeRepository $feeRepository,
        private readonly StudentAssessmentRepository $studentAssessmentRepository,
        private readonly AssessmentDiscountRepository $assessmentDiscountRepository,
        private readonly EnrollmentAuditLogRepository $enrollmentAuditLogRepository,
    ) {
    }

    public function dashboardData(array $filters): array
    {
        $currentPeriod = EnrollmentPeriod::current();

        $applicants = $this->applicantRepository->paginatedForDashboard(
            $currentPeriod,
            $filters['status'] ?? null,
            $filters['search'] ?? null,
            $filters['category'] ?? null
        );

        return [
            'applicants' => $applicants,
            'statistics' => $this->applicantRepository->dashboardStatusCounts($currentPeriod),
            'currentPeriod' => $currentPeriod ? [
                'school_year' => $currentPeriod->getAttribute('school_year'),
                'semester' => $currentPeriod->getAttribute('semester'),
                'is_open' => $currentPeriod->getAttribute('is_open'),
            ] : null,
            'filters' => [
                'status' => $filters['status'] ?? null,
                'search' => $filters['search'] ?? null,
                'category' => $filters['category'] ?? null,
            ],
        ];
    }

    public function showData(Applicant $applicant): array
    {
        $this->applicantRepository->loadEnrollmentShowRelations($applicant);

        $fees = $this->getApplicableFees($applicant->year_level ?? '', $applicant->school_year ?? '');
        $units = $this->resolveUnits($applicant);
        $semester = $applicant->semester ?? 'First Semester';

        $studentRecord = $applicant->personalData?->student;
        $existingAssessment = $studentRecord
            ? $this->studentAssessmentRepository->findForStudentPeriod($studentRecord->id, $applicant->school_year, $semester)
            : null;

        return [
            'applicant' => $applicant,
            'fees' => $fees,
            'units' => $units,
            'discountTypes' => $this->getEligibleDiscounts($applicant),
            'existingAssessment' => $existingAssessment ? [
                'assessment_number' => $existingAssessment->assessment_number,
                'net_amount' => $existingAssessment->net_amount,
                'payment_plan' => $existingAssessment->payment_plan,
                'status' => $existingAssessment->status,
            ] : null,
        ];
    }

    public function processOnsiteEnrollment(Applicant $applicant, array $validated): ?array
    {
        $discountIds = $validated['discount_ids'] ?? [];

        if (! empty($discountIds) && $this->discountTypeRepository->nonStackableCount($discountIds) > 1) {
            return ['discount_ids' => 'Only one non-stackable discount can be applied at a time.'];
        }

        $personalData = $applicant->personalData;
        if (! $personalData) {
            return ['error' => 'Applicant personal data not found.'];
        }

        $semester = $applicant->semester ?? 'First Semester';
        $studentRecord = $personalData->student;

        if ($studentRecord && $this->studentAssessmentRepository->existsForStudentPeriod($studentRecord->id, $applicant->school_year, $semester)) {
            return ['error' => 'A fee assessment already exists for this applicant.'];
        }

        DB::transaction(fn () => $this->runOnsiteEnrollment($applicant, $personalData, $validated, $semester, $discountIds));

        return null;
    }

    private function runOnsiteEnrollment(Applicant $applicant, $personalData, array $validated, string $semester, array $discountIds): void
    {
        $studentRecord = $this->saveOnsiteStudentRecord($applicant, $personalData, $semester);

        app(CopyApplicantDataService::class)->execute($studentRecord);
        $this->applicantRepository->update($applicant, ['student_id_number' => $validated['student_id_number']]);

        $units = $this->resolveUnits($applicant);
        $fees = collect($this->getApplicableFees($applicant->year_level ?? '', $applicant->school_year ?? ''));
        $feeAmount = fn ($f) => $f['is_per_unit'] ? $f['amount'] * $units : $f['amount'];
        $tuitionTotal = $fees->where('category', 'tuition')->sum($feeAmount);
        $miscTotal = $fees->where('category', 'miscellaneous')->sum($feeAmount);
        $grossAmount = $fees->sum($feeAmount);

        [$totalDiscount, $appliedDiscounts] = $this->applyDiscounts($discountIds, $tuitionTotal, $miscTotal, $grossAmount);

        $netAmount = max(0, $grossAmount - $totalDiscount);
        $priorBalance = $this->getStudentPriorBalance($studentRecord->id, $applicant->school_year, $semester);
        $netWithPrior = $netAmount + $priorBalance;

        $assessment = $this->studentAssessmentRepository->create([
            'student_id' => $studentRecord->id,
            'school_year' => $applicant->school_year,
            'semester' => $semester,
            'mode_of_payment' => $validated['mode_of_payment'] ?? null,
            'payment_plan' => $validated['payment_plan'],
            'gross_amount' => $grossAmount,
            'total_discounts' => $totalDiscount,
            'net_amount' => $netWithPrior,
            'prior_balance' => $priorBalance,
            'minimum_amount' => $validated['payment_plan'] === 'installment'
                ? round($netAmount * 0.3 + $priorBalance, 2)
                : $netWithPrior,
            'status' => 'finalized',
            'generated_at' => now(),
            'finalized_at' => now(),
            'finalized_by' => Auth::id(),
        ]);

        foreach ($appliedDiscounts as $applied) {
            $this->assessmentDiscountRepository->create([
                'assessment_id' => $assessment->id,
                'discount_type_id' => $applied['type']->id,
                'description' => $applied['type']->name,
                'base_amount' => $applied['base'],
                'discount_amount' => $applied['amount'],
                'verified_by' => Auth::id(),
                'verified_at' => now(),
            ]);
        }

        $previousStatus = $applicant->application_status;
        $this->applicantRepository->update($applicant, ['application_status' => 'Pending']);

        $this->enrollmentAuditLogRepository->create([
            'applicant_id' => $applicant->id,
            'action' => 'Onsite Enrollment Processed',
            'previous_status' => $previousStatus,
            'new_status' => 'Pending',
            'performed_by' => Auth::user()->name,
            'details' => json_encode([
                'assessment_id' => $assessment->id,
                'student_id_number' => $validated['student_id_number'],
                'payment_plan' => $validated['payment_plan'],
                'gross_amount' => $grossAmount,
                'total_discounts' => $totalDiscount,
                'net_amount' => $netAmount,
                'discounts' => collect($appliedDiscounts)
                    ->map(fn ($d) => ['name' => $d['type']->name, 'amount' => $d['amount']])
                    ->toArray(),
            ]),
            'ip_address' => request()->ip(),
        ]);
    }

    private function saveOnsiteStudentRecord(Applicant $applicant, $personalData, string $semester)
    {
        $studentRecord = $personalData->student;
        $data = [
            'enrollment_status' => 'Pending',
            'enrollment_date' => now(),
            'current_year_level' => $applicant->year_level,
            'current_semester' => $semester,
            'current_school_year' => $applicant->school_year,
        ];

        if (! $studentRecord) {
            return $this->studentRepository->createStudent($data + [
                'applicant_personal_data_id' => $personalData->id,
                'applicant_id' => $applicant->id,
            ]);
        }

        $this->studentRepository->updateStudent($studentRecord, $data);

        return $studentRecord;
    }

    private function applyDiscounts(array $discountIds, float $tuitionTotal, float $miscTotal, float $grossAmount): array
    {
        $totalDiscount = 0;
        $appliedDiscounts = [];

        if (! empty($discountIds)) {
            foreach ($this->discountTypeRepository->activeByIds($discountIds) as $dt) {
                $base = match ($dt->applies_to) {
                    'tuition_only' => $tuitionTotal,
                    'miscellaneous_only' => $miscTotal,
                    default => $grossAmount,
                };
                $amount = $dt->calculateDiscount($base);
                $totalDiscount += $amount;
                $appliedDiscounts[] = ['type' => $dt, 'base' => $base, 'amount' => $amount];
            }
        }

        return [$totalDiscount, $appliedDiscounts];
    }

    public function markEnrolled(Applicant $applicant, array $validated, string $ip): void
    {
        DB::transaction(function () use ($applicant, $validated, $ip) {
            $previousStatus = $applicant->application_status;

            $this->applicantRepository->update($applicant, [
                'application_status' => 'Enrolled',
                'student_id_number' => $validated['student_id_number'],
            ]);

            $this->enrollmentAuditLogRepository->create([
                'applicant_id' => $applicant->id,
                'action' => 'Status Changed to Enrolled',
                'new_status' => 'Enrolled',
                'previous_status' => $previousStatus,
                'details' => json_encode([
                    'student_id_number' => $validated['student_id_number'],
                    'enrolled_by' => Auth::user()->name,
                ]),
                'performed_by' => Auth::user()->name,
                'ip_address' => $ip,
            ]);
        });
    }

    public function revertToPending(Applicant $applicant, string $reason, string $ip): void
    {
        DB::transaction(function () use ($applicant, $reason, $ip) {
            $previousStatus = $applicant->application_status;

            $this->applicantRepository->update($applicant, [
                'application_status' => 'Pending',
                'student_id_number' => null,
            ]);

            $this->enrollmentAuditLogRepository->create([
                'applicant_id' => $applicant->id,
                'action' => 'Status Reverted to Pending',
                'new_status' => 'Pending',
                'previous_status' => $previousStatus,
                'details' => json_encode([
                    'reverted_by' => Auth::user()->name,
                    'reason' => $reason,
                ]),
                'performed_by' => Auth::user()->name,
                'ip_address' => $ip,
            ]);
        });
    }

    public function withdraw(Applicant $applicant, array $validated, string $ip): ?string
    {
        if ($applicant->application_status === 'Withdrawn') {
            return 'This applicant has already been withdrawn.';
        }

        $previousStatus = $applicant->application_status;
        $student = $applicant->student;
        $assessment = $student ? $this->studentRepository->latestAssessmentFor($student->id) : null;

        DB::transaction(function () use ($applicant, $validated, $ip, $previousStatus, $student, $assessment) {
            $this->applicantRepository->update($applicant, ['application_status' => 'Withdrawn']);

            if ($student) {
                $this->studentRepository->updateStudent($student, ['enrollment_status' => 'Withdrawn']);
            }

            $this->studentRepository->createWithdrawal([
                'applicant_id' => $applicant->id,
                'student_id' => $student?->id,
                'assessment_id' => $assessment?->id,
                'withdrawal_type' => $validated['withdrawal_type'],
                'refund_amount' => $validated['refund_amount'],
                'reason' => $validated['reason'] ?? null,
                'processed_by' => Auth::id(),
            ]);

            if ($assessment) {
                $this->studentRepository->updateAssessment($assessment, ['status' => 'cancelled']);
            }

            $this->enrollmentAuditLogRepository->create([
                'applicant_id' => $applicant->id,
                'action' => 'Application Withdrawn',
                'new_status' => 'Withdrawn',
                'previous_status' => $previousStatus,
                'details' => json_encode([
                    'withdrawn_by' => Auth::user()->name,
                    'withdrawal_type' => $validated['withdrawal_type'],
                    'refund_amount' => $validated['refund_amount'],
                    'reason' => $validated['reason'] ?? null,
                ]),
                'performed_by' => Auth::user()->name,
                'ip_address' => $ip,
            ]);
        });

        return null;
    }

    public function auditLogData(Applicant $applicant): array
    {
        $applicant->load('personalData');

        return [
            'applicant' => $applicant,
            'auditLogs' => $this->enrollmentAuditLogRepository->getAllFor($applicant),
        ];
    }

    public function reportData(array $filters): array
    {
        $applicants = $this->applicantRepository->forReport($filters);

        $statistics = [
            'total_students' => $applicants->count(),
            'pending_count' => $applicants->where('application_status', 'Pending')->count(),
            'enrolled_count' => $applicants->where('application_status', 'Enrolled')->count(),
            'by_category' => $applicants->groupBy('student_category')->map(fn ($group, $category) => [
                'category' => $category ?: 'Unknown',
                'count' => $group->count(),
            ])->values(),
            'by_year_level' => $applicants->groupBy('year_level')->map(fn ($group, $yearLevel) => [
                'year_level' => $yearLevel ?: 'Not Assigned',
                'count' => $group->count(),
            ])->values(),
        ];

        return [
            'statistics' => $statistics,
            'filters' => [
                'status' => $filters['status'] ?? null,
                'category' => $filters['category'] ?? null,
                'school_year' => $filters['school_year'] ?? null,
            ],
            'schoolYears' => $this->applicantRepository->distinctSchoolYears(),
            'semesters' => ['1st Semester', '2nd Semester', 'Summer'],
        ];
    }

    private function getStudentPriorBalance(int $studentId, string $schoolYear, string $semester): float
    {
        $previous = $this->studentAssessmentRepository->latestExcludingPeriod($studentId, $schoolYear, $semester);

        return $previous ? $previous->remaining_balance : 0.0;
    }

    private function getEligibleDiscounts(Applicant $applicant): array
    {
        $eligible = [];
        $autoIds = [];
        $family = $applicant->personalData?->familyBackground;

        $employeeIds = array_values(array_filter([
            $family?->father_employee_id,
            $family?->mother_employee_id,
            $family?->guardian_employee_id,
        ]));

        if (! empty($employeeIds) && $this->employeeRepository->hasActiveAmong($employeeIds)) {
            if ($dt = $this->discountTypeRepository->findActiveByCode('EMPLOYEE-DEP')) {
                $autoIds[] = $dt->id;
                $eligible[] = array_merge($dt->toArray(), ['auto_applied' => true]);
            }
        }

        $siblings = $applicant->personalData?->siblings ?? collect();
        $hasSibling = false;
        foreach ($siblings as $sibling) {
            if (! empty($sibling->sibling_id_number) && $this->studentRepository->existsActiveByIdNumber($sibling->sibling_id_number)) {
                $hasSibling = true;
                break;
            }
        }

        if ($hasSibling && ($dt = $this->discountTypeRepository->findActiveByCode('SIBLING'))) {
            $autoIds[] = $dt->id;
            $eligible[] = array_merge($dt->toArray(), ['auto_applied' => true]);
        }

        $manual = $this->discountTypeRepository->activeExcluding($autoIds)
            ->map(fn ($d) => array_merge($d->toArray(), ['auto_applied' => false]))
            ->toArray();

        return array_merge($eligible, $manual);
    }

    private function getApplicableFees(string $gradeLevel, string $schoolYear): array
    {
        $schoolLevel = $this->getStudentCategory($gradeLevel);

        return $this->feeRepository->applicableActive($schoolLevel, $schoolYear)
            ->map(fn ($fee) => [
                'id' => $fee->id,
                'name' => $fee->name,
                'code' => $fee->code,
                'category' => $fee->category,
                'is_per_unit' => $fee->is_per_unit,
                'amount' => (float) $fee->amount,
            ])
            ->toArray();
    }

    private function getStudentCategory(string $gradeLevel): string
    {
        if (in_array($gradeLevel, ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6'])) {
            return 'LES';
        }

        if (in_array($gradeLevel, ['Grade 7', 'Grade 8', 'Grade 9', 'Grade 10'])) {
            return 'JHS';
        }

        if (in_array($gradeLevel, ['Grade 11', 'Grade 12'])) {
            return 'SHS';
        }

        return 'all';
    }

    private function resolveUnits(Applicant $applicant): int
    {
        $strand = $applicant->strand ?? null;

        if ($strand) {
            $code = self::STRAND_CODE_MAP[$strand] ?? $strand;
            if ($program = $this->programRepository->findActiveByCode($code)) {
                return (int) $program->max_load;
            }
        }

        $program = $this->programRepository->findActiveByCode($applicant->student_category ?? '');

        return (int) ($program->max_load ?? 0);
    }
}
