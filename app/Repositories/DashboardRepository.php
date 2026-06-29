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
    public function facultySubjectsWithSections(int $userId): Collection
    {
        return Subject::query()
            ->where('user_id', '=', $userId)
            ->with('blockSections')
            ->get();
    }

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

    public function applicantCount(callable $periodScope, ?string $status = null): int
    {
        return Applicant::query()
            ->when($status, fn ($q) => $q->where('application_status', '=', $status))
            ->tap($periodScope)
            ->count('*');
    }

    public function pendingApplicantCount(callable $periodScope): int
    {
        return Applicant::query()
            ->where('application_status', '!=', 'Enrolled')
            ->tap($periodScope)
            ->count('*');
    }

    public function portalCredentialCount(): int
    {
        return PortalCredential::query()->count('*');
    }

    public function studentCount(): int
    {
        return Student::query()->count('*');
    }

    public function statusBreakdownRows(callable $periodScope): Collection
    {
        return Applicant::query()
            ->select(['application_status', DB::raw('count(*) as "count"')])
            ->tap($periodScope)
            ->groupBy('application_status')
            ->get();
    }

    public function categoryBreakdownRows(callable $periodScope): Collection
    {
        return Applicant::query()
            ->select(['student_category', DB::raw('count(*) as "count"')])
            ->tap($periodScope)
            ->groupBy('student_category')
            ->get();
    }

    public function monthlyApplicationsCount(callable $periodScope, int $year, int $month): int
    {
        return Applicant::query()->tap($periodScope)
            ->whereYear('created_at', '=', $year, 'and')
            ->whereMonth('created_at', '=', $month, 'and')
            ->count('*');
    }

    public function monthlyEnrollmentsCount(callable $periodScope, int $year, int $month): int
    {
        return Applicant::query()
            ->where('application_status', '=', 'Enrolled')
            ->tap($periodScope)
            ->whereYear('updated_at', '=', $year, 'and')
            ->whereMonth('updated_at', '=', $month, 'and')
            ->count('*');
    }

    public function enrolledStudentsGradeStrand(?string $schoolYear): Collection
    {
        return Student::query()
            ->join('applicants', 'students.applicant_id', '=', 'applicants.id')
            ->select(['students.current_year_level as grade_level', 'applicants.strand as strand'])
            ->where('students.enrollment_status', '=', 'Active')
            ->when($schoolYear && $schoolYear !== '—', fn ($q) => $q->where('students.current_school_year', $schoolYear))
            ->get();
    }

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
