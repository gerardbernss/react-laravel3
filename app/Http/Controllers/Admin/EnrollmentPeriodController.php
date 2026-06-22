<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Applicant;
use App\Models\EnrollmentPeriod;
use App\Models\Fee;
use App\Models\Program;
use App\Models\Student;
use App\Models\StudentAssessment;
use App\Services\Student\AutoPromoteStudentsService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class EnrollmentPeriodController extends Controller
{
    /**
     * List all enrollment periods.
     */
    public function index()
    {
        $periods = EnrollmentPeriod::orderByDesc('school_year')
            ->orderBy('semester')
            ->get()
            ->map(fn ($p) => [
                'id'          => $p->id,
                'school_year' => $p->school_year,
                'semester'    => $p->semester,
                'type'        => $p->type,
                'is_open'     => $p->is_open,
                'status'      => $p->status,
                'start_date'  => $p->start_date?->toDateString(),
                'close_date'  => $p->close_date?->toDateString(),
                'opened_at'   => $p->opened_at?->toDateTimeString(),
                'closed_at'   => $p->closed_at?->toDateTimeString(),
                'notes'       => $p->notes,
            ]);

        return Inertia::render('Admin/EnrollmentPeriods/Index', [
            'periods'   => $periods,
            'semesters' => ['First Semester', 'Second Semester', 'Summer', 'Full Year'],
        ]);
    }

    /**
     * Create a new enrollment period and immediately open it.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'school_year' => 'required|string|max:20',
            'semester'    => 'required|in:First Semester,Second Semester,Summer,Full Year',
            'type'        => 'required|in:student,applicant,application',
            'start_date'  => 'nullable|date',
            'close_date'  => 'required|date',
            'notes'       => 'nullable|string|max:500',
        ]);

        // Prevent duplicate only if an active (open and within date range) period exists
        $exists = EnrollmentPeriod::where('school_year', $validated['school_year'])
            ->where('semester', $validated['semester'])
            ->where('type', $validated['type'])
            ->where('is_open', true)
            ->where(function ($q) { $q->whereNull('close_date')->orWhereDate('close_date', '>=', today()); })
            ->exists();

        if ($exists) {
            return back()->withErrors(['error' => 'An active enrollment period of this type for this school year and semester already exists.']);
        }

        // Block if another period of the same type is already open
        $typeLabel   = $validated['type'] === 'student' ? 'student' : 'applicant';
        $alreadyOpen = EnrollmentPeriod::where('type', $validated['type'])
            ->where('is_open', true)
            ->where(function ($q) { $q->whereNull('close_date')->orWhereDate('close_date', '>=', today()); })
            ->exists();

        if ($alreadyOpen) {
            return back()->withErrors(['error' => "Another {$typeLabel} enrollment period is currently open. Close it before starting a new one."]);
        }

        $period = EnrollmentPeriod::create([
            'school_year' => $validated['school_year'],
            'semester'    => $validated['semester'],
            'type'        => $validated['type'],
            'is_open'     => true,
            'start_date'  => $validated['start_date'] ?? today(),
            'close_date'  => $validated['close_date'],
            'opened_at'   => now(),
            'notes'       => $validated['notes'] ?? null,
        ]);

        $successMessage = 'Enrollment period started.';

        if ($validated['type'] === 'student') {
            // Students who never paid before the previous period closed → "Not Enrolled"
            Student::where('enrollment_status', 'Pending')
                ->update(['enrollment_status' => 'Not Enrolled']);

            // Active students → Pending (ready to re-enroll for new semester)
            Student::where('enrollment_status', 'Active')
                ->update(['enrollment_status' => 'Pending']);

            $result = app(AutoPromoteStudentsService::class)->promote($period);

            if ($result['promoted'] > 0 || $result['skipped'] > 0) {
                $successMessage .= " {$result['promoted']} student(s) auto-promoted.";
                if ($result['skipped'] > 0) {
                    $successMessage .= " {$result['skipped']} require manual section assignment.";
                }
            }
        }

        if ($validated['type'] === 'applicant') {
            $promoted = Applicant::where('application_status', 'Exam Passed')->count();
            Applicant::where('application_status', 'Exam Passed')
                ->update(['application_status' => 'Pending Enrollment']);

            if ($promoted > 0) {
                $successMessage .= " {$promoted} exam-passed applicant(s) moved to enrollment processing.";
            }
        }

        return back()->with('success', $successMessage);
    }

    /**
     * Open an enrollment period with a required close date.
     */
    public function open(Request $request, EnrollmentPeriod $period)
    {
        $validated = $request->validate([
            'start_date' => 'nullable|date',
            'close_date' => 'required|date',
            'notes'      => 'nullable|string|max:500',
        ]);

        // Block if a *different* period of the same type is already open
        $typeLabel   = $period->type === 'student' ? 'student' : 'applicant';
        $alreadyOpen = EnrollmentPeriod::where('type', $period->type)
            ->where('id', '!=', $period->id)
            ->where('is_open', true)
            ->where(function ($q) { $q->whereNull('close_date')->orWhereDate('close_date', '>=', today()); })
            ->exists();

        if ($alreadyOpen) {
            return back()->withErrors(['error' => "Another {$typeLabel} enrollment period is currently open. Close it before opening this one."]);
        }

        $period->update([
            'is_open'    => true,
            'start_date' => $validated['start_date'] ?? today(),
            'close_date' => $validated['close_date'],
            'opened_at'  => $period->opened_at ?? now(),  // keep original if re-opening
            'closed_at'  => null,
            'notes'      => $validated['notes'] ?? $period->notes,
        ]);

        if ($period->type === 'student') {
            // Restore "Not Enrolled" students who have an assessment for this period
            $affectedStudentIds = StudentAssessment::where('school_year', $period->school_year)
                ->where('semester', $period->semester)
                ->pluck('student_id');

            Student::whereIn('id', $affectedStudentIds)
                ->where('enrollment_status', 'Not Enrolled')
                ->update(['enrollment_status' => 'Pending']);
        }

        $successMessage = 'Enrollment is now open.';

        if ($period->type === 'applicant') {
            $promoted = Applicant::where('application_status', 'Exam Passed')->count();
            Applicant::where('application_status', 'Exam Passed')
                ->update(['application_status' => 'Pending']);

            if ($promoted > 0) {
                $successMessage .= " {$promoted} exam-passed applicant(s) moved to enrollment processing.";
            }
        }

        return back()->with('success', $successMessage);
    }

    /**
     * Edit close date and/or notes (used for extensions).
     */
    public function update(Request $request, EnrollmentPeriod $period)
    {
        $validated = $request->validate([
            'close_date' => 'required|date',
            'notes'      => 'nullable|string|max:500',
        ]);

        $period->update([
            'close_date' => $validated['close_date'],
            'notes'      => $validated['notes'],
        ]);

        return back()->with('success', 'Enrollment period updated.');
    }

    /**
     * Manually close an enrollment period early.
     */
    public function close(EnrollmentPeriod $period)
    {
        $period->update([
            'is_open'   => false,
            'closed_at' => now(),
        ]);

        return back()->with('success', 'Enrollment has been closed.');
    }

    /**
     * Delete a closed enrollment period.
     */
    public function destroy(EnrollmentPeriod $period)
    {
        if (in_array($period->status, ['open', 'upcoming'])) {
            return back()->withErrors(['error' => 'Cannot delete an open enrollment period. Close it first.']);
        }

        $period->delete();

        return back()->with('success', 'Enrollment period deleted.');
    }

    /**
     * Bulk-generate StudentAssessment records for all active students
     * who do not yet have one for this enrollment period.
     * Idempotent — safe to run multiple times.
     */
    public function generateAssessments(EnrollmentPeriod $period)
    {
        if ($period->type !== 'student') {
            return back()->withErrors(['error' => 'Assessments can only be generated for student enrollment periods.']);
        }

        $schoolYear = $period->school_year;
        $semester   = $period->semester;

        $students = Student::with('application')
            ->whereIn('enrollment_status', ['Active', 'Pending'])
            ->get();

        $created       = 0;
        $skipExisting  = 0;
        $skipNoGrade   = 0;
        $skipNoFees    = 0;

        DB::transaction(function () use ($students, $schoolYear, $semester, &$created, &$skipExisting, &$skipNoGrade, &$skipNoFees) {
            foreach ($students as $student) {
                if (StudentAssessment::where('student_id', $student->id)
                    ->where('school_year', $schoolYear)
                    ->where('semester', $semester)
                    ->exists()) {
                    $skipExisting++;
                    continue;
                }

                $gradeLevel = $student->current_year_level ?? '';
                if (!$gradeLevel) {
                    $skipNoGrade++;
                    continue;
                }

                $fees = $this->getApplicableFees($gradeLevel, $schoolYear);

                if (empty($fees)) {
                    $skipNoFees++;
                    continue;
                }

                // Resolve credit units for per-unit fees
                $strand  = $student->application?->strand ?? '';
                $units   = 0;
                if ($strand && preg_match('/\(([A-Z]+)\)/', $strand, $m)) {
                    $units = Program::where('is_active', true)->where('code', $m[1])->value('max_load') ?? 0;
                }
                if (!$units) {
                    $cat   = $this->getStudentCategory($gradeLevel);
                    $units = Program::where('is_active', true)->where('code', $cat)->value('max_load') ?? 0;
                }

                $feesCol  = collect($fees);
                $amt      = fn($f) => $f['is_per_unit'] ? $f['amount'] * $units : $f['amount'];
                $tuition  = $feesCol->where('category', 'tuition')->sum($amt);
                $misc     = $feesCol->where('category', 'miscellaneous')->sum($amt);
                $lab      = $feesCol->where('category', 'laboratory')->sum($amt);
                $other    = $feesCol->where('category', 'special')->sum($amt);
                $gross    = $tuition + $misc + $lab + $other;

                $prior        = $this->getStudentPriorBalance($student->id, $schoolYear, $semester);
                $netWithPrior = $gross + $prior;
                $minimum      = round($gross * 0.30 + $prior, 2);

                StudentAssessment::create([
                    'student_id'       => $student->id,
                    'assessment_number'=> StudentAssessment::generateAssessmentNumber($schoolYear),
                    'school_year'      => $schoolYear,
                    'semester'         => $semester,
                    'total_tuition'    => $tuition,
                    'total_misc_fees'  => $misc,
                    'total_lab_fees'   => $lab,
                    'total_other_fees' => $other,
                    'gross_amount'     => $gross,
                    'total_discounts'  => 0,
                    'prior_balance'    => $prior,
                    'net_amount'       => $netWithPrior,
                    'payment_plan'     => 'installment',
                    'minimum_amount'   => $minimum,
                    'status'           => 'finalized',
                    'generated_at'     => now(),
                    'finalized_at'     => now(),
                    'finalized_by'     => Auth::id(),
                ]);

                $created++;
            }
        });

        $messages = ["{$created} assessment(s) generated."];
        if ($skipExisting)  $messages[] = "{$skipExisting} already had an assessment (skipped).";
        if ($skipNoGrade)   $messages[] = "{$skipNoGrade} had no grade level assigned (skipped).";
        if ($skipNoFees)    $messages[] = "{$skipNoFees} had no applicable fees for {$schoolYear} (skipped — set up fees first).";

        return back()->with('success', implode(' ', $messages));
    }

    private function getApplicableFees(string $gradeLevel, string $schoolYear): array
    {
        $schoolLevel = $this->getStudentCategory($gradeLevel);

        return Fee::where('is_active', true)
            ->where('school_year', $schoolYear)
            ->where(function ($q) use ($schoolLevel) {
                $q->where('school_level', 'all')->orWhere('school_level', $schoolLevel);
            })
            ->orderByRaw("CASE WHEN school_level = ? THEN 0 ELSE 1 END", [$schoolLevel])
            ->get()
            ->map(fn($fee) => [
                'id'          => $fee->id,
                'category'    => $fee->category,
                'is_per_unit' => $fee->is_per_unit,
                'amount'      => (float) $fee->amount,
            ])
            ->toArray();
    }

    private function getStudentCategory(string $gradeLevel): string
    {
        if (in_array($gradeLevel, ['Grade 1','Grade 2','Grade 3','Grade 4','Grade 5','Grade 6'])) {
            return 'LES';
        }
        if (in_array($gradeLevel, ['Grade 7','Grade 8','Grade 9','Grade 10'])) {
            return 'JHS';
        }
        if (in_array($gradeLevel, ['Grade 11','Grade 12'])) {
            return 'SHS';
        }
        return 'all';
    }

    private function getStudentPriorBalance(int $studentId, string $schoolYear, string $semester): float
    {
        $previous = StudentAssessment::where('student_id', $studentId)
            ->where(function ($q) use ($schoolYear, $semester) {
                $q->where('school_year', '!=', $schoolYear)
                  ->orWhere('semester', '!=', $semester);
            })
            ->whereIn('status', ['finalized', 'partial'])
            ->latest()
            ->first();

        return $previous ? $previous->remaining_balance : 0.0;
    }
}
