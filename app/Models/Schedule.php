<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Schedule extends Model
{
    protected $fillable = [
        'subject_id',
        'block_section_id',
        'days',
        'time',
        'room',
    ];

    protected $appends = ['display'];

    public function subject(): BelongsTo
    {
        return $this->belongsTo(Subject::class);
    }

    public function blockSection(): BelongsTo
    {
        return $this->belongsTo(BlockSection::class);
    }

    /**
     * Returns a human-readable string like "MWF 07:30-08:30".
     */
    public function getDisplayAttribute(): string
    {
        return "{$this->days} {$this->time}";
    }
}
