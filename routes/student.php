<?php

use App\Http\Controllers\Auth\StudentLoginController;
use App\Http\Controllers\Student\StudentPortalController;
use Illuminate\Support\Facades\Route;

/**
 * STUDENT PORTAL ROUTES
 * Routes for student access using portal credentials
 */

// Redirect old student login URL to main login page
Route::get('student/login', function () {
    return redirect()->route('login');
})->name('student.login');

// Applicant routes (no student prefix)
Route::middleware('auth:student')->group(function () {
    Route::get('applicant/dashboard', [StudentPortalController::class, 'applicantDashboard'])
        ->name('applicant.dashboard');
    Route::get('applicant/personal-info', [StudentPortalController::class, 'applicantPersonalInfo'])
        ->name('applicant.personal-info');
    Route::post('applicant/personal-info', [StudentPortalController::class, 'applicantUpdatePersonalInfo'])
        ->name('applicant.personal-info.update');
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

    // Enrolled students only
    Route::middleware('student.enrolled')->group(function () {
        Route::get('enrollment', [StudentPortalController::class, 'enrollment'])
            ->name('student.enrollment');

        Route::post('enrollment/confirm', [StudentPortalController::class, 'confirmEnrollment'])
            ->name('student.enrollment.confirm');

        Route::post('enrollment/process', [StudentPortalController::class, 'processEnrollment'])
            ->name('student.enrollment.process');

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
