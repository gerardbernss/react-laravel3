<?php

namespace App\Repositories;

use App\Models\Attendance;
use App\Models\BlockSection;
use App\Models\StudentEnrollment;
use App\Models\StudentEnrollmentSubject;
use App\Models\Subject;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Collection as SupportCollection;
use Illuminate\Support\Facades\DB;

class AttendanceRepository
{
    /**
     * Returns all subjects the given faculty user is the default teacher for — either as the subject's own
     * owner (subjects.user_id) or as the teacher on the subject's default schedule — with their block sections
     * and schedules eager-loaded.
     */
    public function facultySubjectsWithSectionsAndSchedules(int $userId, array $defaultTaughtSubjectIds = []): Collection
    {
        return Subject::where('user_id', $userId)
            ->orWhereIn('id', $defaultTaughtSubjectIds)
            ->with(['blockSections', 'schedules'])
            ->get();
    }

    /**
     * Returns the number of students enrolled in the given subject within the given section.
     */
    public function countEnrolledForSubjectSection(int $subjectId, int $sectionId): int
    {
        return StudentEnrollmentSubject::whereHas(
            'enrollment',
            fn ($q) => $q->where('block_section_id', $sectionId)
        )->where('subject_id', $subjectId)->count();
    }

    /**
     * Returns whether attendance has been taken today for the given subject/section, and how many students were marked Present.
     */
    public function todayAttendanceStats(int $subjectId, int $sectionId, string $today): array
    {
        $todayQuery = Attendance::where('subject_id', $subjectId)
            ->whereHas('studentEnrollment', fn ($q) => $q->where('block_section_id', $sectionId))
            ->whereDate('date', $today);

        $taken = (clone $todayQuery)->exists();
        $presentCount = $taken ? (clone $todayQuery)->where('status', 'Present')->count() : 0;

        return ['taken' => $taken, 'present_count' => $presentCount];
    }

    /**
     * Returns block sections with subject count and enrolled student count, filtered by optional search, school year, and semester, sorted by grade level then strand then code.
     */
    public function sectionsFiltered(?string $search, ?string $schoolYear, ?string $semester): Collection
    {
        return BlockSection::query()
            ->withCount(['subjects'])
            ->addSelect(['enrolled_count' => StudentEnrollment::selectRaw('count(*)')
                ->whereColumn('block_section_id', 'block_sections.id'),
            ])
            ->when($search, function ($q, $search) {
                $q->where(function ($q) use ($search) {
                    $q->where('code', 'like', "%{$search}%")
                        ->orWhere('name', 'like', "%{$search}%")
                        ->orWhere('adviser', 'like', "%{$search}%");
                });
            })
            ->when($schoolYear, fn ($q) => $q->where('school_year', $schoolYear))
            ->when($semester, fn ($q) => $q->where('semester', $semester))
            ->orderBy('grade_level')
            ->orderBy('strand')
            ->orderBy('code')
            ->get();
    }

    /**
     * Returns the most recent school year and semester that has a section for the given grade level — used as the default filter when the page first loads.
     */
    public function latestPeriodForGrade(string $gradeLevel): ?BlockSection
    {
        return BlockSection::where('grade_level', $gradeLevel)
            ->orderByDesc('school_year')
            ->orderByDesc('semester')
            ->first(['school_year', 'semester']);
    }

    /**
     * Returns sections for a specific grade level with subject and enrollment counts, optionally filtered by school year and semester.
     */
    public function sectionsForGrade(string $gradeLevel, ?string $schoolYear, ?string $semester): Collection
    {
        return BlockSection::query()
            ->withCount(['subjects'])
            ->addSelect(['enrolled_count' => StudentEnrollment::selectRaw('count(*)')
                ->whereColumn('block_section_id', 'block_sections.id'),
            ])
            ->where('grade_level', $gradeLevel)
            ->when($schoolYear, fn ($q) => $q->where('school_year', $schoolYear))
            ->when($semester, fn ($q) => $q->where('semester', $semester))
            ->orderBy('strand')
            ->orderBy('code')
            ->get();
    }

