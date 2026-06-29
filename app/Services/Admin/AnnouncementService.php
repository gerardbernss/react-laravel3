<?php

namespace App\Services\Admin;

use App\Models\Announcement;
use App\Repositories\AnnouncementRepository;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Collection;

class AnnouncementService
{
    public function __construct(private AnnouncementRepository $announcementRepository)
    {
    }

    public function list(): Collection
    {
        return $this->announcementRepository->getAllWithCreatorOrderedByLatest()
            ->map(fn ($a) => array_merge($a->toArray(), ['status' => $a->status]));
    }

    public function withStatus(Announcement $announcement): array
    {
        return array_merge($announcement->toArray(), ['status' => $announcement->status]);
    }

    public function create(array $data, ?UploadedFile $attachment, ?int $userId): Announcement
    {
        if ($attachment) {
            $data['attachment'] = $attachment->store('announcements', 'public');
        }

        $data['created_by'] = $userId;
        $data['updated_by'] = $userId;

        return $this->announcementRepository->create($data);
    }

    public function update(Announcement $announcement, array $data, ?UploadedFile $attachment, ?int $userId): void
    {
        if ($attachment) {
            if ($announcement->attachment) {
                Storage::disk('public')->delete($announcement->attachment);
            }
            $data['attachment'] = $attachment->store('announcements', 'public');
        } else {
            unset($data['attachment']);
        }

        $data['updated_by'] = $userId;

        $this->announcementRepository->update($announcement, $data);
    }

    public function delete(Announcement $announcement): void
    {
        if ($announcement->attachment) {
            Storage::disk('public')->delete($announcement->attachment);
        }

        $this->announcementRepository->delete($announcement);
    }
}
