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
    /**
     * Returns all students with their personal data eager-loaded, ordered by creation date descending.
     */
    public function allWithPersonalDataOrderedByCreated(): Collection
    {
        return Student::with(['studentPersonalData', 'personalData'])
            ->orderBy('created_at', 'desc')
            ->get();
    }

    /**
     * Creates and returns a new student personal data record.
     */
    public function createPersonalData(array $data): StudentPersonalData
    {
        return StudentPersonalData::create($data);
    }

    /**
     * Creates and returns a new student record.
     */
    public function createStudent(array $data): Student
    {
        return Student::create($data);
    }

    /**
     * Creates a new student family background record.
     */
    public function createFamilyBackground(array $data): void
    {
        StudentFamilyBackground::create($data);
    }

    /**
     * Creates a new student sibling record.
     */
    public function createSibling(array $data): void
    {
        StudentSiblings::create($data);
    }

    /**
     * Eager-loads all relations needed for the student show page, including personal data, family background, siblings, documents, application educational background, enrollments, and withdrawal.
     */
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

    /**
     * Eager-loads personal data with family background, siblings, and documents onto the student model for the edit form.
     */
    public function loadEditRelations(Student $student): void
    {
        $student->load(['studentPersonalData.familyBackground', 'studentPersonalData.siblings', 'studentPersonalData.documents']);
    }

    /**
     * Updates the given student personal data record with the supplied data.
     */
    public function updatePersonalData(StudentPersonalData $personalData, array $data): void
    {
        $personalData->update($data);
    }

    /**
     * Updates the given student record with the supplied data.
     */
    public function updateStudent(Student $student, array $data): void
    {
        $student->update($data);
    }

    /**
     * Deletes all sibling records linked to the given personal data — called before re-creating the sibling list during an update.
     */
    public function deleteSiblingsFor(StudentPersonalData $personalData): void
    {
        $personalData->siblings()->delete();
    }

    /**
     * Creates or updates the document record for the given personal data ID.
     */
    public function updateOrCreateDocuments(int $personalDataId, array $data): void
    {
        StudentDocuments::updateOrCreate(['student_personal_data_id' => $personalDataId], $data);
    }

    /**
     * Returns the student's most recently created assessment, or null if none exists.
     */
    public function latestAssessmentFor(int $studentId): ?StudentAssessment
    {
        return StudentAssessment::where('student_id', $studentId)->latest()->first();
    }

    /**
     * Updates the given student assessment with the supplied data.
     */
    public function updateAssessment(StudentAssessment $assessment, array $data): void
    {
        $assessment->update($data);
    }

    /**
     * Creates a new student withdrawal record.
     */
    public function createWithdrawal(array $data): void
    {
        StudentWithdrawal::create($data);
    }

    /**
     * Returns true if an Active student with the given student ID number exists.
     */
    public function existsActiveByIdNumber(string $studentIdNumber): bool
    {
        return Student::where('student_id_number', $studentIdNumber)
            ->where('enrollment_status', 'Active')
            ->exists();
    }

    /**
     * Looks up the student ID for the given applicant by joining through the shared personal data record, or returns null if no student exists.
     */
    public function findIdByApplicantId(int $applicantId): ?int
    {
        $personalDataId = Applicant::where('id', $applicantId)->value('applicant_personal_data_id');

        return $personalDataId ? Student::where('applicant_personal_data_id', $personalDataId)->value('id') : null;
    }

    /**
     * Returns the highest student ID number matching the given LIKE pattern — used to derive the next sequential ID within a prefix group.
     */
    public function maxIdNumberLike(string $pattern): ?string
    {
        return Student::where('student_id_number', 'like', $pattern)->max('student_id_number');
    }

    /**
     * Finds a student linked to the given application ID or personal data ID — used when sending the student ID email to locate the student record from either reference.
     */
    public function findForEmail(int $applicationId, int $personalDataId): ?Student
    {
        return Student::where('application_id', $applicationId)
            ->orWhere('applicant_personal_data_id', $personalDataId)
            ->first();
    }

    /**
     * Returns true if an Active student exists with the given student ID number — single-sibling version of the sibling discount check.
     */
    public function existsActiveSiblingById(string $studentIdNumber): bool
    {
        return Student::where('student_id_number', $studentIdNumber)
            ->where('enrollment_status', 'Active')
            ->exists();
    }

    /**
     * Returns true if an Active student's full name (first_name || ' ' || last_name) matches the given string — single-sibling version of the name-based sibling discount check.
     */
    public function existsActiveSiblingByFullName(string $fullName): bool
    {
        return Student::whereHas('personalData', function ($q) use ($fullName) {
            $q->whereRaw("first_name || ' ' || last_name = ?", [$fullName]);
        })->where('enrollment_status', 'Active')->exists();
    }

    /**
     * Returns true if any of the given student ID numbers belong to an Active student.
     * Runs a single IN query instead of per-sibling EXISTS queries to avoid N+1 in the sibling discount check.
     */
    public function hasAnyActiveSiblingByIds(array $ids): bool
    {
        return Student::whereIn('student_id_number', $ids)
            ->where('enrollment_status', 'Active')
            ->exists();
    }

    /**
     * Returns true if any of the given full names match an Active student's first_name || ' ' || last_name.
     * Builds a single parameterised IN clause using Oracle's || concatenation to avoid N+1.
     */
    public function hasAnyActiveSiblingByFullNames(array $fullNames): bool
    {
        return Student::whereHas('personalData', function ($q) use ($fullNames) {
            $q->whereRaw("first_name || ' ' || last_name IN (".implode(',', array_fill(0, count($fullNames), '?')).')', $fullNames);
        })->where('enrollment_status', 'Active')->exists();
    }

    /**
     * Finds a student by ID with their application eager-loaded, or throws ModelNotFoundException if not found.
     */
    public function findWithApplication(int $studentId): Student
    {
        return Student::with('application')->findOrFail($studentId);
    }

    /**
     * Bulk-updates all Pending students to Not Enrolled — called at the start of a new enrollment cycle to reset students who did not re-enroll.
     */
    public function markPendingStudentsNotEnrolled(): void
    {
        Student::where('enrollment_status', 'Pending')->update(['enrollment_status' => 'Not Enrolled']);
    }

    /**
     * Bulk-updates all Active students to Pending — called when closing an enrollment period so students must re-enroll next term.
     */
    public function markActiveStudentsPending(): void
    {
        Student::where('enrollment_status', 'Active')->update(['enrollment_status' => 'Pending']);
    }

    /**
     * Returns all Active or Pending students with their application eager-loaded — used by the auto-promote service to determine next grade level.
     */
    public function activeOrPendingWithApplication(): Collection
    {
        return Student::with('application')
            ->whereIn('enrollment_status', ['Active', 'Pending'])
            ->get();
    }

    /**
     * Restores Not Enrolled students back to Pending for the given IDs — used when reopening an enrollment period to allow them to re-enroll.
     */
    public function restoreNotEnrolledForIds(iterable $studentIds): void
    {
        Student::whereIn('id', $studentIds)
            ->where('enrollment_status', 'Not Enrolled')
            ->update(['enrollment_status' => 'Pending']);
    }

    /**
     * Returns students at the given grade level (and optional strand) who are not in the supplied enrolled-student ID list — used to find students eligible for manual section assignment.
     */
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

    /**
     * Creates or updates a student personal data record matching the given attributes.
     */
    public function updateOrCreatePersonalData(array $match, array $data): StudentPersonalData
    {
        return StudentPersonalData::updateOrCreate($match, $data);
    }

    /**
     * Creates or updates a student family background record matching the given attributes.
     */
    public function updateOrCreateFamilyBackground(array $match, array $data): void
    {
        StudentFamilyBackground::updateOrCreate($match, $data);
    }

    /**
     * Finds an existing sibling record matching the given attributes or creates a new one — avoids duplicate sibling entries during data sync.
     */
    public function firstOrCreateSibling(array $match, array $data): void
    {
        StudentSiblings::firstOrCreate($match, $data);
    }
}
