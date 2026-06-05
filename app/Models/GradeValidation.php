<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GradeValidation extends Model
{
    protected $fillable = [
        'block_section_id',
        'subject_id',
        'grading_quarter',
        'school_year',
        'status',
        'submitted_at',
        'submitted_by',
        'finalized_at',
        'finalized_by',
        'rejection_reason',
    ];

    protected $casts = [
        'submitted_at' => 'datetime',
        'finalized_at' => 'datetime',
    ];

    public function blockSection(): BelongsTo
    {
        return $this->belongsTo(BlockSection::class);
    }

    public function subject(): BelongsTo
    {
        return $this->belongsTo(Subject::class);
    }

    public function submittedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'submitted_by');
    }

    public function finalizedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'finalized_by');
    }

    public function scopeForSubjectSectionQuarter($query, int $subjectId, int $blockSectionId, string $quarter)
    {
        return $query->where('subject_id', $subjectId)
                     ->where('block_section_id', $blockSectionId)
                     ->where('grading_quarter', $quarter);
    }

    public function isDraft(): bool
    {
        return $this->status === 'draft';
    }

    public function isSubmitted(): bool
    {
        return $this->status === 'submitted';
    }

    public function isFinalized(): bool
    {
        return $this->status === 'finalized';
    }

    public function isLocked(): bool
    {
        return $this->status === 'finalized';
    }
}
