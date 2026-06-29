<?php

namespace App\Services\Admin;

use App\Models\ExamSchedule;
use App\Repositories\ExamScheduleRepository;
use Illuminate\Support\Collection;

class ExamScheduleService
{
    public function __construct(private ExamScheduleRepository $examScheduleRepository)
    {
    }

    public function create(array $data): ExamSchedule
    {
        return $this->examScheduleRepository->create($data);
    }

    public function update(ExamSchedule $examSchedule, array $data): void
    {
        $this->examScheduleRepository->update($examSchedule, $data);
    }

    public function delete(ExamSchedule $examSchedule): bool
    {
        if ($this->examScheduleRepository->hasAssignments($examSchedule)) {
            return false;
        }

        $this->examScheduleRepository->delete($examSchedule);

        return true;
    }

    public function availableApplicantsFor(ExamSchedule $examSchedule): Collection
    {
        $assignedToThisSchedule = $this->examScheduleRepository->assignedApplicantIds($examSchedule);
        $assignedElsewhere = $this->examScheduleRepository->applicantScheduleNamesElsewhere($examSchedule);

        return $this->examScheduleRepository->availableApplicants($assignedToThisSchedule)
            ->map(fn ($a) => [
                'id' => $a->id,
                'application_number' => $a->application_number,
                'application_status' => $a->application_status,
                'first_name' => $a->personalData?->first_name,
                'last_name' => $a->personalData?->last_name,
                'middle_name' => $a->personalData?->middle_name,
                'assigned_to_schedule' => $assignedElsewhere->get($a->id),
            ]);
    }

    public function availableSchedulesPayload(): Collection
    {
        return $this->examScheduleRepository->upcomingActiveWithAssignedCount()
            ->map(function ($schedule) {
                $effectiveCapacity = $schedule->examinationRoom->capacity;

                return [
                    'id' => $schedule->id,
                    'name' => $schedule->name,
                    'exam_type' => $schedule->exam_type,
                    'exam_date' => $schedule->exam_date->format('Y-m-d'),
                    'start_time' => $schedule->start_time,
                    'end_time' => $schedule->end_time,
                    'room' => $schedule->examinationRoom->name,
                    'building' => $schedule->examinationRoom->building,
                    'capacity' => $effectiveCapacity,
                    'assigned_count' => $schedule->assigned_count,
                    'available_slots' => max(0, $effectiveCapacity - $schedule->assigned_count),
                ];
            });
    }
}
