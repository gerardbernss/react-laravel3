<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\BlockSection;
use App\Models\ConductCategory;
use App\Models\ConductGrade;
use App\Models\StudentEnrollment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ConductGradeController extends Controller
{
    private const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'];

    public function index(BlockSection $blockSection, string $quarter)
    {
        abort_unless(in_array($quarter, self::QUARTERS), 404);

        $categories = ConductCategory::with('criteria')
            ->where('is_active', true)
            ->orderBy('order')
            ->orderBy('name')
            ->get();

        $enrollments = StudentEnrollment::where('block_section_id', $blockSection->id)
            ->with('student.personalData:id,last_name,first_name,middle_name')
            ->get()
            ->sortBy(fn($e) => $e->student?->personalData?->last_name)
            ->values();

        $criteriaIds = $categories->flatMap(fn($c) => $c->criteria->pluck('id'));
        $enrollmentIds = $enrollments->pluck('id');

        $existingGrades = ConductGrade::whereIn('student_enrollment_id', $enrollmentIds)
            ->whereIn('conduct_criteria_id', $criteriaIds)
            ->where('grading_quarter', $quarter)
            ->get()
            ->groupBy('student_enrollment_id');

        $students = $enrollments->map(function ($enrollment) use ($criteriaIds, $existingGrades) {
            $personalData = $enrollment->student?->personalData;
            $grades = [];

            $enrollmentGrades = $existingGrades->get($enrollment->id, collect())
                ->keyBy('conduct_criteria_id');

            foreach ($criteriaIds as $criteriaId) {
                $grades[$criteriaId] = $enrollmentGrades->get($criteriaId)?->score;
            }

            return [
                'enrollment_id'     => $enrollment->id,
                'student_id_number' => $enrollment->student?->student_id_number,
                'last_name'         => $personalData?->last_name,
                'first_name'        => $personalData?->first_name,
                'middle_name'       => $personalData?->middle_name,
                'grades'            => $grades,
            ];
        });

        return Inertia::render('Admin/Conduct/Entry', [
            'blockSection' => [
                'id'          => $blockSection->id,
                'code'        => $blockSection->code,
                'name'        => $blockSection->name,
                'school_year' => $blockSection->school_year,
            ],
            'quarter'    => $quarter,
            'quarters'   => self::QUARTERS,
            'categories' => $categories,
            'students'   => $students,
        ]);
    }

    public function save(Request $request, BlockSection $blockSection, string $quarter)
    {
        abort_unless(in_array($quarter, self::QUARTERS), 404);

        $request->validate([
            'grades'   => 'required|array',
            'grades.*' => 'required|array',
        ]);

        DB::transaction(function () use ($request, $quarter) {
            foreach ($request->grades as $enrollmentId => $criteriaScores) {
                foreach ($criteriaScores as $criteriaId => $score) {
                    $value = $score === null || $score === '' ? null : (float) $score;

                    ConductGrade::updateOrCreate(
                        [
                            'student_enrollment_id' => $enrollmentId,
                            'conduct_criteria_id'   => $criteriaId,
                            'grading_quarter'       => $quarter,
                        ],
                        [
                            'score'       => $value,
                            'recorded_by' => auth()->id(),
                        ]
                    );
                }
            }
        });

        return back()->with('success', 'Conduct grades saved.');
    }
}
