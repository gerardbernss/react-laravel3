<?php

namespace App\Repositories;

use App\Models\EnrollmentPeriod;
use App\Models\StudentAssessment;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Collection as SupportCollection;

class StudentAssessmentRepository
{
    /**
     * Returns all student assessments with student personal data and payments eager-loaded, optionally scoped to the given enrollment period, newest first.
     */
    public function assessmentsForPeriod(?EnrollmentPeriod $period): Collection
    {
        return StudentAssessment::with(['student.personalData', 'payments'])
            ->when($period, fn ($q) => $period->applyTo($q))
            ->latest()
            ->get();
    }

    /**
     * Returns distinct school years from all student assessments, newest first — used to populate year filter dropdowns.
     */
    public function distinctSchoolYearsDesc(): SupportCollection
    {
        return StudentAssessment::select('school_year')->distinct()->orderByDesc('school_year')->pluck('school_year');
    }

    /**
     * Eager-loads student personal data and payments with the processing user onto the assessment model — used for the assessment detail view.
     */
    public function loadDetailRelations(StudentAssessment $assessment): void
    {
        $assessment->load(['student.personalData', 'payments.processedBy']);
    }

    /**
     * Creates and returns a new student assessment record.
     */
    public function create(array $data): StudentAssessment
    {
        return StudentAssessment::create($data);
    }

    /**
     * Returns true if the student already has an assessment for the given school year and semester.
     */
    public function existsForStudentPeriod(int $studentId, string $schoolYear, string $semester): bool
    {
        return StudentAssessment::where('student_id', $studentId)
            ->where('school_year', $schoolYear)
            ->where('semester', $semester)
            ->exists();
    }

    /**
     * Returns the student's assessment for the given school year and semester, or null if none exists.
     */
    public function findForStudentPeriod(int $studentId, string $schoolYear, string $semester): ?StudentAssessment
    {
        return StudentAssessment::where('student_id', $studentId)
            ->where('school_year', $schoolYear)
            ->where('semester', $semester)
            ->first();
    }

    /**
     * Returns the student's most recent finalized or partial assessment from any period other than the given school year and semester — used to carry forward an unpaid balance.
     */
    public function latestExcludingPeriod(int $studentId, string $schoolYear, string $semester): ?StudentAssessment
    {
        return StudentAssessment::where('student_id', $studentId)
            ->where(function ($q) use ($schoolYear, $semester) {
                $q->where('school_year', '!=', $schoolYear)
                    ->orWhere('semester', '!=', $semester);
            })
            ->whereIn('status', ['finalized', 'partial'])
            ->latest()
            ->first();
    }

    /**
     * Updates the given student assessment with the supplied data.
     */
    public function updateAssessment(StudentAssessment $assessment, array $data): void
    {
        $assessment->update($data);
    }

    /**
     * Returns the student's most recently created assessment regardless of period, or null if none exists.
     */
    public function latestForStudent(int $studentId): ?StudentAssessment
    {
        return StudentAssessment::where('student_id', $studentId)->latest()->first();
    }

    /**
     * Returns the student IDs of all assessments for the given school year and semester — used to check who already has an assessment before creating a new one.
     */
    public function studentIdsForPeriod(string $schoolYear, string $semester): SupportCollection
    {
        return StudentAssessment::where('school_year', $schoolYear)
            ->where('semester', $semester)
            ->pluck('student_id');
    }

    /**
     * Returns the remaining balance from the student's most recent finalized or partial assessment outside the given period, or 0.0 if none exists.
     */
    public function priorBalance(int $studentId, string $schoolYear, string $semester): float
    {
        $previous = StudentAssessment::where('student_id', $studentId)
            ->where(fn ($q) => $q->where('school_year', '!=', $schoolYear)->orWhere('semester', '!=', $semester))
            ->whereIn('status', ['finalized', 'partial'])
            ->latest()
            ->first();

        return $previous ? $previous->remaining_balance : 0.0;
    }

    /**
     * Generates the next sequential assessment number for the given school year in the format ASS-YYYYYYY-00001.
     * Finds the current highest number by scanning existing records and increments it.
     */
    public function generateAssessmentNumber(string $schoolYear): string
    {
        $prefix = 'ASS-' . str_replace('-', '', $schoolYear) . '-';
        $last = StudentAssessment::where('assessment_number', 'like', $prefix . '%')
            ->orderBy('assessment_number', 'desc')
            ->value('assessment_number');
        $next = $last ? (int) substr($last, -5) + 1 : 1;
        return $prefix . str_pad($next, 5, '0', STR_PAD_LEFT);
    }
}
