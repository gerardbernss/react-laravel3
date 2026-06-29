<?php

namespace App\Repositories;

use App\Models\Announcement;
use Illuminate\Database\Eloquent\Collection;

class AnnouncementRepository
{
    public function getAllWithCreatorOrderedByLatest(): Collection
    {
        return Announcement::with('creator')
            ->orderByDesc('created_at')
            ->get();
    }

    public function getActiveForAudience(string $audience): Collection
    {
        $now = now();

        return Announcement::where(function ($q) use ($now) {
            $q->whereNull('publish_start')->orWhere('publish_start', '<=', $now);
        })
            ->where(function ($q) use ($now) {
                $q->whereNull('publish_end')->orWhere('publish_end', '>=', $now);
            })
            ->whereIn('target_audience', ['all', $audience])
            ->orderByDesc('publish_start')
            ->get(['announcement_id', 'title', 'content', 'attachment', 'publish_start']);
    }

    public function create(array $data): Announcement
    {
        return Announcement::create($data);
    }

    public function update(Announcement $announcement, array $data): void
    {
        $announcement->update($data);
    }

    public function delete(Announcement $announcement): void
    {
        $announcement->delete();
    }
}
