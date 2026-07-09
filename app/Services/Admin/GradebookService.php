<?php

namespace App\Services\Admin;

use App\Models\Attendance;
use App\Models\BlockSection;
use App\Models\GradeComponent;
use App\Models\StudentEnrollmentSubject;
use App\Models\Subject;
use App\Models\User;
use App\Repositories\GradebookRepository;
use App\Repositories\GradeRepository;
use App\Repositories\GradeValidationRepository;
use App\Repositories\ReportRepository;
use App\Repositories\ScheduleRepository;
use App\Repositories\SubjectRepository;
use Illuminate\Support\Facades\DB;

class GradebookService
{
    private const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'];

    public function __construct(
        private GradebookRepository $gradebookRepository,
        private GradeRepository $gradeRepository,
        private GradeValidationRepository $gradeValidationRepository,
        private ReportRepository $reportRepository,
        private SubjectRepository $subjectRepository,
        private ScheduleRepository $scheduleRepository,
    ) {
    }

    /**
     * Returns gradebook index data. Faculty see only their assigned subject-section pairs;
     * admins see all sections with subject and enrollment counts.
     */
    public function indexData(?User $user): array
    {
        if ($user && $user->hasRole('faculty')) {
            return [
                'isFaculty' => true,
                'mySubjects' => $this->mySubjects($user->id),
                'blockSections' => [],
            ];
        }

        return [
            'isFaculty' => false,
            'mySubjects' => [],
            'blockSections' => $this->gradebookRepository->sectionsWithSubjectAndEnrollmentCounts(),
        ];
    }

    /**
     * Returns a per-subject, per-quarter summary for a section: component counts, scored student counts, and validation status.
     * Faculty members only see their own subjects.
     */
    public function showData(BlockSection $blockSection, ?User $user): array
    {
        $subjects = $this->gradeValidationRepository->subjectsForSection($blockSection);
        if ($user && $user->hasRole('faculty')) {
            $subjects = $subjects->filter(function ($subject) use ($blockSection, $user) {
                $sched = $subject->scheduleFor($blockSection->id) ?? $subject->defaultSchedule;

                return ($sched?->teacher_id ?? $subject->user_id) === $user->id;
            })->values();
        }

        $totalStudents = $this->gradebookRepository->countEnrollmentsForSection($blockSection->id);

        return [
            'subjectData' => $subjects->map(
                fn ($subject) => $this->subjectQuarterRow($subject, $blockSection, $totalStudents)
            )->values(),
            'totalStudents' => $totalStudents,
            'isFaculty' => $user?->hasRole('faculty') ?? false,
            'canManageConduct' => $user?->hasPermission('manage-conduct-grades') ?? false,
        ];
    }

    /**
     * Returns the grade components and their combined weight total for a given subject, section, and quarter.
     * Aborts with 403 if a faculty member tries to access a subject they are not assigned to.
     */
    public function componentsData(BlockSection $blockSection, Subject $subject, string $quarter, ?User $user): array
    {
        $this->authorizeSubjectAccess($subject, $user, $blockSection);

        $components = $this->reportRepository->gradeComponents($subject->id, $blockSection->id, $quarter);

        return [
            'components' => $components,
            'weightTotal' => $components->sum('weight'),
        ];
    }

    /**
     * Adds a new grade component to a subject-section-quarter, auto-assigning the next display order.
     * Aborts if the user is not allowed to edit this subject or if the quarter's grades are already locked.
     */
    public function storeComponent(array $data, ?User $user): void
    {
        $blockSection = $this->gradebookRepository->findBlockSectionOrFail($data['block_section_id']);
        $subject = $this->subjectRepository->findOrFail($data['subject_id']);
        $this->authorizeSubjectAccess($subject, $user, $blockSection);
        $this->abortIfLocked($blockSection->id, $subject->id, $data['grading_quarter']);

        $maxOrder = $this->gradebookRepository->maxComponentOrder($subject->id, $blockSection->id, $data['grading_quarter']);

        $this->gradebookRepository->createComponent([
            ...$data,
            'order' => $maxOrder + 1,
            'school_year' => $blockSection->school_year,
            'created_by' => $user?->id,
        ]);
    }

