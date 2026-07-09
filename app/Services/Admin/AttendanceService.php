<?php

namespace App\Services\Admin;

use App\Models\BlockSection;
use App\Models\User;
use App\Repositories\AttendanceRepository;
use App\Repositories\ScheduleRepository;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class AttendanceService
{
    public function __construct(
        private AttendanceRepository $attendanceRepository,
        private ScheduleRepository $scheduleRepository,
    ) {
    }

    /**
     * Returns the attendance index data for a faculty member: their assigned subject-section pairs with today's attendance snapshot.
     */
    public function facultyIndexData(User $user): array
    {
        $today = now()->toDateString();

        $assignedSchedules = $this->scheduleRepository->forTeacher($user->id);
        $assignedSectionSchedules = $assignedSchedules->filter(fn ($sched) => $sched->block_section_id !== null);

        $assignedRows = $assignedSectionSchedules
            ->map(fn ($sched) => $this->subjectSectionRow($sched->subject, $sched->blockSection, $today));

        $overriddenSectionIdsBySubject = $assignedSectionSchedules
            ->groupBy('subject_id')
            ->map(fn ($rows) => $rows->pluck('block_section_id')->all());

        $defaultTaughtSubjectIds = $assignedSchedules
            ->filter(fn ($sched) => $sched->block_section_id === null)
            ->pluck('subject_id')
            ->all();

        $ownedSubjects = $this->attendanceRepository->facultySubjectsWithSectionsAndSchedules($user->id, $defaultTaughtSubjectIds);

        $ownedRows = $ownedSubjects->flatMap(function ($subject) use ($today, $overriddenSectionIdsBySubject) {
            $overriddenSectionIds = $overriddenSectionIdsBySubject[$subject->id] ?? [];

            return $subject->blockSections
                ->reject(fn ($section) => in_array($section->id, $overriddenSectionIds, true))
                ->map(fn ($section) => $this->subjectSectionRow($subject, $section, $today));
        });

        $mySubjectSections = $ownedRows->concat($assignedRows)->values();

        return [
            'isFaculty' => true,
            'mySubjectSections' => $mySubjectSections,
            'groupedSections' => [],
            'filters' => [],
            'schoolYears' => [],
            'semesters' => [],
        ];
    }

    /**
     * Returns the attendance index data for admins: all sections grouped by grade level, with filter options for school year and semester.
     */
    public function adminIndexData(?string $search, ?string $schoolYear, ?string $semester): array
    {
        $sections = $this->attendanceRepository->sectionsFiltered($search, $schoolYear, $semester);

        $grouped = $sections->groupBy(fn ($section) => $section->grade_level ?? 'Unassigned')
            ->map(fn ($sections, $label) => ['label' => $label, 'sections' => $sections->values()])
            ->values();

        return [
            'isFaculty' => false,
            'mySubjectSections' => [],
            'groupedSections' => $grouped,
            'filters' => ['search' => $search, 'school_year' => $schoolYear, 'semester' => $semester],
            'schoolYears' => $this->attendanceRepository->distinctSchoolYearsDesc(),
            'semesters' => $this->attendanceRepository->distinctSemesters(),
        ];
    }

    /**
     * Returns all sections for a given grade level, defaulting to the most recent school year and semester if none are specified.
     */
    public function showGradeData(string $gradeLevel, ?string $schoolYear, ?string $semester): array
    {
        $latest = $this->attendanceRepository->latestPeriodForGrade($gradeLevel);
        $schoolYear = $schoolYear ?? $latest?->school_year;
        $semester = $semester ?? $latest?->semester;

        return [
            'gradeLevel' => $gradeLevel,
            'sections' => $this->attendanceRepository->sectionsForGrade($gradeLevel, $schoolYear, $semester),
        ];
    }

    /**
     * Returns the attendance sheet for a section on a specific date: the student list with existing attendance records,
     * per-day statistics, available subjects (filtered by faculty ownership if applicable), and a list of missed weekdays in the past 30 days.
     */
    public function sheetData(BlockSection $blockSection, ?User $user, string $date, ?int $subjectId): array
    {
        $blockSection->load('subjects');
        $subjects = $this->visibleSubjects($blockSection, $user);

        if (! $subjectId && $subjects->isNotEmpty()) {
            $subjectId = $subjects->first()->id;
        }

        $enrollments = $this->attendanceRepository->enrollmentsForSectionSortedByLastName($blockSection->id);

        $existingAttendance = $subjectId
            ? $this->attendanceRepository->attendanceForDateAndSubject($subjectId, $date, $enrollments->pluck('id'))
            : collect();

        return [
            'blockSection' => $blockSection,
            'students' => $this->studentsForSheet($enrollments, $existingAttendance),
            'statistics' => $this->sheetStatistics($enrollments, $existingAttendance),
            'selectedDate' => $date,
            'selectedSubjectId' => (int) $subjectId,
            'subjects' => $subjects->map(fn ($s) => ['id' => $s->id, 'code' => $s->code, 'name' => $s->name]),
            'missedDates' => $subjectId ? $this->getMissedDates((int) $subjectId, $blockSection->id) : [],
        ];
    }

    /**
     * Returns the attendance history for a section, grouped by date, optionally filtered by subject and date range.
     * Faculty members only see subjects they are assigned to teach.
     */
    public function historyData(BlockSection $blockSection, ?User $user, ?int $subjectId, ?string $dateFrom, ?string $dateTo): array
    {
        $blockSection->load('subjects');
        $subjects = $this->visibleSubjects($blockSection, $user);

        if (! $subjectId && $subjects->isNotEmpty()) {
            $subjectId = $subjects->first()->id;
        }

        $rows = $this->attendanceRepository->attendanceRowsForHistory($subjectId, $blockSection->id, $dateFrom, $dateTo);
        $records = $rows->groupBy(fn ($a) => $a->date->format('Y-m-d'))
            ->map(fn ($dayRows, $date) => $this->historyRecordRow($date, $dayRows))
            ->values();

        return [
            'blockSection' => $blockSection->only(['id', 'code', 'name', 'grade_level', 'strand', 'school_year', 'semester']),
            'subjects' => $subjects->map(fn ($s) => ['id' => $s->id, 'code' => $s->code, 'name' => $s->name]),
            'selectedSubjectId' => (int) $subjectId,
            'dateFrom' => $dateFrom,
            'dateTo' => $dateTo,
            'records' => $records,
        ];
    }

    /**
     * Saves or updates attendance records for all students in a section for a given date and subject.
     */
    public function store(BlockSection $blockSection, array $data, ?User $user = null): void
    {
        if ($user && $user->hasRole('faculty')) {
            $visibleIds = $this->visibleSubjects($blockSection, $user)->pluck('id');
            abort_if(! $visibleIds->contains((int) $data['subject_id']), 403, 'You are not assigned to teach this subject in this section.');
        }

        DB::transaction(function () use ($data) {
            foreach ($data['attendance'] as $entry) {
                $this->attendanceRepository->upsertAttendance(
                    $entry['student_enrollment_id'],
                    $data['subject_id'],
                    $data['date'],
                    $entry['status'],
                    $entry['remarks'] ?? null
                );
            }
        });
    }

    /**
     * Builds a summary row for one subject-section pair on the faculty index, including enrollment count, today's attendance status, and missed day count.
     */
    private function subjectSectionRow($subject, $section, string $today): array
    {
        $enrolledCount = $this->attendanceRepository->countEnrolledForSubjectSection($subject->id, $section->id);
        $todayStats = $this->attendanceRepository->todayAttendanceStats($subject->id, $section->id, $today);

        return [
            'subject_id' => $subject->id,
            'subject_code' => $subject->code,
            'subject_name' => $subject->name,
            'subject_schedule' => $subject->schedules->firstWhere('block_section_id', $section->id)?->display,
            'block_section_id' => $section->id,
            'section_code' => $section->code,
            'section_name' => $section->name,
            'grade_level' => $section->grade_level,
            'enrolled_count' => $enrolledCount,
            'today_taken' => $todayStats['taken'],
            'today_present_count' => $todayStats['present_count'],
            'missed_days_count' => count($this->getMissedDates($subject->id, $section->id)),
        ];
    }

    /**
     * Returns the subjects for a section visible to the given user.
     * Faculty members only see subjects they personally teach; admins see all subjects.
     */
    private function visibleSubjects(BlockSection $blockSection, ?User $user)
    {
        $subjects = $blockSection->subjects;

        if ($user && $user->hasRole('faculty')) {
            $subjects = $subjects->filter(function ($s) use ($blockSection, $user) {
                $sched = $s->scheduleFor($blockSection->id) ?? $s->defaultSchedule;

                return ($sched?->teacher_id ?? $s->user_id) === $user->id;
            })->values();
        }

        return $subjects;
    }

    /**
     * Maps enrollments to attendance sheet rows, merging in each student's existing attendance record for the selected date if one exists.
     */
    private function studentsForSheet($enrollments, $existingAttendance)
    {
        return $enrollments->map(function ($enrollment) use ($existingAttendance) {
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
    }

    /**
     * Computes attendance statistics for the current sheet: total students, how many are marked, counts by status, and overall attendance rate.
     */
    private function sheetStatistics($enrollments, $existingAttendance): array
    {
        $presentCount = $existingAttendance->where('status', 'Present')->count();
        $absentCount = $existingAttendance->where('status', 'Absent')->count();
        $lateCount = $existingAttendance->where('status', 'Late')->count();
        $excusedCount = $existingAttendance->where('status', 'Excused')->count();
        $totalStudents = $enrollments->count();
        $markedCount = $existingAttendance->count();

        return [
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
    }

    /**
     * Summarises all attendance records for a single day into a history row with counts by status and an attendance rate.
     */
    private function historyRecordRow(string $date, $dayRows): array
    {
        $present = $dayRows->where('status', 'Present')->count();
        $absent = $dayRows->where('status', 'Absent')->count();
        $late = $dayRows->where('status', 'Late')->count();
        $excused = $dayRows->where('status', 'Excused')->count();
        $total = $dayRows->count();

        return [
            'date' => $date,
            'total_marked' => $total,
            'present' => $present,
            'absent' => $absent,
            'late' => $late,
            'excused' => $excused,
            'attendance_rate' => $total > 0 ? round((($present + $late) / $total) * 100, 1) : null,
        ];
    }

    /**
     * Returns a list of weekdays in the past N days (default 30) for which no attendance was recorded for the given subject and section.
     * Results are returned newest-first so the most recent missed dates appear at the top.
     */
    private function getMissedDates(int $subjectId, int $blockSectionId, int $daysBack = 30): array
    {
        $today = now()->toDateString();
        $startDate = now()->subDays($daysBack)->toDateString();

        $taken = $this->attendanceRepository->takenDatesSet($subjectId, $blockSectionId, $startDate, $today);

        $missed = [];
        $cursor = Carbon::parse($startDate);
        $yesterday = Carbon::yesterday();

        while ($cursor->lte($yesterday)) {
            if ($cursor->isWeekday() && ! array_key_exists($cursor->toDateString(), $taken)) {
                $missed[] = $cursor->toDateString();
            }
            $cursor->addDay();
        }

        return array_reverse($missed);
    }
}
