<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Attendance;
use App\Models\BlockSection;
use App\Models\StudentEnrollment;
use App\Models\StudentEnrollmentSubject;
use App\Models\Subject;
use Carbon\Carbon;
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
        $user = auth()->user();

        // Faculty see a subject-centric view of only their assigned subjects
        if ($user && $user->hasRole('faculty')) {
            $today = now()->toDateString();
            $subjects = Subject::where('user_id', $user->id)
                ->with(['blockSections', 'defaultSchedule'])
                ->get();

            $mySubjectSections = $subjects->flatMap(function ($subject) use ($today) {
                return $subject->blockSections->map(function ($section) use ($subject, $today) {
                    $enrolledCount = StudentEnrollmentSubject::whereHas('enrollment',
                        fn($q) => $q->where('block_section_id', $section->id))
                        ->where('subject_id', $subject->id)
                        ->count();

                    $todayQuery = Attendance::where('subject_id', $subject->id)
                        ->whereHas('studentEnrollment', fn($q) => $q->where('block_section_id', $section->id))
                        ->whereDate('date', $today);

                    $todayTaken = (clone $todayQuery)->exists();
                    $todayPresentCount = $todayTaken
                        ? (clone $todayQuery)->where('status', 'Present')->count()
                        : 0;

                    return [
                        'subject_id'          => $subject->id,
                        'subject_code'        => $subject->code,
                        'subject_name'        => $subject->name,
                        'subject_schedule'    => $subject->defaultSchedule?->display,
                        'block_section_id'    => $section->id,
                        'section_code'        => $section->code,
                        'section_name'        => $section->name,
                        'grade_level'         => $section->grade_level,
                        'enrolled_count'      => $enrolledCount,
                        'today_taken'         => $todayTaken,
                        'today_present_count' => $todayPresentCount,
                        'missed_days_count'   => count($this->getMissedDates($subject->id, $section->id)),
                    ];
                });
            })->values();

            return Inertia::render('Admin/Attendance/Index', [
                'isFaculty'         => true,
                'mySubjectSections' => $mySubjectSections,
                'groupedSections'   => [],
                'filters'           => [],
                'schoolYears'       => [],
                'semesters'         => [],
            ]);
        }

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

        $sections = $query->orderBy('grade_level')
            ->orderBy('strand')
            ->orderBy('code')
            ->get();

        // Group sections by grade_level only
        $grouped = $sections->groupBy(function ($section) {
            return $section->grade_level ?? 'Unassigned';
        })->map(function ($sections, $label) {
            return [
                'label' => $label,
                'sections' => $sections->values(),
            ];
        })->values();

        $schoolYears = BlockSection::distinct()->orderBy('school_year', 'desc')->pluck('school_year')->filter()->values();
        $semesters = BlockSection::distinct()->pluck('semester')->filter()->values();

        return Inertia::render('Admin/Attendance/Index', [
            'isFaculty'         => false,
            'mySubjectSections' => [],
            'groupedSections'   => $grouped,
            'filters'           => $request->only(['search', 'school_year', 'semester']),
            'schoolYears'       => $schoolYears,
            'semesters'         => $semesters,
        ]);
    }

    /**
     * Display sections for a specific grade level.
     */
    public function showGrade(string $gradeLevel)
    {
        $sections = BlockSection::query()
            ->withCount(['subjects'])
            ->addSelect(['enrolled_count' => StudentEnrollment::selectRaw('count(*)')
                ->whereColumn('block_section_id', 'block_sections.id')
            ])
            ->where('grade_level', $gradeLevel)
            ->orderBy('strand')
            ->orderBy('code')
            ->get();

        return Inertia::render('Admin/Attendance/GradeSections', [
            'gradeLevel' => $gradeLevel,
            'sections'   => $sections,
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
                ->whereDate('date', $date)
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
            'missedDates' => $subjectId ? $this->getMissedDates((int) $subjectId, $blockSection->id) : [],
        ]);
    }

    /**
     * Show the attendance history for a block section.
     *
     * Returns one summary row per date that has attendance records, grouped by
     * subject. Optionally filtered by a date range (date_from / date_to).
     */
    public function history(BlockSection $blockSection, Request $request)
    {
        $blockSection->load('subjects');

        $user     = auth()->user();
        $subjects = $blockSection->subjects;

        // Faculty may only see subjects they teach in this section
        if ($user && $user->hasRole('faculty')) {
            $subjects = $subjects->filter(fn ($s) => $s->user_id === $user->id)->values();
        }

        $subjectId = $request->input('subject_id');
        if (! $subjectId && $subjects->isNotEmpty()) {
            $subjectId = $subjects->first()->id;
        }

        $dateFrom = $request->input('date_from');
        $dateTo   = $request->input('date_to');

        // Fetch all attendance rows for this section + subject, grouped by date
        $query = Attendance::where('subject_id', $subjectId)
            ->whereHas('studentEnrollment', fn ($q) => $q->where('block_section_id', $blockSection->id));

        if ($dateFrom) {
            $query->whereRaw('date(date) >= ?', [$dateFrom]);
        }
        if ($dateTo) {
            $query->whereRaw('date(date) <= ?', [$dateTo]);
        }

        $rows = $query
            ->orderBy('date', 'desc')
            ->get();

        // Summarise per date, including names of absent/late students
        $byDate = $rows->groupBy(fn ($a) => $a->date->format('Y-m-d'));

        $records = $byDate->map(function ($dayRows, $date) {
            $present  = $dayRows->where('status', 'Present')->count();
            $absent   = $dayRows->where('status', 'Absent')->count();
            $late     = $dayRows->where('status', 'Late')->count();
            $excused  = $dayRows->where('status', 'Excused')->count();
            $total    = $dayRows->count();

            return [
                'date'            => $date,
                'total_marked'    => $total,
                'present'         => $present,
                'absent'          => $absent,
                'late'            => $late,
                'excused'         => $excused,
                'attendance_rate' => $total > 0
                    ? round((($present + $late) / $total) * 100, 1)
                    : null,
            ];
        })->values();

        return Inertia::render('Admin/Attendance/History', [
            'blockSection'      => $blockSection->only(['id', 'code', 'name', 'grade_level', 'strand', 'school_year', 'semester']),
            'subjects'          => $subjects->map(fn ($s) => ['id' => $s->id, 'code' => $s->code, 'name' => $s->name]),
            'selectedSubjectId' => (int) $subjectId,
            'dateFrom'          => $dateFrom,
            'dateTo'            => $dateTo,
            'records'           => $records,
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

    /**
     * Return weekdays (Mon–Fri) in the past $daysBack days where no attendance
     * was recorded for the given subject + block section.
     */
    private function getMissedDates(int $subjectId, int $blockSectionId, int $daysBack = 30): array
    {
        $today     = now()->toDateString();
        $startDate = now()->subDays($daysBack)->toDateString();

        $taken = Attendance::where('subject_id', $subjectId)
            ->whereHas('studentEnrollment', fn ($q) => $q->where('block_section_id', $blockSectionId))
            ->whereRaw('date(date) >= ?', [$startDate])
            ->whereRaw('date(date) < ?',  [$today])
            ->selectRaw('date(date) as d')
            ->distinct()
            ->pluck('d')
            ->flip()
            ->all();

        $missed = [];
        $cursor    = Carbon::parse($startDate);
        $yesterday = Carbon::yesterday();

        while ($cursor->lte($yesterday)) {
            if ($cursor->isWeekday() && ! array_key_exists($cursor->toDateString(), $taken)) {
                $missed[] = $cursor->toDateString();
            }
            $cursor->addDay();
        }

        return array_reverse($missed); // most recent first
    }
}
