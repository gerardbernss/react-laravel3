<?php

namespace App\Services\Admin;

use App\Models\BlockSection;
use App\Models\StudentEnrollment;
use App\Repositories\BlockSectionRepository;
use App\Repositories\ScheduleRepository;
use App\Repositories\StudentRepository;
use App\Repositories\SubjectRepository;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class BlockSectionService
{
    public function __construct(
        private BlockSectionRepository $blockSectionRepository,
        private SubjectRepository $subjectRepository,
        private StudentRepository $studentRepository,
        private ScheduleRepository $scheduleRepository,
    ) {
    }

    public function indexData(): array
    {
        return [
            'blockSections' => $this->blockSectionRepository->listWithSubjects(),
            'schoolYears' => $this->blockSectionRepository->distinctSchoolYearsSorted(),
        ];
    }

    public function copyToNewYear(string $fromYear, string $toYear): array
    {
        $sourceSections = $this->blockSectionRepository->sectionsForYearWithSubjectsAndSchedules($fromYear);

        if ($sourceSections->isEmpty()) {
            return ['error' => "No block sections found for {$fromYear}."];
        }

        $oldSuffix = $this->yearCodeSuffix($fromYear);
        $newSuffix = $this->yearCodeSuffix($toYear);
        $copied = 0;
        $skipped = 0;

        DB::transaction(function () use ($sourceSections, $toYear, $oldSuffix, $newSuffix, &$copied, &$skipped) {
            foreach ($sourceSections as $section) {
                $newCode = Str::endsWith($section->code, $oldSuffix)
                    ? Str::replaceLast($oldSuffix, $newSuffix, $section->code)
                    : "{$section->code}-{$newSuffix}";

                if ($this->blockSectionRepository->codeExists($newCode)) {
                    $skipped++;
                    continue;
                }

                $this->copySection($section, $newCode, $toYear);
                $copied++;
            }
        });

        $message = "Copied {$copied} section(s) to {$toYear}.";
        if ($skipped > 0) {
            $message .= " Skipped {$skipped} (a section with that code already exists).";
        }

        return ['message' => $message];
    }

    public function createData(): array
    {
        return ['subjects' => $this->subjectOptions($this->subjectRepository->activeOrdered())];
    }

    public function store(array $data): array
    {
        if ($error = $this->incompatibleSubjectsError($data['subjects'] ?? [], $data['semester'] ?? null)) {
            return $error;
        }

        DB::transaction(function () use ($data) {
            $blockSection = $this->blockSectionRepository->createSection($this->sectionAttributes($data));

            if (! empty($data['subjects'])) {
                $this->blockSectionRepository->attachSubjects($blockSection, array_column($data['subjects'], 'subject_id'));
            }
        });

        return [];
    }

    public function showData(BlockSection $blockSection): array
    {
        $this->blockSectionRepository->loadSubjectsAndSchedules($blockSection);

        $enrolledStudentIds = $this->blockSectionRepository->enrolledStudentIdsFor($blockSection->school_year, $blockSection->semester);

        $subjects = $blockSection->subjects->map(function ($s) use ($blockSection) {
            $sched = $s->scheduleFor($blockSection->id) ?? $s->defaultSchedule;

            return [
                'id' => $s->id,
                'code' => $s->code,
                'name' => $s->name,
                'units' => $s->units,
                'type' => $s->type,
                'semester' => $s->semester,
                'pivot' => [
                    'teacher' => $s->pivot->teacher,
                    'schedule' => $sched?->display,
                    'room' => $sched?->room,
                ],
            ];
        });

        return [
            'blockSection' => array_merge($blockSection->toArray(), ['subjects' => $subjects]),
            'enrolledStudents' => $this->enrolledStudentRows($blockSection),
            'availableStudents' => $this->availableStudentRows($blockSection, $enrolledStudentIds),
        ];
    }

    public function addStudent(BlockSection $blockSection, int $studentId): array
    {
        if (! $blockSection->hasAvailableSlots()) {
            return ['error' => 'This section has reached its maximum capacity.'];
        }

        if ($this->blockSectionRepository->enrollmentExistsFor($studentId, $blockSection->school_year, $blockSection->semester)) {
            return ['error' => 'This student is already enrolled for this school year and semester.'];
        }

        $student = $this->studentRepository->findWithApplication($studentId);
        $this->blockSectionRepository->loadFacultyAndSchedules($blockSection);

        DB::transaction(function () use ($blockSection, $student) {
            $enrollment = $this->blockSectionRepository->createEnrollment([
                'student_id' => $student->id,
                'block_section_id' => $blockSection->id,
                'school_year' => $blockSection->school_year,
                'semester' => $blockSection->semester ?? 'First Semester',
                'year_level' => $blockSection->grade_level,
                'student_category' => $student->application?->student_category ?? '',
                'enrollment_date' => now()->toDateString(),
                'status' => StudentEnrollment::STATUS_ENROLLED,
                'total_units' => $blockSection->subjects->sum('units'),
            ]);

            foreach ($blockSection->subjects as $subject) {
                $sched = $subject->scheduleFor($blockSection->id) ?? $subject->defaultSchedule;
                $this->blockSectionRepository->createEnrollmentSubject([
                    'student_enrollment_id' => $enrollment->id,
                    'subject_id' => $subject->id,
                    'units' => $subject->units,
                    'schedule' => $sched?->display,
                    'room' => $sched?->room,
                    'teacher' => $subject->faculty?->name,
                ]);
            }

            $this->blockSectionRepository->incrementEnrollment($blockSection);
        });

        return [];
    }

    public function removeStudent(BlockSection $blockSection, StudentEnrollment $studentEnrollment): void
    {
        abort_if(
            (int) $studentEnrollment->block_section_id !== (int) $blockSection->id,
            403,
            'This enrollment does not belong to the specified section.'
        );

        DB::transaction(function () use ($blockSection, $studentEnrollment) {
            $this->blockSectionRepository->deleteEnrollment($studentEnrollment);
            $this->blockSectionRepository->decrementEnrollment($blockSection);
        });
    }

    public function editData(BlockSection $blockSection): array
    {
        $blockSection->load('subjects');

        return [
            'blockSection' => $blockSection,
            'subjects' => $this->subjectOptions($this->subjectRepository->activeOrdered()),
        ];
    }

    public function update(BlockSection $blockSection, array $data): array
    {
        $subjectIds = ! empty($data['subjects']) ? array_column($data['subjects'], 'subject_id') : [];

        if ($error = $this->incompatibleSubjectsError($data['subjects'] ?? [], $data['semester'] ?? null)) {
            return $error;
        }

        DB::transaction(function () use ($blockSection, $data, $subjectIds) {
            $this->blockSectionRepository->updateSection($blockSection, $this->sectionAttributes($data));
            $this->blockSectionRepository->syncSubjects($blockSection, $subjectIds);
        });

        return [];
    }

    public function destroy(BlockSection $blockSection): array
    {
        if ($blockSection->current_enrollment > 0) {
            return ['error' => 'Cannot delete block section. Students are currently enrolled.'];
        }

        $this->blockSectionRepository->deleteSection($blockSection);

        return [];
    }

    public function toggleStatus(BlockSection $blockSection): void
    {
        $this->blockSectionRepository->updateSection($blockSection, ['is_active' => ! $blockSection->is_active]);
    }

    private function copySection($section, string $newCode, string $toYear): void
    {
        $newSection = $this->blockSectionRepository->createSection([
            'name' => $section->name,
            'code' => $newCode,
            'grade_level' => $section->grade_level,
            'strand' => $section->strand,
            'school_year' => $toYear,
            'semester' => $section->semester,
            'adviser' => $section->adviser,
            'room' => $section->room,
            'capacity' => $section->capacity,
            'current_enrollment' => 0,
            'schedule' => $section->schedule,
            'is_active' => $section->is_active,
        ]);

        $this->blockSectionRepository->attachSubjects($newSection, $section->subjects->pluck('id')->all());

        foreach ($section->schedules as $sched) {
            $this->scheduleRepository->createSectionSchedule([
                'subject_id' => $sched->subject_id,
                'block_section_id' => $newSection->id,
                'days' => $sched->days,
                'time' => $sched->time,
                'room' => $sched->room,
                'code' => $sched->code,
            ]);
        }
    }

    private function incompatibleSubjectsError(array $subjects, ?string $semester): ?array
    {
        if (! $semester || empty($subjects)) {
            return null;
        }

        $subjectIds = array_column($subjects, 'subject_id');
        $incompatible = $this->subjectRepository->incompatibleNames($subjectIds, $semester);

        if ($incompatible->isEmpty()) {
            return null;
        }

        return ['error_field' => 'subjects', 'error_message' => 'These subjects are not offered in ' . $semester . ': ' . $incompatible->join(', ')];
    }

    private function sectionAttributes(array $data): array
    {
        return [
            'name' => $data['name'],
            'code' => $data['code'],
            'grade_level' => $data['grade_level'],
            'school_year' => $data['school_year'],
            'semester' => $data['semester'] ?? null,
            'adviser' => $data['adviser'] ?? null,
            'room' => $data['room'] ?? null,
            'capacity' => $data['capacity'],
            'schedule' => $data['schedule'] ?? null,
            'is_active' => $data['is_active'] ?? true,
        ];
    }

    private function subjectOptions($subjects)
    {
        return $subjects->map(fn ($s) => [
            'id' => $s->id,
            'code' => $s->code,
            'name' => $s->name,
            'units' => $s->units,
            'semester' => $s->semester,
        ]);
    }

    private function enrolledStudentRows(BlockSection $blockSection)
    {
        return $this->blockSectionRepository->enrolledStudentsForSection($blockSection->id)
            ->map(fn ($e) => [
                'id' => $e->id,
                'enrollment_date' => $e->enrollment_date,
                'status' => $e->status,
                'student' => [
                    'id' => $e->student->id,
                    'student_id_number' => $e->student->student_id_number,
                    'personal_data' => [
                        'first_name' => $e->student->personalData?->first_name,
                        'last_name' => $e->student->personalData?->last_name,
                        'middle_name' => $e->student->personalData?->middle_name,
                    ],
                ],
            ]);
    }

    private function availableStudentRows(BlockSection $blockSection, $enrolledStudentIds)
    {
        return $this->studentRepository->notEnrolledForGradeLevel($enrolledStudentIds, $blockSection->grade_level, $blockSection->strand)
            ->map(fn ($s) => [
                'id' => $s->id,
                'student_id_number' => $s->student_id_number,
                'personal_data' => [
                    'first_name' => $s->personalData?->first_name,
                    'last_name' => $s->personalData?->last_name,
                ],
            ]);
    }

    /**
     * "2025-2026" → "2526" — matches the existing section code convention
     * (e.g. "G1-A-2526"), so copied codes read the same way.
     */
    private function yearCodeSuffix(string $schoolYear): string
    {
        $parts = explode('-', $schoolYear);
        if (count($parts) !== 2) {
            return preg_replace('/\D/', '', $schoolYear);
        }

        return substr($parts[0], -2) . substr($parts[1], -2);
    }
}
