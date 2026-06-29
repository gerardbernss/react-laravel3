<?php

namespace App\Repositories;

use App\Models\Attendance;
use App\Models\BlockSection;
use App\Models\ConductCategory;
use App\Models\ConductGrade;
use App\Models\GradeComponent;
use App\Models\StudentEnrollment;
use App\Models\StudentRawScore;
use Illuminate\Database\Eloquent\Collection;

class ReportRepository
{
    public function gradeComponents(int $subjectId, int $blockSectionId, string $quarter): Collection
    {
        return GradeComponent::forSubjectSection($subjectId, $blockSectionId)
            ->forQuarter($quarter)
            ->orderBy('order')
            ->get();
    }

    public function classRecordEnrollments(int $blockSectionId, int $subjectId): Collection
    {
        return StudentEnrollment::where('block_section_id', $blockSectionId)
            ->with([
                'student.personalData:id,last_name,first_name,middle_name',
                'enrollmentSubjects' => fn ($q) => $q->where('subject_id', $subjectId),
            ])
            ->get()
            ->filter(fn ($e) => $e->enrollmentSubjects->isNotEmpty())
            ->sortBy(fn ($e) => $e->student?->personalData?->last_name)
            ->values();
    }

    public function rawScoresForEnrollmentSubject(int $studentEnrollmentSubjectId, iterable $componentIds): Collection
    {
        return StudentRawScore::where('student_enrollment_subject_id', $studentEnrollmentSubjectId)
            ->whereIn('grade_component_id', $componentIds)
            ->get()
            ->keyBy('grade_component_id');
    }

    public function gradingSheetEnrollments(int $blockSectionId): Collection
    {
        return StudentEnrollment::where('block_section_id', $blockSectionId)
            ->with([
                'student.personalData:id,last_name,first_name,middle_name',
                'enrollmentSubjects',
            ])
            ->get()
            ->sortBy(fn ($e) => $e->student?->personalData?->last_name)
            ->values();
    }

    public function sortedSubjectsForSection(BlockSection $blockSection): Collection
    {
        $blockSection->load('subjects');

        return $blockSection->subjects->sortBy('code')->values();
    }

    public function loadReportCardRelations(StudentEnrollment $studentEnrollment): void
    {
        $studentEnrollment->load([
            'student.personalData',
            'enrollmentSubjects',
            'blockSection.subjects',
        ]);
    }

    public function activeConductCategoriesOrdered(): Collection
    {
        return ConductCategory::with('criteria')
            ->where('is_active', true)
            ->orderBy('order')
            ->get();
    }

    public function conductGradesForEnrollment(int $studentEnrollmentId, iterable $criteriaIds): Collection
    {
        return ConductGrade::where('student_enrollment_id', $studentEnrollmentId)
            ->whereIn('conduct_criteria_id', $criteriaIds)
            ->get()
            ->groupBy('conduct_criteria_id');
    }

    public function attendanceEnrollments(int $blockSectionId): Collection
    {
        return StudentEnrollment::where('block_section_id', $blockSectionId)
            ->with('student.personalData:id,last_name,first_name,middle_name')
            ->get()
            ->sortBy(fn ($e) => $e->student?->personalData?->last_name)
            ->values();
    }

    public function attendanceRecords(iterable $enrollmentIds, int $subjectId): Collection
    {
        return Attendance::whereIn('student_enrollment_id', $enrollmentIds)
            ->where('subject_id', $subjectId)
            ->get()
            ->groupBy('student_enrollment_id');
    }
}
