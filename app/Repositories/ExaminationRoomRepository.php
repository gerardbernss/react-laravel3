<?php

namespace App\Repositories;

use App\Models\ExaminationRoom;
use Illuminate\Database\Eloquent\Collection;

class ExaminationRoomRepository
{
    public function allOrdered(): Collection
    {
        return ExaminationRoom::orderBy('building')->orderBy('name')->get();
    }

    public function loadRecentExamSchedules(ExaminationRoom $room): ExaminationRoom
    {
        // Oracle does not support LIMIT inside eager load subqueries.
        // Load all schedules ordered by date, then trim to 10 on the collection.
        $room->load(['examSchedules' => function ($query) {
            $query->orderBy('exam_date', 'desc');
        }]);

        $room->setRelation('examSchedules', $room->examSchedules->take(10));

        return $room;
    }

    public function activeForDropdown(): Collection
    {
        return ExaminationRoom::active()
            ->orderBy('building')
            ->orderBy('name')
            ->get(['id', 'name', 'building', 'capacity', 'floor']);
    }

    public function activeOrderedByName(): Collection
    {
        return ExaminationRoom::active()->orderBy('name')->get(['id', 'name', 'building']);
    }

    public function hasExamSchedules(ExaminationRoom $room): bool
    {
        return $room->examSchedules()->count() > 0;
    }

    public function create(array $data): ExaminationRoom
    {
        return ExaminationRoom::create($data);
    }

    public function update(ExaminationRoom $room, array $data): void
    {
        $room->update($data);
    }

    public function delete(ExaminationRoom $room): void
    {
        $room->delete();
    }
}
