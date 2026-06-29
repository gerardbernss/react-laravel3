<?php

namespace App\Services\Admin;

use App\Models\ExaminationRoom;
use App\Repositories\ExaminationRoomRepository;

class ExaminationRoomService
{
    public function __construct(private ExaminationRoomRepository $examinationRoomRepository)
    {
    }

    public function create(array $data): ExaminationRoom
    {
        return $this->examinationRoomRepository->create($data);
    }

    public function update(ExaminationRoom $room, array $data): void
    {
        $this->examinationRoomRepository->update($room, $data);
    }

    public function delete(ExaminationRoom $room): bool
    {
        if ($this->examinationRoomRepository->hasExamSchedules($room)) {
            return false;
        }

        $this->examinationRoomRepository->delete($room);

        return true;
    }
}
