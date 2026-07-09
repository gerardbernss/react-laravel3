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
    /**
     * Returns grade components for a specific subject, section, and quarter, ordered by their display order.
     */
    public function gradeComponents(int $subjectId, int $blockSectionId, string $quarter): Collection
    {
        return GradeComponent::forSubjectSection($subjectId, $blockSectionId)
            ->forQuarter($quarter)
            ->orderBy('order')
            ->get();
    }

    /**
     * Returns enrollments for a section that include the given subject, with student personal data and their subject enrollment eager-loaded, sorted alphabetically by last name.
     */
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

    /**
     * Returns raw scores for a student's enrollment subject, keyed by grade_component_id for easy lookup in the class record.
     */
    public function rawScoresForEnrollmentSubject(int $studentEnrollmentSubjectId, iterable $componentIds): Collection
    {
        return StudentRawScore::where('student_enrollment_subject_id', $studentEnrollmentSubjectId)
            ->whereIn('grade_component_id', $componentIds)
            ->get()
            ->keyBy('grade_component_id');
    }

    /**
     * Returns all enrollments for a section with student names and their subjects eager-loaded, sorted alphabetically by last name.
     * Used to build the grading sheet report.
     */
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

    /**
     * Loads the section's subjects and returns them sorted by subject code.
     */
    public function sortedSubjectsForSection(BlockSection $blockSection): Collection
    {
        $blockSection->load('subjects');

        return $blockSection->subjects->sortBy('code')->values();
    }

    /**
     * Eager-loads student personal data, enrollment subjects, and the section's subjects onto the enrollment model for report card generation.
     */
    public function loadReportCardRelations(StudentEnrollment $studentEnrollment): void
    {
        $studentEnrollment->load([
            'student.personalData',
            'enrollmentSubjects',
            'blockSection.subjects',
        ]);
    }

    /**
     * Returns all active conduct categories with their criteria, sorted by display order.
     */
    public function activeConductCategoriesOrdered(): Collection
    {
        return ConductCategory::with('criteria')
            ->where('is_active', true)
            ->orderBy('order')
            ->get();
    }

    /**
     * Returns conduct grades for a student's enrollment, grouped by conduct_criteria_id for easy lookup per criterion.
     */
    public function conductGradesForEnrollment(int $studentEnrollmentId, iterable $criteriaIds): Collection
    {
        return ConductGrade::where('student_enrollment_id', $studentEnrollmentId)
            ->whereIn('conduct_criteria_id', $criteriaIds)
            ->get()
            ->groupBy('conduct_criteria_id');
    }

    /**
     * Returns all enrollments for a section with student names eager-loaded, sorted alphabetically by last name.
     * Used as the student list for attendance reports.
     */
    public function attendanceEnrollments(int $blockSectionId): Collection
    {
        return StudentEnrollment::where('block_section_id', $blockSectionId)
            ->with('student.personalData:id,last_name,first_name,middle_name')
            ->get()
            ->sortBy(fn ($e) => $e->student?->personalData?->last_name)
            ->values();
    }

    /**
     * Returns attendance records for the given enrollments and subject, grouped by student_enrollment_id for easy per-student lookup.
     */
    public function attendanceRecords(iterable $enrollmentIds, int $subjectId): Collection
    {
        return Attendance::whereIn('student_enrollment_id', $enrollmentIds)
            ->where('subject_id', $subjectId)
            ->get()
            ->groupBy('student_enrollment_id');
    }
}
