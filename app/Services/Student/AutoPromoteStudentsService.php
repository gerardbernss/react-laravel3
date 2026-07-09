<?php

namespace App\Services\Student;

use App\Models\EnrollmentPeriod;
use App\Repositories\BlockSectionRepository;
use App\Repositories\EnrollmentPeriodRepository;
use App\Repositories\StudentEnrollmentRepository;
use App\Repositories\StudentRepository;
use Illuminate\Support\Facades\DB;

class AutoPromoteStudentsService
{
    public function __construct(
        private readonly BlockSectionRepository $blockSectionRepository,
        private readonly EnrollmentPeriodRepository $enrollmentPeriodRepository,
        private readonly StudentEnrollmentRepository $studentEnrollmentRepository,
        private readonly StudentRepository $studentRepository,
    ) {}

    /**
     * Promote all students whose last enrollment is Completed into the new period's sections.
     * Returns ['promoted' => int, 'skipped' => int].
     */
    public function promote(EnrollmentPeriod $newPeriod): array
    {
        $prevPeriod = $this->enrollmentPeriodRepository->previousStudentPeriod($newPeriod->id);

        if (! $prevPeriod) {
            return ['promoted' => 0, 'skipped' => 0];
        }

        $completedEnrollments = $this->studentEnrollmentRepository->completedForPeriod(
            $prevPeriod->school_year,
            $prevPeriod->semester
        );

        if ($completedEnrollments->isEmpty()) {
            return ['promoted' => 0, 'skipped' => 0];
        }

        $targetSections = $this->blockSectionRepository->activeSectionsForPeriodGroupedByKey(
            $newPeriod->school_year,
            $newPeriod->semester
        );

        $alreadyEnrolled = $this->studentEnrollmentRepository
            ->enrolledStudentIdsForPeriod($newPeriod->school_year, $newPeriod->semester)
            ->flip();

        $promoted = 0;
        $skipped  = 0;

        DB::transaction(function () use (
            $completedEnrollments, $newPeriod, $prevPeriod,
            $targetSections, $alreadyEnrolled, &$promoted, &$skipped
        ) {
            foreach ($completedEnrollments as $enrollment) {
                if ($alreadyEnrolled->has($enrollment->student_id)) {
                    $skipped++;
                    continue;
                }

                $nextGrade = $this->nextGrade(
                    $enrollment->year_level,
                    $prevPeriod->school_year,
                    $newPeriod->school_year
                );

                if ($nextGrade === null) {
                    $skipped++;
                    continue;
                }

                $strand     = $enrollment->blockSection?->strand;
                $sectionKey = $nextGrade . '|' . ($strand ?? '');
                $sections   = $targetSections->get($sectionKey, collect());

                $section = $sections->first(fn ($s) => $s->current_enrollment < $s->capacity);

                if (! $section) {
                    $skipped++;
                    continue;
                }

                $this->studentEnrollmentRepository->create([
                    'student_id'       => $enrollment->student_id,
                    'block_section_id' => $section->id,
                    'school_year'      => $newPeriod->school_year,
                    'semester'         => $newPeriod->semester,
                    'year_level'       => $nextGrade,
                    'student_category' => $this->getCategory($nextGrade),
                    'enrollment_date'  => today(),
                    'status'           => 'Enrolled',
                ]);

                $this->studentRepository->updateStudent($enrollment->student, [
                    'current_year_level'  => $nextGrade,
                    'current_semester'    => $newPeriod->semester,
                    'current_school_year' => $newPeriod->school_year,
                ]);

                $this->blockSectionRepository->incrementEnrollment($section);

                $promoted++;
            }
        });

        return ['promoted' => $promoted, 'skipped' => $skipped];
    }

    /**
     * Returns the next grade level in the K–12 progression.
     * Returns the same grade when the school year hasn't changed (same-year re-enrollment), or null when the student has reached
     * the end of a cycle (Grade 10, Grade 12) so the caller can skip them.
     */
    private function nextGrade(string $currentGrade, string $prevSchoolYear, string $newSchoolYear): ?string
    {
        if ($prevSchoolYear === $newSchoolYear) {
            return $currentGrade;
        }

        $progression = [
            'Kinder'   => 'Grade 1',
            'Grade 1'  => 'Grade 2',
            'Grade 2'  => 'Grade 3',
            'Grade 3'  => 'Grade 4',
            'Grade 4'  => 'Grade 5',
            'Grade 5'  => 'Grade 6',
            'Grade 6'  => 'Grade 7',
            'Grade 7'  => 'Grade 8',
            'Grade 8'  => 'Grade 9',
            'Grade 9'  => 'Grade 10',
            'Grade 10' => null,
            'Grade 11' => 'Grade 12',
            'Grade 12' => null,
        ];

        return array_key_exists($currentGrade, $progression)
            ? $progression[$currentGrade]
            : null;
    }

    /**
     * Maps a grade level to its student category: SHS (11–12), JHS (7–10), or LES (Kinder–6).
     */
    private function getCategory(string $gradeLevel): string
    {
        if (in_array($gradeLevel, ['Grade 11', 'Grade 12'])) {
            return 'SHS';
        }
        if (in_array($gradeLevel, ['Grade 7', 'Grade 8', 'Grade 9', 'Grade 10'])) {
            return 'JHS';
        }
        return 'LES';
    }
}
