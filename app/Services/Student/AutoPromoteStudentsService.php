<?php

namespace App\Services\Student;

use App\Models\BlockSection;
use App\Models\EnrollmentPeriod;
use App\Models\StudentEnrollment;
use Illuminate\Support\Facades\DB;

class AutoPromoteStudentsService
{
    /**
     * Promote all students whose last enrollment is Completed into the new period's sections.
     * Returns ['promoted' => int, 'skipped' => int].
     */
    public function promote(EnrollmentPeriod $newPeriod): array
    {
        $prevPeriod = EnrollmentPeriod::where('type', 'student')
            ->where('id', '!=', $newPeriod->id)
            ->latest()
            ->first();

        if (! $prevPeriod) {
            return ['promoted' => 0, 'skipped' => 0];
        }

        $completedEnrollments = StudentEnrollment::with('blockSection')
            ->where('school_year', $prevPeriod->school_year)
            ->where('semester', $prevPeriod->semester)
            ->where('status', StudentEnrollment::STATUS_COMPLETED)
            ->get();

        if ($completedEnrollments->isEmpty()) {
            return ['promoted' => 0, 'skipped' => 0];
        }

        // Preload sections for the new period, grouped by "grade_level|strand"
        $targetSections = BlockSection::where('school_year', $newPeriod->school_year)
            ->where('semester', $newPeriod->semester)
            ->where('is_active', true)
            ->orderBy('current_enrollment')
            ->get()
            ->groupBy(fn($s) => $s->grade_level . '|' . ($s->strand ?? ''));

        // Preload student IDs already enrolled in the new period (idempotency guard)
        $alreadyEnrolled = StudentEnrollment::where('school_year', $newPeriod->school_year)
            ->where('semester', $newPeriod->semester)
            ->pluck('student_id')
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

                $section = $sections->first(fn($s) => $s->current_enrollment < $s->capacity);

                if (! $section) {
                    $skipped++;
                    continue;
                }

                StudentEnrollment::create([
                    'student_id'       => $enrollment->student_id,
                    'block_section_id' => $section->id,
                    'school_year'      => $newPeriod->school_year,
                    'semester'         => $newPeriod->semester,
                    'year_level'       => $nextGrade,
                    'student_category' => $this->getCategory($nextGrade),
                    'enrollment_date'  => today(),
                    'status'           => StudentEnrollment::STATUS_ENROLLED,
                ]);

                // Update student's current period fields
                $enrollment->student->update([
                    'current_year_level'  => $nextGrade,
                    'current_semester'    => $newPeriod->semester,
                    'current_school_year' => $newPeriod->school_year,
                ]);

                $section->incrementEnrollment();

                $promoted++;
            }
        });

        return ['promoted' => $promoted, 'skipped' => $skipped];
    }

    private function nextGrade(string $currentGrade, string $prevSchoolYear, string $newSchoolYear): ?string
    {
        // Same school year = semester-to-semester progression (grade stays the same)
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
            'Grade 10' => null,    // strand selection required — admin assigns manually
            'Grade 11' => 'Grade 12',
            'Grade 12' => null,    // graduated — no further enrollment
        ];

        return array_key_exists($currentGrade, $progression)
            ? $progression[$currentGrade]
            : null;
    }

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
