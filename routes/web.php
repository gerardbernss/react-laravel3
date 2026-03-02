<?php

use App\Http\Controllers\Admissions\ApplicantController2;
use App\Http\Controllers\Admissions\ApplicantController;
use App\Http\Controllers\Admin\ApplicantExamAssignmentController;
use App\Http\Controllers\Admin\BlockSectionsController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\AttendanceController;
use App\Http\Controllers\Admin\GradesController;
use App\Http\Controllers\Admin\DiscountTypeController;
use App\Http\Controllers\Admin\ExaminationRoomsController;
use App\Http\Controllers\Admin\ExamSchedulesController;
use App\Http\Controllers\Admin\FeeRateController;
use App\Http\Controllers\Admin\FeeTypeController;
use App\Http\Controllers\Admin\PermissionController;
use App\Http\Controllers\Admin\RolesController;
use App\Http\Controllers\Admin\ProgramsController;
use App\Http\Controllers\Admin\SubjectsController;
use App\Http\Controllers\Student\StudentIDController;
use App\Http\Controllers\Admin\UsersController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

// Login Demo Page
Route::get('/login-demo', function () {
    return Inertia::render('LoginDemo');
})->name('login-demo');

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

    Route::post('/apply-shs', [ApplicantController2::class, 'storeSHS'])->name('applications.shs.store');
    Route::post('/apply-jhs', [ApplicantController2::class, 'storeJHS'])->name('applications.jhs.store');
    Route::post('/apply-les', [ApplicantController2::class, 'storeLES'])->name('applications.les.store');

    Route::post('/check-email', [ApplicantController2::class, 'checkEmail'])->name('check-email');

    // Route::get('/create', [ApplicantController2::class, 'create'])->name('create');
    // Route::post('/applicants', [ApplicantController2::class, 'store'])->name('store');
    Route::get('/success', [ApplicantController2::class, 'success'])->name('success');
});

/**
 * AUTHENTICATED ROUTES
 */
Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');

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
        Route::post('/admissions/applicants/{id}/send-final-result', [ApplicantController::class, 'sendFinalResult'])->name('applicants.send-final-result');
        Route::post('/admissions/applicants/{id}/send-confirmation-email', [ApplicantController::class, 'sendConfirmationEmail'])->name('applicants.send-confirmation-email');
        Route::post('/admissions/applicants/{id}/send-portal-password', [ApplicantController::class, 'sendPortalPassword'])->name('applicants.send-portal-password');

        Route::get('/view-document/{path}', function ($path) {
            $decodedPath = base64_decode($path);
            $filename    = basename($decodedPath);
            $fullPath    = storage_path('app/public/documents/' . $filename);

            if (! file_exists($fullPath)) {
                abort(404, 'Document not found');
            }

            return response()->file($fullPath);
        })->name('view.document');

    });

    // student ID management --ADMIN
    Route::middleware(['permission:manage-student-id-assignment'])->group(function (): void {
        Route::get('/studentidassignment', [StudentIDController::class, 'index'])->name('studentidassignment.index');
        Route::post('/studentidassignment', [StudentIDController::class, 'assignStudentId'])->name('studentidassignment.assignStudentId');
        Route::post('/studentidassignment/{id}/email-admission', [StudentIDController::class, 'emailStudentID'])->name('studentidassignment.emailStudentID');

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

    // Subject Management Routes
    Route::resource('subjects', SubjectsController::class);
    Route::post('/subjects/{subject}/toggle-status', [SubjectsController::class, 'toggleStatus'])->name('subjects.toggle-status');

    // Block Section Management Routes
    Route::resource('block-sections', BlockSectionsController::class);
    Route::post('/block-sections/{blockSection}/toggle-status', [BlockSectionsController::class, 'toggleStatus'])->name('block-sections.toggle-status');

    // Program Management Routes
    Route::resource('programs', ProgramsController::class);
    Route::post('/programs/{program}/toggle-status', [ProgramsController::class, 'toggleStatus'])->name('programs.toggle-status');

    // Examination Rooms Management Routes
    Route::resource('examination-rooms', ExaminationRoomsController::class);
    Route::get('/api/examination-rooms/active', [ExaminationRoomsController::class, 'getActiveRooms'])->name('examination-rooms.active');

    // Exam Schedules Management Routes
    Route::resource('exam-schedules', ExamSchedulesController::class);
    Route::get('/api/exam-schedules/available', [ExamSchedulesController::class, 'getAvailableSchedules'])->name('exam-schedules.available');

    // Exam Assignments Management Routes
    Route::get('/exam-assignments', [ApplicantExamAssignmentController::class, 'index'])->name('exam-assignments.index');
    Route::get('/exam-assignments/create', [ApplicantExamAssignmentController::class, 'create'])->name('exam-assignments.create');
    Route::post('/exam-assignments', [ApplicantExamAssignmentController::class, 'store'])->name('exam-assignments.store');
    Route::post('/exam-assignments/bulk', [ApplicantExamAssignmentController::class, 'bulkStore'])->name('exam-assignments.bulk-store');
    Route::patch('/exam-assignments/{assignment}/status', [ApplicantExamAssignmentController::class, 'updateStatus'])->name('exam-assignments.update-status');
    Route::delete('/exam-assignments/{assignment}', [ApplicantExamAssignmentController::class, 'destroy'])->name('exam-assignments.destroy');

    // Grades Management Routes
    Route::middleware(['permission:view-grades'])->group(function () {
        Route::get('/grades', [GradesController::class, 'index'])->name('grades.index');
        Route::get('/grades/{blockSection}', [GradesController::class, 'show'])->name('grades.show');
    });

    Route::middleware(['permission:manage-grades'])->group(function () {
        Route::put('/grades/{blockSection}', [GradesController::class, 'update'])->name('grades.update');
    });

    // Attendance Management Routes
    Route::middleware(['permission:view-attendance'])->group(function () {
        Route::get('/attendance', [AttendanceController::class, 'index'])->name('attendance.index');
        Route::get('/attendance/{blockSection}', [AttendanceController::class, 'show'])->name('attendance.show');
    });

    Route::middleware(['permission:manage-attendance'])->group(function () {
        Route::post('/attendance/{blockSection}', [AttendanceController::class, 'store'])->name('attendance.store');
    });

    // Fee Management Routes
    Route::prefix('admin')->name('admin.')->group(function () {
        // Fee Types
        Route::resource('fee-types', FeeTypeController::class);
        Route::post('/fee-types/{feeType}/toggle-status', [FeeTypeController::class, 'toggleStatus'])->name('fee-types.toggle-status');

        // Fee Rates
        Route::resource('fee-rates', FeeRateController::class);
        Route::post('/fee-rates/{feeRate}/toggle-status', [FeeRateController::class, 'toggleStatus'])->name('fee-rates.toggle-status');
        Route::post('/fee-rates/copy-from-year', [FeeRateController::class, 'copyFromYear'])->name('fee-rates.copy-from-year');

        // Discount Types
        Route::resource('discount-types', DiscountTypeController::class);
        Route::post('/discount-types/{discountType}/toggle-status', [DiscountTypeController::class, 'toggleStatus'])->name('discount-types.toggle-status');
    });
});

// Admission management routes
require __DIR__ . '/admissions.php';

// Student portal routes
require __DIR__ . '/student.php';

require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
