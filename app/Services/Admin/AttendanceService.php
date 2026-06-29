<?php

namespace App\Services\Admin;

use App\Models\BlockSection;
use App\Models\User;
use App\Repositories\AttendanceRepository;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class AttendanceService
{
    public function __construct(private AttendanceRepository $attendanceRepository)
    {
    }

    public function facultyIndexData(User $user): array
    {
        $today = now()->toDateString();
        $subjects = $this->attendanceRepository->facultySubjectsWithSectionsAndSchedules($user->id);

        $mySubjectSections = $subjects->flatMap(
            fn ($subject) => $subject->blockSections->map(
                fn ($section) => $this->subjectSectionRow($subject, $section, $today)
            )
        )->values();

        return [
            'isFaculty' => true,
            'mySubjectSections' => $mySubjectSections,
            'groupedSections' => [],
            'filters' => [],
            'schoolYears' => [],
            'semesters' => [],
        ];
    }

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

    public function store(BlockSection $blockSection, array $data): void
    {
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

    private function visibleSubjects(BlockSection $blockSection, ?User $user)
    {
        $subjects = $blockSection->subjects;

        if ($user && $user->hasRole('faculty')) {
            $subjects = $subjects->filter(fn ($s) => $s->user_id === $user->id)->values();
        }

        return $subjects;
    }

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
