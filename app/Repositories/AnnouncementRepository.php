<?php

namespace App\Repositories;

use App\Models\Announcement;
use Illuminate\Database\Eloquent\Collection;

class AnnouncementRepository
{
    /**
     * Returns all announcements with their creator user eager-loaded, newest first.
     */
    public function getAllWithCreatorOrderedByLatest(): Collection
    {
        return Announcement::with('creator')
            ->orderByDesc('created_at')
            ->get();
    }

    /**
     * Returns currently published announcements targeted at the given audience (e.g. "students", "applicants") or "all", newest first.
     * An announcement is active if it is within its publish_start/publish_end window (null bounds are treated as open-ended).
     */
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

    /**
     * Creates and returns a new announcement record.
     */
    public function create(array $data): Announcement
    {
        return Announcement::create($data);
    }

    /**
     * Updates the given announcement with the supplied data.
     */
    public function update(Announcement $announcement, array $data): void
    {
        $announcement->update($data);
    }

    /**
     * Deletes the given announcement record.
     */
    public function delete(Announcement $announcement): void
    {
        $announcement->delete();
    }
}
