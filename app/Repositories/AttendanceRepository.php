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
    public function facultySubjectsWithSectionsAndSchedules(int $userId): Collection
    {
        return Subject::where('user_id', $userId)
            ->with(['blockSections', 'schedules'])
            ->get();
    }

    public function countEnrolledForSubjectSection(int $subjectId, int $sectionId): int
    {
        return StudentEnrollmentSubject::whereHas(
            'enrollment',
            fn ($q) => $q->where('block_section_id', $sectionId)
        )->where('subject_id', $subjectId)->count();
    }

    public function todayAttendanceStats(int $subjectId, int $sectionId, string $today): array
    {
        $todayQuery = Attendance::where('subject_id', $subjectId)
            ->whereHas('studentEnrollment', fn ($q) => $q->where('block_section_id', $sectionId))
            ->whereDate('date', $today);

        $taken = (clone $todayQuery)->exists();
        $presentCount = $taken ? (clone $todayQuery)->where('status', 'Present')->count() : 0;

        return ['taken' => $taken, 'present_count' => $presentCount];
    }

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

    public function latestPeriodForGrade(string $gradeLevel): ?BlockSection
    {
        return BlockSection::where('grade_level', $gradeLevel)
            ->orderByDesc('school_year')
            ->orderByDesc('semester')
            ->first(['school_year', 'semester']);
    }

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

    public function attendanceForDateAndSubject(int $subjectId, string $date, iterable $enrollmentIds): Collection
    {
        return Attendance::where('subject_id', $subjectId)
            ->whereDate('date', $date)
            ->whereIn('student_enrollment_id', $enrollmentIds)
            ->get()
            ->keyBy('student_enrollment_id');
    }

    public function attendanceRowsForHistory(int $subjectId, int $blockSectionId, ?string $dateFrom, ?string $dateTo): Collection
    {
        return Attendance::where('subject_id', $subjectId)
            ->whereHas('studentEnrollment', fn ($q) => $q->where('block_section_id', $blockSectionId))
            ->when($dateFrom, fn ($q) => $q->where('date', '>=', $dateFrom))
            ->when($dateTo, fn ($q) => $q->where('date', '<=', $dateTo))
            ->orderBy('date', 'desc')
            ->get();
    }

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

    public function distinctSchoolYearsDesc(): SupportCollection
    {
        return BlockSection::distinct()->orderBy('school_year', 'desc')->pluck('school_year')->filter()->values();
    }

    public function distinctSemesters(): SupportCollection
    {
        return BlockSection::distinct()->pluck('semester')->filter()->values();
    }
}
