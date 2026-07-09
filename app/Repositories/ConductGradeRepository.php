<?php

namespace App\Repositories;

use App\Models\ConductGrade;
use App\Models\StudentEnrollment;
use Illuminate\Database\Eloquent\Collection;

class ConductGradeRepository
{
    /**
     * Returns all enrollments for a section with student personal data eager-loaded, sorted alphabetically by last name.
     */
    public function enrollmentsForSectionSortedByLastName(int $sectionId): Collection
    {
        return StudentEnrollment::where('block_section_id', $sectionId)
            ->with('student.personalData:id,last_name,first_name,middle_name')
            ->get()
            ->sortBy(fn ($e) => $e->student?->personalData?->last_name)
            ->values();
    }

    /**
     * Returns conduct grades for the given enrollments, criteria, and quarter, grouped by student_enrollment_id for efficient per-student lookup.
     */
    public function gradesGroupedByEnrollment(iterable $enrollmentIds, iterable $criteriaIds, string $quarter): Collection
    {
        return ConductGrade::whereIn('student_enrollment_id', $enrollmentIds)
            ->whereIn('conduct_criteria_id', $criteriaIds)
            ->where('grading_quarter', $quarter)
            ->get()
            ->groupBy('student_enrollment_id');
    }

    /**
     * Creates or updates the conduct grade for a student's enrollment on a specific criterion and quarter.
     */
    public function upsertGrade(int $enrollmentId, int $criteriaId, string $quarter, ?float $score, ?int $recordedBy): void
    {
        ConductGrade::updateOrCreate(
            [
                'student_enrollment_id' => $enrollmentId,
                'conduct_criteria_id' => $criteriaId,
                'grading_quarter' => $quarter,
            ],
            [
                'score' => $score,
                'recorded_by' => $recordedBy,
            ]
        );
    }
}
