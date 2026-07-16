<?php

/**
 * Web routes — admin, staff, faculty, and public-facing pages.
 *
 * Middleware groups used in this file:
 *   (none)          — PUBLIC: accessible without authentication
 *   auth + verified — AUTHENTICATED: requires login and email verification
 *   permission:X    — RBAC: requires the named permission slug on the user's role(s)
 *
 * URL / name structure:
 *   /admin/*   ↔ admin.*    — admin & staff panel (RBAC via permission:X where already present)
 *   /teacher/* ↔ teacher.*  — gradebook, attendance, conduct, reports (RBAC via permission:X)
 *   /applications/* ↔ applications.* — public online-application intake forms (no auth)
 *
 * Academic-structure and finance admin.* groups below are gated by broader,
 * area-level permissions (manage-academic-structure, manage-students,
 * manage-enrollment-periods, manage-examinations, manage-finance,
 * manage-announcements) rather than one slug per resource — see
 * database/seeders/RolePermissionSeeder.php.
 *
 * Admissions-specific routes (portal credentials, exam results, enrollment dashboard)
 * are in routes/admissions.php, student portal routes in routes/student.php,
 * and auth routes (login, register, password reset) in routes/auth.php.
 *
 * All admin/teacher routes require the 'web' guard (User model). Student portal uses the
 * separate 'student' guard (PortalCredential model) defined in routes/student.php.
 */

use App\Http\Controllers\Admissions\ApplicationController;
use App\Http\Controllers\Admissions\ApplicantController;
use App\Http\Controllers\Admin\ApplicantExamAssignmentController;
use App\Http\Controllers\Admin\BlockSectionsController;
use App\Http\Controllers\Admin\StudentsController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\EnrollmentPeriodController;
use App\Http\Controllers\Admin\AttendanceController;
use App\Http\Controllers\Admin\GradebookController;
use App\Http\Controllers\Admin\ReportController;
use App\Http\Controllers\Admin\GradeValidationController;
use App\Http\Controllers\Admin\ConductCategoryController;
use App\Http\Controllers\Admin\ConductGradeController;
use App\Http\Controllers\Admin\MyStudentsController;
use App\Http\Controllers\Admin\DiscountTypeController;
use App\Http\Controllers\Admin\ExaminationRoomsController;
use App\Http\Controllers\Admin\ExamSchedulesController;
use App\Http\Controllers\Admin\FeeController;
use App\Http\Controllers\Admin\PermissionController;
use App\Http\Controllers\Admin\RolesController;
use App\Http\Controllers\Admin\ProgramsController;
use App\Http\Controllers\Admin\SubjectsController;
use App\Http\Controllers\Admin\SubjectSchedulesController;
use App\Http\Controllers\Student\StudentIDController;
use App\Http\Controllers\Admin\AnnouncementsController;
use App\Http\Controllers\Admin\SemesterPeriodController;
use App\Http\Controllers\Admin\StudentAssessmentsController;
use App\Http\Controllers\Admin\EmployeeController;
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
    Route::get('/start', [ApplicationController::class, 'start'])->name('start');
    Route::get('/apply-shs', [ApplicationController::class, 'createSHS'])->name('shs');
    Route::get('/apply-jhs', [ApplicationController::class, 'createJHS'])->name('jhs');
    Route::get('/apply-les', [ApplicationController::class, 'createLES'])->name('les');

    Route::post('/apply-shs', [ApplicationController::class, 'storeSHS'])->name('shs.store');
    Route::post('/apply-jhs', [ApplicationController::class, 'storeJHS'])->name('jhs.store');
    Route::post('/apply-les', [ApplicationController::class, 'storeLES'])->name('les.store');

    Route::post('/check-email', [ApplicationController::class, 'checkEmail'])->middleware('throttle:10,1')->name('check-email');
    Route::get('/success', [ApplicationController::class, 'success'])->name('success');
});

