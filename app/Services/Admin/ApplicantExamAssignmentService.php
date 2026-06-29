<?php

namespace App\Services\Admin;

use App\Models\ApplicantExamAssignment;
use App\Models\EnrollmentPeriod;
use App\Repositories\ApplicantExamAssignmentRepository;
use App\Repositories\ApplicantRepository;
use App\Repositories\ExamScheduleRepository;
use Illuminate\Support\Facades\DB;

class ApplicantExamAssignmentService
{
    public function __construct(
        private ApplicantExamAssignmentRepository $assignmentRepository,
        private ExamScheduleRepository $examScheduleRepository,
        private ApplicantRepository $applicantRepository,
    ) {
    }

    public function indexData(): array
    {
        return [
            'assignments' => $this->assignmentRepository->pendingAssignmentsForCurrentPeriod(EnrollmentPeriod::current()),
            'schedules' => $this->examScheduleRepository->activeOrderedByDateMinimal(),
        ];
    }

    public function createData(?string $search): array
    {
        $schedules = $this->examScheduleRepository->activeWithAssignedCountOrderedByDateTime()
            ->map(fn ($schedule) => $this->scheduleWithSlots($schedule));

        return [
            'applicants' => $this->assignmentRepository->applicantsWithoutAssignment($search),
            'schedules' => $schedules,
        ];
    }

    public function store(array $data): array
    {
        if ($this->assignmentRepository->assignmentExists($data['applicant_id'], $data['exam_schedule_id'])) {
            return ['error' => 'This applicant is already assigned to this exam schedule.'];
        }

        $schedule = $this->examScheduleRepository->findWithRoomOrFail($data['exam_schedule_id']);
        $effectiveCapacity = $schedule->capacity ?? $schedule->examinationRoom->capacity;
        $currentCount = $this->examScheduleRepository->countActiveAssignments($schedule);

        if ($currentCount >= $effectiveCapacity) {
            return ['error' => 'This exam schedule is already at full capacity.'];
        }

        $data['status'] = 'assigned';
        $data['assigned_at'] = now();

        DB::transaction(function () use ($data) {
            $this->assignmentRepository->create($data);
            $this->markApplicantForExam($data['applicant_id']);
        });

        return [];
    }

    public function bulkStore(array $data): array
    {
        $schedule = $this->examScheduleRepository->findWithRoomOrFail($data['exam_schedule_id']);
        $effectiveCapacity = $schedule->capacity ?? $schedule->examinationRoom->capacity;
        $currentCount = $this->examScheduleRepository->countActiveAssignments($schedule);
        $availableSlots = $effectiveCapacity - $currentCount;
        $applicantIds = $data['applicant_ids'];

        if (count($applicantIds) > $availableSlots) {
            return ['error' => "Only {$availableSlots} slots available. Cannot assign " . count($applicantIds) . ' applicants.'];
        }

        $assigned = DB::transaction(function () use ($applicantIds, $data) {
            $assigned = 0;
            foreach ($applicantIds as $applicantId) {
                if ($this->assignmentRepository->assignmentExists($applicantId, $data['exam_schedule_id'])) {
                    continue;
                }

                $this->assignmentRepository->create([
                    'applicant_id' => $applicantId,
                    'exam_schedule_id' => $data['exam_schedule_id'],
                    'status' => 'assigned',
                    'assigned_at' => now(),
                ]);
                $this->markApplicantForExam($applicantId);
                $assigned++;
            }

            return $assigned;
        });

        return ['assigned' => $assigned];
    }

    public function updateStatus(ApplicantExamAssignment $assignment, array $data): void
    {
        DB::transaction(function () use ($assignment, $data) {
            $this->assignmentRepository->updateAssignment($assignment, $data);

            if ($data['status'] === 'confirmed') {
                $this->assignmentRepository->updateAssignment($assignment, ['confirmed_at' => now()]);
            }

            if ($data['status'] === 'attended') {
                $this->applicantRepository->update($assignment->applicationInfo, ['application_status' => 'Exam Taken']);
            }
        });
    }

    public function markResult(ApplicantExamAssignment $assignment, array $data): void
    {
        $applicationStatus = $data['result'] === 'passed' ? 'Exam Passed' : 'Exam Failed';

        DB::transaction(function () use ($assignment, $data, $applicationStatus) {
            $this->assignmentRepository->updateAssignment($assignment, [
                'status' => $data['result'] === 'passed' ? 'passed' : 'failed',
                'notes' => $data['notes'] ?? $assignment->notes,
            ]);

            $this->applicantRepository->update($assignment->applicationInfo, ['application_status' => $applicationStatus]);
        });
    }

    public function delete(ApplicantExamAssignment $assignment): void
    {
        $this->assignmentRepository->delete($assignment);
    }

    private function markApplicantForExam(int $applicantId): void
    {
        $this->applicantRepository->update($this->applicantRepository->findOrFail($applicantId), ['application_status' => 'For Exam']);
    }

    private function scheduleWithSlots($schedule): array
    {
        $effectiveCapacity = $schedule->capacity ?? $schedule->examinationRoom->capacity;

        return [
            'id' => $schedule->id,
            'name' => $schedule->name,
            'exam_type' => $schedule->exam_type,
            'exam_date' => $schedule->exam_date->format('Y-m-d'),
            'formatted_date' => $schedule->exam_date->format('M d, Y'),
            'start_time' => $schedule->start_time,
            'end_time' => $schedule->end_time,
            'room_name' => $schedule->examinationRoom->name,
            'building' => $schedule->examinationRoom->building,
            'capacity' => $effectiveCapacity,
            'assigned_count' => $schedule->assigned_count,
            'available_slots' => max(0, $effectiveCapacity - $schedule->assigned_count),
        ];
    }
}
