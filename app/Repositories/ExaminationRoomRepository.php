<?php

namespace App\Repositories;

use App\Models\ExaminationRoom;
use Illuminate\Database\Eloquent\Collection;

class ExaminationRoomRepository
{
    /**
     * Returns all examination rooms ordered by building then room name.
     */
    public function allOrdered(): Collection
    {
        return ExaminationRoom::orderBy('building')->orderBy('name')->get();
    }

    /**
     * Loads the room's 10 most recent exam schedules ordered by date descending.
     * All schedules are loaded first then trimmed in PHP because Oracle rejects LIMIT inside eager-load subqueries.
     */
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

    /**
     * Returns active rooms with only the fields needed for dropdowns (id, name, building, capacity, floor), ordered by building then name.
     */
    public function activeForDropdown(): Collection
    {
        return ExaminationRoom::active()
            ->orderBy('building')
            ->orderBy('name')
            ->get(['id', 'name', 'building', 'capacity', 'floor']);
    }

    /**
     * Returns active rooms ordered by name with only id, name, and building selected — used for lighter exam schedule assignment lists.
     */
    public function activeOrderedByName(): Collection
    {
        return ExaminationRoom::active()->orderBy('name')->get(['id', 'name', 'building']);
    }

    /**
     * Returns true if the room has any exam schedules assigned — used to prevent deletion of rooms that are in use.
     */
    public function hasExamSchedules(ExaminationRoom $room): bool
    {
        return $room->examSchedules()->count() > 0;
    }

    /**
     * Creates and returns a new examination room record.
     */
    public function create(array $data): ExaminationRoom
    {
        return ExaminationRoom::create($data);
    }

    /**
     * Updates the given examination room with the supplied data.
     */
    public function update(ExaminationRoom $room, array $data): void
    {
        $room->update($data);
    }

    /**
     * Deletes the given examination room record.
     */
    public function delete(ExaminationRoom $room): void
    {
        $room->delete();
    }
}
