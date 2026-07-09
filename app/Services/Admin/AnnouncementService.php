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

    /**
     * Returns all announcements (newest first), each with creator info and a computed status field.
     */
    public function list(): Collection
    {
        return $this->announcementRepository->getAllWithCreatorOrderedByLatest()
            ->map(fn ($a) => array_merge($a->toArray(), ['status' => $a->status]));
    }

    /**
     * Returns the announcement as an array with the computed status field included.
     */
    public function withStatus(Announcement $announcement): array
    {
        return array_merge($announcement->toArray(), ['status' => $announcement->status]);
    }

    /**
     * Creates a new announcement. Uploads the file to public storage first if one is provided.
     *
     * @param  int|null  $userId  The ID of the user creating the announcement
     */
    public function create(array $data, ?UploadedFile $attachment, ?int $userId): Announcement
    {
        if ($attachment) {
            $data['attachment'] = $attachment->store('announcements', 'public');
        }

        $data['created_by'] = $userId;
        $data['updated_by'] = $userId;

        return $this->announcementRepository->create($data);
    }

    /**
     * Updates an announcement. If a new file is given, the old one is deleted from storage and replaced.
     *
     * @param  int|null  $userId  The ID of the user making the update
     */
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

    /**
     * Deletes an announcement and removes its attached file from storage if one exists.
     */
    public function delete(Announcement $announcement): void
    {
        if ($announcement->attachment) {
            Storage::disk('public')->delete($announcement->attachment);
        }

        $this->announcementRepository->delete($announcement);
    }
}
