<?php

namespace App\Http\Controllers\Admissions;

use App\Http\Controllers\Controller;
use App\Models\Applicant;
use App\Models\AssessmentDiscount;
use App\Models\DiscountType;
use App\Models\Employee;
use App\Models\EnrollmentAuditLog;
use App\Models\EnrollmentPeriod;
use App\Models\Fee;
use App\Models\Program;
use App\Models\Student;
use App\Models\StudentAssessment;
use App\Services\Student\CopyApplicantDataService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

/**
 * Manages the enrollment workflow for applicants who have passed the exam.
 *
 * Distinct from ApplicantController::enroll() — this controller owns the dedicated
 * enrollment dashboard (listing Exam Passed / Pending / Enrolled applicants) and
 * the onsite enrollment wizard that admin staff use to process walk-in payments.
 *
 * Key methods:
 *   dashboard()              — paginated applicant list with status/category filters
 *   show()                   — full applicant detail + applicable fees + existing assessment
 *   processOnsiteEnrollment() — creates Student + StudentAssessment in one transaction,
 *                               assigns student_id_number, and writes the audit log
 *   enroll()                 — quick status-flip to 'Enrolled' (used when no fee wizard is needed)
 *   revertToPending()        — undo an accidental enrollment
 *   auditLog()               — view the full EnrollmentAuditLog trail for an applicant
 *
 * Fee calculation uses getApplicableFees() which queries the Fee table filtered by
 * the applicant's grade level and school year. resolveProgram() maps the SHS strand
 * code (e.g. "(STEM)") to a Program record to determine max_load (credit units).
 */
