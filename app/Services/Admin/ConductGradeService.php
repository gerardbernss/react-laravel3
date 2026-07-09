<?php

namespace App\Services\Admin;

use App\Models\BlockSection;
use App\Repositories\ConductCategoryRepository;
use App\Repositories\ConductGradeRepository;
use Illuminate\Support\Facades\DB;

class ConductGradeService
{
    public function __construct(
        private ConductGradeRepository $conductGradeRepository,
        private ConductCategoryRepository $conductCategoryRepository,
    ) {
    }

    /**
     * Returns the conduct grade entry sheet for a section and quarter:
     * all active categories with their criteria, and each student's existing scores per criterion.
     */
    public function entryData(BlockSection $blockSection, string $quarter): array
    {
        $categories = $this->conductCategoryRepository->activeCategoriesWithCriteria();
        $enrollments = $this->conductGradeRepository->enrollmentsForSectionSortedByLastName($blockSection->id);

        $criteriaIds = $categories->flatMap(fn ($c) => $c->criteria->pluck('id'));
        $existingGrades = $this->conductGradeRepository->gradesGroupedByEnrollment(
            $enrollments->pluck('id'),
            $criteriaIds,
            $quarter
        );

        return [
            'categories' => $categories,
            'students' => $this->mapStudents($enrollments, $criteriaIds, $existingGrades),
        ];
    }

    /**
     * Saves or updates conduct scores for all students in a section for the given quarter.
     * Empty or null scores are stored as null (no score recorded).
     */
    public function saveGrades(array $grades, string $quarter): void
    {
        DB::transaction(function () use ($grades, $quarter) {
            $recordedBy = auth()->id();

            foreach ($grades as $enrollmentId => $criteriaScores) {
                foreach ($criteriaScores as $criteriaId => $score) {
                    $value = $score === null || $score === '' ? null : (float) $score;

                    $this->conductGradeRepository->upsertGrade((int) $enrollmentId, (int) $criteriaId, $quarter, $value, $recordedBy);
                }
            }
        });
    }

    /**
     * Maps enrollments to conduct grade entry rows, each containing the student's name and their existing score for every criterion.
     */
    private function mapStudents($enrollments, $criteriaIds, $existingGrades)
    {
        return $enrollments->map(function ($enrollment) use ($criteriaIds, $existingGrades) {
            $personalData = $enrollment->student?->personalData;
            $enrollmentGrades = $existingGrades->get($enrollment->id, collect())->keyBy('conduct_criteria_id');

            $grades = [];
            foreach ($criteriaIds as $criteriaId) {
                $grades[$criteriaId] = $enrollmentGrades->get($criteriaId)?->score;
            }

            return [
                'enrollment_id' => $enrollment->id,
                'student_id_number' => $enrollment->student?->student_id_number,
                'last_name' => $personalData?->last_name,
                'first_name' => $personalData?->first_name,
                'middle_name' => $personalData?->middle_name,
                'grades' => $grades,
            ];
        });
    }
}
