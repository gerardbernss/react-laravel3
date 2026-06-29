<?php

namespace App\Repositories;

use App\Models\Applicant;
use App\Models\Student;
use App\Models\StudentAssessment;
use App\Models\StudentDocuments;
use App\Models\StudentFamilyBackground;
use App\Models\StudentPersonalData;
use App\Models\StudentSiblings;
use App\Models\StudentWithdrawal;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Collection as SupportCollection;

class StudentRepository
{
    public function allWithPersonalDataOrderedByCreated(): Collection
    {
        return Student::with(['studentPersonalData', 'personalData'])
            ->orderBy('created_at', 'desc')
            ->get();
    }

    public function createPersonalData(array $data): StudentPersonalData
    {
        return StudentPersonalData::create($data);
    }

    public function createStudent(array $data): Student
    {
        return Student::create($data);
    }

    public function createFamilyBackground(array $data): void
    {
        StudentFamilyBackground::create($data);
    }

    public function createSibling(array $data): void
    {
        StudentSiblings::create($data);
    }

    public function loadShowRelations(Student $student): void
    {
        $student->load([
            'studentPersonalData.familyBackground',
            'studentPersonalData.siblings',
            'studentPersonalData.documents',
            'personalData.familyBackground',
            'personalData.siblings',
            'application.educationalBackground',
            'enrollments',
            'withdrawal.processedBy',
        ]);
    }

    public function loadEditRelations(Student $student): void
    {
        $student->load(['studentPersonalData.familyBackground', 'studentPersonalData.siblings', 'studentPersonalData.documents']);
    }

    public function updatePersonalData(StudentPersonalData $personalData, array $data): void
    {
        $personalData->update($data);
    }

    public function updateStudent(Student $student, array $data): void
    {
        $student->update($data);
    }

    public function deleteSiblingsFor(StudentPersonalData $personalData): void
    {
        $personalData->siblings()->delete();
    }

    public function updateOrCreateDocuments(int $personalDataId, array $data): void
    {
        StudentDocuments::updateOrCreate(['student_personal_data_id' => $personalDataId], $data);
    }

    public function latestAssessmentFor(int $studentId): ?StudentAssessment
    {
        return StudentAssessment::where('student_id', $studentId)->latest()->first();
    }

    public function updateAssessment(StudentAssessment $assessment, array $data): void
    {
        $assessment->update($data);
    }

    public function createWithdrawal(array $data): void
    {
        StudentWithdrawal::create($data);
    }

    public function existsActiveByIdNumber(string $studentIdNumber): bool
    {
        return Student::where('student_id_number', $studentIdNumber)
            ->where('enrollment_status', 'Active')
            ->exists();
    }

    public function findIdByApplicantId(int $applicantId): ?int
    {
        $personalDataId = Applicant::where('id', $applicantId)->value('applicant_personal_data_id');

        return $personalDataId ? Student::where('applicant_personal_data_id', $personalDataId)->value('id') : null;
    }

    public function maxIdNumberLike(string $pattern): ?string
    {
        return Student::where('student_id_number', 'like', $pattern)->max('student_id_number');
    }

    public function findForEmail(int $applicationId, int $personalDataId): ?Student
    {
        return Student::where('application_id', $applicationId)
            ->orWhere('applicant_personal_data_id', $personalDataId)
            ->first();
    }

    public function existsActiveSiblingById(string $studentIdNumber): bool
    {
        return Student::where('student_id_number', $studentIdNumber)
            ->where('enrollment_status', 'Active')
            ->exists();
    }

    public function existsActiveSiblingByFullName(string $fullName): bool
    {
        return Student::whereHas('personalData', function ($q) use ($fullName) {
            $q->whereRaw("first_name || ' ' || last_name = ?", [$fullName]);
        })->where('enrollment_status', 'Active')->exists();
    }

    public function hasAnyActiveSiblingByIds(array $ids): bool
    {
        return Student::whereIn('student_id_number', $ids)
            ->where('enrollment_status', 'Active')
            ->exists();
    }

    public function hasAnyActiveSiblingByFullNames(array $fullNames): bool
    {
        return Student::whereHas('personalData', function ($q) use ($fullNames) {
            $q->whereRaw("first_name || ' ' || last_name IN (".implode(',', array_fill(0, count($fullNames), '?')).')', $fullNames);
        })->where('enrollment_status', 'Active')->exists();
    }

    public function findWithApplication(int $studentId): Student
    {
        return Student::with('application')->findOrFail($studentId);
    }

    public function markPendingStudentsNotEnrolled(): void
    {
        Student::where('enrollment_status', 'Pending')->update(['enrollment_status' => 'Not Enrolled']);
    }

    public function markActiveStudentsPending(): void
    {
        Student::where('enrollment_status', 'Active')->update(['enrollment_status' => 'Pending']);
    }

    public function activeOrPendingWithApplication(): Collection
    {
        return Student::with('application')
            ->whereIn('enrollment_status', ['Active', 'Pending'])
            ->get();
    }

    public function restoreNotEnrolledForIds(iterable $studentIds): void
    {
        Student::whereIn('id', $studentIds)
            ->where('enrollment_status', 'Not Enrolled')
            ->update(['enrollment_status' => 'Pending']);
    }

    public function notEnrolledForGradeLevel(SupportCollection|array $enrolledStudentIds, string $gradeLevel, ?string $strand): Collection
    {
        return Student::whereNotIn('id', $enrolledStudentIds)
            ->where('current_year_level', $gradeLevel)
            ->when($strand, function ($q) use ($strand) {
                $q->whereHas('application', fn ($q2) => $q2->where('strand', $strand));
            })
            ->with('personalData')
            ->get();
    }

    public function updateOrCreatePersonalData(array $match, array $data): StudentPersonalData
    {
        return StudentPersonalData::updateOrCreate($match, $data);
    }

    public function updateOrCreateFamilyBackground(array $match, array $data): void
    {
        StudentFamilyBackground::updateOrCreate($match, $data);
    }

    public function firstOrCreateSibling(array $match, array $data): void
    {
        StudentSiblings::firstOrCreate($match, $data);
    }
}