    /**
     * Deletes a grade component.
     * Aborts if the user is not allowed to edit the subject or if the quarter's grades are already locked.
     */
    public function deleteComponent(GradeComponent $component, ?User $user): void
    {
        $blockSection = $this->gradebookRepository->findBlockSectionOrFail($component->block_section_id);
        $subject = $this->subjectRepository->findOrFail($component->subject_id);
        $this->authorizeSubjectAccess($subject, $user, $blockSection);
        $this->abortIfLocked($blockSection->id, $subject->id, $component->grading_quarter);

        $this->gradebookRepository->deleteComponent($component);
    }

    /**
     * Returns the grade entry sheet for a subject-section-quarter: students with their raw scores per component,
     * attendance counts, and the current validation status with the user's submit/finalize permissions.
     */
    public function entryData(BlockSection $blockSection, Subject $subject, string $quarter, ?User $user): array
    {
        $this->authorizeSubjectAccess($subject, $user, $blockSection);

        $components = $this->reportRepository->gradeComponents($subject->id, $blockSection->id, $quarter);
        $enrollments = $this->gradebookRepository->enrollmentsForSubjectEntry($blockSection->id, $subject->id);
        $componentIds = $components->pluck('id');

        $attendanceRecords = $this->reportRepository->attendanceRecords($enrollments->pluck('id'), $subject->id);

        $students = $enrollments->map(
            fn ($enrollment) => $this->entryStudentRow($enrollment, $components, $componentIds, $attendanceRecords)
        )->sortBy('last_name')->values();

        $validation = $this->gradebookRepository->findValidation($subject->id, $blockSection->id, $quarter);

        return [
            'components' => $components,
            'students' => $students,
            'weightTotal' => $components->sum('weight'),
            'validationStatus' => $validation?->status ?? 'draft',
            'validationId' => $validation?->id,
            'canSubmit' => $user?->hasPermission('submit-grades') ?? false,
            'canFinalize' => $user?->hasPermission('finalize-grades') ?? false,
        ];
    }

    /**
     * Saves raw scores for all students in a subject-quarter, clamping each value to the component's HPS.
     * After saving, recomputes each affected student's equivalent grade, GWA, and units earned.
     * Aborts if the quarter is locked or the user lacks access to the subject.
     */
    public function saveScores(array $scores, BlockSection $blockSection, Subject $subject, string $quarter, ?User $user): void
    {
        $this->authorizeSubjectAccess($subject, $user, $blockSection);
        $this->abortIfLocked($blockSection->id, $subject->id, $quarter);

        $components = $this->gradebookRepository->componentsKeyedById($subject->id, $blockSection->id, $quarter);

        DB::transaction(function () use ($scores, $components, $subject, $blockSection) {
            $affectedEnrollmentIds = collect();

            foreach ($scores as $enrollmentSubjectId => $componentScores) {
                $es = $this->gradeRepository->findEnrollmentSubjectOrFail($enrollmentSubjectId);

                foreach ($componentScores as $componentId => $rawScore) {
                    $component = $components->get($componentId);
                    if (! $component) {
                        continue;
                    }

                    $value = $rawScore === null || $rawScore === '' ? null : (float) $rawScore;
                    if ($value !== null) {
                        $value = max(0, min($value, $component->hps));
                    }

                    $this->gradebookRepository->upsertRawScore((int) $componentId, (int) $enrollmentSubjectId, $value);
                }

                $this->recomputeEquivalentGrade($es, $subject->id, $blockSection->id);
                $affectedEnrollmentIds->push($es->student_enrollment_id);
            }

            $affectedEnrollmentIds->unique()->each(function ($enrollmentId) {
                $enrollment = $this->gradeRepository->findEnrollment($enrollmentId);
                if ($enrollment) {
                    $this->gradeRepository->recalculateGwa($enrollment);
                    $this->gradeRepository->recalculateUnitsEarned($enrollment);
                }
            });
        });
    }

