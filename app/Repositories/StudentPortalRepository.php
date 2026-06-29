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

class StudentPortalRepository
{
    public function examAssignmentWithSchedule(Applicant $application): ?ApplicantExamAssignment
    {
        return $application->examAssignment()->with('examSchedule.examinationRoom')->first();
    }

    public function assessmentSubjectsFor(Applicant $application): Collection
    {
        return $application->assessment
            ? $application->assessment->subjects()->with('subject')->get()
            : collect();
    }

    public function applicantAssessmentExists(Applicant $application): bool
    {
        return $application->assessment()->exists();
    }

    public function createApplicantAssessment(array $data): ApplicantAssessment
    {
        return ApplicantAssessment::create($data);
    }

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

    public function attachAssessmentSubjects(ApplicantAssessment $assessment, array $subjects): void
    {
        $assessment->subjects()->createMany($subjects);
    }

    public function latestSectionEnrollment(int $studentId): ?StudentEnrollment
    {
        return StudentEnrollment::where('student_id', $studentId)
            ->with('blockSection.subjects')
            ->latest()
            ->first();
    }

    public function assessmentsWithPaymentsForStudent(int $studentId): Collection
    {
        return StudentAssessment::where('student_id', $studentId)
            ->with('payments')
            ->orderBy('school_year')
            ->orderBy('generated_at')
            ->get();
    }

    public function latestEnrollmentWithSubjects(int $studentId): ?StudentEnrollment
    {
        return StudentEnrollment::where('student_id', $studentId)
            ->with('enrollmentSubjects.subject')
            ->latest()
            ->first();
    }

    public function latestEnrollment(int $studentId): ?StudentEnrollment
    {
        return StudentEnrollment::where('student_id', $studentId)->latest()->first();
    }

    public function attendanceForEnrollment(int $enrollmentId): Collection
    {
        return Attendance::where('student_enrollment_id', $enrollmentId)
            ->whereIn('status', ['Absent', 'Late'])
            ->with('subject')
            ->orderBy('date', 'desc')
            ->get();
    }

    public function updateAttendance(Attendance $attendance, array $data): void
    {
        $attendance->update($data);
    }
}
