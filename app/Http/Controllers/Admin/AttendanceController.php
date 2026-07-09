<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreAttendanceRequest;
use App\Models\BlockSection;
use App\Services\Admin\AttendanceService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AttendanceController extends Controller
{
    public function __construct(private AttendanceService $attendanceService)
    {
    }

    /**
     * List sections for attendance — faculty see only their assigned sections while admins see all sections filterable by search, school year, and semester.
     */
    public function index(Request $request)
    {
        $user = auth()->user();

        $data = $user && $user->hasRole('faculty')
            ? $this->attendanceService->facultyIndexData($user)
            : $this->attendanceService->adminIndexData($request->search, $request->school_year, $request->semester);

        return Inertia::render('Admin/Attendance/Index', $data);
    }

    /**
     * Show all sections for a specific grade level, filterable by school year and semester.
     */
    public function showGrade(Request $request, string $gradeLevel)
    {
        $data = $this->attendanceService->showGradeData($gradeLevel, $request->input('school_year'), $request->input('semester'));

        return Inertia::render('Admin/Attendance/GradeSections', $data);
    }

    /**
     * Show the attendance entry sheet for a section on a given date, optionally filtered by subject.
     */
    public function show(BlockSection $blockSection, Request $request)
    {
        $date = $request->input('date', now()->format('Y-m-d'));
        $subjectId = $request->input('subject_id');

        $data = $this->attendanceService->sheetData($blockSection, auth()->user(), $date, $subjectId ? (int) $subjectId : null);

        return Inertia::render('Admin/Attendance/Sheet', $data);
    }

    /**
     * Show the attendance history for a section, filterable by subject and date range.
     */
    public function history(BlockSection $blockSection, Request $request)
    {
        $subjectId = $request->input('subject_id');

        $data = $this->attendanceService->historyData(
            $blockSection,
            auth()->user(),
            $subjectId ? (int) $subjectId : null,
            $request->input('date_from'),
            $request->input('date_to')
        );

        return Inertia::render('Admin/Attendance/History', $data);
    }

    /**
     * Save attendance records for a section on the submitted date.
     */
    public function store(StoreAttendanceRequest $request, BlockSection $blockSection)
    {
        $this->attendanceService->store($blockSection, $request->validated(), auth()->user());

        return back()->with('success', 'Attendance saved successfully.');
    }
}
