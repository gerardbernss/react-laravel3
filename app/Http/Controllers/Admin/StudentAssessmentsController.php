<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Applicant;
use App\Models\StudentAssessment;
use App\Models\StudentPayment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class StudentAssessmentsController extends Controller
{
    public function index()
    {
        $assessments = StudentAssessment::with(['student.personalData', 'payments'])
            ->latest()
            ->get()
            ->map(fn ($a) => [
                'id'                => $a->id,
                'assessment_number' => $a->assessment_number,
                'school_year'       => $a->school_year,
                'semester'          => $a->semester,
                'status'            => $a->status,
                'gross_amount'      => (float) $a->gross_amount,
                'total_discounts'   => (float) $a->total_discounts,
                'net_amount'        => (float) $a->net_amount,
                'total_paid'        => $a->total_paid,
                'balance'           => $a->remaining_balance,
                'student_name'      => $a->student?->personalData
                    ? $a->student->personalData->last_name . ', ' . $a->student->personalData->first_name
                    : '—',
                'student_id_number' => $a->student?->student_id_number ?? '—',
                'grade_level'       => $a->student?->current_year_level ?? '—',
            ]);

        $schoolYears = StudentAssessment::select('school_year')
            ->distinct()
            ->orderByDesc('school_year')
            ->pluck('school_year');

        return Inertia::render('Admin/Finance/Assessments/Index', [
            'assessments' => $assessments,
            'schoolYears' => $schoolYears,
        ]);
    }

    public function show(StudentAssessment $assessment)
    {
        $assessment->load(['student.personalData', 'payments.processedBy']);

        return Inertia::render('Admin/Finance/Assessments/Show', [
            'assessment' => [
                'id'                => $assessment->id,
                'assessment_number' => $assessment->assessment_number,
                'school_year'       => $assessment->school_year,
                'semester'          => $assessment->semester,
                'status'            => $assessment->status,
                'total_tuition'     => (float) $assessment->total_tuition,
                'total_misc_fees'   => (float) $assessment->total_misc_fees,
                'total_lab_fees'    => (float) $assessment->total_lab_fees,
                'total_other_fees'  => (float) $assessment->total_other_fees,
                'gross_amount'      => (float) $assessment->gross_amount,
                'total_discounts'   => (float) $assessment->total_discounts,
                'net_amount'        => (float) $assessment->net_amount,
                'payment_plan'      => $assessment->payment_plan ?? 'full',
                'minimum_amount'    => $assessment->minimum_required,
                'total_paid'        => $assessment->total_paid,
                'balance'           => $assessment->remaining_balance,
                'finalized_at'        => $assessment->finalized_at?->format('F d, Y'),
                'student'           => $assessment->student ? [
                    'student_id'  => $assessment->student->student_id_number,
                    'name'        => $assessment->student->personalData
                        ? trim($assessment->student->personalData->last_name . ', '
                            . $assessment->student->personalData->first_name . ' '
                            . ($assessment->student->personalData->middle_name ?? ''))
                        : '—',
                    'grade_level' => $assessment->student->current_year_level,
                    'school_year' => $assessment->student->current_school_year,
                ] : null,
                'payments'          => $assessment->payments->map(fn ($p) => [
                    'id'               => $p->id,
                    'amount_paid'      => (float) $p->amount_paid,
                    'payment_method'   => $p->payment_method,
                    'reference_number' => $p->reference_number,
                    'payment_date'     => $p->payment_date->format('M d, Y'),
                    'notes'            => $p->notes,
                    'processed_by'     => $p->processedBy?->name ?? '—',
                ]),
            ],
        ]);
    }

    public function processPayment(Request $request, StudentAssessment $assessment)
    {
        if ($assessment->status === 'paid') {
            return back()->withErrors(['error' => 'This assessment has already been fully paid.']);
        }

        $balance = $assessment->remaining_balance;

        $validated = $request->validate([
            'amount_paid'      => ['required', 'numeric', 'min:0.01', 'max:' . $balance],
            'payment_method'   => ['required', 'in:cash,check,bank_transfer,gcash,maya'],
            'reference_number' => ['nullable', 'string', 'max:100'],
            'payment_date'     => ['required', 'date', 'before_or_equal:today'],
            'notes'            => ['nullable', 'string', 'max:500'],
        ]);

        StudentPayment::create([
            'assessment_id'    => $assessment->id,
            'amount_paid'      => $validated['amount_paid'],
            'payment_method'   => $validated['payment_method'],
            'reference_number' => $validated['reference_number'] ?? null,
            'payment_date'     => $validated['payment_date'],
            'notes'            => $validated['notes'] ?? null,
            'processed_by'     => Auth::id(),
        ]);

        $this->recalculateAssessmentStatus($assessment);

        $assessment->refresh();

        return back()->with('success', $assessment->status === 'paid'
            ? 'Payment recorded. Student is now fully enrolled.'
            : 'Partial payment recorded successfully.');
    }

    public function updatePayment(Request $request, StudentAssessment $assessment, StudentPayment $payment)
    {
        // Max is remaining balance PLUS the payment's own amount (since we're replacing it)
        $maxAmount = $assessment->remaining_balance + (float) $payment->amount_paid;

        $validated = $request->validate([
            'amount_paid'      => ['required', 'numeric', 'min:0.01', 'max:' . $maxAmount],
            'payment_method'   => ['required', 'in:cash,check,bank_transfer,gcash,maya'],
            'reference_number' => ['nullable', 'string', 'max:100'],
            'payment_date'     => ['required', 'date', 'before_or_equal:today'],
            'notes'            => ['nullable', 'string', 'max:500'],
        ]);

        $payment->update($validated);

        $this->recalculateAssessmentStatus($assessment);

        $assessment->refresh();

        return back()->with('success', 'Payment updated successfully.');
    }

    public function deletePayment(StudentAssessment $assessment, StudentPayment $payment)
    {
        $payment->delete();

        $this->recalculateAssessmentStatus($assessment);

        return back()->with('success', 'Payment deleted.');
    }

    public function syncStatus(StudentAssessment $assessment): \Illuminate\Http\RedirectResponse
    {
        $this->recalculateAssessmentStatus($assessment);
        return back()->with('success', 'Enrollment status synced.');
    }

    public function debugStatus(StudentAssessment $assessment): \Illuminate\Http\JsonResponse
    {
        $assessment->refresh();
        $student = $assessment->student;

        return response()->json([
            'assessment_id'      => $assessment->id,
            'student_id'         => $assessment->student_id,
            'total_paid'         => $assessment->total_paid,
            'minimum_required'   => $assessment->minimum_required,
            'minimum_amount_col' => $assessment->minimum_amount,
            'net_amount'         => $assessment->net_amount,
            'payment_plan'       => $assessment->payment_plan,
            'student_found'      => $student ? true : false,
            'student_apd_id'     => $student?->applicant_personal_data_id,
            'student_aai_id'     => $student?->applicant_id,
            'student_enroll'     => $student?->enrollment_status,
            'portal_cred'        => $student?->portalCredential ? [
                'id'     => $student->portalCredential->id,
                'aai_id' => $student->portalCredential->applicant_id,
            ] : null,
            'application_via_student'   => $student?->application?->id,
            'application_via_portal'    => $student?->portalCredential?->application?->id,
            'application_via_apd'       => $student ? Applicant::where('applicant_personal_data_id', $student->applicant_personal_data_id)->latest()->value('id') : null,
            'application_status'        => $student?->application?->application_status
                ?? $student?->portalCredential?->application?->application_status,
        ]);
    }

    public function updateMinimumAmount(Request $request, StudentAssessment $assessment): \Illuminate\Http\RedirectResponse
    {
        $validated = $request->validate([
            'minimum_amount' => ['required', 'numeric', 'min:0', 'max:' . (float) $assessment->net_amount],
        ]);

        $assessment->update($validated);
        $this->recalculateAssessmentStatus($assessment);

        return back()->with('success', 'Minimum amount updated.');
    }

    private function recalculateAssessmentStatus(StudentAssessment $assessment): void
    {
        $assessment->refresh();
        $totalPaid       = round($assessment->total_paid, 2);
        $netAmount       = round((float) $assessment->net_amount, 2);
        $minimumRequired = round($assessment->minimum_required, 2);

        if ($totalPaid >= $netAmount) {
            $newStatus = 'paid';
        } elseif ($totalPaid > 0) {
            $newStatus = 'partial';
        } else {
            $newStatus = 'finalized';
        }

        $assessment->update(['status' => $newStatus]);

        $student = $assessment->student;
        if (!$student) {
            return;
        }

        // Resolve application — try multiple paths:
        // 1. students.applicant_id (direct FK)
        // 2. portal_credentials.applicant_id (what the student portal actually reads)
        // 3. Fallback via applicant_personal_data_id
        $application = $student->application
            ?? $student->portalCredential?->application
            ?? Applicant::where('applicant_personal_data_id', $student->applicant_personal_data_id)
                ->latest()
                ->first();

        // Backfill the missing FK so future calls don't need the fallback
        if ($application && !$student->applicant_id) {
            $student->update(['applicant_id' => $application->id]);
        }

        if ($totalPaid >= $minimumRequired) {
            $student->update(['enrollment_status' => 'Active']);
            $application?->update(['application_status' => 'Enrolled']);
        } elseif ($application?->application_status === 'Enrolled') {
            // Payment reduced below minimum — revert to Pending
            $student->update(['enrollment_status' => 'Pending']);
            $application->update(['application_status' => 'Pending']);
        }
    }
}
