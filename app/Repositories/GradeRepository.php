<?php

namespace App\Repositories;

use App\Models\BlockSection;
use App\Models\StudentEnrollment;
use App\Models\StudentEnrollmentSubject;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class GradeRepository
{
    /**
     * Returns the number of students in the given section who are enrolled in the specified subject.
     */
    public function countEnrolledForSubjectInSection(int $sectionId, int $subjectId): int
    {
        return StudentEnrollmentSubject::whereHas(
            'enrollment',
            fn ($q) => $q->where('block_section_id', $sectionId)
        )->where('subject_id', $subjectId)->count();
    }

    /**
     * Returns the number of students in the given section who already have a final grade recorded for the specified subject.
     */
    public function countGradedForSubjectInSection(int $sectionId, int $subjectId): int
    {
        return StudentEnrollmentSubject::whereHas(
            'enrollment',
            fn ($q) => $q->where('block_section_id', $sectionId)
        )->where('subject_id', $subjectId)->whereNotNull('grade')->count();
    }

    /**
     * Returns all block sections with their subject count and enrolled student count, ordered by school year descending then section code.
     */
    public function blockSectionsWithCounts(): Collection
    {
        return BlockSection::query()
            ->withCount(['subjects'])
            ->addSelect(['enrolled_count' => StudentEnrollment::selectRaw('count(*)')
                ->whereColumn('block_section_id', 'block_sections.id'),
            ])
            ->orderBy('school_year', 'desc')
            ->orderBy('code')
            ->get();
    }

    /**
     * Returns distinct school years from block sections, newest first, for use in filter dropdowns.
     */
    public function distinctSchoolYears(): Collection
    {
        return BlockSection::distinct()->orderBy('school_year', 'desc')->pluck('school_year')->filter()->values();
    }

    /**
     * Returns distinct semester values from block sections for use in filter dropdowns.
     */
    public function distinctSemesters(): Collection
    {
        return BlockSection::distinct()->pluck('semester')->filter()->values();
    }

    /**
     * Eager-loads the section's subjects onto the model.
     */
    public function loadSubjects(BlockSection $blockSection): BlockSection
    {
        return $blockSection->load('subjects');
    }

    /**
     * Returns the IDs of subjects in the section that are assigned to the given faculty user — used to restrict grade entry to the faculty member's own subjects.
     */
    public function assignedSubjectIds(BlockSection $blockSection, int $userId): array
    {
        return $blockSection->subjects()
            ->where('subjects.user_id', $userId)
            ->pluck('subjects.id')
            ->toArray();
    }

    /**
     * Returns all enrollments for a section with student names and their enrolled subjects eager-loaded, sorted alphabetically by last name via a correlated subquery.
     */
    public function enrollmentsForSection(int $sectionId): Collection
    {
        return StudentEnrollment::where('block_section_id', $sectionId)
            ->with([
                'student.personalData:id,last_name,first_name,middle_name',
                'enrollmentSubjects.subject:id,code,name,units',
            ])
            ->orderBy(
                DB::raw('(SELECT last_name FROM applicant_personal_data
                    JOIN students ON students.applicant_personal_data_id = applicant_personal_data.id
                    WHERE students.id = student_enrollments.student_id)'),
                'asc'
            )
            ->get();
    }

    /**
     * Eager-loads student personal data and enrolled subjects (with subject details) onto the enrollment model.
     */
    public function loadStudentEnrollmentRelations(StudentEnrollment $enrollment): StudentEnrollment
    {
        return $enrollment->load([
            'student.personalData:id,last_name,first_name,middle_name',
            'enrollmentSubjects.subject:id,code,name,units',
        ]);
    }

    /**
     * Finds an enrollment subject record by ID or throws a ModelNotFoundException if not found.
     */
    public function findEnrollmentSubjectOrFail(int $id): StudentEnrollmentSubject
    {
        return StudentEnrollmentSubject::findOrFail($id);
    }

    /**
     * Finds the enrollment subject row for a specific student enrollment and subject, or returns null if not found.
     */
    public function findEnrollmentSubject(int $enrollmentId, int $subjectId): ?StudentEnrollmentSubject
    {
        return StudentEnrollmentSubject::where('enrollment_id', $enrollmentId)
            ->where('subject_id', $subjectId)
            ->first();
    }

    /**
     * Finds a student enrollment by ID, or returns null if not found.
     */
    public function findEnrollment(int $id): ?StudentEnrollment
    {
        return StudentEnrollment::find($id);
    }

    /**
     * Marks the enrollment subject as Incomplete (INC) via the model's markAsIncomplete() method.
     */
    public function markEnrollmentSubjectIncomplete(StudentEnrollmentSubject $es): void
    {
        $es->markAsIncomplete();
    }

    /**
     * Marks the enrollment subject as Dropped via the model's markAsDropped() method.
     */
    public function markEnrollmentSubjectDropped(StudentEnrollmentSubject $es): void
    {
        $es->markAsDropped();
    }

    /**
     * Clears the grade and sets the status to "W" (Withdrawn) on the enrollment subject.
     */
    public function markEnrollmentSubjectWithdrawn(StudentEnrollmentSubject $es): void
    {
        $es->update(['grade' => null, 'grade_status' => 'W']);
    }

    /**
     * Saves the final grade for the enrollment subject via the model's setGrade() method.
     */
    public function setEnrollmentSubjectGrade(StudentEnrollmentSubject $es, float $grade): void
    {
        $es->setGrade($grade);
    }

    /**
     * Triggers GWA recalculation on the enrollment model after a grade change.
     */
    public function recalculateGwa(StudentEnrollment $enrollment): void
    {
        $enrollment->calculateGWA();
    }

    /**
     * Triggers a recalculation of how many credit units the student has earned and updates the enrollment record.
     */
    public function recalculateUnitsEarned(StudentEnrollment $enrollment): void
    {
        $enrollment->getUnitsEarned();
    }
}
