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

    public function index(Request $request)
    {
        $user = auth()->user();

        $data = $user && $user->hasRole('faculty')
            ? $this->attendanceService->facultyIndexData($user)
            : $this->attendanceService->adminIndexData($request->search, $request->school_year, $request->semester);

        return Inertia::render('Admin/Attendance/Index', $data);
    }

    public function showGrade(Request $request, string $gradeLevel)
    {
        $data = $this->attendanceService->showGradeData($gradeLevel, $request->input('school_year'), $request->input('semester'));

        return Inertia::render('Admin/Attendance/GradeSections', $data);
    }

    public function show(BlockSection $blockSection, Request $request)
    {
        $date = $request->input('date', now()->format('Y-m-d'));
        $subjectId = $request->input('subject_id');

        $data = $this->attendanceService->sheetData($blockSection, auth()->user(), $date, $subjectId ? (int) $subjectId : null);

        return Inertia::render('Admin/Attendance/Sheet', $data);
    }

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

    public function store(StoreAttendanceRequest $request, BlockSection $blockSection)
    {
        $this->attendanceService->store($blockSection, $request->validated());

        return back()->with('success', 'Attendance saved successfully.');
    }
}
