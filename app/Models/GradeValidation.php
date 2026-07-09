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

    /**
     * Get the block section this grade validation is for.
     */
    public function blockSection(): BelongsTo
    {
        return $this->belongsTo(BlockSection::class);
    }

    /**
     * Get the subject this grade validation is for.
     */
    public function subject(): BelongsTo
    {
        return $this->belongsTo(Subject::class);
    }

    /**
     * Get the faculty user who submitted grades for validation.
     */
    public function submittedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'submitted_by');
    }

    /**
     * Get the admin who finalized (approved or rejected) the grade validation.
     */
    public function finalizedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'finalized_by');
    }

    /**
     * Scope to the validation record for a specific subject, section, and grading quarter.
     */
    public function scopeForSubjectSectionQuarter($query, int $subjectId, int $blockSectionId, string $quarter)
    {
        return $query->where('subject_id', $subjectId)
                     ->where('block_section_id', $blockSectionId)
                     ->where('grading_quarter', $quarter);
    }

    /**
     * Return true if the grades are still in draft and have not yet been submitted.
     */
    public function isDraft(): bool
    {
        return $this->status === 'draft';
    }

    /**
     * Return true if grades have been submitted and are awaiting admin finalization.
     */
    public function isSubmitted(): bool
    {
        return $this->status === 'submitted';
    }

    /**
     * Return true if the validation has been finalized (approved) by an admin.
     */
    public function isFinalized(): bool
    {
        return $this->status === 'finalized';
    }

    /**
     * Return true if grades are locked (finalized), preventing further faculty edits.
     */
    public function isLocked(): bool
    {
        return $this->status === 'finalized';
    }
}
