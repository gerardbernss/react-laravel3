<?php

namespace App\Repositories;

use App\Models\BlockSection;
use App\Models\GradeValidation;
use Illuminate\Database\Eloquent\Collection;

class GradeValidationRepository
{
    /**
     * Returns all block sections with their subject count, ordered by school year descending then section code.
     */
    public function sectionsWithSubjectCount(): Collection
    {
        return BlockSection::query()
            ->withCount('subjects')
            ->orderBy('school_year', 'desc')
            ->orderBy('code')
            ->get();
    }

    /**
     * Eager-loads the section's subjects with their faculty and returns the subject collection.
     */
    public function subjectsForSection(BlockSection $blockSection): Collection
    {
        $blockSection->load('subjects.faculty');

        return $blockSection->subjects;
    }

    /**
     * Returns all grade validations for a section keyed by "{subject_id}_{grading_quarter}" for O(1) lookup per subject-quarter pair.
     */
    public function validationsForSection(int $blockSectionId): Collection
    {
        return GradeValidation::where('block_section_id', $blockSectionId)
            ->get()
            ->keyBy(fn ($v) => "{$v->subject_id}_{$v->grading_quarter}");
    }

    /**
     * Finds an existing grade validation record matching the attributes or creates a new one with the given defaults.
     */
    public function firstOrCreateValidation(array $attributes, array $defaults): GradeValidation
    {
        return GradeValidation::firstOrCreate($attributes, $defaults);
    }

    /**
     * Updates the given grade validation record with the supplied data.
     */
    public function updateValidation(GradeValidation $gradeValidation, array $data): void
    {
        $gradeValidation->update($data);
    }
}
