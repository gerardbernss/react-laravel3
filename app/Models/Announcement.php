<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Announcement extends Model
{
    use HasFactory;

    protected $primaryKey = 'announcement_id';

    protected $fillable = [
        'title',
        'content',
        'attachment',
        'publish_start',
        'publish_end',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'publish_start' => 'datetime',
        'publish_end'   => 'datetime',
    ];

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updater()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    /**
     * Computed publish status.
     * draft     — no dates set
     * scheduled — publish_start is in the future
     * active    — currently within the publish window
     * expired   — publish_end is in the past
     */
    public function getStatusAttribute(): string
    {
        $now = now();

        if (! $this->publish_start && ! $this->publish_end) {
            return 'draft';
        }

        if ($this->publish_start && $this->publish_start->gt($now)) {
            return 'scheduled';
        }

        if ($this->publish_end && $this->publish_end->lt($now)) {
            return 'expired';
        }

        return 'active';
    }
}
