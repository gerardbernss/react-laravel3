<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Attendance;
use App\Models\BlockSection;
use App\Models\StudentEnrollment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class AttendanceController extends Controller
{
    /**
     * Display a listing of block sections for attendance management.
     */
    public function index(Request $request)
    {
        $query = BlockSection::query()
            ->withCount(['subjects'])
            ->addSelect(['enrolled_count' => StudentEnrollment::selectRaw('count(*)')
                ->whereColumn('block_section_id', 'block_sections.id')
            ]);

        // Search filter
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('code', 'like', "%{$search}%")
                    ->orWhere('name', 'like', "%{$search}%")
                    ->orWhere('adviser', 'like', "%{$search}%");
            });
        }

        // School year filter
        if ($request->filled('school_year')) {
            $query->where('school_year', $request->school_year);
        }

        // Semester filter
        if ($request->filled('semester')) {
            $query->where('semester', $request->semester);
        }

        // Faculty filter — faculty members only see sections where they teach a subject
        $user = auth()->user();
        if ($user && $user->hasRole('faculty')) {
            $query->whereHas('subjects', function ($q) use ($user) {
                $q->where('subjects.user_id', $user->id);
            });
        }

        $sections = $query->orderBy('grade_level')
            ->orderBy('strand')
            ->orderBy('code')
            ->get();

        // Group sections by grade_level + strand
        $grouped = $sections->groupBy(function ($section) {
            $label = $section->grade_level ?? 'Unassigned';
            if ($section->strand) {
                $label .= ' — ' . $section->strand;
            }
            return $label;
        })->map(function ($sections, $label) {
            return [
                'label' => $label,
                'sections' => $sections->values(),
            ];
        })->values();

        $schoolYears = BlockSection::distinct()->orderBy('school_year', 'desc')->pluck('school_year')->filter()->values();
        $semesters = BlockSection::distinct()->pluck('semester')->filter()->values();

        return Inertia::render('Admin/Attendance/Index', [
            'groupedSections' => $grouped,
            'filters' => $request->only(['search', 'school_year', 'semester']),
            'schoolYears' => $schoolYears,
            'semesters' => $semesters,
        ]);
    }

    /**
     * Display the attendance sheet for a specific block section.
     */
    public function show(BlockSection $blockSection, Request $request)
    {
        $blockSection->load('subjects');

        $date = $request->input('date', now()->format('Y-m-d'));
        $subjectId = $request->input('subject_id');

        // For faculty, only show subjects they're assigned to teach in this section
        $user = auth()->user();
        $subjects = $blockSection->subjects;
        if ($user && $user->hasRole('faculty')) {
            $subjects = $subjects->filter(fn($s) => $s->user_id === $user->id)->values();
        }

        // Default to the first subject if none selected
        if (!$subjectId && $subjects->isNotEmpty()) {
            $subjectId = $subjects->first()->id;
        }

        // Get all enrollments for this section with students
        $enrollments = StudentEnrollment::where('block_section_id', $blockSection->id)
            ->with([
                'student.personalData:id,last_name,first_name,middle_name',
            ])
            ->orderBy(
                DB::raw('(SELECT last_name FROM applicant_personal_data
                    JOIN students ON students.applicant_personal_data_id = applicant_personal_data.id
                    WHERE students.id = student_enrollments.student_id)'),
                'asc'
            )
            ->get();

        // Get existing attendance for this date and subject
        $existingAttendance = [];
        if ($subjectId) {
            $existingAttendance = Attendance::where('subject_id', $subjectId)
                ->where('date', $date)
                ->whereIn('student_enrollment_id', $enrollments->pluck('id'))
                ->get()
                ->keyBy('student_enrollment_id');
        }

        // Transform for frontend
        $students = $enrollments->map(function ($enrollment) use ($existingAttendance) {
            $student = $enrollment->student;
            $personalData = $student?->personalData;
            $attendance = $existingAttendance->get($enrollment->id);

            return [
                'enrollment_id' => $enrollment->id,
                'student_id' => $student?->id,
                'student_id_number' => $student?->student_id_number,
                'last_name' => $personalData?->last_name,
                'first_name' => $personalData?->first_name,
                'middle_name' => $personalData?->middle_name,
                'status' => $attendance?->status ?? null,
                'remarks' => $attendance?->remarks ?? '',
                'attendance_id' => $attendance?->id ?? null,
            ];
        });

        // Compute statistics for this date/subject
        $presentCount = $existingAttendance->where('status', 'Present')->count();
        $absentCount = $existingAttendance->where('status', 'Absent')->count();
        $lateCount = $existingAttendance->where('status', 'Late')->count();
        $excusedCount = $existingAttendance->where('status', 'Excused')->count();
        $totalStudents = $enrollments->count();
        $markedCount = $existingAttendance->count();

        $statistics = [
            'total_students' => $totalStudents,
            'marked_count' => $markedCount,
            'present_count' => $presentCount,
            'absent_count' => $absentCount,
            'late_count' => $lateCount,
            'excused_count' => $excusedCount,
            'attendance_rate' => $totalStudents > 0 && $markedCount > 0
                ? round((($presentCount + $lateCount) / $markedCount) * 100, 1)
                : null,
        ];

        return Inertia::render('Admin/Attendance/Sheet', [
            'blockSection' => $blockSection,
            'students' => $students,
            'statistics' => $statistics,
            'selectedDate' => $date,
            'selectedSubjectId' => (int) $subjectId,
            'subjects' => $subjects->map(fn($s) => [
                'id' => $s->id,
                'code' => $s->code,
                'name' => $s->name,
            ]),
        ]);
    }

    /**
     * Store/update attendance for a block section.
     */
    public function store(Request $request, BlockSection $blockSection)
    {
        $request->validate([
            'date' => 'required|date',
            'subject_id' => 'required|exists:subjects,id',
            'attendance' => 'required|array',
            'attendance.*.student_enrollment_id' => 'required|exists:student_enrollments,id',
            'attendance.*.status' => 'required|in:Present,Absent,Late,Excused',
            'attendance.*.remarks' => 'nullable|string|max:255',
        ]);

        DB::transaction(function () use ($request) {
            foreach ($request->attendance as $entry) {
                Attendance::updateOrCreate(
                    [
                        'student_enrollment_id' => $entry['student_enrollment_id'],
                        'subject_id' => $request->subject_id,
                        'date' => $request->date,
                    ],
                    [
                        'status' => $entry['status'],
                        'remarks' => $entry['remarks'] ?? null,
                    ]
                );
            }
        });

        return back()->with('success', 'Attendance saved successfully.');
    }
}
