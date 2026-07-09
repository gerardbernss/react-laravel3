<?php

namespace App\Services\Admin;

use App\Models\Schedule;
use App\Repositories\ScheduleRepository;
use App\Repositories\SubjectRepository;
use App\Repositories\UserRepository;
use Illuminate\Support\Facades\DB;

class SubjectSchedulesService
{
    public function __construct(
        private ScheduleRepository $scheduleRepository,
        private SubjectRepository $subjectRepository,
        private UserRepository $userRepository,
    ) {
    }

    /**
     * Returns every schedule (default and section-specific) with its subject and block section loaded, for the index page.
     */
    public function indexData(): array
    {
        return ['schedules' => $this->scheduleRepository->allWithSubjectAndSection()];
    }

    /**
     * Returns the subject list and each subject's block sections, so the create form can scope its section picker client-side.
     */
    public function createData(): array
    {
        $subjects = $this->subjectRepository->activeOrderedWithBlockSections();

        return [
            'subjects' => $subjects->map(fn ($s) => ['id' => $s->id, 'code' => $s->code, 'name' => $s->name])->values(),
            'subjectBlockSections' => $subjects->mapWithKeys(fn ($s) => [$s->id => $s->blockSections->values()]),
            'facultyUsers' => $this->userRepository->getFacultyUsers(),
        ];
    }

    /**
     * Creates a schedule for a subject. With no block sections selected, creates the subject's default schedule.
     * With one or more selected, creates one schedule row per section (all sharing the same days/time/room/code).
     * Rejects with an error array if any target (default or a selected section) already has a schedule for this subject.
     */
    public function store(array $data): array
    {
        $subjectId = $data['subject_id'];
        $blockSectionIds = $data['block_section_ids'] ?? [];

        if (empty($blockSectionIds)) {
            if ($this->scheduleRepository->hasDefaultSchedule($subjectId)) {
                return ['error_field' => 'block_section_ids', 'error_message' => 'This subject already has a default schedule. Edit it instead.'];
            }

            $this->scheduleRepository->createDefaultSchedule($subjectId, $data);

            return [];
        }

        $conflicts = $this->scheduleRepository->conflictingSchedules($subjectId, $blockSectionIds);

        if ($conflicts->isNotEmpty()) {
            $codes = $conflicts->pluck('blockSection.code')->filter()->implode(', ');

            return ['error_field' => 'block_section_ids', 'error_message' => "This subject already has a schedule for: {$codes}"];
        }

        DB::transaction(function () use ($subjectId, $blockSectionIds, $data) {
            $this->scheduleRepository->bulkCreateForSections($subjectId, $blockSectionIds, $data);
        });

        return [];
    }

    /**
     * Returns the schedule, the block sections eligible to be assigned to it (the subject's sections minus any
     * already claimed by one of the subject's other schedule rows), and whether "no section" (default) is still
     * available — so a conflict can't be submitted from this form.
     */
    public function editData(Schedule $schedule): array
    {
        $schedule = $this->scheduleRepository->findOrFail($schedule->id);
        $subject = $this->subjectRepository->withBlockSections($schedule->subject_id);

        $claimedSectionIds = $this->scheduleRepository
            ->conflictingSchedules($schedule->subject_id, $subject->blockSections->pluck('id')->all(), $schedule->id)
            ->pluck('block_section_id')
            ->all();

        return [
            'schedule' => $schedule,
            'blockSections' => $subject->blockSections->reject(
                fn ($section) => in_array($section->id, $claimedSectionIds, true)
            )->values(),
            'canUnassign' => ! $this->scheduleRepository->hasDefaultSchedule($schedule->subject_id, $schedule->id),
            'facultyUsers' => $this->userRepository->getFacultyUsers(),
        ];
    }

    /**
     * Updates a schedule's own days/time/room/code and which block section (if any) it belongs to.
     */
    public function update(Schedule $schedule, array $data): void
    {
        $this->scheduleRepository->update($schedule, [
            'days' => $data['days'],
            'time' => $data['time'],
            'room' => $data['room'] ?? null,
            'code' => $data['code'] ?? null,
            'block_section_id' => $data['block_section_id'] ?? null,
            'teacher_id' => $data['teacher_id'] ?? null,
        ]);
    }

    /**
     * Deletes a schedule row.
     */
    public function destroy(Schedule $schedule): void
    {
        $this->scheduleRepository->delete($schedule);
    }
}
