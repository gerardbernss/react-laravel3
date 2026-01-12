<?php

use App\Http\Controllers\ApplicantController2;
use App\Http\Controllers\ApplicantController;
use App\Http\Controllers\PermissionController;
use App\Http\Controllers\RolesController;
use App\Http\Controllers\StudentIDController;
use App\Http\Controllers\UsersController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

// Test CORS headers
Route::get('/test-cors', function () {
    return response()->json(['message' => 'CORS test successful'], 200);
});

/**
 * PUBLIC ROUTES (Guest Application)
 * These routes are accessible without authentication
 */
Route::prefix('applications')->name('applications.')->group(function () {
    Route::get('/start', [ApplicantController2::class, 'start'])->name('applications.start');
    Route::get('/apply-shs', [ApplicantController2::class, 'createSHS'])->name('applications.shs');
    Route::get('/apply-jhs', [ApplicantController2::class, 'createJHS'])->name('applications.jhs');
    Route::get('/apply-les', [ApplicantController2::class, 'createLES'])->name('applications.les');

    Route::post('/apply-shs', [ApplicantController2::class, 'storeSHS'])->name('applications.shs.store')->middleware('throttle:3,1');
    Route::post('/apply-jhs', [ApplicantController2::class, 'storeJHS'])->name('applications.jhs.store')->middleware('throttle:3,1');
    Route::post('/apply-les', [ApplicantController2::class, 'storeLES'])->name('applications.les.store')->middleware('throttle:3,1');

    // Route::get('/create', [ApplicantController2::class, 'create'])->name('create');
    // Route::post('/applicants', [ApplicantController2::class, 'store'])->name('store');
    Route::get('/success', [ApplicantController2::class, 'success'])->name('success');
});

