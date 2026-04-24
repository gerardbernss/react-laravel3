<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Announcement;
use App\Models\Applicant;
use App\Models\Attendance;
use App\Models\BlockSection;
use App\Models\PortalCredential;
use App\Models\Student;
use App\Models\StudentEnrollmentSubject;
use App\Models\Subject;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(): Response
    {
        $user = auth()->user();

        // ─── Faculty Dashboard ───────────────────────────────────────────────
        // Faculty users see a teaching-focused dashboard instead of the
        // admissions overview. We check the role here and return early.
        if ($user && $user->hasRole('faculty')) {
            $today = now()->toDateString();

            // Load all subjects this faculty member owns, along with the
            // block sections (classes) they are attached to.
            $subjects = Subject::where('user_id', $user->id)
                ->with('blockSections')
                ->get();

            // Build a flat list of "class cards" — one entry per subject/section
            // pair. flatMap flattens the nested subject→sections structure into
            // a single array that the React component can loop over directly.
            $myClasses = $subjects->flatMap(function ($subject) use ($today) {
                return $subject->blockSections->map(function ($section) use ($subject, $today) {
                    // Count students who are enrolled in this specific subject
                    // inside this specific section.
                    $enrolledCount = StudentEnrollmentSubject::whereHas('enrollment',
                        fn($q) => $q->where('block_section_id', $section->id))
                        ->where('subject_id', $subject->id)
                        ->count();

                    // Count how many of those enrolled students already have a
                    // grade recorded (grade column is not null).
                    $gradedCount = StudentEnrollmentSubject::whereHas('enrollment',
                        fn($q) => $q->where('block_section_id', $section->id))
                        ->where('subject_id', $subject->id)
                        ->whereNotNull('grade')
                        ->count();

                    // Build the base attendance query for today's date. We clone
                    // it below so we can reuse the same constraints for two
                    // different counts without running the query twice.
                    $todayQuery = Attendance::where('subject_id', $subject->id)
                        ->whereHas('studentEnrollment', fn($q) => $q->where('block_section_id', $section->id))
                        ->where('date', $today);

                    // exists() is a cheap check — returns true if at least one
                    // attendance record was taken for this class today.
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
                        // Only count present students when attendance was actually
                        // taken; avoids an extra DB query when it wasn't.
                        'today_present_count' => $todayTaken
                            ? (clone $todayQuery)->where('status', 'Present')->count()
                            : 0,
                    ];
                });
            })->values();

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

        // ─── Admin / Staff Dashboard ─────────────────────────────────────────

        // TODO: make this dynamic via SemesterPeriod::getCurrentSchoolYear()
        $currentSchoolYear = '2025-2026';

        // Top-level KPI counts displayed in the stat cards.
        $stats = [
            'total_applicants' => Applicant::count(),
            'pending'          => Applicant::where('application_status', 'Pending')->count(),
            'for_exam'         => Applicant::where('application_status', 'For Exam')->count(),
            'exam_taken'       => Applicant::where('application_status', 'Exam Taken')->count(),
            'enrolled'         => Applicant::where('application_status', 'Enrolled')->count(),
            // portal_credentials counts how many enrolled applicants have been
            // issued login credentials for the student portal.
            'portal_credentials' => PortalCredential::count(),
            // students is the count of Student model records, which are created
            // when an applicant's status is set to Enrolled.
            'students'           => Student::count(),
        ];

        // Group applicants by their current status and count each group.
        // The resulting array powers the progress-bar chart on the dashboard.
        $statusBreakdown = Applicant::select('application_status', DB::raw('count(*) as count'))
            ->groupBy('application_status')
            ->get()
            ->map(fn ($item) => [
                'status' => $item->application_status ?? 'Unknown',
                'count'  => $item->count,
            ])
            ->toArray();

        // Group applicants by student_category (LES / JHS / SHS) to show the
        // distribution of applications across school levels.
        $categoryBreakdown = Applicant::select('student_category', DB::raw('count(*) as count'))
            ->groupBy('student_category')
            ->get()
            ->map(fn ($item) => [
                'category' => $item->student_category ?? 'Unknown',
                'count'    => $item->count,
            ])
            ->toArray();

        // Monthly applications trend (last 6 months) — kept for data but
        // no longer displayed on the dashboard UI after the Monthly Trends
        // section was removed. Left here in case it's re-added later.
        $monthlyApplications = [];
        for ($i = 5; $i >= 0; $i--) {
            $date                  = Carbon::now()->subMonths($i);
            $monthlyApplications[] = [
                'month' => $date->format('M Y'),
                'count' => Applicant::whereYear('created_at', $date->year)
                    ->whereMonth('created_at', $date->month)
                    ->count(),
            ];
        }

        // Monthly enrollments trend — same note as above.
        $monthlyEnrollments = [];
        for ($i = 5; $i >= 0; $i--) {
            $date                 = Carbon::now()->subMonths($i);
            $monthlyEnrollments[] = [
                'month' => $date->format('M Y'),
                'count' => Applicant::where('application_status', 'Enrolled')
                    ->whereYear('updated_at', $date->year)
                    ->whereMonth('updated_at', $date->month)
                    ->count(),
            ];
        }

        // Enrollment analytics grouped by grade level + program (strand).
        // Each row represents one unique grade+program combination so the
        // dashboard chart can show aggregate capacity utilisation per program.
        $enrollmentByGrade = BlockSection::where('is_active', true)
            ->select(
                'grade_level',
                'strand',
                DB::raw('SUM(current_enrollment) as total_enrolled'),
                DB::raw('SUM(capacity) as total_capacity'),
                DB::raw('COUNT(*) as section_count'),
            )
            ->groupBy('grade_level', 'strand')
            ->get()
            ->sortBy(fn ($b) => (int) preg_replace('/\D/', '', $b->grade_level))
            ->values()
            ->map(fn ($b) => [
                'label'      => $b->strand ? "{$b->grade_level} · {$b->strand}" : $b->grade_level,
                'grade'      => $b->grade_level,
                'program'    => $b->strand,
                'enrolled'   => (int) $b->total_enrolled,
                'capacity'   => (int) $b->total_capacity,
                'sections'   => (int) $b->section_count,
                'percentage' => $b->total_capacity > 0
                    ? round(($b->total_enrolled / $b->total_capacity) * 100)
                    : 0,
            ])
            ->toArray();

        // Keep raw block sections for backwards compat (unused on dashboard now).
        $blockSections = [];

        $now = now();
        $announcements = Announcement::where('publish_start', '<=', $now)
            ->where(function ($q) use ($now) {
                $q->whereNull('publish_end')->orWhere('publish_end', '>=', $now);
            })
            ->orderByDesc('publish_start')
            ->limit(5)
            ->get()
            ->map(fn ($a) => [
                'id'            => $a->announcement_id,
                'title'         => $a->title,
                'content'       => $a->content,
                'publish_start' => $a->publish_start?->format('M d, Y'),
            ])
            ->toArray();

        return Inertia::render('dashboard', [
            'isFaculty'           => false,
            'myClasses'           => [],
            'today'               => now()->format('F j, Y'),
            'stats'               => $stats,
            'statusBreakdown'     => $statusBreakdown,
            'categoryBreakdown'   => $categoryBreakdown,
            'monthlyApplications' => $monthlyApplications,
            'monthlyEnrollments'  => $monthlyEnrollments,
            'blockSections'       => $blockSections,
            'enrollmentByGrade'   => $enrollmentByGrade,
            'currentSchoolYear'   => $currentSchoolYear,
            'announcements'       => $announcements,
        ]);
    }
}
