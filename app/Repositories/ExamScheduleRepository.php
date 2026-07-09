<?php

namespace App\Repositories;

use App\Models\Applicant;
use App\Models\ApplicantExamAssignment;
use App\Models\ExamSchedule;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Collection as SupportCollection;

class ExamScheduleRepository
{
    /**
     * Returns all exam schedules with their room and non-cancelled assignment count, ordered by date descending then start time.
     */
    public function allWithRoomAndAssignedCount(): Collection
    {
        return ExamSchedule::with('examinationRoom')
            ->withCount(['applicantAssignments as assigned_count' => function ($q) {
                $q->whereNotIn('status', ['cancelled']);
            }])
            ->orderBy('exam_date', 'desc')
            ->orderBy('start_time')
            ->get();
    }

    /**
     * Eager-loads the exam room and all assigned applicants (with personal data) onto the schedule model — used for the schedule detail/show page.
     */
    public function loadShowRelations(ExamSchedule $examSchedule): ExamSchedule
    {
        return $examSchedule->load([
            'examinationRoom',
            'applicantAssignments.applicationInfo.personalData',
        ]);
    }

    /**
     * Returns the applicant IDs with non-cancelled assignments to this schedule — used to exclude them from the available-applicants list.
     */
    public function assignedApplicantIds(ExamSchedule $examSchedule): array
    {
        return $examSchedule->applicantAssignments()
            ->whereNotIn('status', ['cancelled'])
            ->pluck('applicant_id')
            ->toArray();
    }

    /**
     * Returns a map of applicant_id → schedule name for applicants assigned to any other schedule (non-cancelled).
     * Used to warn the admin when assigning an applicant who already has an exam scheduled elsewhere.
     */
    public function applicantScheduleNamesElsewhere(ExamSchedule $examSchedule): SupportCollection
    {
        return ApplicantExamAssignment::with('examSchedule:id,name')
            ->whereNotIn('status', ['cancelled'])
            ->where('exam_schedule_id', '!=', $examSchedule->id)
            ->get()
            ->keyBy('applicant_id')
            ->map(fn ($a) => $a->examSchedule?->name);
    }

    /**
     * Returns applicants with Pending or For Exam status who are not already in the excluded ID list, ordered by application number.
     */
    public function availableApplicants(array $excludeApplicantIds): Collection
    {
        return Applicant::with('personalData')
            ->whereIn('application_status', ['Pending', 'For Exam'])
            ->whereNotIn('id', $excludeApplicantIds)
            ->orderBy('application_number')
            ->get();
    }

    /**
     * Returns true if the schedule has any applicant assignments (including cancelled) — used to prevent deletion of schedules with history.
     */
    public function hasAssignments(ExamSchedule $examSchedule): bool
    {
        return $examSchedule->applicantAssignments()->count() > 0;
    }

    /**
     * Returns upcoming active exam schedules with their room and non-cancelled assignment count, ordered by date then start time.
     * Used for the admissions dashboard widget.
     */
    public function upcomingActiveWithAssignedCount(): Collection
    {
        return ExamSchedule::with('examinationRoom')
            ->active()
            ->upcoming()
            ->withCount(['applicantAssignments as assigned_count' => function ($q) {
                $q->whereNotIn('status', ['cancelled']);
            }])
            ->orderBy('exam_date')
            ->orderBy('start_time')
            ->get();
    }

    /**
     * Returns active schedules with only id, name, exam_date, and room — a lightweight query for populating dropdowns.
     */
    public function activeOrderedByDateMinimal(): Collection
    {
        return ExamSchedule::with('examinationRoom')
            ->active()
            ->orderBy('exam_date')
            ->get(['id', 'name', 'exam_date', 'examination_room_id']);
    }

    /**
     * Returns all active schedules with their room and non-cancelled assignment count, ordered by date then start time.
     */
    public function activeWithAssignedCountOrderedByDateTime(): Collection
    {
        return ExamSchedule::with('examinationRoom')
            ->active()
            ->withCount(['applicantAssignments as assigned_count' => function ($q) {
                $q->whereNotIn('status', ['cancelled']);
            }])
            ->orderBy('exam_date')
            ->orderBy('start_time')
            ->get();
    }

    /**
     * Finds an exam schedule by ID with its room eager-loaded, or throws a ModelNotFoundException.
     */
    public function findWithRoomOrFail(int $id): ExamSchedule
    {
        return ExamSchedule::with('examinationRoom')->findOrFail($id);
    }

    /**
     * Returns the number of non-cancelled applicant assignments for this schedule — used to enforce capacity limits.
     */
    public function countActiveAssignments(ExamSchedule $examSchedule): int
    {
        return $examSchedule->applicantAssignments()->whereNotIn('status', ['cancelled'])->count();
    }

    /**
     * Creates and returns a new exam schedule record.
     */
    public function create(array $data): ExamSchedule
    {
        return ExamSchedule::create($data);
    }

    /**
     * Updates the given exam schedule with the supplied data.
     */
    public function update(ExamSchedule $examSchedule, array $data): void
    {
        $examSchedule->update($data);
    }

    /**
     * Deletes the given exam schedule record.
     */
    public function delete(ExamSchedule $examSchedule): void
    {
        $examSchedule->delete();
    }
}
