<?php

namespace App\Services\Admin;

use App\Models\Subject;
use App\Repositories\ScheduleRepository;
use App\Repositories\SubjectRepository;
use Illuminate\Support\Facades\DB;

class SubjectService
{
    public function __construct(
        private SubjectRepository $subjectRepository,
        private ScheduleRepository $scheduleRepository,
    ) {
    }

    public function create(array $data): Subject
    {
        return DB::transaction(function () use ($data) {
            $subject = $this->subjectRepository->create(collect($data)->except(['days', 'time', 'room'])->toArray());

            if (! empty($data['days']) && ! empty($data['time'])) {
                $this->scheduleRepository->createDefaultSchedule($subject->id, $data);
            }

            return $subject;
        });
    }

    public function update(Subject $subject, array $data): void
    {
        DB::transaction(function () use ($subject, $data) {
            $this->subjectRepository->update($subject, collect($data)->except(['days', 'time', 'room'])->toArray());

            if (! empty($data['days']) && ! empty($data['time'])) {
                $this->scheduleRepository->upsertDefaultSchedule($subject->id, $data);
            } else {
                $this->scheduleRepository->deleteDefaultSchedule($subject->id);
            }
        });
    }

    public function delete(Subject $subject): bool
    {
        if ($this->subjectRepository->hasBlockSections($subject)) {
            return false;
        }

        $this->subjectRepository->delete($subject);

        return true;
    }

    public function toggleStatus(Subject $subject): void
    {
        $this->subjectRepository->update($subject, ['is_active' => ! $subject->is_active]);
    }
}
