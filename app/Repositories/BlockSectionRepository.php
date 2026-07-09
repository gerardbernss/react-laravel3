<?php

namespace App\Repositories;

use App\Models\BlockSection;
use App\Models\StudentEnrollment;
use App\Models\StudentEnrollmentSubject;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Collection as SupportCollection;

class BlockSectionRepository
{
    /**
     * Returns all block sections with their subjects eager-loaded, ordered by grade level then section name.
     */
    public function listWithSubjects(): Collection
    {
        return BlockSection::with('subjects')
            ->orderBy('grade_level')
            ->orderBy('name')
            ->get();
    }

    /**
     * Returns distinct school years from all block sections, sorted ascending — used to populate year filter dropdowns.
     */
    public function distinctSchoolYearsSorted(): SupportCollection
    {
        return BlockSection::distinct()->pluck('school_year')->sort()->values();
    }

    /**
     * Returns all block sections for the given school year with subjects and schedules eager-loaded.
     */
    public function sectionsForYearWithSubjectsAndSchedules(string $schoolYear): Collection
    {
        return BlockSection::where('school_year', $schoolYear)
            ->with(['subjects', 'schedules'])
            ->get();
    }

    /**
     * Returns true if a block section with the given code already exists — used to enforce unique section codes.
     */
    public function codeExists(string $code): bool
    {
        return BlockSection::where('code', $code)->exists();
    }

    /**
     * Creates and returns a new block section record.
     */
    public function createSection(array $data): BlockSection
    {
        return BlockSection::create($data);
    }

    /**
     * Attaches the given subjects to the section without removing any already attached.
     */
    public function attachSubjects(BlockSection $blockSection, array $subjectIds): void
    {
        $blockSection->subjects()->attach($subjectIds);
    }

    /**
     * Eager-loads subjects with their schedules onto the block section model.
     */
    public function loadSubjectsAndSchedules(BlockSection $blockSection): void
    {
        $blockSection->load(['subjects.schedules']);
    }

    /**
     * Returns all enrollments for the given section with student personal data eager-loaded.
     */
    public function enrolledStudentsForSection(int $blockSectionId): Collection
    {
        return StudentEnrollment::where('block_section_id', $blockSectionId)
            ->with(['student.personalData'])
            ->get();
    }

    /**
     * Returns the student IDs of all enrollments for the given school year, optionally filtered by semester.
     */
    public function enrolledStudentIdsFor(string $schoolYear, ?string $semester): SupportCollection
    {
        return StudentEnrollment::where('school_year', $schoolYear)
            ->when($semester, fn ($q) => $q->where('semester', $semester))
            ->pluck('student_id');
    }

    /**
     * Eager-loads subjects with their faculty and schedules onto the block section model.
     */
    public function loadFacultyAndSchedules(BlockSection $blockSection): void
    {
        $blockSection->load(['subjects.faculty', 'subjects.schedules.teacher']);
    }

    /**
     * Returns true if the student already has an enrollment record for the given school year and optional semester.
     */
    public function enrollmentExistsFor(int $studentId, string $schoolYear, ?string $semester): bool
    {
        return StudentEnrollment::where('student_id', $studentId)
            ->where('school_year', $schoolYear)
            ->when($semester, fn ($q) => $q->where('semester', $semester))
            ->exists();
    }

    /**
     * Creates and returns a new student enrollment record.
     */
    public function createEnrollment(array $data): StudentEnrollment
    {
        return StudentEnrollment::create($data);
    }

    /**
     * Creates a new enrollment subject record linking an enrolled student to a specific subject.
     */
    public function createEnrollmentSubject(array $data): void
    {
        StudentEnrollmentSubject::create($data);
    }

    /**
     * Updates the given block section with the supplied data.
     */
    public function updateSection(BlockSection $blockSection, array $data): void
    {
        $blockSection->update($data);
    }

    /**
     * Replaces the section's entire subject list with the given subject IDs.
     */
    public function syncSubjects(BlockSection $blockSection, array $subjectIds): void
    {
        $blockSection->subjects()->sync($subjectIds);
    }

    /**
     * Detaches all subjects from the section then deletes the section record.
     */
    public function deleteSection(BlockSection $blockSection): void
    {
        $blockSection->subjects()->detach();
        $blockSection->delete();
    }

    /**
     * Increments the section's current enrollment count via the model method.
     */
    public function incrementEnrollment(BlockSection $blockSection): void
    {
        $blockSection->incrementEnrollment();
    }

    /**
     * Decrements the section's current enrollment count via the model method.
     */
    public function decrementEnrollment(BlockSection $blockSection): void
    {
        $blockSection->decrementEnrollment();
    }

    /**
     * Deletes the given student enrollment record.
     */
    public function deleteEnrollment(StudentEnrollment $studentEnrollment): void
    {
        $studentEnrollment->delete();
    }

    /**
     * Returns active sections for the given period grouped by "grade_level|strand" key, ordered by current enrollment ascending — used to find the least-full section when auto-assigning students.
     */
    public function activeSectionsForPeriodGroupedByKey(string $schoolYear, string $semester): \Illuminate\Support\Collection
    {
        return BlockSection::where('school_year', $schoolYear)
            ->where('semester', $semester)
            ->where('is_active', true)
            ->orderBy('current_enrollment')
            ->get()
            ->groupBy(fn ($s) => $s->grade_level . '|' . ($s->strand ?? ''));
    }
}
