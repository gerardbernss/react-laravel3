<?php

namespace App\Repositories;

use App\Models\BlockSection;
use App\Models\StudentEnrollment;
use App\Models\StudentEnrollmentSubject;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class GradeRepository
{
    public function countEnrolledForSubjectInSection(int $sectionId, int $subjectId): int
    {
        return StudentEnrollmentSubject::whereHas(
            'enrollment',
            fn ($q) => $q->where('block_section_id', $sectionId)
        )->where('subject_id', $subjectId)->count();
    }

    public function countGradedForSubjectInSection(int $sectionId, int $subjectId): int
    {
        return StudentEnrollmentSubject::whereHas(
            'enrollment',
            fn ($q) => $q->where('block_section_id', $sectionId)
        )->where('subject_id', $subjectId)->whereNotNull('grade')->count();
    }

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

    public function distinctSchoolYears(): Collection
    {
        return BlockSection::distinct()->orderBy('school_year', 'desc')->pluck('school_year')->filter()->values();
    }

    public function distinctSemesters(): Collection
    {
        return BlockSection::distinct()->pluck('semester')->filter()->values();
    }

    public function loadSubjects(BlockSection $blockSection): BlockSection
    {
        return $blockSection->load('subjects');
    }

    public function assignedSubjectIds(BlockSection $blockSection, int $userId): array
    {
        return $blockSection->subjects()
            ->where('subjects.user_id', $userId)
            ->pluck('subjects.id')
            ->toArray();
    }

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

    public function loadStudentEnrollmentRelations(StudentEnrollment $enrollment): StudentEnrollment
    {
        return $enrollment->load([
            'student.personalData:id,last_name,first_name,middle_name',
            'enrollmentSubjects.subject:id,code,name,units',
        ]);
    }

    public function findEnrollmentSubjectOrFail(int $id): StudentEnrollmentSubject
    {
        return StudentEnrollmentSubject::findOrFail($id);
    }

    public function findEnrollmentSubject(int $enrollmentId, int $subjectId): ?StudentEnrollmentSubject
    {
        return StudentEnrollmentSubject::where('enrollment_id', $enrollmentId)
            ->where('subject_id', $subjectId)
            ->first();
    }

    public function findEnrollment(int $id): ?StudentEnrollment
    {
        return StudentEnrollment::find($id);
    }

    public function markEnrollmentSubjectIncomplete(StudentEnrollmentSubject $es): void
    {
        $es->markAsIncomplete();
    }

    public function markEnrollmentSubjectDropped(StudentEnrollmentSubject $es): void
    {
        $es->markAsDropped();
    }

    public function markEnrollmentSubjectWithdrawn(StudentEnrollmentSubject $es): void
    {
        $es->update(['grade' => null, 'grade_status' => 'W']);
    }

    public function setEnrollmentSubjectGrade(StudentEnrollmentSubject $es, float $grade): void
    {
        $es->setGrade($grade);
    }

    public function recalculateGwa(StudentEnrollment $enrollment): void
    {
        $enrollment->calculateGWA();
    }

    public function recalculateUnitsEarned(StudentEnrollment $enrollment): void
    {
        $enrollment->getUnitsEarned();
    }
}
