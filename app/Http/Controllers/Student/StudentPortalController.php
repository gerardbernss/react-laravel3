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

    protected function getStudent(): PortalCredential
    {
        return Auth::guard('student')->user();
    }

    public function applicantDashboard(): Response|RedirectResponse
    {
        $student = $this->getStudent();

        if ($this->portalService->hasStudentRecord($student)) {
            return redirect()->route('student.dashboard');
        }

        return Inertia::render('Applicant/Dashboard', $this->portalService->applicantDashboardData($student));
    }

    public function dashboard(): Response|RedirectResponse
    {
        $student = $this->getStudent();

        if (! $this->portalService->hasStudentRecord($student)) {
            return redirect()->route('applicant.dashboard');
        }

        return Inertia::render('Student/Dashboard', $this->portalService->dashboardData($student));
    }

    public function applicantPersonalInfo(): Response|RedirectResponse
    {
        $student = $this->getStudent();

        if ($this->portalService->hasStudentRecord($student)) {
            return redirect()->route('student.profile.edit');
        }

        return Inertia::render('Applicant/PersonalInfo', $this->portalService->applicantPersonalInfoData($student));
    }

    public function applicantUpdatePersonalInfo(ApplicantUpdatePersonalInfoRequest $request): RedirectResponse
    {
        $result = $this->portalService->updateApplicantPersonalInfo($this->getStudent(), $request->validated());

        if (! $result['ok']) {
            return back()->withErrors($result['errors']);
        }

        return back()->with('success', 'Information updated successfully.');
    }

    public function applicantEnrollment(): Response|RedirectResponse
    {
        $student = $this->getStudent();

        if ($this->portalService->hasStudentRecord($student)) {
            return redirect()->route('student.enrollment');
        }

        return Inertia::render('Applicant/Enrollment', $this->portalService->applicantEnrollmentData($student));
    }

    public function generateApplicantAssessment(): RedirectResponse
    {
        $result = $this->portalService->generateApplicantAssessment($this->getStudent());

        if (! $result['ok']) {
            return back()->withErrors($result['errors']);
        }

        return back()->with('success', $result['message']);
    }

    public function enrollment(): Response
    {
        return Inertia::render('Student/Enrollment', $this->portalService->enrollmentData($this->getStudent()));
    }

    public function mySection(): Response
    {
        return Inertia::render('Student/MySection', $this->portalService->mySectionData($this->getStudent()));
    }

    public function statementOfAccount(): Response
    {
        return Inertia::render('Student/StatementOfAccount', $this->portalService->statementOfAccountData($this->getStudent()));
    }

    public function confirmEnrollment(): RedirectResponse
    {
        $result = $this->portalService->confirmEnrollment($this->getStudent());

        if (! $result['ok']) {
            return back()->withErrors($result['errors']);
        }

        return back()->with('success', $result['message']);
    }

    public function processEnrollment(ProcessEnrollmentRequest $request): RedirectResponse
    {
        $result = $this->portalService->processEnrollment($this->getStudent(), $request->validated());

        if (! $result['ok']) {
            return back()->withErrors($result['errors']);
        }

        return redirect()->route('student.enrollment')->with('success', $result['message']);
    }

    public function changePaymentMode(ChangePaymentModeRequest $request): RedirectResponse
    {
        $result = $this->portalService->changePaymentMode($this->getStudent(), $request->validated());

        if (! $result['ok']) {
            return back()->withErrors($result['errors']);
        }

        return back()->with('success', 'Payment mode updated successfully.');
    }

    public function personalInfo(): Response
    {
        return Inertia::render('Student/PersonalInfo', $this->portalService->personalInfoData($this->getStudent()));
    }

    public function updatePersonalInfo(UpdateStudentPersonalInfoRequest $request): RedirectResponse
    {
        $result = $this->portalService->updatePersonalInfo($this->getStudent(), $request->validated());

        if (! $result['ok']) {
            return back()->withErrors($result['errors']);
        }

        return back()->with('success', 'Personal information updated successfully.');
    }

    public function changePasswordForm(): Response
    {
        return Inertia::render('Student/ChangePassword', $this->portalService->changePasswordFormData($this->getStudent()));
    }

    public function changePassword(ChangeStudentPasswordRequest $request): RedirectResponse
    {
        $result = $this->portalService->changePassword($this->getStudent(), $request->validated());

        if (! $result['ok']) {
            return back()->withErrors($result['errors']);
        }

        return back()->with('success', 'Password changed successfully.');
    }

    public function schedule(): Response
    {
        return Inertia::render('Student/Schedule', $this->portalService->scheduleData($this->getStudent()));
    }

    public function attendance(): Response
    {
        return Inertia::render('Student/Attendance', $this->portalService->attendanceData($this->getStudent()));
    }

    public function updateAttendanceReason(UpdateAttendanceReasonRequest $request, Attendance $attendance): RedirectResponse
    {
        $student = $this->getStudent();

        if (! $this->portalService->canAnnotateAttendance($student, $attendance)) {
            abort(403, 'This attendance record does not belong to you.');
        }

        $this->portalService->updateAttendanceReason($attendance, $request->validated('reason'));

        return back();
    }

    public function downloadableForms(): Response
    {
        return Inertia::render('Student/DownloadableForms');
    }
}
