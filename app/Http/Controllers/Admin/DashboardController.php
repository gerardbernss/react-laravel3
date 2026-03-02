<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ApplicantApplicationInfo;
use App\Models\ApplicantPersonalData;
use App\Models\BlockSection;
use App\Models\PortalCredential;
use App\Models\Student;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(): Response
    {
        // Get current school year (you can make this dynamic)
        $currentSchoolYear = '2025-2026';

        // Statistics cards data
        $stats = [
            'total_applicants' => ApplicantApplicationInfo::count(),
            'pending' => ApplicantApplicationInfo::where('application_status', 'Pending')->count(),
            'for_exam' => ApplicantApplicationInfo::where('application_status', 'For Exam')->count(),
            'exam_taken' => ApplicantApplicationInfo::where('application_status', 'Exam Taken')->count(),
            'enrolled' => ApplicantApplicationInfo::where('application_status', 'Enrolled')->count(),
            'portal_credentials' => PortalCredential::count(),
            'students' => Student::count(),
        ];

        // Application status breakdown for pie chart
        $statusBreakdown = ApplicantApplicationInfo::select('application_status', DB::raw('count(*) as count'))
            ->groupBy('application_status')
            ->get()
            ->map(fn ($item) => [
                'status' => $item->application_status ?? 'Unknown',
                'count' => $item->count,
            ])
            ->toArray();

        // Applications by student category (LES, JHS, SHS)
        $categoryBreakdown = ApplicantApplicationInfo::select('student_category', DB::raw('count(*) as count'))
            ->groupBy('student_category')
            ->get()
            ->map(fn ($item) => [
                'category' => $item->student_category ?? 'Unknown',
                'count' => $item->count,
            ])
            ->toArray();

        // Monthly applications trend (last 6 months)
        $monthlyApplications = [];
        for ($i = 5; $i >= 0; $i--) {
            $date = Carbon::now()->subMonths($i);
            $count = ApplicantApplicationInfo::whereYear('created_at', $date->year)
                ->whereMonth('created_at', $date->month)
                ->count();
            $monthlyApplications[] = [
                'month' => $date->format('M Y'),
                'count' => $count,
            ];
        }

        // Monthly enrollments trend (last 6 months)
        $monthlyEnrollments = [];
        for ($i = 5; $i >= 0; $i--) {
            $date = Carbon::now()->subMonths($i);
            $count = ApplicantApplicationInfo::where('application_status', 'Enrolled')
                ->whereYear('updated_at', $date->year)
                ->whereMonth('updated_at', $date->month)
                ->count();
            $monthlyEnrollments[] = [
                'month' => $date->format('M Y'),
                'count' => $count,
            ];
        }

        // Block section capacity utilization
        $blockSections = BlockSection::where('is_active', true)
            ->select('name', 'capacity', 'current_enrollment', 'grade_level', 'strand')
            ->orderBy('grade_level')
            ->get()
            ->map(fn ($block) => [
                'name' => $block->name,
                'capacity' => $block->capacity,
                'enrolled' => $block->current_enrollment,
                'available' => $block->capacity - $block->current_enrollment,
                'percentage' => $block->capacity > 0
                    ? round(($block->current_enrollment / $block->capacity) * 100)
                    : 0,
                'grade_level' => $block->grade_level,
                'strand' => $block->strand,
            ])
            ->toArray();

        return Inertia::render('dashboard', [
            'stats' => $stats,
            'statusBreakdown' => $statusBreakdown,
            'categoryBreakdown' => $categoryBreakdown,
            'monthlyApplications' => $monthlyApplications,
            'monthlyEnrollments' => $monthlyEnrollments,
            'blockSections' => $blockSections,
            'currentSchoolYear' => $currentSchoolYear,
        ]);
    }
}