    /**
     * Returns all enrollments for a section with student personal data eager-loaded, sorted alphabetically by last name via a correlated subquery.
     */
    public function enrollmentsForSectionSortedByLastName(int $blockSectionId): Collection
    {
        return StudentEnrollment::where('block_section_id', $blockSectionId)
            ->with(['student.personalData:id,last_name,first_name,middle_name'])
            ->orderBy(
                DB::raw('(SELECT last_name FROM applicant_personal_data
                    JOIN students ON students.applicant_personal_data_id = applicant_personal_data.id
                    WHERE students.id = student_enrollments.student_id)'),
                'asc'
            )
            ->get();
    }

    /**
     * Returns attendance records for the given subject and date, keyed by student_enrollment_id for O(1) lookup per student.
     */
    public function attendanceForDateAndSubject(int $subjectId, string $date, iterable $enrollmentIds): Collection
    {
        return Attendance::where('subject_id', $subjectId)
            ->whereDate('date', $date)
            ->whereIn('student_enrollment_id', $enrollmentIds)
            ->get()
            ->keyBy('student_enrollment_id');
    }

    /**
     * Returns attendance records for a subject/section within an optional date range, newest first — used for the attendance history view.
     */
    public function attendanceRowsForHistory(int $subjectId, int $blockSectionId, ?string $dateFrom, ?string $dateTo): Collection
    {
        return Attendance::where('subject_id', $subjectId)
            ->whereHas('studentEnrollment', fn ($q) => $q->where('block_section_id', $blockSectionId))
            ->when($dateFrom, fn ($q) => $q->where('date', '>=', $dateFrom))
            ->when($dateTo, fn ($q) => $q->where('date', '<=', $dateTo))
            ->orderBy('date', 'desc')
            ->get();
    }

    /**
     * Returns a flipped array (date string → true) of past dates where attendance was already taken for the subject/section.
     * Used to mark calendar days as "taken" without an O(n) search per date.
     */
    public function takenDatesSet(int $subjectId, int $blockSectionId, string $startDate, string $today): array
    {
        return Attendance::where('subject_id', $subjectId)
            ->whereHas('studentEnrollment', fn ($q) => $q->where('block_section_id', $blockSectionId))
            ->where('date', '>=', $startDate)
            ->where('date', '<', $today)
            ->distinct()
            ->pluck('date')
            ->map(fn ($date) => $date->toDateString())
            ->flip()
            ->all();
    }

    /**
     * Returns attendance counts keyed by status (Present, Absent, Late, etc.) for a student's enrollment in a specific subject.
     */
    public function countsByStatusFor(int $enrollmentId, int $subjectId): array
    {
        return Attendance::where('student_enrollment_id', $enrollmentId)
            ->where('subject_id', $subjectId)
            ->selectRaw('status, count(*) as "cnt"')
            ->groupBy('status')
            ->pluck('cnt', 'status')
            ->map(fn ($v) => (int) $v)
            ->toArray();
    }

    /**
     * Creates or updates the attendance record for a student's enrollment on a specific date and subject.
     */
    public function upsertAttendance(int $studentEnrollmentId, int $subjectId, string $date, string $status, ?string $remarks): void
    {
        Attendance::updateOrCreate(
            [
                'student_enrollment_id' => $studentEnrollmentId,
                'subject_id' => $subjectId,
                'date' => $date,
            ],
            [
                'status' => $status,
                'remarks' => $remarks,
            ]
        );
    }

    /**
     * Returns distinct school years from block sections, newest first, for use in filter dropdowns.
     */
    public function distinctSchoolYearsDesc(): SupportCollection
    {
        return BlockSection::distinct()->orderBy('school_year', 'desc')->pluck('school_year')->filter()->values();
    }

    /**
     * Returns distinct semester values from block sections for use in filter dropdowns.
     */
    public function distinctSemesters(): SupportCollection
    {
        return BlockSection::distinct()->pluck('semester')->filter()->values();
    }
}
