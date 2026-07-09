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

    /**
     * Returns pending exam assignments and the list of active schedules for the assignments index page.
     */
    public function indexData(): array
    {
        return [
            'assignments' => $this->assignmentRepository->pendingAssignmentsForCurrentPeriod(EnrollmentPeriod::current()),
            'schedules' => $this->examScheduleRepository->activeOrderedByDateMinimal(),
        ];
    }

    /**
     * Returns the data needed for the assignment creation form: unassigned applicants (optionally filtered by search) and available schedules with slot counts.
     */
    public function createData(?string $search): array
    {
        $schedules = $this->examScheduleRepository->activeWithAssignedCountOrderedByDateTime()
            ->map(fn ($schedule) => $this->scheduleWithSlots($schedule));

        return [
            'applicants' => $this->assignmentRepository->applicantsWithoutAssignment($search),
            'schedules' => $schedules,
        ];
    }

    /**
     * Assigns a single applicant to an exam schedule, checking for duplicates and available capacity first.
     * Also updates the applicant's status to 'For Exam'.
     * Returns an error array if blocked, or an empty array on success.
     */
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

    /**
     * Assigns multiple applicants to an exam schedule in one transaction.
     * Rejects the entire batch if the number of applicants exceeds the remaining available slots.
     * Skips any applicant already assigned to the same schedule.
     * Returns the count of successfully assigned applicants.
     */
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

    /**
     * Updates an assignment's status and applies side effects:
     * stamps confirmed_at when status is 'confirmed', and marks the applicant as 'Exam Taken' when status is 'attended'.
     */
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

    /**
     * Records the exam result (passed or failed) on the assignment and updates the applicant's application status accordingly.
     */
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

    /**
     * Removes an applicant's exam assignment.
     */
    public function delete(ApplicantExamAssignment $assignment): void
    {
        $this->assignmentRepository->delete($assignment);
    }

    /**
     * Sets the applicant's application status to 'For Exam'.
     */
    private function markApplicantForExam(int $applicantId): void
    {
        $this->applicantRepository->update($this->applicantRepository->findOrFail($applicantId), ['application_status' => 'For Exam']);
    }

    /**
     * Formats a schedule record into an array with room details, capacity, assigned count, and remaining available slots.
     */
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
