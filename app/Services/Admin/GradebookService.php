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
    ) {
    }

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

    public function showData(BlockSection $blockSection, ?User $user): array
    {
        $subjects = $this->gradeValidationRepository->subjectsForSection($blockSection);
        if ($user && $user->hasRole('faculty')) {
            $subjects = $subjects->where('user_id', $user->id)->values();
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

    public function componentsData(BlockSection $blockSection, Subject $subject, string $quarter, ?User $user): array
    {
        $this->authorizeSubjectAccess($subject, $user);

        $components = $this->reportRepository->gradeComponents($subject->id, $blockSection->id, $quarter);

        return [
            'components' => $components,
            'weightTotal' => $components->sum('weight'),
        ];
    }

    public function storeComponent(array $data, ?User $user): void
    {
        $blockSection = $this->gradebookRepository->findBlockSectionOrFail($data['block_section_id']);
        $subject = $this->subjectRepository->findOrFail($data['subject_id']);
        $this->authorizeSubjectAccess($subject, $user);
        $this->abortIfLocked($blockSection->id, $subject->id, $data['grading_quarter']);

        $maxOrder = $this->gradebookRepository->maxComponentOrder($subject->id, $blockSection->id, $data['grading_quarter']);

        $this->gradebookRepository->createComponent([
            ...$data,
            'order' => $maxOrder + 1,
            'school_year' => $blockSection->school_year,
            'created_by' => $user?->id,
        ]);
    }

    public function deleteComponent(GradeComponent $component, ?User $user): void
    {
        $blockSection = $this->gradebookRepository->findBlockSectionOrFail($component->block_section_id);
        $subject = $this->subjectRepository->findOrFail($component->subject_id);
        $this->authorizeSubjectAccess($subject, $user);
        $this->abortIfLocked($blockSection->id, $subject->id, $component->grading_quarter);

        $this->gradebookRepository->deleteComponent($component);
    }

    public function entryData(BlockSection $blockSection, Subject $subject, string $quarter, ?User $user): array
    {
        $this->authorizeSubjectAccess($subject, $user);

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

    public function saveScores(array $scores, BlockSection $blockSection, Subject $subject, string $quarter, ?User $user): void
    {
        $this->authorizeSubjectAccess($subject, $user);
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
                'semester' => $section->semester,
            ]);
        })->values()->all();
    }

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

    private function authorizeSubjectAccess(Subject $subject, ?User $user): void
    {
        if ($user && $user->hasRole('faculty') && $subject->user_id !== $user->id) {
            abort(403, 'You are not assigned to this subject.');
        }
    }

    private function abortIfLocked(int $blockSectionId, int $subjectId, string $quarter): void
    {
        $validation = $this->gradebookRepository->findValidation($subjectId, $blockSectionId, $quarter);
        if ($validation && $validation->isLocked()) {
            abort(403, 'Grades for this quarter are finalized and cannot be modified.');
        }
    }
}