class EnrollmentController extends Controller
{
    /**
     * Display enrollment dashboard
     * Shows applicants with status 'Pending' and 'Enrolled'
     */
    public function dashboard(Request $request)
    {
        /** @var EnrollmentPeriod|null $currentPeriod */
        $currentPeriod = EnrollmentPeriod::current();

        $query = Applicant::with(['personalData', 'documents', 'portalCredential'])
            ->whereIn('application_status', ['Exam Passed', 'Pending', 'Enrolled'])
            ->when($currentPeriod, fn($q) => $q
                ->where('school_year', $currentPeriod->school_year)
                ->where('semester', $currentPeriod->semester)
            )
            ->orderBy('created_at', 'desc');

        if ($request->filled('status')) {
            $query->where('application_status', $request->status);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->whereHas('personalData', function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($request->filled('category')) {
            $query->where('student_category', $request->category);
        }

        $applicants = $query->paginate(15);

        /** @var string|null $sy */
        $sy  = $currentPeriod ? (string) $currentPeriod->getAttribute('school_year') : null;
        /** @var string|null $sem */
        $sem = $currentPeriod ? (string) $currentPeriod->getAttribute('semester') : null;

        $statistics = [
            'pending'  => Applicant::query()->where('application_status', 'Pending')
                ->when($sy,  fn ($q) => $q->where('school_year', $sy))
                ->when($sem, fn ($q) => $q->where('semester', $sem))
                ->count(),
            'enrolled' => Applicant::query()->where('application_status', 'Enrolled')
                ->when($sy,  fn ($q) => $q->where('school_year', $sy))
                ->when($sem, fn ($q) => $q->where('semester', $sem))
                ->count(),
            'total'    => Applicant::query()->whereIn('application_status', ['Pending', 'Enrolled'], 'and', false)
                ->when($sy,  fn ($q) => $q->where('school_year', $sy))
                ->when($sem, fn ($q) => $q->where('semester', $sem))
                ->count(),
        ];

        return Inertia::render('Admissions/Enrollment/Dashboard', [
            'applicants'     => $applicants,
            'statistics'     => $statistics,
            'currentPeriod'  => $currentPeriod ? [
                'school_year' => $currentPeriod->getAttribute('school_year'),
                'semester'    => $currentPeriod->getAttribute('semester'),
                'is_open'     => $currentPeriod->getAttribute('is_open'),
            ] : null,
            'filters'        => [
                'status'   => $request->status,
                'search'   => $request->search,
                'category' => $request->category,
            ],
        ]);
    }

    /**
     * Show applicant enrollment details
     */
    public function show(Applicant $applicant)
    {
        $applicant->load([
            'personalData.familyBackground',
            'personalData.siblings',
            'educationalBackground',
            'documents',
            'portalCredential',
            'auditLogs' => function ($q) {
                $q->orderBy('created_at', 'desc')->limit(20);
            },
        ]);

        $fees    = $this->getApplicableFees($applicant->year_level ?? '', $applicant->school_year ?? '');
        $program = $this->resolveProgram($applicant);
        $units   = $program?->max_load ?? 0;

        $studentRecord      = $applicant->personalData?->student;
        $existingAssessment = $studentRecord
            ? StudentAssessment::where('student_id', $studentRecord->id)
                ->where('school_year', $applicant->school_year)
                ->where('semester', $applicant->semester ?? 'First Semester')
                ->first()
            : null;

        return Inertia::render('Admissions/Enrollment/Show', [
            'applicant'          => $applicant,
            'fees'               => $fees,
            'units'              => $units,
            'discountTypes'      => $this->getEligibleDiscounts($applicant),
            'existingAssessment' => $existingAssessment ? [
                'assessment_number' => $existingAssessment->assessment_number,
                'net_amount'        => $existingAssessment->net_amount,
                'payment_plan'      => $existingAssessment->payment_plan,
                'status'            => $existingAssessment->status,
            ] : null,
        ]);
    }

    /**
     * Process onsite enrollment on behalf of an applicant.
     */
    public function processOnsiteEnrollment(Request $request, Applicant $applicant)
    {
        $validated = $request->validate([
            'student_id_number' => ['required', 'string', Rule::unique('applicants', 'student_id_number')->ignore($applicant->id)],
            'payment_plan'      => ['required', 'in:full,installment'],
            'mode_of_payment'   => ['nullable', 'in:cash,check,bank_transfer,gcash,maya'],
            'discount_ids'      => ['nullable', 'array'],
            'discount_ids.*'    => ['integer', 'exists:discount_types,id'],
        ]);

        $discountIds = $validated['discount_ids'] ?? [];

        // Enforce stackability: at most one non-stackable discount
        if (!empty($discountIds)) {
            $nonStackableCount = DiscountType::whereIn('id', $discountIds)
                ->where('is_stackable', false)
                ->count();
            if ($nonStackableCount > 1) {
                return back()->withErrors(['discount_ids' => 'Only one non-stackable discount can be applied at a time.']);
            }
        }

        $personalData = $applicant->personalData;
        if (!$personalData) {
            return back()->withErrors(['error' => 'Applicant personal data not found.']);
        }

        $semester = $applicant->semester ?? 'First Semester';

        $studentRecord = $personalData->student;
        $alreadyExists = $studentRecord && StudentAssessment::where('student_id', $studentRecord->id)
            ->where('school_year', $applicant->school_year)
            ->where('semester', $semester)
            ->exists();

        if ($alreadyExists) {
            return back()->withErrors(['error' => 'A fee assessment already exists for this applicant.']);
        }

        DB::transaction(function () use ($applicant, $personalData, $validated, $semester, $discountIds) {
            $studentRecord = $personalData->student;

            if (!$studentRecord) {
                $studentRecord = Student::create([
                    'applicant_personal_data_id' => $personalData->id,
                    'applicant_id'               => $applicant->id,
                    'enrollment_status'          => 'Pending',
                    'enrollment_date'            => now(),
                    'current_year_level'         => $applicant->year_level,
                    'current_semester'           => $semester,
                    'current_school_year'        => $applicant->school_year,
                ]);
            } else {
                $studentRecord->update([
                    'enrollment_status'   => 'Pending',
                    'enrollment_date'     => now(),
                    'current_year_level'  => $applicant->year_level,
                    'current_semester'    => $semester,
                    'current_school_year' => $applicant->school_year,
                ]);
            }

            app(CopyApplicantDataService::class)->execute($studentRecord);

            $applicant->update(['student_id_number' => $validated['student_id_number']]);

            $fees    = $this->getApplicableFees($applicant->year_level ?? '', $applicant->school_year ?? '');
            $program = $this->resolveProgram($applicant);
            $units   = $program?->max_load ?? 0;

            $feesCol      = collect($fees);
            $feeAmt       = fn($f) => $f['is_per_unit'] ? $f['amount'] * $units : $f['amount'];
            $tuitionTotal = $feesCol->where('category', 'tuition')->sum($feeAmt);
            $miscTotal    = $feesCol->where('category', 'miscellaneous')->sum($feeAmt);
            $grossAmount  = $feesCol->sum($feeAmt);

            // Apply selected discounts
            $totalDiscount    = 0;
            $appliedDiscounts = [];

            if (!empty($discountIds)) {
                $selectedTypes = DiscountType::whereIn('id', $discountIds)->where('is_active', true)->get();
                foreach ($selectedTypes as $dt) {
                    $base = match ($dt->applies_to) {
                        'tuition_only'       => $tuitionTotal,
                        'miscellaneous_only' => $miscTotal,
                        default              => $grossAmount,
                    };
                    $amount            = $dt->calculateDiscount($base);
                    $totalDiscount    += $amount;
                    $appliedDiscounts[] = ['type' => $dt, 'base' => $base, 'amount' => $amount];
                }
            }

            $netAmount    = max(0, $grossAmount - $totalDiscount);
            $priorBalance = $this->getStudentPriorBalance($studentRecord->id, $applicant->school_year, $semester);
            $netWithPrior = $netAmount + $priorBalance;

            $assessment = StudentAssessment::create([
                'student_id'      => $studentRecord->id,
                'school_year'     => $applicant->school_year,
                'semester'        => $semester,
                'mode_of_payment' => $validated['mode_of_payment'] ?? null,
                'payment_plan'    => $validated['payment_plan'],
                'gross_amount'    => $grossAmount,
                'total_discounts' => $totalDiscount,
                'net_amount'      => $netWithPrior,
                'prior_balance'   => $priorBalance,
                'minimum_amount'  => $validated['payment_plan'] === 'installment'
                    ? round($netAmount * 0.3 + $priorBalance, 2)
                    : $netWithPrior,
                'status'          => 'finalized',
                'generated_at'    => now(),
                'finalized_at'    => now(),
                'finalized_by'    => Auth::id(),
            ]);

            // Record each discount applied
            foreach ($appliedDiscounts as $applied) {
                AssessmentDiscount::create([
                    'assessment_id'    => $assessment->id,
                    'discount_type_id' => $applied['type']->id,
                    'description'      => $applied['type']->name,
                    'base_amount'      => $applied['base'],
                    'discount_amount'  => $applied['amount'],
                    'verified_by'      => Auth::id(),
                    'verified_at'      => now(),
                ]);
            }

            $previousStatus = $applicant->application_status;
            $applicant->update(['application_status' => 'Pending']);

            EnrollmentAuditLog::create([
                'applicant_id'    => $applicant->id,
                'action'          => 'Onsite Enrollment Processed',
                'previous_status' => $previousStatus,
                'new_status'      => 'Pending',
                'performed_by'    => Auth::user()->name,
                'details'         => json_encode([
                    'assessment_id'     => $assessment->id,
                    'student_id_number' => $validated['student_id_number'],
                    'payment_plan'      => $validated['payment_plan'],
                    'gross_amount'      => $grossAmount,
                    'total_discounts'   => $totalDiscount,
                    'net_amount'        => $netAmount,
                    'discounts'         => collect($appliedDiscounts)
                        ->map(fn($d) => ['name' => $d['type']->name, 'amount' => $d['amount']])
                        ->toArray(),
                ]),
                'ip_address'      => request()->ip(),
            ]);
        });

        return back()->with('success', 'Onsite enrollment processed successfully.');
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

    private function getEligibleDiscounts(Applicant $applicant): array
    {
        $eligible  = [];
        $autoIds   = [];
        $family    = $applicant->personalData?->familyBackground;

        // 1. Employee dependent — auto-detected via family background FKs
        $employeeIds = array_values(array_filter([
            $family?->father_employee_id,
            $family?->mother_employee_id,
            $family?->guardian_employee_id,
        ]));

        if (!empty($employeeIds)) {
            $hasActiveEmployee = Employee::whereIn('id', $employeeIds)
                ->where('is_active', true)
                ->exists();

            if ($hasActiveEmployee) {
                $dt = DiscountType::where('code', 'EMPLOYEE-DEP')->where('is_active', true)->first();
                if ($dt) {
                    $autoIds[]  = $dt->id;
                    $eligible[] = array_merge($dt->toArray(), ['auto_applied' => true]);
                }
            }
        }

        // 2. Sibling — auto-detected
        $siblings   = $applicant->personalData?->siblings ?? collect();
        $hasSibling = false;
        foreach ($siblings as $sibling) {
            if (!empty($sibling->sibling_id_number) &&
                Student::where('student_id_number', $sibling->sibling_id_number)
                    ->where('enrollment_status', 'Active')
                    ->exists()) {
                $hasSibling = true;
                break;
            }
        }
        if ($hasSibling) {
            $dt = DiscountType::where('code', 'SIBLING')->where('is_active', true)->first();
            if ($dt) {
                $autoIds[]  = $dt->id;
                $eligible[] = array_merge($dt->toArray(), ['auto_applied' => true]);
            }
        }

        // 3. All other active discounts — available for manual selection
        $manual = DiscountType::where('is_active', true)
            ->whereNotIn('id', $autoIds)
            ->get()
            ->map(fn($d) => array_merge($d->toArray(), ['auto_applied' => false]))
            ->toArray();

        return array_merge($eligible, $manual);
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
                'name'        => $fee->name,
                'code'        => $fee->code,
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

    private function resolveProgram(Applicant $applicant): ?Program
    {
        $strand = $applicant->strand ?? null;

        if ($strand) {
            $codeMap = [
                'Science, Technology, Engineering and Mathematics' => 'STEM',
                'Accountancy, Business and Management'             => 'ABM',
                'Humanities and Social Sciences'                   => 'HUMSS',
            ];
            $code    = $codeMap[$strand] ?? $strand;
            $program = Program::where('is_active', true)->where('code', $code)->first();
            if ($program) {
                return $program;
            }
        }

        return Program::where('is_active', true)->where('code', $applicant->student_category)->first();
    }

    /**
     * Update applicant status to Enrolled
     */
    public function enroll(Request $request, Applicant $applicant)
    {
        $validated = $request->validate([
            'student_id_number' => 'required|string|unique:applicants,student_id_number,' . $applicant->id,
        ]);

        $previousStatus = $applicant->application_status;

        $applicant->update([
            'application_status' => 'Enrolled',
            'student_id_number'  => $validated['student_id_number'],
        ]);

        EnrollmentAuditLog::create([
            'applicant_id' => $applicant->id,
            'action'                        => 'Status Changed to Enrolled',
            'new_status'                    => 'Enrolled',
            'previous_status'               => $previousStatus,
            'details'                       => json_encode([
                'student_id_number' => $validated['student_id_number'],
                'enrolled_by'       => Auth::user()->name,
            ]),
            'performed_by'                  => Auth::user()->name,
            'ip_address'                    => $request->ip(),
        ]);

        return back()->with('success', 'Applicant has been enrolled successfully.');
    }

    /**
     * Revert applicant status back to Pending
     */
    public function revertToPending(Request $request, Applicant $applicant)
    {
        $previousStatus = $applicant->application_status;

        $applicant->update([
            'application_status' => 'Pending',
            'student_id_number'  => null,
        ]);

        EnrollmentAuditLog::create([
            'applicant_id' => $applicant->id,
            'action'                        => 'Status Reverted to Pending',
            'new_status'                    => 'Pending',
            'previous_status'               => $previousStatus,
            'details'                       => json_encode([
                'reverted_by' => Auth::user()->name,
                'reason'      => $request->input('reason', 'No reason provided'),
            ]),
            'performed_by'                  => Auth::user()->name,
            'ip_address'                    => $request->ip(),
        ]);

        return back()->with('success', 'Applicant status reverted to Pending.');
    }

    /**
     * View enrollment audit trail
     */
    public function auditLog(Applicant $applicant)
    {
        $applicant->load('personalData');

        $logs = $applicant->auditLogs()
            ->orderBy('created_at', 'desc')
            ->get();

        return Inertia::render('Admissions/Enrollment/AuditLog', [
            'applicant' => $applicant,
            'auditLogs' => $logs,
        ]);
    }

    /**
     * Generate enrollment report
     */
    public function report(Request $request)
    {
        $query = Applicant::with(['personalData'])
            ->whereIn('application_status', ['Pending', 'Enrolled']);

        if ($request->filled('status')) {
            $query->where('application_status', $request->status);
        }

        if ($request->filled('category')) {
            $query->where('student_category', $request->category);
        }

        if ($request->filled('school_year')) {
            $query->where('school_year', $request->school_year);
        }

        $applicants = $query->get();

        $statistics = [
            'total_students'  => $applicants->count(),
            'pending_count'   => $applicants->where('application_status', 'Pending')->count(),
            'enrolled_count'  => $applicants->where('application_status', 'Enrolled')->count(),
            'by_category'     => $applicants->groupBy('student_category')->map(function ($group, $category) {
                return [
                    'category' => $category ?: 'Unknown',
                    'count'    => $group->count(),
                ];
            })->values(),
            'by_year_level'   => $applicants->groupBy('year_level')->map(function ($group, $yearLevel) {
                return [
                    'year_level' => $yearLevel ?: 'Not Assigned',
                    'count'      => $group->count(),
                ];
            })->values(),
        ];

        // Get unique school years for filter
        $schoolYears = Applicant::distinct()
            ->pluck('school_year')
            ->filter()
            ->sort()
            ->values();

        return Inertia::render('Admissions/Enrollment/Report', [
            'statistics'  => $statistics,
            'filters'     => [
                'status'      => $request->status,
                'category'    => $request->category,
                'school_year' => $request->school_year,
            ],
            'schoolYears' => $schoolYears,
            'semesters'   => ['1st Semester', '2nd Semester', 'Summer'],
        ]);
    }
}
