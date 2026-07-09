<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Http\Requests\Student\ApplicantUpdatePersonalInfoRequest;
use App\Http\Requests\Student\ChangePaymentModeRequest;
use App\Http\Requests\Student\ChangeStudentPasswordRequest;
use App\Http\Requests\Student\ProcessEnrollmentRequest;
use App\Http\Requests\Student\UpdateAttendanceReasonRequest;
use App\Http\Requests\Student\UpdateStudentPersonalInfoRequest;
use App\Models\Attendance;
use App\Models\PortalCredential;
use App\Services\Student\StudentPortalService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class StudentPortalController extends Controller
{
    public function __construct(private readonly StudentPortalService $portalService)
    {
    }

    /**
     * Resolve the currently authenticated portal credential from the student guard.
     */
    protected function getStudent(): PortalCredential
    {
        return Auth::guard('student')->user();
    }

    /**
     * Render the applicant dashboard, redirecting to the student dashboard if a student record already exists.
     */
    public function applicantDashboard(): Response|RedirectResponse
    {
        $student = $this->getStudent();

        if ($this->portalService->hasStudentRecord($student)) {
            return redirect()->route('student.dashboard');
        }

        return Inertia::render('Applicant/Dashboard', $this->portalService->applicantDashboardData($student));
    }

    /**
     * Render the enrolled student dashboard, redirecting to the applicant dashboard if no student record exists yet.
     */
    public function dashboard(): Response|RedirectResponse
    {
        $student = $this->getStudent();

        if (! $this->portalService->hasStudentRecord($student)) {
            return redirect()->route('applicant.dashboard');
        }

        return Inertia::render('Student/Dashboard', $this->portalService->dashboardData($student));
    }

    /**
     * Show the applicant's personal information page, redirecting enrolled students to their own personal info page.
     */
    public function applicantPersonalInfo(): Response|RedirectResponse
    {
        $student = $this->getStudent();

        if ($this->portalService->hasStudentRecord($student)) {
            return redirect()->route('student.profile.edit');
        }

        return Inertia::render('Applicant/PersonalInfo', $this->portalService->applicantPersonalInfoData($student));
    }

    /**
     * Update personal information submitted by an applicant through the portal.
     */
    public function applicantUpdatePersonalInfo(ApplicantUpdatePersonalInfoRequest $request): RedirectResponse
    {
        $result = $this->portalService->updateApplicantPersonalInfo($this->getStudent(), $request->validated());

        if (! $result['ok']) {
            return back()->withErrors($result['errors']);
        }

        return back()->with('success', 'Information updated successfully.');
    }

    /**
     * Show the applicant's enrollment status page, redirecting enrolled students to the student enrollment page.
     */
    public function applicantEnrollment(): Response|RedirectResponse
    {
        $student = $this->getStudent();

        if ($this->portalService->hasStudentRecord($student)) {
            return redirect()->route('student.enrollment');
        }

        return Inertia::render('Applicant/Enrollment', $this->portalService->applicantEnrollmentData($student));
    }

    /**
     * Generate a fee assessment for the authenticated applicant if one does not already exist.
     */
    public function generateApplicantAssessment(): RedirectResponse
    {
        $result = $this->portalService->generateApplicantAssessment($this->getStudent());

        if (! $result['ok']) {
            return back()->withErrors($result['errors']);
        }

        return back()->with('success', $result['message']);
    }

    /**
     * Show the enrolled student's current enrollment status and assessment summary.
     */
    public function enrollment(): Response
    {
        return Inertia::render('Student/Enrollment', $this->portalService->enrollmentData($this->getStudent()));
    }

    /**
     * Show the student's assigned section, subjects, and classmates.
     */
    public function mySection(): Response
    {
        return Inertia::render('Student/MySection', $this->portalService->mySectionData($this->getStudent()));
    }

    /**
     * Show the student's statement of account with fees, payments, and remaining balance.
     */
    public function statementOfAccount(): Response
    {
        return Inertia::render('Student/StatementOfAccount', $this->portalService->statementOfAccountData($this->getStudent()));
    }

    /**
     * Confirm the student's intention to enroll for the current period.
     */
    public function confirmEnrollment(): RedirectResponse
    {
        $result = $this->portalService->confirmEnrollment($this->getStudent());

        if (! $result['ok']) {
            return back()->withErrors($result['errors']);
        }

        return back()->with('success', $result['message']);
    }

    /**
     * Process the student's self-enrollment including section selection and initial payment.
     */
    public function processEnrollment(ProcessEnrollmentRequest $request): RedirectResponse
    {
        $result = $this->portalService->processEnrollment($this->getStudent(), $request->validated());

        if (! $result['ok']) {
            return back()->withErrors($result['errors']);
        }

        return redirect()->route('student.enrollment')->with('success', $result['message']);
    }

    /**
     * Switch the student's payment mode between full and installment payment plans.
     */
    public function changePaymentMode(ChangePaymentModeRequest $request): RedirectResponse
    {
        $result = $this->portalService->changePaymentMode($this->getStudent(), $request->validated());

        if (! $result['ok']) {
            return back()->withErrors($result['errors']);
        }

        return back()->with('success', 'Payment mode updated successfully.');
    }

    /**
     * Show the enrolled student's personal information for viewing and editing.
     */
    public function personalInfo(): Response
    {
        return Inertia::render('Student/PersonalInfo', $this->portalService->personalInfoData($this->getStudent()));
    }

    /**
     * Update personal information submitted by an enrolled student through the portal.
     */
    public function updatePersonalInfo(UpdateStudentPersonalInfoRequest $request): RedirectResponse
    {
        $result = $this->portalService->updatePersonalInfo($this->getStudent(), $request->validated());

        if (! $result['ok']) {
            return back()->withErrors($result['errors']);
        }

        return back()->with('success', 'Personal information updated successfully.');
    }

    /**
     * Show the change password form for the authenticated portal user.
     */
    public function changePasswordForm(): Response
    {
        return Inertia::render('Student/ChangePassword', $this->portalService->changePasswordFormData($this->getStudent()));
    }

    /**
     * Update the portal account password after verifying the current password.
     */
    public function changePassword(ChangeStudentPasswordRequest $request): RedirectResponse
    {
        $result = $this->portalService->changePassword($this->getStudent(), $request->validated());

        if (! $result['ok']) {
            return back()->withErrors($result['errors']);
        }

        return back()->with('success', 'Password changed successfully.');
    }

    /**
     * Show the student's class schedule for the current enrollment period.
     */
    public function schedule(): Response
    {
        return Inertia::render('Student/Schedule', $this->portalService->scheduleData($this->getStudent()));
    }

    /**
     * Show the student's attendance record for the current period.
     */
    public function attendance(): Response
    {
        return Inertia::render('Student/Attendance', $this->portalService->attendanceData($this->getStudent()));
    }

    /**
     * Update the reason/excuse note on one of the student's own attendance records.
     *
     * @throws \Symfony\Component\HttpKernel\Exception\HttpException if the attendance record belongs to a different student.
     */
    public function updateAttendanceReason(UpdateAttendanceReasonRequest $request, Attendance $attendance): RedirectResponse
    {
        $student = $this->getStudent();

        if (! $this->portalService->canAnnotateAttendance($student, $attendance)) {
            abort(403, 'This attendance record does not belong to you.');
        }

        $this->portalService->updateAttendanceReason($attendance, $request->validated('reason'));

        return back();
    }

    /**
     * Show the downloadable forms page for enrolled students.
     */
    public function downloadableForms(): Response
    {
        return Inertia::render('Student/DownloadableForms');
    }
}