/**
 * AUTHENTICATED ROUTES
 */
Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');

    /**
     * ===================== ADMIN PANEL (/admin/*) =====================
     */
    Route::prefix('admin')->name('admin.')->group(function () {

        // Applicant management
        Route::middleware(['permission:manage-applications'])->prefix('applicants')->name('applicants.')->group(function () {
            Route::get('/create', [ApplicantController::class, 'create'])->name('create');
            Route::post('/', [ApplicantController::class, 'store'])->name('store');
            Route::get('/', [ApplicantController::class, 'index'])->name('index');
            Route::get('/{id}', [ApplicantController::class, 'show'])->name('show');
            Route::get('/{id}/edit', [ApplicantController::class, 'edit'])->name('edit');
            Route::put('/{id}', [ApplicantController::class, 'update'])->name('update');
            Route::delete('/{id}', [ApplicantController::class, 'destroy'])->name('destroy');
            Route::post('/{id}/send-final-result', [ApplicantController::class, 'sendFinalResult'])->name('send-final-result');
            Route::post('/{id}/send-confirmation-email', [ApplicantController::class, 'sendConfirmationEmail'])->name('send-confirmation-email');
            Route::post('/{id}/send-portal-password', [ApplicantController::class, 'sendPortalPassword'])->name('send-portal-password');
            Route::post('/{id}/evaluate', [ApplicantController::class, 'evaluate'])->name('evaluate');
            Route::get('/{id}/enroll', [ApplicantController::class, 'enrollPage'])->name('enroll.page');
            Route::post('/{id}/enroll', [ApplicantController::class, 'enroll'])->name('enroll');

            Route::get('/documents/{path}', function ($path) {
                $filename = basename(base64_decode($path));

                abort_unless(
                    \App\Models\ApplicantDocuments::whereRaw("file_path LIKE ?", ["%{$filename}"], 'and')->exists(),
                    404
                );

                $fullPath = storage_path('app/public/documents/' . $filename);
                abort_unless(file_exists($fullPath), 404);

                return response()->file($fullPath);
            })->name('documents.show');
        });

        // Employee management
        Route::middleware(['permission:manage-employees'])->group(function () {
            Route::resource('employees', EmployeeController::class);
        });

        // Student ID assignment
        Route::middleware(['permission:manage-student-id-assignment'])->prefix('student-id-assignment')->name('student-id-assignment.')->group(function (): void {
            Route::get('/', [StudentIDController::class, 'index'])->name('index');
            Route::post('/', [StudentIDController::class, 'assignStudentId'])->name('store');
            Route::post('/bulk-generate', [StudentIDController::class, 'bulkGenerate'])->name('bulk-generate');
            Route::post('/{id}/email-admission', [StudentIDController::class, 'emailStudentID'])->name('email-admission');
        });

        // User management
        Route::middleware(['permission:create-users'])->group(function () {
            Route::get('/users/create', [UsersController::class, 'create'])->name('users.create');
            Route::post('/users', [UsersController::class, 'store'])->name('users.store');
        });

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

        // Role management
        Route::middleware(['permission:create-roles'])->group(function () {
            Route::get('/roles/create', [RolesController::class, 'create'])->name('roles.create');
            Route::post('/roles', [RolesController::class, 'store'])->name('roles.store');
        });

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

        // Permission management
        Route::middleware(['permission:create-permissions'])->group(function () {
            Route::get('/permissions/create', [PermissionController::class, 'create'])->name('permissions.create');
            Route::post('/permissions', [PermissionController::class, 'store'])->name('permissions.store');
        });

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

        // Academic structure: subjects, subject schedules, block sections, programs
        Route::middleware(['permission:manage-academic-structure'])->group(function () {
            // Subject management
            Route::resource('subjects', SubjectsController::class);
            Route::post('/subjects/{subject}/toggle-status', [SubjectsController::class, 'toggleStatus'])->name('subjects.toggle-status');

            // Subject schedule management
            Route::resource('subject-schedules', SubjectSchedulesController::class)->except(['show']);

            // Block section management
            Route::resource('block-sections', BlockSectionsController::class);
            Route::post('/block-sections/copy-year', [BlockSectionsController::class, 'copyToNewYear'])->name('block-sections.copy-year');
            Route::post('/block-sections/{blockSection}/toggle-status', [BlockSectionsController::class, 'toggleStatus'])->name('block-sections.toggle-status');
            Route::post('/block-sections/{blockSection}/add-student', [BlockSectionsController::class, 'addStudent'])->name('block-sections.add-student');
            Route::delete('/block-sections/{blockSection}/students/{studentEnrollment}', [BlockSectionsController::class, 'removeStudent'])->name('block-sections.remove-student');

            // Program management
            Route::resource('programs', ProgramsController::class)->except(['show']);
            Route::post('/programs/{program}/toggle-status', [ProgramsController::class, 'toggleStatus'])->name('programs.toggle-status');
        });

        // Student management (URL now matches route name: /admin/students ↔ admin.students.*)
        Route::middleware(['permission:manage-students'])->group(function () {
            Route::resource('students', StudentsController::class);
            Route::post('/students/{student}/withdraw', [StudentsController::class, 'withdraw'])->name('students.withdraw');
        });

        // Enrollment period management
        Route::middleware(['permission:manage-enrollment-periods'])->prefix('enrollment-periods')->name('enrollment-periods.')->group(function () {
            Route::get('/', [EnrollmentPeriodController::class, 'index'])->name('index');
            Route::post('/', [EnrollmentPeriodController::class, 'store'])->name('store');
            Route::put('/{period}', [EnrollmentPeriodController::class, 'update'])->name('update');
            Route::post('/{period}/open', [EnrollmentPeriodController::class, 'open'])->name('open');
            Route::post('/{period}/close', [EnrollmentPeriodController::class, 'close'])->name('close');
            Route::post('/{period}/generate-assessments', [EnrollmentPeriodController::class, 'generateAssessments'])->name('generate-assessments');
            Route::delete('/{period}', [EnrollmentPeriodController::class, 'destroy'])->name('destroy');
        });

        // Examinations: rooms, schedules, applicant exam assignments
        Route::middleware(['permission:manage-examinations'])->group(function () {
            // Examination room management — static "active" route must precede the
            // resource's {examination_room} show route, or "active" would be parsed as an ID.
            Route::get('/examination-rooms/active', [ExaminationRoomsController::class, 'getActiveRooms'])->name('examination-rooms.active');
            Route::resource('examination-rooms', ExaminationRoomsController::class);

            // Exam schedule management — same static-before-resource ordering as above.
            Route::get('/exam-schedules/available', [ExamSchedulesController::class, 'getAvailableSchedules'])->name('exam-schedules.available');
            Route::resource('exam-schedules', ExamSchedulesController::class);

            // Exam assignment management
            Route::prefix('exam-assignments')->name('exam-assignments.')->group(function () {
                Route::get('/', [ApplicantExamAssignmentController::class, 'index'])->name('index');
                Route::get('/create', [ApplicantExamAssignmentController::class, 'create'])->name('create');
                Route::post('/', [ApplicantExamAssignmentController::class, 'store'])->name('store');
                Route::post('/bulk', [ApplicantExamAssignmentController::class, 'bulkStore'])->name('bulk-store');
                Route::patch('/{assignment}/status', [ApplicantExamAssignmentController::class, 'updateStatus'])->name('update-status');
                Route::post('/{assignment}/mark-result', [ApplicantExamAssignmentController::class, 'markResult'])->name('mark-result');
                Route::delete('/{assignment}', [ApplicantExamAssignmentController::class, 'destroy'])->name('destroy');
            });
        });

        // Finance: fees, discount types, semester periods, fee assessments & payments
        Route::middleware(['permission:manage-finance'])->group(function () {
            // Fee management
            Route::post('/fees/copy-from-year', [FeeController::class, 'copyFromYear'])->name('fees.copy-from-year');
            Route::resource('fees', FeeController::class)->except(['show']);
            Route::post('/fees/{fee}/toggle-status', [FeeController::class, 'toggleStatus'])->name('fees.toggle-status');

            // Discount types
            Route::resource('discount-types', DiscountTypeController::class);
            Route::post('/discount-types/{discountType}/toggle-status', [DiscountTypeController::class, 'toggleStatus'])->name('discount-types.toggle-status');

            // Semester periods
            Route::get('/semester-periods', [SemesterPeriodController::class, 'index'])->name('semester-periods.index');
            Route::put('/semester-periods/{semesterPeriod}', [SemesterPeriodController::class, 'update'])->name('semester-periods.update');

            // Fee assessments & payments (formerly "finance/assessments")
            Route::prefix('fee-assessments')->name('fee-assessments.')->group(function () {
                Route::get('/', [StudentAssessmentsController::class, 'index'])->name('index');
                Route::get('/{assessment}', [StudentAssessmentsController::class, 'show'])->name('show');
                Route::post('/{assessment}/payments', [StudentAssessmentsController::class, 'processPayment'])->name('payments.store');
                Route::put('/{assessment}/payments/{payment}', [StudentAssessmentsController::class, 'updatePayment'])->name('payments.update');
                Route::delete('/{assessment}/payments/{payment}', [StudentAssessmentsController::class, 'deletePayment'])->name('payments.destroy');
                Route::patch('/{assessment}/minimum-amount', [StudentAssessmentsController::class, 'updateMinimumAmount'])->name('minimum-amount');
                Route::post('/{assessment}/sync-status', [StudentAssessmentsController::class, 'syncStatus'])->name('sync-status');
                Route::get('/{assessment}/debug', [StudentAssessmentsController::class, 'debugStatus'])->name('debug');
            });
        });

        // Announcements
        Route::middleware(['permission:manage-announcements'])->group(function () {
            Route::resource('announcements', AnnouncementsController::class);
        });
    });

    /**
     * ===================== TEACHER PANEL (/teacher/*) =====================
     * Gradebook, attendance, conduct, and reports — used by faculty/evaluators.
     * Gated by the same granular permission:X middleware as before; only the
     * URL/name namespace changed.
     */
    Route::prefix('teacher')->name('teacher.')->group(function () {

        Route::middleware(['permission:view-grades'])->group(function () {
            Route::get('/my-students/{blockSection}', [MyStudentsController::class, 'show'])->name('my-students.show');
        });

        // Gradebook — static paths must come before {blockSection} catch-all
        Route::middleware(['permission:view-grades'])->group(function () {
            Route::get('/gradebook', [GradebookController::class, 'index'])->name('gradebook.index');
            Route::get('/gradebook/validations', [GradeValidationController::class, 'index'])->name('gradebook.validations.index');
            Route::get('/gradebook/validations/{blockSection}', [GradeValidationController::class, 'show'])->name('gradebook.validations.show');
            Route::get('/gradebook/{blockSection}', [GradebookController::class, 'show'])->name('gradebook.show');
            Route::get('/gradebook/{blockSection}/{subject}/{quarter}/components', [GradebookController::class, 'components'])->name('gradebook.components');
            Route::get('/gradebook/{blockSection}/{subject}/{quarter}/entry', [GradebookController::class, 'entry'])->name('gradebook.entry');
        });

        Route::middleware(['permission:manage-grades'])->group(function () {
            Route::post('/gradebook/components', [GradebookController::class, 'storeComponent'])->name('gradebook.components.store');
            Route::delete('/gradebook/components/{component}', [GradebookController::class, 'deleteComponent'])->name('gradebook.components.destroy');
            Route::put('/gradebook/{blockSection}/{subject}/{quarter}/scores', [GradebookController::class, 'saveScores'])->name('gradebook.scores.save');
        });

        Route::middleware(['permission:submit-grades'])->group(function () {
            Route::post('/gradebook/{blockSection}/{subject}/{quarter}/submit', [GradeValidationController::class, 'submit'])->name('gradebook.validations.submit');
        });

        Route::middleware(['permission:finalize-grades'])->group(function () {
            Route::post('/gradebook/validations/{gradeValidation}/finalize', [GradeValidationController::class, 'finalize'])->name('gradebook.validations.finalize');
            Route::post('/gradebook/validations/{gradeValidation}/reject', [GradeValidationController::class, 'reject'])->name('gradebook.validations.reject');
        });

        // Report exports (CSV downloads)
        Route::middleware(['permission:view-grades'])->group(function () {
            Route::get('/reports/class-record/{blockSection}/{subject}/{quarter}', [ReportController::class, 'classRecord'])->name('reports.class-record');
            Route::get('/reports/grading-sheet/{blockSection}', [ReportController::class, 'gradingSheet'])->name('reports.grading-sheet');
            Route::get('/reports/report-card/{studentEnrollment}', [ReportController::class, 'reportCard'])->name('reports.report-card');
            Route::get('/reports/attendance/{blockSection}/{subject}', [ReportController::class, 'attendanceSummary'])->name('reports.attendance');
        });

        // Conduct grades
        Route::middleware(['permission:manage-conduct'])->group(function () {
            Route::get('/conduct-categories', [ConductCategoryController::class, 'index'])->name('conduct-categories.index');
            Route::post('/conduct-categories', [ConductCategoryController::class, 'store'])->name('conduct-categories.store');
            Route::put('/conduct-categories/{conductCategory}', [ConductCategoryController::class, 'update'])->name('conduct-categories.update');
            Route::delete('/conduct-categories/{conductCategory}', [ConductCategoryController::class, 'destroy'])->name('conduct-categories.destroy');
            Route::post('/conduct-categories/{conductCategory}/criteria', [ConductCategoryController::class, 'storeCriteria'])->name('conduct-categories.criteria.store');
            Route::delete('/conduct-criteria/{conductCriteria}', [ConductCategoryController::class, 'destroyCriteria'])->name('conduct-criteria.destroy');
        });

        Route::middleware(['permission:manage-conduct-grades'])->group(function () {
            Route::get('/gradebook/{blockSection}/conduct/{quarter}', [ConductGradeController::class, 'index'])->name('gradebook.conduct.index');
            Route::put('/gradebook/{blockSection}/conduct/{quarter}', [ConductGradeController::class, 'save'])->name('gradebook.conduct.save');
        });

        // Attendance management
        Route::middleware(['permission:view-attendance'])->group(function () {
            Route::get('/attendance', [AttendanceController::class, 'index'])->name('attendance.index');
            Route::get('/attendance/grade/{gradeLevel}', [AttendanceController::class, 'showGrade'])->name('attendance.grade');
            Route::get('/attendance/{blockSection}/history', [AttendanceController::class, 'history'])->name('attendance.history');
            Route::get('/attendance/{blockSection}', [AttendanceController::class, 'show'])->name('attendance.show');
        });

        Route::middleware(['permission:manage-attendance'])->group(function () {
            Route::post('/attendance/{blockSection}', [AttendanceController::class, 'store'])->name('attendance.store');
        });
    });

    // Legacy grades redirect
    Route::get('/grades', fn() => redirect('/teacher/gradebook'))->name('grades.index');
    Route::get('/grades/{any}', fn() => redirect('/teacher/gradebook'))->where('any', '.*');
});

// Admission management routes
require __DIR__ . '/admissions.php';

// Student portal routes
require __DIR__ . '/student.php';

require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
