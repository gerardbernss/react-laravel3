<?php

use App\Http\Controllers\AssessmentController;
use App\Http\Controllers\EnrollmentController;
use App\Http\Controllers\EntranceExamController;
use App\Http\Controllers\PortalCredentialController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified'])->group(function () {

    // ===== ENTRANCE EXAM ROUTES =====
    Route::prefix('entrance-exams')->name('entrance-exams.')->group(function () {
        Route::get('/', [EntranceExamController::class, 'index'])->name('index');
        Route::get('/{application}/create', [EntranceExamController::class, 'create'])->name('create');
        Route::post('/', [EntranceExamController::class, 'store'])->name('store');
        Route::get('/{entranceExam}', [EntranceExamController::class, 'show'])->name('show');
        Route::get('/{entranceExam}/edit', [EntranceExamController::class, 'edit'])->name('edit');
        Route::put('/{entranceExam}', [EntranceExamController::class, 'update'])->name('update');
        Route::get('/{entranceExam}/record-results', [EntranceExamController::class, 'recordResults'])->name('record-results');
        Route::post('/{entranceExam}/results', [EntranceExamController::class, 'storeResults'])->name('store-results');
        Route::post('/{entranceExam}/cancel', [EntranceExamController::class, 'cancel'])->name('cancel');
        Route::post('/{entranceExam}/no-show', [EntranceExamController::class, 'noShow'])->name('no-show');
        Route::get('/statistics', [EntranceExamController::class, 'statistics'])->name('statistics');
    });

    // ===== ASSESSMENT ROUTES =====
    Route::prefix('assessments')->name('assessments.')->group(function () {
        Route::get('/', [AssessmentController::class, 'index'])->name('index');
        Route::get('/{application}/create', [AssessmentController::class, 'create'])->name('create');
        Route::post('/', [AssessmentController::class, 'store'])->name('store');
        Route::get('/{assessment}', [AssessmentController::class, 'show'])->name('show');
        Route::get('/{assessment}/edit', [AssessmentController::class, 'edit'])->name('edit');
        Route::put('/{assessment}', [AssessmentController::class, 'update'])->name('update');
        Route::delete('/{assessment}', [AssessmentController::class, 'destroy'])->name('destroy');
        Route::get('/statistics', [AssessmentController::class, 'statistics'])->name('statistics');
    });

    // ===== PORTAL CREDENTIAL ROUTES =====
    Route::prefix('portal-credentials')->name('portal-credentials.')->group(function () {
        Route::get('/', [PortalCredentialController::class, 'index'])->name('index');
        Route::get('/{application}/create', [PortalCredentialController::class, 'create'])->name('create');
        Route::post('/', [PortalCredentialController::class, 'store'])->name('store');
        Route::get('/{credential}', [PortalCredentialController::class, 'show'])->name('show');
        Route::post('/{credential}/send', [PortalCredentialController::class, 'send'])->name('send');
        Route::post('/{credential}/resend', [PortalCredentialController::class, 'resend'])->name('resend');
        Route::post('/{credential}/suspend', [PortalCredentialController::class, 'suspend'])->name('suspend');
        Route::post('/{credential}/reactivate', [PortalCredentialController::class, 'reactivate'])->name('reactivate');
        Route::post('/{credential}/reset-password', [PortalCredentialController::class, 'resetPassword'])->name('reset-password');
        Route::get('/statistics', [PortalCredentialController::class, 'statistics'])->name('statistics');
    });

    // ===== ENROLLMENT ROUTES =====
    Route::prefix('enrollment')->name('enrollment.')->group(function () {
        Route::get('/dashboard', [EnrollmentController::class, 'dashboard'])->name('dashboard');
        Route::get('/{student}', [EnrollmentController::class, 'show'])->name('show');
        Route::post('/{student}/activate-portal', [EnrollmentController::class, 'activatePortal'])->name('activate-portal');
        Route::post('/{student}/deactivate-portal', [EnrollmentController::class, 'deactivatePortal'])->name('deactivate-portal');
        Route::post('/{student}/complete', [EnrollmentController::class, 'complete'])->name('complete');
        Route::get('/{student}/audit-log', [EnrollmentController::class, 'auditLog'])->name('audit-log');
        Route::get('/report', [EnrollmentController::class, 'report'])->name('report');
    });
});