    /**
     * Returns all subject-section pairs assigned to a faculty member, formatted for the gradebook index.
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
            'semester' => $sched->blockSection->semester,
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
                    'semester' => $section->semester,
                ]);
        });

        return $ownedRows->concat($assignedRows)->values()->all();
    }

    /**
     * Builds a summary row for one subject showing, for each quarter, the number of grade components,
     * how many students have scores, and the current validation status.
     */
    private function subjectQuarterRow(Subject $subject, BlockSection $blockSection, int $totalStudents): array
    {
        $quarterData = collect(self::QUARTERS)->mapWithKeys(function ($quarter) use ($subject, $blockSection, $totalStudents) {
            $components = $this->reportRepository->gradeComponents($subject->id, $blockSection->id, $quarter);

            $scoredStudents = 0;
            if ($components->isNotEmpty() && $totalStudents > 0) {
                $scoredStudents = $this->gradebookRepository->countScoredStudents($components->pluck('id'));
            }

            $validation = $this->gradebookRepository->findValidation($subject->id, $blockSection->id, $quarter);

            return [$quarter => [
                'component_count' => $components->count(),
                'scored_students' => $scoredStudents,
                'total_students' => $totalStudents,
                'weight_total' => $components->sum('weight'),
                'validation_status' => $validation?->status ?? 'draft',
            ]];
        });

        return [
            'id' => $subject->id,
            'code' => $subject->code,
            'name' => $subject->name,
            'faculty_name' => $subject->faculty?->name,
            'quarters' => $quarterData,
        ];
    }

    /**
     * Builds one student's row for the grade entry sheet, including their existing raw scores per component and attendance counts.
     */
    private function entryStudentRow($enrollment, $components, $componentIds, $attendanceRecords): array
    {
        $es = $enrollment->enrollmentSubjects->first();
        $personalData = $enrollment->student?->personalData;

        $scores = [];
        if ($es) {
            $rawScores = $this->reportRepository->rawScoresForEnrollmentSubject($es->id, $componentIds);
            foreach ($components as $component) {
                $scores[$component->id] = $rawScores->get($component->id)?->raw_score;
            }
        }

        $attRecords = $attendanceRecords->get($enrollment->id, collect());

        return [
            'enrollment_id' => $enrollment->id,
            'enrollment_subject_id' => $es?->id,
            'student_id_number' => $enrollment->student?->student_id_number,
            'last_name' => $personalData?->last_name,
            'first_name' => $personalData?->first_name,
            'middle_name' => $personalData?->middle_name,
            'grade' => $es?->grade,
            'grade_status' => $es?->grade_status,
            'scores' => $scores,
            'absences' => $attRecords->where('status', Attendance::STATUS_ABSENT)->count(),
            'tardies' => $attRecords->where('status', Attendance::STATUS_LATE)->count(),
        ];
    }

    /**
     * Recalculates and saves the equivalent grade for a student's enrollment subject using the formula EG = PS% × 0.5 + 50, clamped to 60–100.
     * Does nothing if there are no components, no scores, or if the total component weight is zero.
     */
    private function recomputeEquivalentGrade(StudentEnrollmentSubject $es, int $subjectId, int $blockSectionId): void
    {
        $allComponents = $this->gradebookRepository->componentsWithRawScoresForEs($subjectId, $blockSectionId, $es->id);

        if ($allComponents->isEmpty()) {
            return;
        }

        $totalWeight = $allComponents->sum('weight');
        if ($totalWeight == 0) {
            return;
        }

        $weightedSum = 0;
        $hasAnyScore = false;

        foreach ($allComponents as $component) {
            $rawScore = $component->rawScores->first();
            if ($rawScore === null || $rawScore->raw_score === null) {
                continue;
            }
            $hasAnyScore = true;
            $componentPct = $component->hps > 0 ? ($rawScore->raw_score / $component->hps) * 100 : 0;
            $weightedSum += $componentPct * ($component->weight / $totalWeight);
        }

        if (! $hasAnyScore) {
            return;
        }

        $ps = $weightedSum;
        $eg = ($ps * 0.50) + 50;
        $eg = max(60, min(100, $eg));

        $this->gradeRepository->setEnrollmentSubjectGrade($es, round($eg, 2));
    }

    /**
     * Aborts with 403 if a faculty member tries to access a subject they are not assigned to teach.
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

    /**
     * Aborts with 403 if grades for the given subject-section-quarter have been finalized and are no longer editable.
     */
    private function abortIfLocked(int $blockSectionId, int $subjectId, string $quarter): void
    {
        $validation = $this->gradebookRepository->findValidation($subjectId, $blockSectionId, $quarter);
        if ($validation && $validation->isLocked()) {
            abort(403, 'Grades for this quarter are finalized and cannot be modified.');
        }
    }
}
