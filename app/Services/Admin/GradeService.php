<?php

namespace App\Services\Admin;

use App\Models\BlockSection;
use App\Models\StudentEnrollment;
use App\Models\StudentEnrollmentSubject;
use App\Models\User;
use App\Repositories\GradeRepository;
use App\Repositories\SubjectRepository;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class GradeService
{
    public function __construct(
        private GradeRepository $gradeRepository,
        private SubjectRepository $subjectRepository,
    ) {
    }

    public function facultyIndexData(User $user): array
    {
        return [
            'isFaculty' => true,
            'mySubjects' => $this->buildMySubjects($user),
            'blockSections' => ['data' => [], 'last_page' => 1, 'current_page' => 1, 'total' => 0, 'per_page' => 15, 'links' => []],
            'filters' => [],
            'schoolYears' => [],
            'semesters' => [],
        ];
    }

    public function adminIndexData(): array
    {
        return [
            'isFaculty' => false,
            'mySubjects' => [],
            'blockSections' => $this->gradeRepository->blockSectionsWithCounts(),
            'filters' => [],
            'schoolYears' => $this->gradeRepository->distinctSchoolYears(),
            'semesters' => $this->gradeRepository->distinctSemesters(),
        ];
    }

    public function gradeSheetData(BlockSection $blockSection, ?User $user): array
    {
        $this->gradeRepository->loadSubjects($blockSection);
        $assignedSubjectIds = $this->resolveAssignedSubjectIds($blockSection, $user);

        if ($assignedSubjectIds !== null) {
            $blockSection->setRelation('subjects', $blockSection->subjects->whereIn('id', $assignedSubjectIds)->values());
        }

        $enrollments = $this->gradeRepository->enrollmentsForSection($blockSection->id);

        return [
            'blockSection' => $blockSection,
            'students' => $this->mapStudents($enrollments, $assignedSubjectIds),
            'statistics' => $this->computeStatistics($enrollments, $assignedSubjectIds),
        ];
    }

    public function studentGradeSheetData(BlockSection $blockSection, StudentEnrollment $studentEnrollment, ?User $user): array
    {
        $this->gradeRepository->loadSubjects($blockSection);
        $assignedSubjectIds = $this->resolveAssignedSubjectIds($blockSection, $user);

        $this->gradeRepository->loadStudentEnrollmentRelations($studentEnrollment);
        $enrollmentSubjects = $this->filterSubjects($studentEnrollment->enrollmentSubjects, $assignedSubjectIds)->values();

        $student = $studentEnrollment->student;
        $personalData = $student?->personalData;

        return [
            'blockSection' => [
                'id' => $blockSection->id,
                'code' => $blockSection->code,
                'name' => $blockSection->name,
                'grade_level' => $blockSection->grade_level,
            ],
            'enrollment' => [
                'id' => $studentEnrollment->id,
                'gwa' => $studentEnrollment->gwa,
                'status' => $studentEnrollment->status,
            ],
            'student' => [
                'id' => $student?->id,
                'student_id_number' => $student?->student_id_number,
                'last_name' => $personalData?->last_name,
                'first_name' => $personalData?->first_name,
                'middle_name' => $personalData?->middle_name,
            ],
            'subjects' => $this->mapSubjects($enrollmentSubjects),
        ];
    }

    public function saveGrades(BlockSection $blockSection, array $grades, ?User $user): void
    {
        $allowedSubjectIds = $this->resolveAssignedSubjectIds($blockSection, $user);

        DB::transaction(function () use ($grades, $allowedSubjectIds) {
            $enrollmentIds = collect();

            foreach ($grades as $gradeEntry) {
                $enrollmentSubject = $this->gradeRepository->findEnrollmentSubjectOrFail($gradeEntry['id']);

                if ($allowedSubjectIds !== null && ! in_array($enrollmentSubject->subject_id, $allowedSubjectIds)) {
                    continue;
                }

                $this->applyGradeEntry($enrollmentSubject, $gradeEntry);
                $enrollmentIds->push($enrollmentSubject->student_enrollment_id);
            }

            $this->recalculateGwaFor($enrollmentIds->unique());
        });
    }

    private function buildMySubjects(User $user): Collection
    {
        $subjects = $this->subjectRepository->facultySubjectsWithSections($user->id);

        return $subjects->flatMap(function ($subject) {
            return $subject->blockSections->map(fn ($section) => [
                'subject_id' => $subject->id,
                'subject_code' => $subject->code,
                'subject_name' => $subject->name,
                'block_section_id' => $section->id,
                'section_code' => $section->code,
                'section_name' => $section->name,
                'grade_level' => $section->grade_level,
                'enrolled_count' => $this->gradeRepository->countEnrolledForSubjectInSection($section->id, $subject->id),
                'graded_count' => $this->gradeRepository->countGradedForSubjectInSection($section->id, $subject->id),
            ]);
        })->values();
    }

    private function resolveAssignedSubjectIds(BlockSection $blockSection, ?User $user): ?array
    {
        if ($user && $user->hasRole('faculty')) {
            return $this->gradeRepository->assignedSubjectIds($blockSection, $user->id);
        }

        return null;
    }

    private function filterSubjects(Collection $subjects, ?array $assignedSubjectIds): Collection
    {
        return $assignedSubjectIds !== null
            ? $subjects->whereIn('subject_id', $assignedSubjectIds)
            : $subjects;
    }

    private function mapStudents(Collection $enrollments, ?array $assignedSubjectIds): Collection
    {
        return $enrollments->map(function ($enrollment) use ($assignedSubjectIds) {
            $student = $enrollment->student;
            $personalData = $student?->personalData;
            $enrollmentSubjects = $this->filterSubjects($enrollment->enrollmentSubjects, $assignedSubjectIds);

            return [
                'enrollment_id' => $enrollment->id,
                'student_id' => $student?->id,
                'student_id_number' => $student?->student_id_number,
                'last_name' => $personalData?->last_name,
                'first_name' => $personalData?->first_name,
                'middle_name' => $personalData?->middle_name,
                'gwa' => $enrollment->gwa,
                'status' => $enrollment->status,
                'subjects' => $this->mapSubjects($enrollmentSubjects),
            ];
        });
    }

    private function mapSubjects(Collection $enrollmentSubjects): Collection
    {
        return $enrollmentSubjects->map(fn ($es) => [
            'id' => $es->id,
            'subject_id' => $es->subject_id,
            'subject_code' => $es->subject?->code,
            'subject_name' => $es->subject?->name,
            'units' => $es->units,
            'grade' => $es->grade,
            'grade_status' => $es->grade_status,
        ])->values();
    }

    private function computeStatistics(Collection $enrollments, ?array $assignedSubjectIds): array
    {
        $allSubjectGrades = $enrollments->flatMap(fn ($e) => $this->filterSubjects($e->enrollmentSubjects, $assignedSubjectIds));

        $gradedCount = $allSubjectGrades->whereNotNull('grade')->count();
        $passedCount = $allSubjectGrades->where('grade_status', 'Passed')->count();
        $failedCount = $allSubjectGrades->where('grade_status', 'Failed')->count();
        $incCount = $allSubjectGrades->where('grade_status', 'INC')->count();
        $avgGwa = $enrollments->whereNotNull('gwa')->avg('gwa');

        return [
            'total_students' => $enrollments->count(),
            'graded_count' => $gradedCount,
            'total_subject_entries' => $allSubjectGrades->count(),
            'passed_count' => $passedCount,
            'failed_count' => $failedCount,
            'incomplete_count' => $incCount,
            'average_gwa' => $avgGwa ? round($avgGwa, 2) : null,
            'pass_rate' => $gradedCount > 0 ? round(($passedCount / max($passedCount + $failedCount, 1)) * 100, 1) : null,
        ];
    }

    private function applyGradeEntry(StudentEnrollmentSubject $enrollmentSubject, array $gradeEntry): void
    {
        if (isset($gradeEntry['grade_status']) && in_array($gradeEntry['grade_status'], ['INC', 'DRP', 'W'])) {
            match ($gradeEntry['grade_status']) {
                'INC' => $this->gradeRepository->markEnrollmentSubjectIncomplete($enrollmentSubject),
                'DRP' => $this->gradeRepository->markEnrollmentSubjectDropped($enrollmentSubject),
                default => $this->gradeRepository->markEnrollmentSubjectWithdrawn($enrollmentSubject),
            };

            return;
        }

        if (isset($gradeEntry['grade']) && $gradeEntry['grade'] !== null) {
            $this->gradeRepository->setEnrollmentSubjectGrade($enrollmentSubject, (float) $gradeEntry['grade']);
        }
    }

    private function recalculateGwaFor(Collection $enrollmentIds): void
    {
        $enrollmentIds->each(function ($enrollmentId) {
            $enrollment = $this->gradeRepository->findEnrollment($enrollmentId);

            if ($enrollment) {
                $this->gradeRepository->recalculateGwa($enrollment);
                $this->gradeRepository->recalculateUnitsEarned($enrollment);
            }
        });
    }
}
