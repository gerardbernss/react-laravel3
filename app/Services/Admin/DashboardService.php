<?php

namespace App\Services\Admin;

use App\Models\BlockSection;
use App\Models\EnrollmentPeriod;
use App\Models\Subject;
use App\Models\User;
use App\Repositories\AttendanceRepository;
use App\Repositories\DashboardRepository;
use App\Repositories\ScheduleRepository;
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
        private ScheduleRepository $scheduleRepository,
    ) {
    }

    /**
     * Returns dashboard data for a faculty member: today's classes with enrollment and attendance stats.
     * Admin-only fields (stats, charts, announcements) are returned as empty placeholders.
     * Includes subjects owned via subjects.user_id and subjects/sections assigned via schedule.teacher_id.
     */
    public function facultyDashboardData(User $user): array
    {
        $today = now()->toDateString();

        $assignedSchedules = $this->scheduleRepository->forTeacher($user->id);
        $assignedSectionSchedules = $assignedSchedules->filter(fn ($sched) => $sched->block_section_id !== null);

        $assignedClasses = $assignedSectionSchedules
            ->map(fn ($sched) => $this->buildClassCard($sched->subject, $sched->blockSection, $today));

        $overriddenSectionIdsBySubject = $assignedSectionSchedules
            ->groupBy('subject_id')
            ->map(fn ($rows) => $rows->pluck('block_section_id')->all());

        $defaultTaughtSubjectIds = $assignedSchedules
            ->filter(fn ($sched) => $sched->block_section_id === null)
            ->pluck('subject_id')
            ->all();

        $subjects = $this->dashboardRepository->facultySubjectsWithSections($user->id, $defaultTaughtSubjectIds);

        $ownedClasses = $subjects->flatMap(function ($subject) use ($today, $overriddenSectionIdsBySubject) {
            $overriddenSectionIds = $overriddenSectionIdsBySubject[$subject->id] ?? [];

            return $subject->blockSections
                ->reject(fn ($section) => in_array($section->id, $overriddenSectionIds, true))
                ->map(fn ($section) => $this->buildClassCard($subject, $section, $today));
        });

        $myClasses = $ownedClasses->concat($assignedClasses)->values();

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

    /**
     * Returns the full admin dashboard payload: applicant stats, status/category breakdowns,
     * monthly application and enrollment charts, enrollment by grade level, and recent announcements.
     * All data is scoped to the currently active enrollment period.
     */
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

    /**
     * Builds a summary card for one of a faculty member's classes, including enrollment count,
     * graded count, and today's attendance snapshot.
     */
    private function buildClassCard(Subject $subject, BlockSection $section, string $today): array
    {
        $enrolledCount = $this->dashboardRepository->countEnrollmentSubjects($subject->id, $section->id);
        $gradedCount = $this->dashboardRepository->countEnrollmentSubjects($subject->id, $section->id, true);
        $todayStats = $this->attendanceRepository->todayAttendanceStats($subject->id, $section->id, $today);
        $sched = $subject->scheduleFor($section->id) ?? $subject->defaultSchedule;

        return [
            'subject_id' => $subject->id,
            'subject_code' => $subject->code,
            'subject_name' => $subject->name,
            'subject_schedule' => $sched?->display,
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

    /**
     * Returns applicant and student counts for the current enrollment period.
     */
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

    /**
     * Returns applicant counts grouped by application status (e.g. Pending, For Exam, Enrolled).
     */
    private function buildStatusBreakdown(callable $periodScope): array
    {
        return $this->dashboardRepository->statusBreakdownRows($periodScope)
            ->map(fn ($item) => ['status' => $item->application_status ?? 'Unknown', 'count' => (int) $item->count])
            ->toArray();
    }

    /**
     * Returns applicant counts grouped by student category (e.g. New, Transferee, Returnee).
     */
    private function buildCategoryBreakdown(callable $periodScope): array
    {
        return $this->dashboardRepository->categoryBreakdownRows($periodScope)
            ->map(fn ($item) => ['category' => $item->student_category ?? 'Unknown', 'count' => (int) $item->count])
            ->toArray();
    }

    /**
     * Returns new application counts for each of the last 6 months, for the monthly applications chart.
     */
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

    /**
     * Returns enrollment counts for each of the last 6 months, for the monthly enrollments chart.
     */
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

    /**
     * Returns enrollment vs. capacity data for every grade level and strand combination.
     * Rows from block sections are merged with a fixed list of expected combos so all grades always appear,
     * even if no sections have been configured yet for that school year.
     * Strands like 'Laboratory Elementary School' are treated as no-strand (elementary/JHS) rows.
     */
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

    /**
     * Returns the full list of expected grade/strand combinations used to fill gaps in the enrollment chart.
     * Covers Grades 1–10 (no strand) and Grades 11–12 (one row per SHS strand).
     */
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

    /**
     * Returns the 5 most recently active announcements for the dashboard notice board.
     */
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
