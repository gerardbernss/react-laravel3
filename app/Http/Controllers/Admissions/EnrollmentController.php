<?php

namespace App\Http\Controllers\Admissions;

use App\Http\Controllers\Controller;
use App\Models\ApplicantApplicationInfo;
use App\Models\EnrollmentAuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class EnrollmentController extends Controller
{
    /**
     * Display enrollment dashboard
     * Shows applicants with status 'Pending' and 'Enrolled'
     */
    public function dashboard(Request $request)
    {
        $query = ApplicantApplicationInfo::with(['personalData', 'documents', 'portalCredential'])
            ->whereIn('application_status', ['Pending', 'Enrolled'])
            ->orderBy('created_at', 'desc');

        if ($request->filled('status')) {
            $query->where('application_status', $request->status);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->whereHas('personalData', function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($request->filled('category')) {
            $query->where('student_category', $request->category);
        }

        $applicants = $query->paginate(15);

        $statistics = [
            'total'    => ApplicantApplicationInfo::whereIn('application_status', ['Pending', 'Enrolled'])->count(),
            'pending'  => ApplicantApplicationInfo::where('application_status', 'Pending')->count(),
            'enrolled' => ApplicantApplicationInfo::where('application_status', 'Enrolled')->count(),
        ];

        return Inertia::render('Admissions/Enrollment/Dashboard', [
            'applicants' => $applicants,
            'statistics' => $statistics,
            'filters'    => [
                'status'   => $request->status,
                'search'   => $request->search,
                'category' => $request->category,
            ],
        ]);
    }

    /**
     * Show applicant enrollment details
     */
    public function show(ApplicantApplicationInfo $applicant)
    {
        $applicant->load([
            'personalData.familyBackground',
            'personalData.siblings',
            'educationalBackground',
            'documents',
            'portalCredential',
            'auditLogs' => function ($q) {
                $q->orderBy('created_at', 'desc')->limit(20);
            },
        ]);

        return Inertia::render('Admissions/Enrollment/Show', [
            'applicant' => $applicant,
        ]);
    }

    /**
     * Update applicant status to Enrolled
     */
    public function enroll(Request $request, ApplicantApplicationInfo $applicant)
    {
        $validated = $request->validate([
            'student_id_number' => 'required|string|unique:applicant_application_info,student_id_number,' . $applicant->id,
        ]);

        $previousStatus = $applicant->application_status;

        $applicant->update([
            'application_status' => 'Enrolled',
            'student_id_number'  => $validated['student_id_number'],
        ]);

        EnrollmentAuditLog::create([
            'applicant_application_info_id' => $applicant->id,
            'action'                        => 'Status Changed to Enrolled',
            'new_status'                    => 'Enrolled',
            'previous_status'               => $previousStatus,
            'details'                       => json_encode([
                'student_id_number' => $validated['student_id_number'],
                'enrolled_by'       => Auth::user()->name,
            ]),
            'performed_by'                  => Auth::user()->name,
            'ip_address'                    => $request->ip(),
        ]);

        return back()->with('success', 'Applicant has been enrolled successfully.');
    }

    /**
     * Revert applicant status back to Pending
     */
    public function revertToPending(Request $request, ApplicantApplicationInfo $applicant)
    {
        $previousStatus = $applicant->application_status;

        $applicant->update([
            'application_status' => 'Pending',
            'student_id_number'  => null,
        ]);

        EnrollmentAuditLog::create([
            'applicant_application_info_id' => $applicant->id,
            'action'                        => 'Status Reverted to Pending',
            'new_status'                    => 'Pending',
            'previous_status'               => $previousStatus,
            'details'                       => json_encode([
                'reverted_by' => Auth::user()->name,
                'reason'      => $request->input('reason', 'No reason provided'),
            ]),
            'performed_by'                  => Auth::user()->name,
            'ip_address'                    => $request->ip(),
        ]);

        return back()->with('success', 'Applicant status reverted to Pending.');
    }

    /**
     * View enrollment audit trail
     */
    public function auditLog(ApplicantApplicationInfo $applicant, Request $request)
    {
        $applicant->load('personalData');

        $logs = $applicant->auditLogs()
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return Inertia::render('Admissions/Enrollment/AuditLog', [
            'applicant' => $applicant,
            'auditLogs' => $logs,
        ]);
    }

    /**
     * Generate enrollment report
     */
    public function report(Request $request)
    {
        $query = ApplicantApplicationInfo::with(['personalData'])
            ->whereIn('application_status', ['Pending', 'Enrolled']);

        if ($request->filled('status')) {
            $query->where('application_status', $request->status);
        }

        if ($request->filled('category')) {
            $query->where('student_category', $request->category);
        }

        if ($request->filled('school_year')) {
            $query->where('school_year', $request->school_year);
        }

        $applicants = $query->get();

        $statistics = [
            'total_students'  => $applicants->count(),
            'pending_count'   => $applicants->where('application_status', 'Pending')->count(),
            'enrolled_count'  => $applicants->where('application_status', 'Enrolled')->count(),
            'by_category'     => $applicants->groupBy('student_category')->map(function ($group, $category) {
                return [
                    'category' => $category ?: 'Unknown',
                    'count'    => $group->count(),
                ];
            })->values(),
            'by_year_level'   => $applicants->groupBy('year_level')->map(function ($group, $yearLevel) {
                return [
                    'year_level' => $yearLevel ?: 'Not Assigned',
                    'count'      => $group->count(),
                ];
            })->values(),
        ];

        // Get unique school years for filter
        $schoolYears = ApplicantApplicationInfo::distinct()
            ->pluck('school_year')
            ->filter()
            ->sort()
            ->values();

        return Inertia::render('Admissions/Enrollment/Report', [
            'statistics'  => $statistics,
            'filters'     => [
                'status'      => $request->status,
                'category'    => $request->category,
                'school_year' => $request->school_year,
            ],
            'schoolYears' => $schoolYears,
            'semesters'   => ['1st Semester', '2nd Semester', 'Summer'],
        ]);
    }
}
