<?php

namespace App\Repositories;

use App\Models\Applicant;
use App\Models\ApplicantAssessment;
use App\Models\ApplicantExamAssignment;
use App\Models\Attendance;
use App\Models\StudentAssessment;
use App\Models\StudentEnrollment;
use App\Models\Subject;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Collection as SupportCollection;

class StudentPortalRepository
{
    /**
     * Returns the applicant's exam assignment with its schedule and examination room eager-loaded, or null if none exists.
     */
    public function examAssignmentWithSchedule(Applicant $application): ?ApplicantExamAssignment
    {
        return $application->examAssignment()->with('examSchedule.examinationRoom')->first();
    }

    /**
     * Returns the subjects attached to the applicant's assessment with their subject details eager-loaded, or an empty collection if no assessment exists.
     */
    public function assessmentSubjectsFor(Applicant $application): SupportCollection
    {
        return $application->assessment
            ? $application->assessment->subjects()->with('subject')->get()
            : collect();
    }

    /**
     * Returns true if the applicant already has a fee assessment generated — used to prevent duplicates.
     */
    public function applicantAssessmentExists(Applicant $application): bool
    {
        return $application->assessment()->exists();
    }

    /**
     * Creates and returns a new applicant fee assessment record.
     */
    public function createApplicantAssessment(array $data): ApplicantAssessment
    {
        return ApplicantAssessment::create($data);
    }

    /**
     * Returns active subjects matching the given grade level, strand, and semester (including Full Year subjects).
     * Used to populate the subject list on an applicant's assessment.
     */
    public function subjectsForAssessment(string $gradeLevel, ?string $strand, string $semester): Collection
    {
        return Subject::active()
            ->byGradeLevel($gradeLevel)
            ->byStrand($strand)
            ->where(function ($q) use ($semester) {
                $q->where('semester', $semester)->orWhere('semester', 'Full Year');
            })
            ->get();
    }

    /**
     * Attaches a list of subjects (each with subject_id and units) to the applicant's assessment.
     */
    public function attachAssessmentSubjects(ApplicantAssessment $assessment, array $subjects): void
    {
        $assessment->subjects()->createMany($subjects);
    }

    /**
     * Returns the student's most recent enrollment with their block section and its subjects eager-loaded, or null if not yet enrolled.
     */
    public function latestSectionEnrollment(int $studentId): ?StudentEnrollment
    {
        return StudentEnrollment::where('student_id', $studentId)
            ->with('blockSection.subjects')
            ->latest()
            ->first();
    }

    /**
     * Returns all assessments for the student ordered chronologically, with their payment records eager-loaded.
     */
    public function assessmentsWithPaymentsForStudent(int $studentId): Collection
    {
        return StudentAssessment::where('student_id', $studentId)
            ->with('payments')
            ->orderBy('school_year')
            ->orderBy('generated_at')
            ->get();
    }

    /**
     * Returns the student's most recent enrollment with their enrolled subjects and subject details eager-loaded — used for the schedule page.
     */
    public function latestEnrollmentWithSubjects(int $studentId): ?StudentEnrollment
    {
        return StudentEnrollment::where('student_id', $studentId)
            ->with('enrollmentSubjects.subject')
            ->latest()
            ->first();
    }

    /**
     * Returns the student's most recent enrollment record without any eager-loading.
     */
    public function latestEnrollment(int $studentId): ?StudentEnrollment
    {
        return StudentEnrollment::where('student_id', $studentId)->latest()->first();
    }

    /**
     * Returns Absent and Late attendance records for the enrollment, newest first, with subject details eager-loaded.
     * Present and Excused records are excluded as they are not actionable by the student.
     */
    public function attendanceForEnrollment(int $enrollmentId): Collection
    {
        return Attendance::where('student_enrollment_id', $enrollmentId)
            ->whereIn('status', ['Absent', 'Late'])
            ->with('subject')
            ->orderBy('date', 'desc')
            ->get();
    }

    /**
     * Updates the given attendance record with the supplied data.
     */
    public function updateAttendance(Attendance $attendance, array $data): void
    {
        $attendance->update($data);
    }
}
