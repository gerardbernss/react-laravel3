<?php

namespace App\Http\Controllers\Admissions;

use App\Http\Controllers\Controller;
use App\Models\Applicant;
use App\Models\EnrollmentAuditLog;
use App\Models\Fee;
use App\Models\Program;
use App\Models\Student;
use App\Models\StudentAssessment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class EnrollmentController extends Controller
{
    /**
     * Display enrollment dashboard
     * Shows applicants with status 'Pending' and 'Enrolled'
     */
    public function dashboard(Request $request)
    {
        $query = Applicant::with(['personalData', 'documents', 'portalCredential'])
            ->whereIn('application_status', ['Pending', 'Enrolled'])
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

        $statistics = [
            'pending'  => Applicant::where('application_status', 'Pending')->count(),
            'enrolled' => Applicant::where('application_status', 'Enrolled')->count(),
            'total'    => Applicant::whereIn('application_status', ['Pending', 'Enrolled'])->count(),
        ];

        return Inertia::render('Admissions/Enrollment/Dashboard', [
            'applicants' => $applicants,
            'statistics' => $statistics,
            'filters'    => [
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
            'total_amount'      => ['required', 'numeric', 'min:0'],
        ]);

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

        DB::transaction(function () use ($applicant, $personalData, $validated, $semester) {
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
                    'enrollment_status'  => 'Pending',
                    'enrollment_date'    => now(),
                    'current_year_level' => $applicant->year_level,
                    'current_semester'   => $semester,
                    'current_school_year'=> $applicant->school_year,
                ]);
            }

            $applicant->update(['student_id_number' => $validated['student_id_number']]);

            $fees        = $this->getApplicableFees($applicant->year_level ?? '', $applicant->school_year ?? '');
            $program     = $this->resolveProgram($applicant);
            $units       = $program?->max_load ?? 0;
            $grossAmount = collect($fees)->sum(fn($f) => $f['is_per_unit'] ? $f['amount'] * $units : $f['amount']);
            $netAmount   = (float) $validated['total_amount'];
            $discount    = max(0, $grossAmount - $netAmount);

            $assessment = StudentAssessment::create([
                'student_id'       => $studentRecord->id,
                'school_year'      => $applicant->school_year,
                'semester'         => $semester,
                'mode_of_payment'  => $validated['mode_of_payment'] ?? null,
                'payment_plan'     => $validated['payment_plan'],
                'gross_amount'     => $grossAmount,
                'total_discounts'  => $discount,
                'net_amount'       => $netAmount,
                'status'           => 'finalized',
                'generated_at'     => now(),
                'finalized_at'     => now(),
                'finalized_by'     => Auth::id(),
            ]);

            $previousStatus = $applicant->application_status;
            $applicant->update(['application_status' => 'Pending']);

            EnrollmentAuditLog::create([
                'applicant_id'   => $applicant->id,
                'action'         => 'Onsite Enrollment Processed',
                'previous_status'=> $previousStatus,
                'new_status'     => 'Pending',
                'performed_by'   => Auth::user()->name,
                'details'        => json_encode([
                    'assessment_id'     => $assessment->id,
                    'student_id_number' => $validated['student_id_number'],
                    'payment_plan'      => $validated['payment_plan'],
                    'gross_amount'      => $grossAmount,
                    'net_amount'        => $netAmount,
                ]),
                'ip_address'     => request()->ip(),
            ]);
        });

        return back()->with('success', 'Onsite enrollment processed successfully.');
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
        $strand = $applicant->strand ?? '';
        if ($strand && preg_match('/\(([A-Z]+)\)/', $strand, $matches)) {
            $program = Program::where('is_active', true)->where('code', $matches[1])->first();
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
