<?php

namespace App\Repositories;

use App\Models\BlockSection;
use App\Models\StudentEnrollment;
use App\Models\StudentEnrollmentSubject;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Collection as SupportCollection;

class BlockSectionRepository
{
    public function listWithSubjects(): Collection
    {
        return BlockSection::with('subjects')
            ->orderBy('grade_level')
            ->orderBy('name')
            ->get();
    }

    public function distinctSchoolYearsSorted(): SupportCollection
    {
        return BlockSection::distinct()->pluck('school_year')->sort()->values();
    }

    public function sectionsForYearWithSubjectsAndSchedules(string $schoolYear): Collection
    {
        return BlockSection::where('school_year', $schoolYear)
            ->with(['subjects', 'schedules'])
            ->get();
    }

    public function codeExists(string $code): bool
    {
        return BlockSection::where('code', $code)->exists();
    }

    public function createSection(array $data): BlockSection
    {
        return BlockSection::create($data);
    }

    public function attachSubjects(BlockSection $blockSection, array $subjectIds): void
    {
        $blockSection->subjects()->attach($subjectIds);
    }

    public function loadSubjectsAndSchedules(BlockSection $blockSection): void
    {
        $blockSection->load(['subjects.schedules']);
    }

    public function enrolledStudentsForSection(int $blockSectionId): Collection
    {
        return StudentEnrollment::where('block_section_id', $blockSectionId)
            ->with(['student.personalData'])
            ->get();
    }

    public function enrolledStudentIdsFor(string $schoolYear, ?string $semester): SupportCollection
    {
        return StudentEnrollment::where('school_year', $schoolYear)
            ->when($semester, fn ($q) => $q->where('semester', $semester))
            ->pluck('student_id');
    }

    public function loadFacultyAndSchedules(BlockSection $blockSection): void
    {
        $blockSection->load(['subjects.faculty', 'subjects.schedules']);
    }

    public function enrollmentExistsFor(int $studentId, string $schoolYear, ?string $semester): bool
    {
        return StudentEnrollment::where('student_id', $studentId)
            ->where('school_year', $schoolYear)
            ->when($semester, fn ($q) => $q->where('semester', $semester))
            ->exists();
    }

    public function createEnrollment(array $data): StudentEnrollment
    {
        return StudentEnrollment::create($data);
    }

    public function createEnrollmentSubject(array $data): void
    {
        StudentEnrollmentSubject::create($data);
    }

    public function updateSection(BlockSection $blockSection, array $data): void
    {
        $blockSection->update($data);
    }

    public function syncSubjects(BlockSection $blockSection, array $subjectIds): void
    {
        $blockSection->subjects()->sync($subjectIds);
    }

    public function deleteSection(BlockSection $blockSection): void
    {
        $blockSection->subjects()->detach();
        $blockSection->delete();
    }

    public function incrementEnrollment(BlockSection $blockSection): void
    {
        $blockSection->incrementEnrollment();
    }

    public function decrementEnrollment(BlockSection $blockSection): void
    {
        $blockSection->decrementEnrollment();
    }

    public function deleteEnrollment(StudentEnrollment $studentEnrollment): void
    {
        $studentEnrollment->delete();
    }

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
