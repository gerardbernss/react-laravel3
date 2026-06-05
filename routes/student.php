<?php

/**
 * Student portal routes — accessible via the 'student' auth guard (PortalCredential model).
 *
 * This file is completely separate from the admin 'web' guard routes. The student
 * guard uses portal_credentials table for authentication, not the users table.
 *
 * Route groups:
 *   (no middleware)        — PUBLIC: student login form
 *   auth:student           — AUTHENTICATED STUDENT: all portal pages
 *   auth:student (prefix /applicant) — Applicant-only portal: shown to applicants who have
 *                            received credentials but have NOT yet been formally enrolled
 *                            (no Student record exists yet). Gives them a read-only view of
 *                            their application status and allows generating their fee assessment.
 *   auth:student + student.enrolled — ENROLLED ONLY: schedule, attendance, forms, payment mode.
 *                            The 'student.enrolled' middleware (EnsureEnrolledStudent) aborts
 *                            with 403 if the student's enrollment_status is not 'Active'.
 *
 * Password change is mandatory on first login: the portal redirects to /student/change-password
 * whenever password_changed = false on the PortalCredential. This is enforced in
 * StudentPortalController, not at the middleware level.
 *
 * This file is included by routes/web.php via require __DIR__.'/student.php'.
 */

use App\Http\Controllers\Auth\StudentLoginController;
use App\Http\Controllers\Student\StudentPortalController;
use Illuminate\Support\Facades\Route;

// ===== PUBLIC: Student login =====

// Student portal login
Route::get('student/login', [StudentLoginController::class, 'create'])->name('student.login');
Route::post('student/login', [StudentLoginController::class, 'store']);

// Applicant routes (no student prefix)
Route::middleware('auth:student')->group(function () {
    Route::get('applicant/dashboard', [StudentPortalController::class, 'applicantDashboard'])
        ->name('applicant.dashboard');
    Route::get('applicant/personal-info', [StudentPortalController::class, 'applicantPersonalInfo'])
        ->name('applicant.personal-info');
    Route::post('applicant/personal-info', [StudentPortalController::class, 'applicantUpdatePersonalInfo'])
        ->name('applicant.personal-info.update');
    Route::get('applicant/enrollment', [StudentPortalController::class, 'applicantEnrollment'])
        ->name('applicant.enrollment');
    Route::post('applicant/enrollment/generate-assessment', [StudentPortalController::class, 'generateApplicantAssessment'])
        ->name('applicant.enrollment.generate-assessment');
});

// Authenticated student routes
Route::middleware('auth:student')->prefix('student')->group(function () {

    // Enrolled students only
    Route::get('dashboard', [StudentPortalController::class, 'dashboard'])
        ->name('student.dashboard');

    Route::get('personal-info', [StudentPortalController::class, 'personalInfo'])
        ->name('student.personal-info');

    Route::put('personal-info', [StudentPortalController::class, 'updatePersonalInfo'])
        ->name('student.personal-info.update');

    Route::get('change-password', [StudentPortalController::class, 'changePasswordForm'])
        ->name('student.change-password');

    Route::put('change-password', [StudentPortalController::class, 'changePassword'])
        ->name('student.change-password.update');

    Route::post('logout', [StudentLoginController::class, 'destroy'])
        ->name('student.logout');

    // Enrollment page: accessible to Exam Passed applicants and enrolled students
    Route::get('enrollment', [StudentPortalController::class, 'enrollment'])
        ->name('student.enrollment');
    Route::post('enrollment/process', [StudentPortalController::class, 'processEnrollment'])
        ->name('student.enrollment.process');

    Route::get('my-section', [StudentPortalController::class, 'mySection'])
        ->name('student.my-section');

    // Enrolled students only
    Route::middleware('student.enrolled')->group(function () {
        Route::patch('enrollment/payment-mode', [StudentPortalController::class, 'changePaymentMode'])
            ->name('student.enrollment.payment-mode');

        Route::get('schedule', [StudentPortalController::class, 'schedule'])
            ->name('student.schedule');

        Route::get('attendance', [StudentPortalController::class, 'attendance'])
            ->name('student.attendance');

        Route::patch('attendance/{attendance}/reason', [StudentPortalController::class, 'updateAttendanceReason'])
            ->name('student.attendance.reason');

        Route::get('downloadable-forms', [StudentPortalController::class, 'downloadableForms'])
            ->name('student.downloadable-forms');
    });
});
