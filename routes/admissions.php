<?php

/**
 * Admissions routes — portal credentials, exam results, and enrollment workflow.
 * URL/name namespace: /admin/portal-credentials/*, /admin/exam-results/*, /admin/enrollment/*.
 *
 * All routes in this file require 'auth' + 'verified' middleware (admin/staff).
 * Individual route groups add a 'permission:X' middleware for finer-grained RBAC.
 *
 * Route groups:
 *   permission:manage-portal-credentials — generate, send, suspend, reactivate student portal logins.
 *                                          NOTE: this permission slug is not present in
 *                                          database/seeders/RolePermissionSeeder.php, so no role
 *                                          currently has it — this group is effectively
 *                                          inaccessible until the seeder is updated. Pre-existing,
 *                                          left as-is (out of scope for a routing cleanup).
 *   permission:manage-exam-results       — upload CSV scores, rank results, send result emails,
 *                                          bulk-update applicant statuses (Exam Passed / Exam Failed)
 *   (no extra permission)                — enrollment dashboard, onsite enrollment wizard, audit log
 *                                          TODO: no permission:X gate exists for this group yet.
 *
 * This file is included by routes/web.php via require __DIR__.'/admissions.php'.
 */

use App\Http\Controllers\Admissions\EnrollmentController;
use App\Http\Controllers\Admissions\ExamResultsController;
use App\Http\Controllers\Admissions\PortalCredentialController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified'])->prefix('admin')->name('admin.')->group(function () {

    // ===== PORTAL CREDENTIAL ROUTES =====
    Route::middleware(['permission:manage-portal-credentials'])->prefix('portal-credentials')->name('portal-credentials.')->group(function () {
        Route::get('/', [PortalCredentialController::class, 'index'])->name('index');
        Route::get('/{application}/create', [PortalCredentialController::class, 'create'])->name('create');
        Route::post('/', [PortalCredentialController::class, 'store'])->name('store');
        Route::get('/{credential}', [PortalCredentialController::class, 'show'])->name('show');
        Route::post('/{credential}/send', [PortalCredentialController::class, 'send'])->name('send');
        Route::post('/{credential}/resend', [PortalCredentialController::class, 'resend'])->name('resend');
        Route::post('/{credential}/suspend', [PortalCredentialController::class, 'suspend'])->name('suspend');
        Route::post('/{credential}/reactivate', [PortalCredentialController::class, 'reactivate'])->name('reactivate');
    });

    // ===== EXAM RESULTS ROUTES =====
    Route::middleware(['permission:manage-exam-results'])->prefix('exam-results')->name('exam-results.')->group(function () {
        Route::get('/', [ExamResultsController::class, 'index'])->name('index');
        Route::get('/upload', [ExamResultsController::class, 'create'])->name('upload');
        Route::post('/upload', [ExamResultsController::class, 'store'])->name('store');
        Route::post('/upload/confirm', [ExamResultsController::class, 'confirmStore'])->name('confirm');
        Route::post('/update-rankings', [ExamResultsController::class, 'updateRankings'])->name('update-rankings');
        Route::post('/update-all', [ExamResultsController::class, 'updateAll'])->name('update-all');
        Route::post('/settings', [ExamResultsController::class, 'updateSettings'])->name('settings');
        Route::post('/send-all', [ExamResultsController::class, 'sendAllResults'])->name('send-all');
        Route::post('/update-statuses', [ExamResultsController::class, 'updateApplicantStatuses'])->name('update-statuses');
        Route::post('/{result}/send', [ExamResultsController::class, 'sendResult'])->name('send');
        Route::post('/{result}/update-status', [ExamResultsController::class, 'updateApplicantStatus'])->name('update-status');
    });

    // ===== ENROLLMENT ROUTES =====
    Route::prefix('enrollment')->name('enrollment.')->group(function () {
        Route::get('/dashboard', [EnrollmentController::class, 'dashboard'])->name('dashboard');
        Route::get('/report', [EnrollmentController::class, 'report'])->name('report');
        Route::get('/{applicant}', [EnrollmentController::class, 'show'])->name('show');
        Route::post('/{applicant}/enroll', [EnrollmentController::class, 'enroll'])->name('enroll');
        Route::post('/{applicant}/revert-to-pending', [EnrollmentController::class, 'revertToPending'])->name('revert-to-pending');
        Route::post('/{applicant}/withdraw', [EnrollmentController::class, 'withdraw'])->name('withdraw');
        Route::get('/{applicant}/audit-log', [EnrollmentController::class, 'auditLog'])->name('audit-log');
    });
});
