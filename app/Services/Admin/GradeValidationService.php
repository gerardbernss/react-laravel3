<?php

namespace App\Services\Admin;

use App\Models\BlockSection;
use App\Models\GradeValidation;
use App\Models\Subject;
use App\Models\User;
use App\Repositories\GradeValidationRepository;
use App\Repositories\SubjectRepository;

class GradeValidationService
{
    private const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'];

    public function __construct(
        private GradeValidationRepository $gradeValidationRepository,
        private SubjectRepository $subjectRepository,
    ) {
    }

    public function indexData(?User $user): array
    {
        $isFaculty = $user && $user->hasRole('faculty');

        if ($isFaculty) {
            return [
                'isFaculty' => true,
                'mySubjects' => $this->mySubjects($user->id),
                'sections' => [],
                'canFinalize' => false,
            ];
        }

        return [
            'isFaculty' => false,
            'mySubjects' => [],
            'sections' => $this->gradeValidationRepository->sectionsWithSubjectCount(),
            'canFinalize' => $user?->hasPermission('finalize-grades') ?? false,
        ];
    }

    public function showData(BlockSection $blockSection, ?User $user): array
    {
        $isFaculty = $user && $user->hasRole('faculty');
        $subjects = $this->gradeValidationRepository->subjectsForSection($blockSection);

        if ($isFaculty) {
            $subjects = $subjects->where('user_id', $user->id)->values();
            abort_if($subjects->isEmpty(), 403, 'You have no subjects in this section.');
        }

        $allValidations = $this->gradeValidationRepository->validationsForSection($blockSection->id);

        return [
            'isFaculty' => $isFaculty,
            'canFinalize' => $user?->hasPermission('finalize-grades') ?? false,
            'subjectRows' => $this->mapSubjectRows($subjects, $allValidations),
        ];
    }

    public function submit(BlockSection $blockSection, Subject $subject, string $quarter, ?User $user): void
    {
        $this->authorizeSubjectAccess($subject, $user);

        $validation = $this->gradeValidationRepository->firstOrCreateValidation(
            [
                'block_section_id' => $blockSection->id,
                'subject_id' => $subject->id,
                'grading_quarter' => $quarter,
                'school_year' => $blockSection->school_year,
            ],
            ['status' => 'draft']
        );

        abort_if($validation->isLocked(), 403, 'These grades are already finalized.');
        abort_if($validation->isSubmitted(), 409, 'These grades are already submitted and awaiting approval.');

        $this->gradeValidationRepository->updateValidation($validation, [
            'status' => 'submitted',
            'submitted_at' => now(),
            'submitted_by' => $user?->id,
            'rejection_reason' => null,
        ]);
    }

    public function finalize(GradeValidation $gradeValidation, ?User $user): void
    {
        abort_unless($gradeValidation->isSubmitted(), 409, 'Only submitted grades can be finalized.');

        $this->gradeValidationRepository->updateValidation($gradeValidation, [
            'status' => 'finalized',
            'finalized_at' => now(),
            'finalized_by' => $user?->id,
        ]);
    }

    public function reject(GradeValidation $gradeValidation, string $rejectionReason): void
    {
        abort_unless($gradeValidation->isSubmitted(), 409, 'Only submitted grades can be rejected.');

        $this->gradeValidationRepository->updateValidation($gradeValidation, [
            'status' => 'draft',
            'submitted_at' => null,
            'submitted_by' => null,
            'rejection_reason' => $rejectionReason,
        ]);
    }

    private function mySubjects(int $userId): array
    {
        $subjects = $this->subjectRepository->facultySubjectsWithSections($userId);

        return $subjects->flatMap(function ($subject) {
            return $subject->blockSections->map(fn ($section) => [
                'subject_id' => $subject->id,
                'subject_code' => $subject->code,
                'subject_name' => $subject->name,
                'block_section_id' => $section->id,
                'section_code' => $section->code,
                'section_name' => $section->name,
                'grade_level' => $section->grade_level,
                'school_year' => $section->school_year,
            ]);
        })->values()->all();
    }

    private function mapSubjectRows($subjects, $allValidations)
    {
        return $subjects->map(function ($subject) use ($allValidations) {
            $quarters = collect(self::QUARTERS)->mapWithKeys(function ($q) use ($subject, $allValidations) {
                $key = "{$subject->id}_{$q}";
                $validation = $allValidations->get($key);

                return [$q => [
                    'status' => $validation?->status ?? 'draft',
                    'validation_id' => $validation?->id,
                ]];
            });

            return [
                'id' => $subject->id,
                'code' => $subject->code,
                'name' => $subject->name,
                'faculty_name' => $subject->faculty?->name,
                'quarters' => $quarters,
            ];
        })->values();
    }

    private function authorizeSubjectAccess(Subject $subject, ?User $user): void
    {
        if ($user && $user->hasRole('faculty') && $subject->user_id !== $user->id) {
            abort(403, 'You are not assigned to this subject.');
        }
    }
}
