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
    public function sectionsWithSubjectAndEnrollmentCounts(): Collection
    {
        return BlockSection::query()
            ->withCount('subjects')
            ->withCount('enrollments')
            ->orderBy('school_year', 'desc')
            ->orderBy('code')
            ->get();
    }

    public function countEnrollmentsForSection(int $blockSectionId): int
    {
        return StudentEnrollment::where('block_section_id', $blockSectionId)->count();
    }

    public function countScoredStudents(iterable $componentIds): int
    {
        return StudentRawScore::whereIn('grade_component_id', $componentIds)
            ->whereNotNull('raw_score')
            ->distinct('student_enrollment_subject_id')
            ->count('student_enrollment_subject_id');
    }

    public function findValidation(int $subjectId, int $blockSectionId, string $quarter): ?GradeValidation
    {
        return GradeValidation::forSubjectSectionQuarter($subjectId, $blockSectionId, $quarter)->first();
    }

    public function findBlockSectionOrFail(int $id): BlockSection
    {
        return BlockSection::findOrFail($id);
    }

    public function maxComponentOrder(int $subjectId, int $blockSectionId, string $quarter): int
    {
        return GradeComponent::forSubjectSection($subjectId, $blockSectionId)
            ->forQuarter($quarter)
            ->max('order') ?? 0;
    }

    public function createComponent(array $data): GradeComponent
    {
        return GradeComponent::create($data);
    }

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

    public function componentsKeyedById(int $subjectId, int $blockSectionId, string $quarter): Collection
    {
        return GradeComponent::forSubjectSection($subjectId, $blockSectionId)
            ->forQuarter($quarter)
            ->get()
            ->keyBy('id');
    }

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

    public function componentsWithRawScoresForEs(int $subjectId, int $blockSectionId, int $studentEnrollmentSubjectId): Collection
    {
        return GradeComponent::forSubjectSection($subjectId, $blockSectionId)
            ->with(['rawScores' => fn ($q) => $q->where('student_enrollment_subject_id', $studentEnrollmentSubjectId)])
            ->get();
    }

    public function deleteComponent(GradeComponent $component): void
    {
        $component->delete();
    }
}
