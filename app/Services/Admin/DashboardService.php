<?php

namespace App\Services\Admin;

use App\Models\BlockSection;
use App\Models\EnrollmentPeriod;
use App\Models\Subject;
use App\Models\User;
use App\Repositories\AttendanceRepository;
use App\Repositories\DashboardRepository;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;

class DashboardService
{
    private const NO_STRAND_LABELS = [
        'Laboratory Elementary School',
        'Laboratory Junior High School',
    ];

    private const SHS_STRANDS = [
        'Accountancy, Business and Management',
        'Humanities and Social Sciences',
        'Science, Technology, Engineering and Mathematics',
    ];

    public function __construct(
        private DashboardRepository $dashboardRepository,
        private AttendanceRepository $attendanceRepository,
    ) {
    }

    public function facultyDashboardData(User $user): array
    {
        $today = now()->toDateString();
        $subjects = $this->dashboardRepository->facultySubjectsWithSections($user->id);

        $myClasses = $subjects
            ->flatMap(fn ($subject) => $subject->blockSections->map(
                fn ($section) => $this->buildClassCard($subject, $section, $today)
            ))
            ->values();

        return [
            'isFaculty' => true,
            'myClasses' => $myClasses,
            'today' => now()->format('F j, Y'),
            'stats' => null,
            'statusBreakdown' => [],
            'categoryBreakdown' => [],
            'monthlyApplications' => [],
            'monthlyEnrollments' => [],
            'blockSections' => [],
            'currentSchoolYear' => '',
        ];
    }

    public function adminDashboardData(): array
    {
        $currentPeriod = EnrollmentPeriod::current();
        $currentSchoolYear = $currentPeriod?->school_year ?? '—';
        $periodScope = fn (Builder $q) => $q->when($currentPeriod, fn (Builder $q) => $currentPeriod->applyTo($q));

        return [
            'isFaculty' => false,
            'myClasses' => [],
            'today' => now()->format('F j, Y'),
            'stats' => $this->buildStats($periodScope),
            'statusBreakdown' => $this->buildStatusBreakdown($periodScope),
            'categoryBreakdown' => $this->buildCategoryBreakdown($periodScope),
            'monthlyApplications' => $this->buildMonthlyApplications($periodScope),
            'monthlyEnrollments' => $this->buildMonthlyEnrollments($periodScope),
            'blockSections' => [],
            'enrollmentByGrade' => $this->buildEnrollmentByGrade($currentSchoolYear),
            'currentSchoolYear' => $currentSchoolYear,
            'announcements' => $this->buildAnnouncements(),
        ];
    }

    private function buildClassCard(Subject $subject, BlockSection $section, string $today): array
    {
        $enrolledCount = $this->dashboardRepository->countEnrollmentSubjects($subject->id, $section->id);
        $gradedCount = $this->dashboardRepository->countEnrollmentSubjects($subject->id, $section->id, true);
        $todayStats = $this->attendanceRepository->todayAttendanceStats($subject->id, $section->id, $today);

        return [
            'subject_id' => $subject->id,
            'subject_code' => $subject->code,
            'subject_name' => $subject->name,
            'subject_schedule' => $subject->schedule,
            'block_section_id' => $section->id,
            'section_code' => $section->code,
            'section_name' => $section->name,
            'grade_level' => $section->grade_level,
            'enrolled_count' => $enrolledCount,
            'graded_count' => $gradedCount,
            'today_taken' => $todayStats['taken'],
            'today_present_count' => $todayStats['present_count'],
        ];
    }

    private function buildStats(callable $periodScope): array
    {
        return [
            'total_applicants' => $this->dashboardRepository->applicantCount($periodScope),
            'pending' => $this->dashboardRepository->pendingApplicantCount($periodScope),
            'for_exam' => $this->dashboardRepository->applicantCount($periodScope, 'For Exam'),
            'exam_taken' => $this->dashboardRepository->applicantCount($periodScope, 'Exam Taken'),
            'enrolled' => $this->dashboardRepository->applicantCount($periodScope, 'Enrolled'),
            'portal_credentials' => $this->dashboardRepository->portalCredentialCount(),
            'students' => $this->dashboardRepository->studentCount(),
        ];
    }

    private function buildStatusBreakdown(callable $periodScope): array
    {
        return $this->dashboardRepository->statusBreakdownRows($periodScope)
            ->map(fn ($item) => ['status' => $item->application_status ?? 'Unknown', 'count' => (int) $item->count])
            ->toArray();
    }

