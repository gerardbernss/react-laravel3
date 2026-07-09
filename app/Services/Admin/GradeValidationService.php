<?php

namespace App\Services\Admin;

use App\Models\BlockSection;
use App\Models\GradeValidation;
use App\Models\Subject;
use App\Models\User;
use App\Repositories\GradeValidationRepository;
use App\Repositories\ScheduleRepository;
use App\Repositories\SubjectRepository;

class GradeValidationService
{
    private const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'];

    public function __construct(
        private GradeValidationRepository $gradeValidationRepository,
        private SubjectRepository $subjectRepository,
        private ScheduleRepository $scheduleRepository,
    ) {
    }

    /**
     * Returns grade validation index data. Faculty see only their own subject-section pairs;
     * admins see all sections with subject counts and whether they can finalize grades.
     */
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

    /**
     * Returns the validation status for every subject and quarter in a section.
     * Faculty members only see their own subjects and are blocked entirely if they have none in this section.
     */
    public function showData(BlockSection $blockSection, ?User $user): array
    {
        $isFaculty = $user && $user->hasRole('faculty');
        $subjects = $this->gradeValidationRepository->subjectsForSection($blockSection);

        if ($isFaculty) {
            $subjects = $subjects->filter(function ($subject) use ($blockSection, $user) {
                $sched = $subject->scheduleFor($blockSection->id) ?? $subject->defaultSchedule;

                return ($sched?->teacher_id ?? $subject->user_id) === $user->id;
            })->values();
            abort_if($subjects->isEmpty(), 403, 'You have no subjects in this section.');
        }

        $allValidations = $this->gradeValidationRepository->validationsForSection($blockSection->id);

        return [
            'isFaculty' => $isFaculty,
            'canFinalize' => $user?->hasPermission('finalize-grades') ?? false,
            'subjectRows' => $this->mapSubjectRows($subjects, $allValidations),
        ];
    }

    /**
     * Submits grades for a subject-section-quarter for admin review.
     * Creates a draft validation record if one does not yet exist.
     * Aborts if the grades are already finalized or already submitted.
     */
    public function submit(BlockSection $blockSection, Subject $subject, string $quarter, ?User $user): void
    {
        $this->authorizeSubjectAccess($subject, $user, $blockSection);

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

    /**
     * Finalizes a submitted grade validation, locking the grades from further edits.
     * Aborts if the validation is not currently in a submitted state.
     */
    public function finalize(GradeValidation $gradeValidation, ?User $user): void
    {
        abort_unless($gradeValidation->isSubmitted(), 409, 'Only submitted grades can be finalized.');

        $this->gradeValidationRepository->updateValidation($gradeValidation, [
            'status' => 'finalized',
            'finalized_at' => now(),
            'finalized_by' => $user?->id,
        ]);
    }

    /**
     * Rejects a submitted grade validation, returning it to draft status so the faculty member can make corrections.
     * Stores the rejection reason and clears the submission timestamp.
     * Aborts if the validation is not currently submitted.
     */
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

    /**
     * Returns all subject-section pairs assigned to a faculty member, formatted for the validation index.
     * Includes subjects owned via subjects.user_id and subjects/sections assigned via schedule.teacher_id.
     */
    private function mySubjects(int $userId): array
    {
        $assignedSchedules = $this->scheduleRepository->forTeacher($userId);
        $assignedSectionSchedules = $assignedSchedules->filter(fn ($sched) => $sched->block_section_id !== null);

        $assignedRows = $assignedSectionSchedules->map(fn ($sched) => [
            'subject_id' => $sched->subject_id,
            'subject_code' => $sched->subject->code,
            'subject_name' => $sched->subject->name,
            'block_section_id' => $sched->block_section_id,
            'section_code' => $sched->blockSection->code,
            'section_name' => $sched->blockSection->name,
            'grade_level' => $sched->blockSection->grade_level,
            'school_year' => $sched->blockSection->school_year,
        ]);

        $overriddenSectionIdsBySubject = $assignedSectionSchedules
            ->groupBy('subject_id')
            ->map(fn ($rows) => $rows->pluck('block_section_id')->all());

        $defaultTaughtSubjectIds = $assignedSchedules
            ->filter(fn ($sched) => $sched->block_section_id === null)
            ->pluck('subject_id')
            ->all();

        $ownedSubjects = $this->subjectRepository->facultySubjectsWithSections($userId, $defaultTaughtSubjectIds);

        $ownedRows = $ownedSubjects->flatMap(function ($subject) use ($overriddenSectionIdsBySubject) {
            $overriddenSectionIds = $overriddenSectionIdsBySubject[$subject->id] ?? [];

            return $subject->blockSections
                ->reject(fn ($section) => in_array($section->id, $overriddenSectionIds, true))
                ->map(fn ($section) => [
                    'subject_id' => $subject->id,
                    'subject_code' => $subject->code,
                    'subject_name' => $subject->name,
                    'block_section_id' => $section->id,
                    'section_code' => $section->code,
                    'section_name' => $section->name,
                    'grade_level' => $section->grade_level,
                    'school_year' => $section->school_year,
                ]);
        });

        return $ownedRows->concat($assignedRows)->values()->all();
    }

    /**
     * Maps each subject to a row containing its per-quarter validation status, used to render the section detail table.
     */
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

    /**
     * Aborts with 403 if a faculty member tries to submit grades for a subject they are not assigned to teach.
     * Resolution follows the section's own schedule (or the subject's default schedule) first,
     * falling back to the subject's own owner (subjects.user_id) if no schedule teacher is set.
     */
    private function authorizeSubjectAccess(Subject $subject, ?User $user, ?BlockSection $blockSection = null): void
    {
        if (! $user || ! $user->hasRole('faculty')) {
            return;
        }

        $sched = $blockSection ? ($subject->scheduleFor($blockSection->id) ?? $subject->defaultSchedule) : $subject->defaultSchedule;

        if (($sched?->teacher_id ?? $subject->user_id) !== $user->id) {
            abort(403, 'You are not assigned to this subject.');
        }
    }
}
