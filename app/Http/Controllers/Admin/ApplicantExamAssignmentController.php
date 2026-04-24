<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Applicant;
use App\Models\ApplicantExamAssignment;
use App\Models\ExamSchedule;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ApplicantExamAssignmentController extends Controller
{
    /**
     * Display a listing of exam assignments.
     */
    public function index()
    {
        $assignments = ApplicantExamAssignment::with([
            'applicationInfo.personalData',
            'examSchedule.examinationRoom',
        ])->orderBy('created_at', 'desc')->get();

        $schedules = ExamSchedule::with('examinationRoom')
            ->active()
            ->orderBy('exam_date')
            ->get(['id', 'name', 'exam_date', 'examination_room_id']);

        return Inertia::render('Admin/ExamAssignments/Index', [
            'assignments' => $assignments,
            'schedules' => $schedules,
        ]);
    }

    /**
     * Show the form for creating a new assignment.
     */
    public function create(Request $request)
    {
        // Get applicants without exam assignments
        $applicantsQuery = Applicant::with('personalData')
            ->whereDoesntHave('examAssignment')
            ->whereIn('application_status', ['For Exam']);

        if ($request->filled('search')) {
            $search = $request->search;
            $applicantsQuery->where(function ($q) use ($search) {
                $q->where('application_number', 'like', "%{$search}%")
                    ->orWhereHas('personalData', function ($pq) use ($search) {
                        $pq->where('first_name', 'like', "%{$search}%")
                            ->orWhere('last_name', 'like', "%{$search}%");
                    });
            });
        }

        $applicants = $applicantsQuery->orderBy('application_number')->paginate(20);

        // Get available schedules with slot info
        $schedules = ExamSchedule::with('examinationRoom')
            ->active()
            ->withCount(['applicantAssignments as assigned_count' => function ($q) {
                $q->whereNotIn('status', ['cancelled']);
            }])
            ->orderBy('exam_date')
            ->orderBy('start_time')
            ->get()
            ->map(function ($schedule) {
                $effectiveCapacity = $schedule->capacity ?? $schedule->examinationRoom->capacity;
                return [
                    'id' => $schedule->id,
                    'name' => $schedule->name,
                    'exam_type' => $schedule->exam_type,
                    'exam_date' => $schedule->exam_date->format('Y-m-d'),
                    'formatted_date' => $schedule->exam_date->format('M d, Y'),
                    'start_time' => $schedule->start_time,
                    'end_time' => $schedule->end_time,
                    'room_name' => $schedule->examinationRoom->name,
                    'building' => $schedule->examinationRoom->building,
                    'capacity' => $effectiveCapacity,
                    'assigned_count' => $schedule->assigned_count,
                    'available_slots' => max(0, $effectiveCapacity - $schedule->assigned_count),
                ];
            });

        return Inertia::render('Admin/ExamAssignments/Create', [
            'applicants' => $applicants,
            'schedules' => $schedules,
            'filters' => $request->only(['search']),
        ]);
    }

    /**
     * Store a new assignment.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'applicant_id' => 'required|exists:applicants,id',
            'exam_schedule_id' => 'required|exists:exam_schedules,id',
'notes' => 'nullable|string',
        ]);

        // Check if already assigned
        $exists = ApplicantExamAssignment::where('applicant_id', $validated['applicant_id'])
            ->where('exam_schedule_id', $validated['exam_schedule_id'])
            ->exists();

        if ($exists) {
            return back()->withErrors([
                'error' => 'This applicant is already assigned to this exam schedule.',
            ]);
        }

        // Check capacity
        $schedule = ExamSchedule::with('examinationRoom')->findOrFail($validated['exam_schedule_id']);
        $effectiveCapacity = $schedule->capacity ?? $schedule->examinationRoom->capacity;
        $currentCount = $schedule->applicantAssignments()->whereNotIn('status', ['cancelled'])->count();

        if ($currentCount >= $effectiveCapacity) {
            return back()->withErrors([
                'error' => 'This exam schedule is already at full capacity.',
            ]);
        }

        $validated['status'] = 'assigned';
        $validated['assigned_at'] = now();

        ApplicantExamAssignment::create($validated);

        // Update application status to indicate exam scheduled
        Applicant::where('id', $validated['applicant_id'])
            ->update(['application_status' => 'For Exam']);

        return redirect()->route('exam-assignments.index')
            ->with('success', 'Applicant assigned to exam schedule successfully.');
    }

    /**
     * Store multiple assignments at once.
     */
    public function bulkStore(Request $request)
    {
        $validated = $request->validate([
            'applicant_ids' => 'required|array|min:1',
            'applicant_ids.*' => 'exists:applicants,id',
            'exam_schedule_id' => 'required|exists:exam_schedules,id',
        ]);

        $schedule = ExamSchedule::with('examinationRoom')->findOrFail($validated['exam_schedule_id']);
        $effectiveCapacity = $schedule->capacity ?? $schedule->examinationRoom->capacity;
        $currentCount = $schedule->applicantAssignments()->whereNotIn('status', ['cancelled'])->count();
        $availableSlots = $effectiveCapacity - $currentCount;

        if (count($validated['applicant_ids']) > $availableSlots) {
            return back()->withErrors([
                'error' => "Only {$availableSlots} slots available. Cannot assign " . count($validated['applicant_ids']) . " applicants.",
            ]);
        }

        $assigned = 0;
        foreach ($validated['applicant_ids'] as $applicantId) {
            // Check if already assigned
            $exists = ApplicantExamAssignment::where('applicant_id', $applicantId)
                ->where('exam_schedule_id', $validated['exam_schedule_id'])
                ->exists();

            if (!$exists) {
                ApplicantExamAssignment::create([
                    'applicant_id' => $applicantId,
                    'exam_schedule_id' => $validated['exam_schedule_id'],
                    'status' => 'assigned',
                    'assigned_at' => now(),
                ]);

                // Update application status
                Applicant::where('id', $applicantId)
                    ->update(['application_status' => 'For Exam']);

                $assigned++;
            }
        }

        return redirect()->route('exam-assignments.index')
            ->with('success', "{$assigned} applicant(s) assigned to exam schedule successfully.");
    }

    /**
     * Update assignment status.
     */
    public function updateStatus(Request $request, ApplicantExamAssignment $assignment)
    {
        $validated = $request->validate([
            'status' => 'required|in:assigned,confirmed,attended,absent,cancelled',
            'notes' => 'nullable|string',
        ]);

        $assignment->update($validated);

        if ($validated['status'] === 'confirmed') {
            $assignment->update(['confirmed_at' => now()]);
        }

        // Update application status based on assignment status
        if ($validated['status'] === 'attended') {
            $assignment->applicationInfo->update(['application_status' => 'Exam Taken']);
        }

        return back()->with('success', 'Assignment status updated successfully.');
    }

    /**
     * Remove the specified assignment.
     */
    public function destroy(ApplicantExamAssignment $assignment)
    {
        $assignment->delete();

        return redirect()->route('exam-assignments.index')
            ->with('success', 'Assignment removed successfully.');
    }
}
