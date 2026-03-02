<?php

use App\Http\Controllers\Admissions\EnrollmentController;
use App\Http\Controllers\Admissions\PortalCredentialController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified'])->group(function () {

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
        Route::post('/{credential}/reset-password', [PortalCredentialController::class, 'resetPassword'])->name('reset-password');
        Route::get('/statistics', [PortalCredentialController::class, 'statistics'])->name('statistics');
    });

    // ===== ENROLLMENT ROUTES =====
    Route::prefix('enrollment')->name('enrollment.')->group(function () {
        Route::get('/dashboard', [EnrollmentController::class, 'dashboard'])->name('dashboard');
        Route::get('/report', [EnrollmentController::class, 'report'])->name('report');
        Route::get('/{applicant}', [EnrollmentController::class, 'show'])->name('show');
        Route::post('/{applicant}/enroll', [EnrollmentController::class, 'enroll'])->name('enroll');
        Route::post('/{applicant}/revert-to-pending', [EnrollmentController::class, 'revertToPending'])->name('revert-to-pending');
        Route::get('/{applicant}/audit-log', [EnrollmentController::class, 'auditLog'])->name('audit-log');
    });
});
