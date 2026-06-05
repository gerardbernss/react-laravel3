<?php
namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Announcement;
use App\Models\Applicant;
use App\Models\Attendance;
use App\Models\BlockSection;
use App\Models\EnrollmentPeriod;
use App\Models\PortalCredential;
use App\Models\Student;
use App\Models\StudentEnrollmentSubject;
use App\Models\Subject;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(): Response
    {
        /** @var \App\Models\User|null $user */
        $user = Auth::user();

        if ($user && $user->hasRole('faculty')) {
            return $this->facultyDashboard($user);
        }

        return $this->adminDashboard();
    }

    private function facultyDashboard(\App\Models\User $user): Response
    {
        $today = now()->toDateString();

        $subjects = Subject::query()
            ->where('user_id', '=', $user->id)
            ->with('blockSections')
            ->get();

        $myClasses = $subjects
            ->flatMap(fn($subject) => $subject->blockSections->map(
                fn($section) => $this->buildClassCard($subject, $section, $today)
            ))
            ->values();

        return Inertia::render('dashboard', [
            'isFaculty'           => true,
            'myClasses'           => $myClasses,
            'today'               => now()->format('F j, Y'),
            'stats'               => null,
            'statusBreakdown'     => [],
            'categoryBreakdown'   => [],
            'monthlyApplications' => [],
            'monthlyEnrollments'  => [],
            'blockSections'       => [],
            'currentSchoolYear'   => '',
        ]);
    }

    private function buildClassCard(Subject $subject, BlockSection $section, string $today): array
    {
        $enrolledCount = StudentEnrollmentSubject::whereHas('enrollment',
            fn(Builder $q) => $q->where('block_section_id', '=', $section->id))
            ->where('subject_id', '=', $subject->id)
            ->count('*');

        $gradedCount = StudentEnrollmentSubject::whereHas('enrollment',
            fn(Builder $q) => $q->where('block_section_id', '=', $section->id))
            ->where('subject_id', '=', $subject->id)
            ->whereNotNull('grade')
            ->count('*');

        $todayQuery = Attendance::query()
            ->where('subject_id', '=', $subject->id)
            ->whereHas('studentEnrollment', fn(Builder $q) => $q->where('block_section_id', '=', $section->id))
            ->where('date', '=', $today);

        $todayTaken = (clone $todayQuery)->exists();

        return [
            'subject_id'          => $subject->id,
            'subject_code'        => $subject->code,
            'subject_name'        => $subject->name,
            'subject_schedule'    => $subject->schedule,
            'block_section_id'    => $section->id,
            'section_code'        => $section->code,
            'section_name'        => $section->name,
            'grade_level'         => $section->grade_level,
            'enrolled_count'      => $enrolledCount,
            'graded_count'        => $gradedCount,
            'today_taken'         => $todayTaken,
            'today_present_count' => $todayTaken
                ? (clone $todayQuery)->where('status', '=', 'Present')->count('*')
                : 0,
        ];
    }

    private function adminDashboard(): Response
    {
        $currentPeriod = EnrollmentPeriod::current();

        $currentSchoolYear = $currentPeriod?->school_year ?? '—';
        $currentSemester   = $currentPeriod?->semester ?? null;

        $periodScope = fn(Builder $q) => $q->when($currentPeriod, fn(Builder $q) => $q
                ->where('school_year', '=', $currentSchoolYear)
                ->where('semester', '=', $currentSemester)
        );

        $stats               = $this->buildStats($periodScope);
        $statusBreakdown     = $this->buildStatusBreakdown($periodScope);
        $categoryBreakdown   = $this->buildCategoryBreakdown($periodScope);
        $monthlyApplications = $this->buildMonthlyApplications($periodScope);
        $monthlyEnrollments  = $this->buildMonthlyEnrollments($periodScope);
        $enrollmentByGrade   = $this->buildEnrollmentByGrade();
        $announcements       = $this->buildAnnouncements();

        return Inertia::render('dashboard', [
            'isFaculty'           => false,
            'myClasses'           => [],
            'today'               => now()->format('F j, Y'),
            'stats'               => $stats,
            'statusBreakdown'     => $statusBreakdown,
            'categoryBreakdown'   => $categoryBreakdown,
            'monthlyApplications' => $monthlyApplications,
            'monthlyEnrollments'  => $monthlyEnrollments,
            'blockSections'       => [],
            'enrollmentByGrade'   => $enrollmentByGrade,
            'currentSchoolYear'   => $currentSchoolYear,
            'announcements'       => $announcements,
        ]);
    }

    private function buildStats(callable $periodScope): array
    {
        return [
            'total_applicants'   => Applicant::query()->tap($periodScope)->count('*'),
            'pending'            => Applicant::query()->where('application_status', '=', 'Pending')->tap($periodScope)->count('*'),
            'for_exam'           => Applicant::query()->where('application_status', '=', 'For Exam')->tap($periodScope)->count('*'),
            'exam_taken'         => Applicant::query()->where('application_status', '=', 'Exam Taken')->tap($periodScope)->count('*'),
            'enrolled'           => Applicant::query()->where('application_status', '=', 'Enrolled')->tap($periodScope)->count('*'),
            'portal_credentials' => PortalCredential::query()->count('*'),
            'students'           => Student::query()->count('*'),
        ];
    }

    private function buildStatusBreakdown(callable $periodScope): array
    {
        return Applicant::query()
            ->select(['application_status', DB::raw('count(*) as "count"')])
            ->tap($periodScope)
            ->groupBy('application_status')
            ->get()
            ->map(fn($item) => [
                'status' => $item->application_status ?? 'Unknown',
                'count'  => $item->count,
            ])
            ->toArray();
    }

    private function buildCategoryBreakdown(callable $periodScope): array
    {
        return Applicant::query()
            ->select(['student_category', DB::raw('count(*) as "count"')])
            ->tap($periodScope)
            ->groupBy('student_category')
            ->get()
            ->map(fn($item) => [
                'category' => $item->student_category ?? 'Unknown',
                'count'    => $item->count,
            ])
            ->toArray();
    }

    private function buildMonthlyApplications(callable $periodScope): array
    {
        $rows = [];
        for ($i = 5; $i >= 0; $i--) {
            $date   = Carbon::now()->subMonths($i);
            $rows[] = [
                'month' => $date->format('M Y'),
                'count' => Applicant::query()->tap($periodScope)
                    ->whereYear('created_at', '=', $date->year, 'and')
                    ->whereMonth('created_at', '=', $date->month, 'and')
                    ->count('*'),
            ];
        }
        return $rows;
    }

    private function buildMonthlyEnrollments(callable $periodScope): array
    {
        $rows = [];
        for ($i = 5; $i >= 0; $i--) {
            $date   = Carbon::now()->subMonths($i);
            $rows[] = [
                'month' => $date->format('M Y'),
                'count' => Applicant::query()
                    ->where('application_status', '=', 'Enrolled')
                    ->tap($periodScope)
                    ->whereYear('updated_at', '=', $date->year, 'and')
                    ->whereMonth('updated_at', '=', $date->month, 'and')
                    ->count('*'),
            ];
        }
        return $rows;
    }

    private function buildEnrollmentByGrade(): array
    {
        $sectionRows = BlockSection::query()
            ->select([
                'grade_level',
                'strand',
                DB::raw('SUM(current_enrollment) as "total_enrolled"'),
                DB::raw('SUM(capacity) as "total_capacity"'),
                DB::raw('COUNT(*) as "section_count"'),
            ])
            ->groupBy('grade_level', 'strand')
            ->get()
            ->map(function ($b) {
                $noStrandLabel = \in_array($b->strand, [
                    'Laboratory Elementary School',
                    'Laboratory Junior High School',
                ]);
                return [
                    'label' => $noStrandLabel ? $b->grade_level : ($b->strand ? "{$b->grade_level} · {$b->strand}" : $b->grade_level),
                    'grade'      => $b->grade_level,
                    'program'    => $b->strand,
                    'enrolled'   => (int) $b->total_enrolled,
                    'capacity'   => (int) $b->total_capacity,
                    'sections'   => (int) $b->section_count,
                    'percentage' => $b->total_capacity > 0
                        ? round(($b->total_enrolled / $b->total_capacity) * 100)
                        : 0,
                ];
            });

        $shsStrands = [
            'Accountancy, Business, and Management (ABM)',
            'General Academics (GAS)',
            'Humanities and Social Sciences (HUMSS)',
            'Science, Technology, Engineering and Mathematics (STEM)',
        ];

        $expected = collect();
        foreach (range(1, 6) as $n) {
            $expected->push(['grade' => "Grade {$n}", 'strand' => 'Laboratory Elementary School', 'label' => "Grade {$n}"]);
        }
        foreach (range(7, 10) as $n) {
            $expected->push(['grade' => "Grade {$n}", 'strand' => 'Laboratory Junior High School', 'label' => "Grade {$n}"]);
        }
        foreach ([11, 12] as $n) {
            foreach ($shsStrands as $strand) {
                $expected->push(['grade' => "Grade {$n}", 'strand' => $strand, 'label' => "Grade {$n} · {$strand}"]);
            }
        }

        $existing = $sectionRows->keyBy(fn($r) => "{$r['grade']}|{$r['program']}");

        foreach ($expected as $combo) {
            if (! $existing->has("{$combo['grade']}|{$combo['strand']}")) {
                $sectionRows->push([
                    'label'      => $combo['label'],
                    'grade'      => $combo['grade'],
                    'program'    => $combo['strand'],
                    'enrolled'   => 0,
                    'capacity'   => 0,
                    'sections'   => 0,
                    'percentage' => 0,
                ]);
            }
        }

        return $sectionRows
            ->sortBy(fn($b) => (int) preg_replace('/\D/', '', $b['grade']))
            ->values()
            ->toArray();
    }

    private function buildAnnouncements(): array
    {
        $now = now();
        return Announcement::query()
            ->where('publish_start', '<=', $now)
            ->where(fn(Builder $q) => $q->whereNull('publish_end')->orWhere('publish_end', '>=', $now))
            ->orderByDesc('publish_start')
            ->limit(5)
            ->get()
            ->map(fn($a) => [
                'id'            => $a->announcement_id,
                'title'         => $a->title,
                'content'       => $a->content,
                'publish_start' => $a->publish_start?->format('M d, Y'),
            ])
            ->toArray();
    }
}
