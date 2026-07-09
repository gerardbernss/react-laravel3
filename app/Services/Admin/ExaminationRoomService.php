<?php

namespace App\Services\Admin;

use App\Models\ExaminationRoom;
use App\Repositories\ExaminationRoomRepository;

class ExaminationRoomService
{
    public function __construct(private ExaminationRoomRepository $examinationRoomRepository)
    {
    }

    /**
     * Creates a new examination room record.
     */
    public function create(array $data): ExaminationRoom
    {
        return $this->examinationRoomRepository->create($data);
    }

    /**
     * Updates an examination room record with the given data.
     */
    public function update(ExaminationRoom $room, array $data): void
    {
        $this->examinationRoomRepository->update($room, $data);
    }

    /**
     * Deletes an examination room, but blocks deletion if it is linked to any exam schedules.
     * Returns false if blocked, true on success.
     */
    public function delete(ExaminationRoom $room): bool
    {
        if ($this->examinationRoomRepository->hasExamSchedules($room)) {
            return false;
        }

        $this->examinationRoomRepository->delete($room);

        return true;
    }
}
