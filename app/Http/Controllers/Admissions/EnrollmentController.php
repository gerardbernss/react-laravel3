<?php

namespace App\Http\Controllers\Admissions;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admissions\EnrollApplicantStatusRequest;
use App\Http\Requests\Admissions\ProcessOnsiteEnrollmentRequest;
use App\Http\Requests\Admissions\WithdrawApplicantRequest;
use App\Models\Applicant;
use App\Services\Admissions\EnrollmentService;
use Illuminate\Http\Request;
use Inertia\Inertia;

/**
 * Manages the enrollment workflow for applicants who have passed the exam.
 *
 * Distinct from ApplicantController::enroll() — this controller owns the dedicated
 * enrollment dashboard (listing Exam Passed / Pending / Enrolled applicants) and
 * the onsite enrollment wizard that admin staff use to process walk-in payments.
 *
 * All queries live in ApplicantRepository (extended for this domain) plus the
 * Student/DiscountType/Employee/Program/Fee repositories it reuses. All business
 * logic — fee calculation, discount eligibility, the onsite enrollment transaction,
 * and the enroll/revert/withdraw lifecycle — lives in EnrollmentService.
 */
class EnrollmentController extends Controller
{
    public function __construct(private readonly EnrollmentService $enrollmentService)
    {
    }

    /**
     * Show the enrollment dashboard listing applicants filterable by status, category, and search term.
     */
    public function dashboard(Request $request)
    {
        return Inertia::render('Admissions/Enrollment/Dashboard', $this->enrollmentService->dashboardData(
            $request->only(['status', 'search', 'category'])
        ));
    }

    /**
     * Show an applicant's enrollment detail page including fee breakdown and discount eligibility.
     */
    public function show(Applicant $applicant)
    {
        return Inertia::render('Admissions/Enrollment/Show', $this->enrollmentService->showData($applicant));
    }

    /**
     * Process a walk-in onsite enrollment including payment recording and student record creation.
     */
    public function processOnsiteEnrollment(ProcessOnsiteEnrollmentRequest $request, Applicant $applicant)
    {
        $errors = $this->enrollmentService->processOnsiteEnrollment($applicant, $request->validated());

        if ($errors) {
            return back()->withErrors($errors);
        }

        return back()->with('success', 'Onsite enrollment processed successfully.');
    }

    /**
     * Mark an applicant as officially enrolled and log the action with the requester's IP.
     */
    public function enroll(EnrollApplicantStatusRequest $request, Applicant $applicant)
    {
        $this->enrollmentService->markEnrolled($applicant, $request->validated(), $request->ip());

        return back()->with('success', 'Applicant has been enrolled successfully.');
    }

    /**
     * Revert an enrolled applicant back to Pending status with an audit trail reason.
     */
    public function revertToPending(Request $request, Applicant $applicant)
    {
        $this->enrollmentService->revertToPending($applicant, $request->input('reason', 'No reason provided'), $request->ip());

        return back()->with('success', 'Applicant status reverted to Pending.');
    }

    /**
     * Withdraw an applicant from the current period and record the reason in the audit log.
     */
    public function withdraw(WithdrawApplicantRequest $request, Applicant $applicant)
    {
        $error = $this->enrollmentService->withdraw($applicant, $request->validated(), $request->ip());

        if ($error) {
            return back()->withErrors(['error' => $error]);
        }

        return back()->with('success', 'Application has been withdrawn.');
    }

    /**
     * Show the full status-change audit log for an applicant's enrollment history.
     */
    public function auditLog(Applicant $applicant)
    {
        return Inertia::render('Admissions/Enrollment/AuditLog', $this->enrollmentService->auditLogData($applicant));
    }

    /**
     * Show the enrollment report filterable by status, student category, and school year.
     */
    public function report(Request $request)
    {
        return Inertia::render('Admissions/Enrollment/Report', $this->enrollmentService->reportData(
            $request->only(['status', 'category', 'school_year'])
        ));
    }
}
