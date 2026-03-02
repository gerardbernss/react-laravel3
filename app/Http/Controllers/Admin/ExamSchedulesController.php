<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ExamSchedule;
use App\Models\ExaminationRoom;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ExamSchedulesController extends Controller
{
    /**
     * Display a listing of exam schedules.
     */
    public function index(Request $request)
    {
        $query = ExamSchedule::with('examinationRoom')
            ->withCount(['applicantAssignments as assigned_count' => function ($q) {
                $q->whereNotIn('status', ['cancelled']);
            }]);

        // Search filter
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('exam_type', 'like', "%{$search}%");
            });
        }

        // Date filter
        if ($request->filled('date_from')) {
            $query->where('exam_date', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->where('exam_date', '<=', $request->date_to);
        }

        // Status filter
        if ($request->filled('status')) {
            $query->where('is_active', $request->status === 'active');
        }

        // Room filter
        if ($request->filled('room_id')) {
            $query->where('examination_room_id', $request->room_id);
        }

        $schedules = $query->orderBy('exam_date', 'desc')
            ->orderBy('start_time')
            ->paginate(15)
            ->withQueryString();

        $rooms = ExaminationRoom::active()->orderBy('name')->get(['id', 'name', 'building']);

        return Inertia::render('Admin/ExamSchedules/Index', [
            'schedules' => $schedules,
            'rooms' => $rooms,
            'filters' => $request->only(['search', 'date_from', 'date_to', 'status', 'room_id']),
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

        return Inertia::render('Admin/ExamSchedules/Show', [
            'schedule' => $examSchedule,
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