    private function buildCategoryBreakdown(callable $periodScope): array
    {
        return $this->dashboardRepository->categoryBreakdownRows($periodScope)
            ->map(fn ($item) => ['category' => $item->student_category ?? 'Unknown', 'count' => (int) $item->count])
            ->toArray();
    }

    private function buildMonthlyApplications(callable $periodScope): array
    {
        $rows = [];
        for ($i = 5; $i >= 0; $i--) {
            $date = Carbon::now()->subMonths($i);
            $rows[] = [
                'month' => $date->format('M Y'),
                'count' => $this->dashboardRepository->monthlyApplicationsCount($periodScope, $date->year, $date->month),
            ];
        }

        return $rows;
    }

    private function buildMonthlyEnrollments(callable $periodScope): array
    {
        $rows = [];
        for ($i = 5; $i >= 0; $i--) {
            $date = Carbon::now()->subMonths($i);
            $rows[] = [
                'month' => $date->format('M Y'),
                'count' => $this->dashboardRepository->monthlyEnrollmentsCount($periodScope, $date->year, $date->month),
            ];
        }

        return $rows;
    }

    private function buildEnrollmentByGrade(?string $schoolYear = null): array
    {
        $normalizeStrand = fn (?string $strand) => in_array($strand, self::NO_STRAND_LABELS) ? null : $strand;

        $enrolledCounts = $this->dashboardRepository->enrolledStudentsGradeStrand($schoolYear)
            ->groupBy(fn ($a) => $a->grade_level . '|' . ($normalizeStrand($a->strand) ?? ''))
            ->map(fn ($group) => $group->count());

        $enrolledFor = fn (string $grade, ?string $strand) => (int) ($enrolledCounts->get($grade . '|' . ($strand ?? '')) ?? 0);

        $sectionRows = $this->dashboardRepository->sectionCapacityByGradeStrand($schoolYear)
            ->map(function ($b) use ($enrolledFor) {
                $noStrandLabel = in_array($b->strand, self::NO_STRAND_LABELS);
                $enrolled = $enrolledFor($b->grade_level, $noStrandLabel ? null : $b->strand);

                return [
                    'label' => $noStrandLabel ? $b->grade_level : ($b->strand ? "{$b->grade_level} · {$b->strand}" : $b->grade_level),
                    'grade' => $b->grade_level,
                    'program' => $b->strand,
                    'enrolled' => $enrolled,
                    'capacity' => (int) $b->total_capacity,
                    'percentage' => $b->total_capacity > 0 ? round(($enrolled / $b->total_capacity) * 100) : 0,
                ];
            });

        $expected = $this->expectedGradeStrandCombos();
        $existing = $sectionRows->keyBy(fn ($r) => $r['label']);

        foreach ($expected as $combo) {
            if (! $existing->has($combo['label'])) {
                $sectionRows->push([
                    'label' => $combo['label'],
                    'grade' => $combo['grade'],
                    'program' => $combo['strand'],
                    'enrolled' => $enrolledFor($combo['grade'], $combo['strand']),
                    'capacity' => 0,
                    'percentage' => 0,
                ]);
            }
        }

        return $sectionRows
            ->sortBy(fn ($b) => (int) preg_replace('/\D/', '', $b['grade']))
            ->values()
            ->toArray();
    }

    private function expectedGradeStrandCombos()
    {
        $expected = collect();

        foreach (range(1, 6) as $n) {
            $expected->push(['grade' => "Grade {$n}", 'strand' => null, 'label' => "Grade {$n}"]);
        }
        foreach (range(7, 10) as $n) {
            $expected->push(['grade' => "Grade {$n}", 'strand' => null, 'label' => "Grade {$n}"]);
        }
        foreach ([11, 12] as $n) {
            foreach (self::SHS_STRANDS as $strand) {
                $expected->push(['grade' => "Grade {$n}", 'strand' => $strand, 'label' => "Grade {$n} · {$strand}"]);
            }
        }

        return $expected;
    }

    private function buildAnnouncements(): array
    {
        return $this->dashboardRepository->activeAnnouncements(5)
            ->map(fn ($a) => [
                'id' => $a->announcement_id,
                'title' => $a->title,
                'content' => $a->content,
                'publish_start' => $a->publish_start?->format('M d, Y'),
            ])
            ->toArray();
    }
}