/**
 * AUTHENTICATED ROUTES
 */
Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');

    // applicant management
    Route::middleware(['permission:manage-applications'])->group(function () {
        // Route::put('/applications/applicants/generate-pdf', [YourController::class, 'generatePdf'])->name('applications.applicants.generatePdf');

        Route::get('/admissions/applicants/create', [ApplicantController::class, 'create'])->name('applicants.create');
        Route::post('/admissions/applicants', [ApplicantController::class, 'store'])->name('applicants.store');
        Route::get('/admissions/applicants', [ApplicantController::class, 'index'])->name('applicants.index');
        Route::get('/admissions/applicants/{id}/show', [ApplicantController::class, 'show'])->name('applicants.show');
        Route::get('/admissions/applicants/{id}/edit', [ApplicantController::class, 'edit'])->name('applicants.edit');
        Route::put('/admissions/applicants/{id}', [ApplicantController::class, 'update'])->name('applicants.update');
        Route::delete('/admissions/applicants/{id}', [ApplicantController::class, 'destroy'])->name('applicants.destroy');
        Route::get('/view-document/{path}', function ($path) {
            // Verify user is admin

            $decodedPath = base64_decode($path);

            // Files are in storage/app/public/documents
            // Remove "documents/" from the path since we'll add it back
            $filename = basename($decodedPath);
            $fullPath = storage_path('app/public/documents/' . $filename);

            if (! file_exists($fullPath)) {
                abort(404, 'Document not found');
            }

            return response()->file($fullPath);
        })->name('view.document');

    });

    /*/ applications management --ADMIN
    Route::middleware(['permission:manage-applications'])->group(function () {
        Route::post('/applications/applicants', [ApplicantController2::class, 'store'])->name('applications.store');
        Route::get('/applications/applicants', [ApplicantController2::class, 'index'])->name('applications.index');
        Route::get('/applications/applicants/{id}/show', [ApplicantController2::class, 'show'])->name('applications.show');
        Route::get('/applications/applicants/{id}/edit', [ApplicantController2::class, 'edit'])->name('applications.edit');
        Route::put('/applications/applicants/{id}', [ApplicantController2::class, 'update'])->name('applications.update');
        Route::delete('/applications/applicants/{id}', [ApplicantController2::class, 'destroy'])->name('applications.destroy');
        Route::get('/applications/success', [ApplicantController2::class, 'success'])
            ->name('applications.success');
    }); */

    // student ID management --ADMIN
    Route::middleware(['permission:manage-student-id-assignment'])->group(function (): void {
        Route::get('/studentidassignment', [StudentIDController::class, 'index'])->name('studentidassignment.index');
        Route::post('/studentidassignment', [StudentIDController::class, 'assignStudentId'])->name('studentidassignment.assignStudentId');
        Route::get('/studentidassignment/{id}/email-admission', [StudentIDController::class, 'emailStudentID'])->name('studentidassignment.emailStudentID');

    });

    Route::middleware(['permission:create-users'])->group(function () {
        Route::get('/users/create', [UsersController::class, 'create'])->name('users.create');
        Route::post('/users', [UsersController::class, 'store'])->name('users.store');
    });

    // User Management Routes
    Route::middleware(['permission:view-users'])->group(function () {
        Route::get('/users', [UsersController::class, 'index'])->name('users.index');
        Route::get('/users/{user}/edit', [UsersController::class, 'edit'])->name('users.edit');
    });

    Route::middleware(['permission:update-users'])->group(function () {
        Route::put('/users/{user}', [UsersController::class, 'update'])->name('users.update');
    });

    Route::middleware(['permission:delete-users'])->group(function () {
        Route::delete('/users/{user}', [UsersController::class, 'destroy'])->name('users.destroy');
    });

    Route::middleware(['permission:assign-roles'])->group(function () {
        Route::post('/users/{user}/assign-role', [UsersController::class, 'assignRole'])->name('users.assign-role');
        Route::post('/users/{user}/remove-role', [UsersController::class, 'removeRole'])->name('users.remove-role');
    });

    Route::middleware(['permission:create-roles'])->group(function () {
        Route::get('/roles/create', [RolesController::class, 'create'])->name('roles.create');
        Route::post('/roles', [RolesController::class, 'store'])->name('roles.store');
    });

    // Role Management Routes
    Route::middleware(['permission:view-roles'])->group(function () {
        Route::get('/roles', [RolesController::class, 'index'])->name('roles.index');
        Route::get('/roles/{role}', [RolesController::class, 'show'])->name('roles.show');
        Route::get('/roles/{role}/edit', [RolesController::class, 'edit'])->name('roles.edit');
    });

    Route::middleware(['permission:update-roles'])->group(function () {
        Route::put('/roles/{role}', [RolesController::class, 'update'])->name('roles.update');
    });

    Route::middleware(['permission:delete-roles'])->group(function () {
        Route::delete('/roles/{role}', [RolesController::class, 'destroy'])->name('roles.destroy');
    });

    Route::middleware(['permission:assign-permissions'])->group(function () {
        Route::post('/roles/{role}/assign-permission', [RolesController::class, 'assignPermission'])->name('roles.assign-permission');
        Route::post('/roles/{role}/remove-permission', [RolesController::class, 'removePermission'])->name('roles.remove-permission');
    });

    Route::middleware(['permission:create-permissions'])->group(function () {
        Route::get('/permissions/create', [PermissionController::class, 'create'])->name('permissions.create');
        Route::post('/permissions', [PermissionController::class, 'store'])->name('permissions.store');
    });

    // Permission Management Routes
    Route::middleware(['permission:view-permissions'])->group(function () {
        Route::get('/permissions', [PermissionController::class, 'index'])->name('permissions.index');
        Route::get('/permissions/{permission}', [PermissionController::class, 'show'])->name('permissions.show');
        Route::get('/permissions/{permission}/edit', [PermissionController::class, 'edit'])->name('permissions.edit');
    });

    Route::middleware(['permission:update-permissions'])->group(function () {
        Route::put('/permissions/{permission}', [PermissionController::class, 'update'])->name('permissions.update');
    });

    Route::middleware(['permission:delete-permissions'])->group(function () {
        Route::delete('/permissions/{permission}', [PermissionController::class, 'destroy'])->name('permissions.destroy');
    });
});

require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
