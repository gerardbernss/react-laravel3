<?php

namespace App\Repositories;

use App\Models\Schedule;

class ScheduleRepository
{
    public function createDefaultSchedule(int $subjectId, array $data): Schedule
    {
        return Schedule::create([
            'subject_id' => $subjectId,
            'block_section_id' => null,
            'days' => $data['days'],
            'time' => $data['time'],
            'room' => $data['room'] ?? null,
        ]);
    }

    public function upsertDefaultSchedule(int $subjectId, array $data): Schedule
    {
        return Schedule::updateOrCreate(
            ['subject_id' => $subjectId, 'block_section_id' => null],
            ['days' => $data['days'], 'time' => $data['time'], 'room' => $data['room'] ?? null]
        );
    }

    public function deleteDefaultSchedule(int $subjectId): void
    {
        Schedule::where('subject_id', $subjectId)->whereNull('block_section_id')->delete();
    }

    public function createSectionSchedule(array $data): void
    {
        Schedule::create($data);
    }
}
