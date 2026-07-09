<?php

namespace App\Services\Admin;

use App\Models\EnrollmentPeriod;
use App\Repositories\ApplicantRepository;
use App\Repositories\EnrollmentPeriodRepository;
use App\Repositories\FeeRepository;
use App\Repositories\ProgramRepository;
use App\Repositories\StudentAssessmentRepository;
use App\Repositories\StudentRepository;
use App\Services\Student\AutoPromoteStudentsService;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class EnrollmentPeriodService
{
    public function __construct(
        private EnrollmentPeriodRepository $enrollmentPeriodRepository,
        private FeeRepository $feeRepository,
        private ProgramRepository $programRepository,
        private AutoPromoteStudentsService $autoPromoteStudentsService,
        private StudentRepository $studentRepository,
        private StudentAssessmentRepository $studentAssessmentRepository,
        private ApplicantRepository $applicantRepository,
    ) {
    }

    /**
     * Returns all enrollment periods ordered by recency, along with the available semester options for the create form.
     */
    public function indexData(): array
    {
        $periods = $this->enrollmentPeriodRepository->allOrdered()->map(fn ($p) => [
            'id' => $p->id,
            'school_year' => $p->school_year,
            'semester' => $p->semester,
            'type' => $p->type,
            'is_open' => $p->is_open,
            'status' => $p->status,
            'start_date' => $p->start_date?->toDateString(),
            'close_date' => $p->close_date?->toDateString(),
            'opened_at' => $p->opened_at?->toDateTimeString(),
            'closed_at' => $p->closed_at?->toDateTimeString(),
            'notes' => $p->notes,
        ]);

        return [
            'periods' => $periods,
            'semesters' => ['First Semester', 'Second Semester', 'Summer', 'Full Year'],
        ];
    }

    /**
     * Creates and immediately opens a new enrollment period.
     * Blocks creation if an active period of the same type already exists for the given school year/semester,
     * or if another period of the same type is currently open.
     */
    public function store(array $data): array
    {
        if ($this->enrollmentPeriodRepository->activePeriodExists($data['school_year'], $data['semester'], $data['type'])) {
            return ['error' => 'An active enrollment period of this type for this school year and semester already exists.'];
        }

        if ($this->enrollmentPeriodRepository->activeOpenPeriodExistsForType($data['type'])) {
            $typeLabel = $data['type'] === 'student' ? 'student' : 'applicant';

            return ['error' => "Another {$typeLabel} enrollment period is currently open. Close it before starting a new one."];
        }

        $period = $this->enrollmentPeriodRepository->create([
            'school_year' => $data['school_year'],
            'semester' => $data['semester'],
            'type' => $data['type'],
            'is_open' => true,
            'start_date' => $data['start_date'] ?? today(),
            'close_date' => $data['close_date'],
            'opened_at' => now(),
            'notes' => $data['notes'] ?? null,
        ]);

        return ['message' => $this->afterOpenMessage($period, 'Enrollment period started.')];
    }

    /**
     * Re-opens a previously closed enrollment period.
     * For student periods, restores not-enrolled students with existing assessments.
     * For applicant periods, moves exam-passed applicants back to enrollment processing.
     * Blocks if another period of the same type is already open.
     */
    public function open(EnrollmentPeriod $period, array $data): array
    {
        if ($this->enrollmentPeriodRepository->activeOpenPeriodExistsForType($period->type, $period->id)) {
            $typeLabel = $period->type === 'student' ? 'student' : 'applicant';

            return ['error' => "Another {$typeLabel} enrollment period is currently open. Close it before opening this one."];
        }

        $this->enrollmentPeriodRepository->update($period, [
            'is_open' => true,
            'start_date' => $data['start_date'] ?? today(),
            'close_date' => $data['close_date'],
            'opened_at' => $period->opened_at ?? now(),
            'closed_at' => null,
            'notes' => $data['notes'] ?? $period->notes,
        ]);

        if ($period->type === 'student') {
            $studentIds = $this->studentAssessmentRepository->studentIdsForPeriod($period->school_year, $period->semester);
            $this->studentRepository->restoreNotEnrolledForIds($studentIds);
        }

        $message = 'Enrollment is now open.';

        if ($period->type === 'applicant') {
            $promoted = $this->applicantRepository->countByStatus('Exam Passed');
            $this->applicantRepository->bulkUpdateStatus('Exam Passed', 'Pending');

            if ($promoted > 0) {
                $message .= " {$promoted} exam-passed applicant(s) moved to enrollment processing.";
            }
        }

        return ['message' => $message];
    }

    /**
     * Updates the close date and notes for an enrollment period.
     */
    public function update(EnrollmentPeriod $period, array $data): void
    {
        $this->enrollmentPeriodRepository->update($period, [
            'close_date' => $data['close_date'],
            'notes' => $data['notes'],
        ]);
    }

    /**
     * Closes an enrollment period by marking it as not open and recording the close timestamp.
     */
    public function close(EnrollmentPeriod $period): void
    {
        $this->enrollmentPeriodRepository->update($period, ['is_open' => false, 'closed_at' => now()]);
    }

    /**
     * Deletes an enrollment period. Blocks deletion if the period is still open or upcoming.
     */
    public function destroy(EnrollmentPeriod $period): array
    {
        if (in_array($period->status, ['open', 'upcoming'])) {
            return ['error' => 'Cannot delete an open enrollment period. Close it first.'];
        }

        $this->enrollmentPeriodRepository->delete($period);

        return [];
    }

    /**
     * Generates fee assessments for all active/pending students in a student enrollment period.
     * Skips students who already have an assessment, have no grade level, or have no applicable fees.
     * Returns a summary message with counts for each outcome.
     */
    public function generateAssessments(EnrollmentPeriod $period): array
    {
        if ($period->type !== 'student') {
            return ['error' => 'Assessments can only be generated for student enrollment periods.'];
        }

        $schoolYear = $period->school_year;
        $semester = $period->semester;
        $students = $this->studentRepository->activeOrPendingWithApplication();

        $counts = ['created' => 0, 'skipExisting' => 0, 'skipNoGrade' => 0, 'skipNoFees' => 0];

        DB::transaction(function () use ($students, $schoolYear, $semester, &$counts) {
            foreach ($students as $student) {
                $this->generateAssessmentForStudent($student, $schoolYear, $semester, $counts);
            }
        });

        $messages = ["{$counts['created']} assessment(s) generated."];
        if ($counts['skipExisting']) {
            $messages[] = "{$counts['skipExisting']} already had an assessment (skipped).";
        }
        if ($counts['skipNoGrade']) {
            $messages[] = "{$counts['skipNoGrade']} had no grade level assigned (skipped).";
        }
        if ($counts['skipNoFees']) {
            $messages[] = "{$counts['skipNoFees']} had no applicable fees for {$schoolYear} (skipped — set up fees first).";
        }

        return ['message' => implode(' ', $messages)];
    }

    /**
     * Runs side effects after a new enrollment period is opened and returns a human-readable summary message.
     * For student periods: marks current students as pending and auto-promotes eligible ones to the next grade.
     * For applicant periods: moves exam-passed applicants to enrollment processing.
     */
    private function afterOpenMessage(EnrollmentPeriod $period, string $baseMessage): string
    {
        if ($period->type === 'student') {
            $this->studentRepository->markPendingStudentsNotEnrolled();
            $this->studentRepository->markActiveStudentsPending();

            $result = $this->autoPromoteStudentsService->promote($period);

            if ($result['promoted'] > 0 || $result['skipped'] > 0) {
                $baseMessage .= " {$result['promoted']} student(s) auto-promoted.";
                if ($result['skipped'] > 0) {
                    $baseMessage .= " {$result['skipped']} require manual section assignment.";
                }
            }
        }

        if ($period->type === 'applicant') {
            $promoted = $this->applicantRepository->countByStatus('Exam Passed');
            $this->applicantRepository->bulkUpdateStatus('Exam Passed', 'Pending Enrollment');

            if ($promoted > 0) {
                $baseMessage .= " {$promoted} exam-passed applicant(s) moved to enrollment processing.";
            }
        }

        return $baseMessage;
    }

    /**
     * Generates a single fee assessment for a student, setting the minimum amount to 30% of gross plus any prior balance.
     * Increments the appropriate skip counter if the student is ineligible.
     */
    private function generateAssessmentForStudent($student, string $schoolYear, string $semester, array &$counts): void
    {
        if ($this->studentAssessmentRepository->existsForStudentPeriod($student->id, $schoolYear, $semester)) {
            $counts['skipExisting']++;

            return;
        }

        $gradeLevel = $student->current_year_level ?? '';
        if (! $gradeLevel) {
            $counts['skipNoGrade']++;

            return;
        }

        $fees = $this->applicableFees($gradeLevel, $schoolYear);
        if ($fees->isEmpty()) {
            $counts['skipNoFees']++;

            return;
        }

        $units = $this->resolveUnits($student, $gradeLevel);
        $amounts = $this->feeAmounts($fees, $units);
        $prior = $this->studentAssessmentRepository->priorBalance($student->id, $schoolYear, $semester);
        $gross = $amounts['tuition'] + $amounts['misc'] + $amounts['lab'] + $amounts['other'];

        $this->studentAssessmentRepository->create([
            'student_id' => $student->id,
            'assessment_number' => $this->studentAssessmentRepository->generateAssessmentNumber($schoolYear),
            'school_year' => $schoolYear,
            'semester' => $semester,
            'total_tuition' => $amounts['tuition'],
            'total_misc_fees' => $amounts['misc'],
            'total_lab_fees' => $amounts['lab'],
            'total_other_fees' => $amounts['other'],
            'gross_amount' => $gross,
            'total_discounts' => 0,
            'prior_balance' => $prior,
            'net_amount' => $gross + $prior,
            'payment_plan' => 'installment',
            'minimum_amount' => round($gross * 0.30 + $prior, 2),
            'status' => 'finalized',
            'generated_at' => now(),
            'finalized_at' => now(),
            'finalized_by' => Auth::id(),
        ]);

        $counts['created']++;
    }

    /**
     * Resolves the number of units for fee calculation by looking up the student's strand program code first,
     * then falling back to the school-level category (LES/JHS/SHS).
     */
    private function resolveUnits($student, string $gradeLevel): int
    {
        $strand = $student->application?->strand ?? '';

        if ($strand && preg_match('/\(([A-Z]+)\)/', $strand, $m)) {
            $units = $this->programRepository->activeMaxLoadForCode($m[1]);
            if ($units) {
                return $units;
            }
        }

        return $this->programRepository->activeMaxLoadForCode($this->getStudentCategory($gradeLevel));
    }

    /**
     * Calculates total amounts per fee category, multiplying per-unit fees by the student's unit count.
     */
    private function feeAmounts($fees, int $units): array
    {
        $feesCol = $fees->map(fn ($fee) => [
            'category' => $fee->category,
            'amount' => $fee->is_per_unit ? $fee->amount * $units : $fee->amount,
        ]);

        return [
            'tuition' => (float) $feesCol->where('category', 'tuition')->sum('amount'),
            'misc' => (float) $feesCol->where('category', 'miscellaneous')->sum('amount'),
            'lab' => (float) $feesCol->where('category', 'laboratory')->sum('amount'),
            'other' => (float) $feesCol->where('category', 'special')->sum('amount'),
        ];
    }

    /**
     * Returns all active fees for the given school year that apply to the student's school level category.
     */
    private function applicableFees(string $gradeLevel, string $schoolYear)
    {
        return $this->feeRepository->applicableActive($this->getStudentCategory($gradeLevel), $schoolYear);
    }

    /**
     * Maps a grade level string to its school level category code: 'LES' (Grades 1–6), 'JHS' (Grades 7–10), 'SHS' (Grades 11–12), or 'all'.
     */
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
}
