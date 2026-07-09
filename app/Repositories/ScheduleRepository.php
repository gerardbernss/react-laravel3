<?php

namespace App\Repositories;

use App\Models\BlockSection;
use App\Models\Schedule;
use Illuminate\Database\Eloquent\Collection;

class ScheduleRepository
{
    /**
     * Creates a default schedule for a subject (no block section) with the given days, time, and optional room.
     */
    public function createDefaultSchedule(int $subjectId, array $data): Schedule
    {
        return Schedule::create([
            'subject_id' => $subjectId,
            'block_section_id' => null,
            'days' => $data['days'],
            'time' => $data['time'],
            'room' => $data['room'] ?? null,
            'teacher_id' => $data['teacher_id'] ?? null,
        ]);
    }

    /**
     * Creates a section-specific schedule row linking a subject to a particular block section.
     */
    public function createSectionSchedule(array $data): void
    {
        Schedule::create($data);
    }

    /**
     * Returns all schedules with their subject and block section loaded, optionally filtered to one subject.
     */
    public function allWithSubjectAndSection(?int $subjectId = null): Collection
    {
        return Schedule::with(['subject', 'blockSection', 'teacher'])
            ->when($subjectId, fn ($q) => $q->where('subject_id', $subjectId))
            ->orderBy('subject_id')
            ->get();
    }

    /**
     * Finds a schedule by id with its subject, block section, and teacher loaded, or fails.
     */
    public function findOrFail(int $id): Schedule
    {
        return Schedule::with(['subject', 'blockSection', 'teacher'])->findOrFail($id);
    }

    /**
     * Returns all schedules where the given user is the assigned teacher, with subject and block section loaded.
     */
    public function forTeacher(int $userId): Collection
    {
        return Schedule::with(['subject', 'blockSection'])
            ->where('teacher_id', $userId)
            ->get();
    }

    /**
     * Returns the existing schedules for a subject that already occupy any of the given block sections — used to block conflicting assignments before they violate the unique constraint.
     */
    public function conflictingSchedules(int $subjectId, array $blockSectionIds, ?int $excludeScheduleId = null): Collection
    {
        return Schedule::with('blockSection')
            ->where('subject_id', $subjectId)
            ->whereIn('block_section_id', $blockSectionIds)
            ->when($excludeScheduleId, fn ($q) => $q->where('id', '!=', $excludeScheduleId))
            ->get();
    }

    /**
     * Returns true if the subject already has a default schedule (no block section).
     */
    public function hasDefaultSchedule(int $subjectId, ?int $excludeScheduleId = null): bool
    {
        return Schedule::where('subject_id', $subjectId)
            ->whereNull('block_section_id')
            ->when($excludeScheduleId, fn ($q) => $q->where('id', '!=', $excludeScheduleId))
            ->exists();
    }

    /**
     * Creates one schedule row per given block section, all sharing the same days/time/room/code.
     */
    public function bulkCreateForSections(int $subjectId, array $blockSectionIds, array $data): void
    {
        foreach ($blockSectionIds as $blockSectionId) {
            Schedule::create([
                'subject_id' => $subjectId,
                'block_section_id' => $blockSectionId,
                'days' => $data['days'],
                'time' => $data['time'],
                'room' => $data['room'] ?? null,
                'code' => $data['code'] ?? null,
                'teacher_id' => $data['teacher_id'] ?? null,
            ]);
        }
    }

    /**
     * Updates a schedule's own fields (days, time, room, code, and/or which block section it belongs to).
     */
    public function update(Schedule $schedule, array $data): void
    {
        $schedule->update($data);
    }

    /**
     * Deletes a schedule row.
     */
    public function delete(Schedule $schedule): void
    {
        $schedule->delete();
    }

    /**
     * Deletes this section's schedule rows for subjects no longer attached to it.
     */
    public function pruneForRemovedSubjects(BlockSection $blockSection, array $subjectIds): void
    {
        Schedule::where('block_section_id', $blockSection->id)
            ->when(! empty($subjectIds), fn ($q) => $q->whereNotIn('subject_id', $subjectIds))
            ->delete();
    }
}
