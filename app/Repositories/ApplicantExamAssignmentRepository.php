<?php

namespace App\Repositories;

use App\Models\Applicant;
use App\Models\ApplicantExamAssignment;
use App\Models\EnrollmentPeriod;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

class ApplicantExamAssignmentRepository
{
    /**
     * Returns exam assignments (with application info, personal data, and room) for applicants who are not yet enrolled in the current period, newest first.
     */
    public function pendingAssignmentsForCurrentPeriod(?EnrollmentPeriod $currentPeriod): Collection
    {
        return ApplicantExamAssignment::with([
            'applicationInfo.personalData',
            'examSchedule.examinationRoom',
        ])
            ->whereHas('applicationInfo', function ($q) use ($currentPeriod) {
                $q->where('application_status', '!=', 'Enrolled')
                    ->when($currentPeriod, fn ($q) => $currentPeriod->applyTo($q));
            })
            ->orderBy('created_at', 'desc')
            ->get();
    }

    /**
     * Returns a paginated list (20 per page) of "For Exam" applicants who have no exam assignment yet, optionally filtered by name or application number search.
     */
    public function applicantsWithoutAssignment(?string $search): LengthAwarePaginator
    {
        return Applicant::with('personalData')
            ->whereDoesntHave('examAssignment')
            ->whereIn('application_status', ['For Exam'])
            ->when($search, function ($q, $search) {
                $q->where(function ($q) use ($search) {
                    $q->where('application_number', 'like', "%{$search}%")
                        ->orWhereHas('personalData', function ($pq) use ($search) {
                            $pq->where('first_name', 'like', "%{$search}%")
                                ->orWhere('last_name', 'like', "%{$search}%");
                        });
                });
            })
            ->orderBy('application_number')
            ->paginate(20);
    }

    /**
     * Returns true if the applicant is already assigned to the given exam schedule — used to prevent duplicate assignments.
     */
    public function assignmentExists(int $applicantId, int $examScheduleId): bool
    {
        return ApplicantExamAssignment::where('applicant_id', $applicantId)
            ->where('exam_schedule_id', $examScheduleId)
            ->exists();
    }

    /**
     * Creates and returns a new exam assignment record.
     */
    public function create(array $data): ApplicantExamAssignment
    {
        return ApplicantExamAssignment::create($data);
    }

    /**
     * Updates the given exam assignment with the supplied data.
     */
    public function updateAssignment(ApplicantExamAssignment $assignment, array $data): void
    {
        $assignment->update($data);
    }

    /**
     * Deletes the given exam assignment record.
     */
    public function delete(ApplicantExamAssignment $assignment): void
    {
        $assignment->delete();
    }
}
