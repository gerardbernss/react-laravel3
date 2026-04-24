<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Applicant;
use App\Models\ExamSchedule;
use App\Models\ExaminationRoom;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ExamSchedulesController extends Controller
{
    /**
     * Display a listing of exam schedules.
     */
    public function index()
    {
        $schedules = ExamSchedule::with('examinationRoom')
            ->withCount(['applicantAssignments as assigned_count' => function ($q) {
                $q->whereNotIn('status', ['cancelled']);
            }])
            ->orderBy('exam_date', 'desc')
            ->orderBy('start_time')
            ->get();

        $rooms = ExaminationRoom::active()->orderBy('name')->get(['id', 'name', 'building']);

        return Inertia::render('Admin/ExamSchedules/Index', [
            'schedules' => $schedules,
            'rooms' => $rooms,
        ]);
    }

    /**
     * Show the form for creating a new schedule.
     */
    public function create()
    {
        $rooms = ExaminationRoom::active()
            ->orderBy('building')
            ->orderBy('name')
            ->get(['id', 'name', 'building', 'capacity', 'floor']);

        return Inertia::render('Admin/ExamSchedules/Create', [
            'rooms' => $rooms,
        ]);
    }

    /**
     * Store a newly created schedule.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'exam_type' => 'required|string|max:100',
            'exam_date' => 'required|date',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i|after:start_time',
            'examination_room_id' => 'required|exists:examination_rooms,id',
            'is_active' => 'boolean',
        ]);

        ExamSchedule::create($validated);

        return redirect()->route('exam-schedules.index')
            ->with('success', 'Exam schedule created successfully.');
    }

    /**
     * Display the specified schedule.
     */
    public function show(ExamSchedule $examSchedule)
    {
        $examSchedule->load([
            'examinationRoom',
            'applicantAssignments.applicationInfo.personalData',
        ]);

        // IDs already assigned to THIS schedule (excluding cancelled).
        $assignedToThisSchedule = $examSchedule->applicantAssignments()
            ->whereNotIn('status', ['cancelled'])
            ->pluck('applicant_id')
            ->toArray();

        // For all other active assignments, build a map of applicant_id → schedule name.
        $assignedElsewhere = \App\Models\ApplicantExamAssignment::with('examSchedule:id,name')
            ->whereNotIn('status', ['cancelled'])
            ->where('exam_schedule_id', '!=', $examSchedule->id)
            ->get()
            ->keyBy('applicant_id')
            ->map(fn ($a) => $a->examSchedule?->name);

        $availableApplicants = Applicant::with('personalData')
            ->whereIn('application_status', ['Pending', 'For Exam'])
            ->whereNotIn('id', $assignedToThisSchedule)
            ->orderBy('application_number')
            ->get()
            ->map(fn ($a) => [
                'id'                   => $a->id,
                'application_number'   => $a->application_number,
                'application_status'   => $a->application_status,
                'first_name'           => $a->personalData?->first_name,
                'last_name'            => $a->personalData?->last_name,
                'middle_name'          => $a->personalData?->middle_name,
                'assigned_to_schedule' => $assignedElsewhere->get($a->id),
            ]);

        return Inertia::render('Admin/ExamSchedules/Show', [
            'schedule'            => $examSchedule,
            'availableApplicants' => $availableApplicants,
        ]);
    }

    /**
     * Show the form for editing the specified schedule.
     */
    public function edit(ExamSchedule $examSchedule)
    {
        $rooms = ExaminationRoom::active()
            ->orderBy('building')
            ->orderBy('name')
            ->get(['id', 'name', 'building', 'capacity', 'floor']);

        return Inertia::render('Admin/ExamSchedules/Edit', [
            'schedule' => $examSchedule,
            'rooms' => $rooms,
        ]);
    }

    /**
     * Update the specified schedule.
     */
    public function update(Request $request, ExamSchedule $examSchedule)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'exam_type' => 'required|string|max:100',
            'exam_date' => 'required|date',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i|after:start_time',
            'examination_room_id' => 'required|exists:examination_rooms,id',
            'is_active' => 'boolean',
        ]);

        $examSchedule->update($validated);

        return redirect()->route('exam-schedules.index')
            ->with('success', 'Exam schedule updated successfully.');
    }

    /**
     * Remove the specified schedule.
     */
    public function destroy(ExamSchedule $examSchedule)
    {
        // Check if schedule has assignments
        if ($examSchedule->applicantAssignments()->count() > 0) {
            return back()->withErrors([
                'error' => 'Cannot delete schedule. It has applicants assigned.',
            ]);
        }

        $examSchedule->delete();

        return redirect()->route('exam-schedules.index')
            ->with('success', 'Exam schedule deleted successfully.');
    }

    /**
     * Get available schedules for assignment (API).
     */
    public function getAvailableSchedules()
    {
        $schedules = ExamSchedule::with('examinationRoom')
            ->active()
            ->upcoming()
            ->withCount(['applicantAssignments as assigned_count' => function ($q) {
                $q->whereNotIn('status', ['cancelled']);
            }])
            ->orderBy('exam_date')
            ->orderBy('start_time')
            ->get()
            ->map(function ($schedule) {
                $effectiveCapacity = $schedule->examinationRoom->capacity;
                return [
                    'id' => $schedule->id,
                    'name' => $schedule->name,
                    'exam_type' => $schedule->exam_type,
                    'exam_date' => $schedule->exam_date->format('Y-m-d'),
                    'start_time' => $schedule->start_time,
                    'end_time' => $schedule->end_time,
                    'room' => $schedule->examinationRoom->name,
                    'building' => $schedule->examinationRoom->building,
                    'capacity' => $effectiveCapacity,
                    'assigned_count' => $schedule->assigned_count,
                    'available_slots' => max(0, $effectiveCapacity - $schedule->assigned_count),
                ];
            });

        return response()->json($schedules);
    }
}
