<?php

namespace App\Repositories;

use App\Models\Announcement;
use App\Models\Applicant;
use App\Models\BlockSection;
use App\Models\PortalCredential;
use App\Models\Student;
use App\Models\StudentEnrollmentSubject;
use App\Models\Subject;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class DashboardRepository
{
    /**
     * Returns subjects the given faculty user is the default teacher for — either as the subject's own owner
     * (subjects.user_id) or as the teacher on the subject's default schedule — with block sections eager-loaded.
     */
    public function facultySubjectsWithSections(int $userId, array $defaultTaughtSubjectIds = []): Collection
    {
        return Subject::query()
            ->where('user_id', '=', $userId)
            ->orWhereIn('id', $defaultTaughtSubjectIds)
            ->with('blockSections')
            ->get();
    }

    /**
     * Counts how many students in a section are enrolled in a given subject.
     * Pass `$gradedOnly = true` to count only those who already have a grade recorded.
     */
    public function countEnrollmentSubjects(int $subjectId, int $sectionId, bool $gradedOnly = false): int
    {
        return StudentEnrollmentSubject::whereHas(
            'enrollment',
            fn (Builder $q) => $q->where('block_section_id', '=', $sectionId)
        )
            ->where('subject_id', '=', $subjectId)
            ->when($gradedOnly, fn ($q) => $q->whereNotNull('grade'))
            ->count('*');
    }

    /**
     * Counts applicants within the period defined by `$periodScope`, optionally filtered to a specific application status.
     */
    public function applicantCount(callable $periodScope, ?string $status = null): int
    {
        return Applicant::query()
            ->when($status, fn ($q) => $q->where('application_status', '=', $status))
            ->tap($periodScope)
            ->count('*');
    }

    /**
     * Counts applicants within the period who are not yet enrolled (any status other than "Enrolled").
     */
    public function pendingApplicantCount(callable $periodScope): int
    {
        return Applicant::query()
            ->where('application_status', '!=', 'Enrolled')
            ->tap($periodScope)
            ->count('*');
    }

    /**
     * Returns the total number of student portal credentials across all periods.
     */
    public function portalCredentialCount(): int
    {
        return PortalCredential::query()->count('*');
    }

    /**
     * Returns the total number of student records across all school years.
     */
    public function studentCount(): int
    {
        return Student::query()->count('*');
    }

    /**
     * Returns applicant counts grouped by application_status for the period — used to build the status breakdown chart.
     */
    public function statusBreakdownRows(callable $periodScope): Collection
    {
        return Applicant::query()
            ->select(['application_status', DB::raw('count(*) as "count"')])
            ->tap($periodScope)
            ->groupBy('application_status')
            ->get();
    }

    /**
     * Returns applicant counts grouped by student_category (LES/JHS/SHS) for the period — used to build the category breakdown chart.
     */
    public function categoryBreakdownRows(callable $periodScope): Collection
    {
        return Applicant::query()
            ->select(['student_category', DB::raw('count(*) as "count"')])
            ->tap($periodScope)
            ->groupBy('student_category')
            ->get();
    }

    /**
     * Counts new applications created in the given year/month within the period scope.
     */
    public function monthlyApplicationsCount(callable $periodScope, int $year, int $month): int
    {
        return Applicant::query()->tap($periodScope)
            ->whereYear('created_at', '=', $year, 'and')
            ->whereMonth('created_at', '=', $month, 'and')
            ->count('*');
    }

    /**
     * Counts applicants whose status changed to "Enrolled" in the given year/month within the period scope.
     */
    public function monthlyEnrollmentsCount(callable $periodScope, int $year, int $month): int
    {
        return Applicant::query()
            ->where('application_status', '=', 'Enrolled')
            ->tap($periodScope)
            ->whereYear('updated_at', '=', $year, 'and')
            ->whereMonth('updated_at', '=', $month, 'and')
            ->count('*');
    }

    /**
     * Returns the grade level and strand for every active student, optionally filtered to a specific school year.
     * Used to count enrolled students per grade/strand combination on the dashboard.
     */
    public function enrolledStudentsGradeStrand(?string $schoolYear): Collection
    {
        return Student::query()
            ->join('applicants', 'students.applicant_id', '=', 'applicants.id')
            ->select(['students.current_year_level as grade_level', 'applicants.strand as strand'])
            ->where('students.enrollment_status', '=', 'Active')
            ->when($schoolYear && $schoolYear !== '—', fn ($q) => $q->where('students.current_school_year', $schoolYear))
            ->get();
    }

    /**
     * Returns the summed section capacity grouped by grade_level and strand, optionally filtered to a specific school year.
     * Used alongside `enrolledStudentsGradeStrand()` to compute the enrollment fill-rate widget.
     */
    public function sectionCapacityByGradeStrand(?string $schoolYear): Collection
    {
        return BlockSection::query()
            ->select([
                'grade_level',
                'strand',
                DB::raw('SUM(capacity) as "total_capacity"'),
            ])
            ->when($schoolYear && $schoolYear !== '—', fn ($q) => $q->where('school_year', $schoolYear))
            ->groupBy('grade_level', 'strand')
            ->get();
    }

    /**
     * Returns the most recent active announcements (publish window includes now), newest first, up to the given limit.
     */
    public function activeAnnouncements(int $limit): Collection
    {
        $now = now();

        return Announcement::query()
            ->where('publish_start', '<=', $now)
            ->where(fn (Builder $q) => $q->whereNull('publish_end')->orWhere('publish_end', '>=', $now))
            ->orderByDesc('publish_start')
            ->limit($limit)
            ->get();
    }
}
