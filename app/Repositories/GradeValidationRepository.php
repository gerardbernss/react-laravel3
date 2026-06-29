<?php

namespace App\Repositories;

use App\Models\BlockSection;
use App\Models\GradeValidation;
use Illuminate\Database\Eloquent\Collection;

class GradeValidationRepository
{
    public function sectionsWithSubjectCount(): Collection
    {
        return BlockSection::query()
            ->withCount('subjects')
            ->orderBy('school_year', 'desc')
            ->orderBy('code')
            ->get();
    }

    public function subjectsForSection(BlockSection $blockSection): Collection
    {
        $blockSection->load('subjects.faculty');

        return $blockSection->subjects;
    }

    public function validationsForSection(int $blockSectionId): Collection
    {
        return GradeValidation::where('block_section_id', $blockSectionId)
            ->get()
            ->keyBy(fn ($v) => "{$v->subject_id}_{$v->grading_quarter}");
    }

    public function firstOrCreateValidation(array $attributes, array $defaults): GradeValidation
    {
        return GradeValidation::firstOrCreate($attributes, $defaults);
    }

    public function updateValidation(GradeValidation $gradeValidation, array $data): void
    {
        $gradeValidation->update($data);
    }
}
