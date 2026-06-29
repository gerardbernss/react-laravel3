<?php

namespace App\Repositories;

use App\Models\EnrollmentPeriod;
use App\Models\StudentAssessment;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Collection as SupportCollection;

class StudentAssessmentRepository
{
    public function assessmentsForPeriod(?EnrollmentPeriod $period): Collection
    {
        return StudentAssessment::with(['student.personalData', 'payments'])
            ->when($period, fn ($q) => $period->applyTo($q))
            ->latest()
            ->get();
    }

    public function distinctSchoolYearsDesc(): SupportCollection
    {
        return StudentAssessment::select('school_year')->distinct()->orderByDesc('school_year')->pluck('school_year');
    }

    public function loadDetailRelations(StudentAssessment $assessment): void
    {
        $assessment->load(['student.personalData', 'payments.processedBy']);
    }

    public function create(array $data): StudentAssessment
    {
        return StudentAssessment::create($data);
    }

    public function existsForStudentPeriod(int $studentId, string $schoolYear, string $semester): bool
    {
        return StudentAssessment::where('student_id', $studentId)
            ->where('school_year', $schoolYear)
            ->where('semester', $semester)
            ->exists();
    }

    public function findForStudentPeriod(int $studentId, string $schoolYear, string $semester): ?StudentAssessment
    {
        return StudentAssessment::where('student_id', $studentId)
            ->where('school_year', $schoolYear)
            ->where('semester', $semester)
            ->first();
    }

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

    public function updateAssessment(StudentAssessment $assessment, array $data): void
    {
        $assessment->update($data);
    }

    public function latestForStudent(int $studentId): ?StudentAssessment
    {
        return StudentAssessment::where('student_id', $studentId)->latest()->first();
    }

    public function studentIdsForPeriod(string $schoolYear, string $semester): SupportCollection
    {
        return StudentAssessment::where('school_year', $schoolYear)
            ->where('semester', $semester)
            ->pluck('student_id');
    }

    public function priorBalance(int $studentId, string $schoolYear, string $semester): float
    {
        $previous = StudentAssessment::where('student_id', $studentId)
            ->where(fn ($q) => $q->where('school_year', '!=', $schoolYear)->orWhere('semester', '!=', $semester))
            ->whereIn('status', ['finalized', 'partial'])
            ->latest()
            ->first();

        return $previous ? $previous->remaining_balance : 0.0;
    }

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
