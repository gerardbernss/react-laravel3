<?php
namespace App\Http\Controllers;

use App\Models\EnrollmentAuditLog;
use App\Models\Student;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class EnrollmentController extends Controller
{
    /**
     * Display enrollment dashboard
     */
    public function dashboard(Request $request)
    {
        $query = Student::with(['personalData', 'application', 'portalCredential'])
            ->orderBy('created_at', 'desc');

        if ($request->filled('status')) {
            $query->where('enrollment_status', $request->status);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->whereHas('personalData', function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%");
            });
        }

        $students = $query->paginate(15);

        $stats = [
            'total_pending'  => Student::pending()->count(),
            'total_active'   => Student::active()->count(),
            'total_inactive' => Student::inactive()->count(),
            'portal_active'  => Student::portalAccessActive()->count(),
        ];

        return Inertia::render('Admissions/Enrollment/Dashboard', [
            'students'   => $students,
            'statistics' => $stats,
            'filters'    => [
                'status' => $request->status,
                'search' => $request->search,
            ],
        ]);
    }

    /**
     * Show student enrollment details
     */
    public function show(Student $student)
    {
        $student->load([
            'personalData',
            'application',
            'portalCredential',
            'auditLogs' => function ($q) {
                $q->orderBy('created_at', 'desc')->limit(20);
            },
        ]);

        return Inertia::render('Admissions/Enrollment/Show', [
            'student' => $student,
        ]);
    }

    /**
     * Activate portal access
     */
    public function activatePortal(Request $request, Student $student)
    {
        $student->activatePortalAccess();

        EnrollmentAuditLog::logAction(
            $student,
            'Portal Access Granted',
            'Active',
            null,
            'Portal access activated for student',
            Auth::user()->name,
            $request->ip(),
            $student->application
        );

        return back()->with('success', 'Portal access activated.');
    }

    /**
     * Deactivate portal access
     */
    public function deactivatePortal(Request $request, Student $student)
    {
        $student->deactivatePortalAccess();

        EnrollmentAuditLog::logAction(
            $student,
            'Portal Access Revoked',
            'Inactive',
            'Active',
            'Portal access deactivated',
            Auth::user()->name,
            $request->ip(),
            $student->application
        );

        return back()->with('success', 'Portal access deactivated.');
    }

    /**
     * Complete enrollment
     */
    public function complete(Request $request, Student $student)
    {
        $validated = $request->validate([
            'student_id_number'   => 'required|string|unique:students,student_id_number,' . $student->id,
            'current_year_level'  => 'required|string',
            'current_semester'    => 'required|string',
            'current_school_year' => 'required|string',
        ]);

        $student->update($validated);
        $student->completeEnrollment();

        // Update application status
        if ($student->application) {
            $student->application->application_status = 'Enrolled';
            $student->application->student_id_number  = $validated['student_id_number'];
            $student->application->save();
        }

        EnrollmentAuditLog::logAction(
            $student,
            'Enrollment Completed',
            'Active',
            'Pending',
            'Student enrollment completed and activated',
            Auth::user()->name,
            $request->ip(),
            $student->application
        );

        return back()->with('success', 'Student enrollment completed.');
    }

    /**
     * View enrollment audit trail
     */
    public function auditLog(Student $student, Request $request)
    {
        $logs = $student->auditLogs()
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return Inertia::render('Admissions/Enrollment/AuditLog', [
            'student' => $student,
            'logs'    => $logs,
        ]);
    }

    /**
     * Generate enrollment report
     */
    public function report(Request $request)
    {
        $query = Student::with(['personalData', 'application']);

        if ($request->filled('status')) {
            $query->where('enrollment_status', $request->status);
        }

        if ($request->filled('date_from') && $request->filled('date_to')) {
            $query->whereBetween('enrollment_date', [
                $request->date_from,
                $request->date_to,
            ]);
        }

        $students = $query->get();

        $reportData = [
            'total_students' => $students->count(),
            'by_status'      => $students->groupBy('enrollment_status')->map->count(),
            'by_year_level'  => $students->groupBy('current_year_level')->map->count(),
            'portal_active'  => $students->where('portal_access_active', true)->count(),
        ];

        return Inertia::render('Admissions/Enrollment/Report', [
            'data'     => $reportData,
            'students' => $students,
        ]);
    }
}
