<?php

namespace App\Repositories;

use App\Models\Applicant;
use App\Models\ApplicantExamAssignment;
use App\Models\ExamSchedule;
use Illuminate\Database\Eloquent\Collection;

class ExamScheduleRepository
{
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

    public function loadShowRelations(ExamSchedule $examSchedule): ExamSchedule
    {
        return $examSchedule->load([
            'examinationRoom',
            'applicantAssignments.applicationInfo.personalData',
        ]);
    }

    public function assignedApplicantIds(ExamSchedule $examSchedule): array
    {
        return $examSchedule->applicantAssignments()
            ->whereNotIn('status', ['cancelled'])
            ->pluck('applicant_id')
            ->toArray();
    }

    public function applicantScheduleNamesElsewhere(ExamSchedule $examSchedule): Collection
    {
        return ApplicantExamAssignment::with('examSchedule:id,name')
            ->whereNotIn('status', ['cancelled'])
            ->where('exam_schedule_id', '!=', $examSchedule->id)
            ->get()
            ->keyBy('applicant_id')
            ->map(fn ($a) => $a->examSchedule?->name);
    }

    public function availableApplicants(array $excludeApplicantIds): Collection
    {
        return Applicant::with('personalData')
            ->whereIn('application_status', ['Pending', 'For Exam'])
            ->whereNotIn('id', $excludeApplicantIds)
            ->orderBy('application_number')
            ->get();
    }

    public function hasAssignments(ExamSchedule $examSchedule): bool
    {
        return $examSchedule->applicantAssignments()->count() > 0;
    }

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

    public function activeOrderedByDateMinimal(): Collection
    {
        return ExamSchedule::with('examinationRoom')
            ->active()
            ->orderBy('exam_date')
            ->get(['id', 'name', 'exam_date', 'examination_room_id']);
    }

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

    public function findWithRoomOrFail(int $id): ExamSchedule
    {
        return ExamSchedule::with('examinationRoom')->findOrFail($id);
    }

    public function countActiveAssignments(ExamSchedule $examSchedule): int
    {
        return $examSchedule->applicantAssignments()->whereNotIn('status', ['cancelled'])->count();
    }

    public function create(array $data): ExamSchedule
    {
        return ExamSchedule::create($data);
    }

    public function update(ExamSchedule $examSchedule, array $data): void
    {
        $examSchedule->update($data);
    }

    public function delete(ExamSchedule $examSchedule): void
    {
        $examSchedule->delete();
    }
}
