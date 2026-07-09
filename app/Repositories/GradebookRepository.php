<?php

namespace App\Repositories;

use App\Models\BlockSection;
use App\Models\GradeComponent;
use App\Models\GradeValidation;
use App\Models\StudentEnrollment;
use App\Models\StudentRawScore;
use Illuminate\Database\Eloquent\Collection;

class GradebookRepository
{
    /**
     * Returns all block sections with their subject count and enrollment count, ordered by school year descending then section code.
     */
    public function sectionsWithSubjectAndEnrollmentCounts(): Collection
    {
        return BlockSection::query()
            ->withCount('subjects')
            ->withCount('enrollments')
            ->orderBy('school_year', 'desc')
            ->orderBy('code')
            ->get();
    }

    /**
     * Returns the number of students enrolled in the given section.
     */
    public function countEnrollmentsForSection(int $blockSectionId): int
    {
        return StudentEnrollment::where('block_section_id', $blockSectionId)->count();
    }

    /**
     * Returns the number of distinct students who have at least one non-null raw score across the given grade components.
     */
    public function countScoredStudents(iterable $componentIds): int
    {
        return StudentRawScore::whereIn('grade_component_id', $componentIds)
            ->whereNotNull('raw_score')
            ->distinct('student_enrollment_subject_id')
            ->count('student_enrollment_subject_id');
    }

    /**
     * Returns the grade validation record for a specific subject, section, and quarter, or null if none exists.
     */
    public function findValidation(int $subjectId, int $blockSectionId, string $quarter): ?GradeValidation
    {
        return GradeValidation::forSubjectSectionQuarter($subjectId, $blockSectionId, $quarter)->first();
    }

    /**
     * Finds a block section by ID or throws a ModelNotFoundException if not found.
     */
    public function findBlockSectionOrFail(int $id): BlockSection
    {
        return BlockSection::findOrFail($id);
    }

    /**
     * Returns the highest existing order value among grade components for the given subject, section, and quarter — used to append new components at the end.
     */
    public function maxComponentOrder(int $subjectId, int $blockSectionId, string $quarter): int
    {
        return GradeComponent::forSubjectSection($subjectId, $blockSectionId)
            ->forQuarter($quarter)
            ->max('order') ?? 0;
    }

    /**
     * Creates and returns a new grade component record.
     */
    public function createComponent(array $data): GradeComponent
    {
        return GradeComponent::create($data);
    }

    /**
     * Returns enrollments for a section that include the given subject, with student names and the matching enrollment subject eager-loaded.
     * Enrollments without the subject are filtered out.
     */
    public function enrollmentsForSubjectEntry(int $blockSectionId, int $subjectId): Collection
    {
        return StudentEnrollment::where('block_section_id', $blockSectionId)
            ->with([
                'student.personalData:id,last_name,first_name,middle_name',
                'enrollmentSubjects' => fn ($q) => $q->where('subject_id', $subjectId),
            ])
            ->get()
            ->filter(fn ($e) => $e->enrollmentSubjects->isNotEmpty())
            ->values();
    }

    /**
     * Returns all grade components for the given subject, section, and quarter, keyed by component ID for direct lookup.
     */
    public function componentsKeyedById(int $subjectId, int $blockSectionId, string $quarter): Collection
    {
        return GradeComponent::forSubjectSection($subjectId, $blockSectionId)
            ->forQuarter($quarter)
            ->get()
            ->keyBy('id');
    }

    /**
     * Creates or updates the raw score for a student's enrollment subject on a specific grade component.
     */
    public function upsertRawScore(int $componentId, int $studentEnrollmentSubjectId, ?float $value): void
    {
        StudentRawScore::updateOrCreate(
            [
                'grade_component_id' => $componentId,
                'student_enrollment_subject_id' => $studentEnrollmentSubjectId,
            ],
            ['raw_score' => $value]
        );
    }

    /**
     * Returns all grade components for the given subject and section, each with the specific student's raw scores eager-loaded.
     */
    public function componentsWithRawScoresForEs(int $subjectId, int $blockSectionId, int $studentEnrollmentSubjectId): Collection
    {
        return GradeComponent::forSubjectSection($subjectId, $blockSectionId)
            ->with(['rawScores' => fn ($q) => $q->where('student_enrollment_subject_id', $studentEnrollmentSubjectId)])
            ->get();
    }

    /**
     * Deletes the given grade component and its associated raw scores.
     */
    public function deleteComponent(GradeComponent $component): void
    {
        $component->delete();
    }
}
