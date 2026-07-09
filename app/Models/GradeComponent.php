<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class GradeComponent extends Model
{
    protected $fillable = [
        'subject_id',
        'block_section_id',
        'grading_quarter',
        'name',
        'hps',
        'weight',
        'order',
        'school_year',
        'created_by',
    ];

    protected $casts = [
        'hps' => 'float',
        'weight' => 'float',
        'order' => 'integer',
    ];

    /**
     * Get the subject this grade component belongs to.
     */
    public function subject(): BelongsTo
    {
        return $this->belongsTo(Subject::class);
    }

    /**
     * Get the block section this grade component is scoped to.
     */
    public function blockSection(): BelongsTo
    {
        return $this->belongsTo(BlockSection::class);
    }

    /**
     * Get the faculty user who created this grade component.
     */
    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get the raw scores entered for this component across all enrolled students.
     */
    public function rawScores(): HasMany
    {
        return $this->hasMany(StudentRawScore::class);
    }

    /**
     * Scope to components for a specific grading quarter (e.g. "Q1").
     */
    public function scopeForQuarter($query, string $quarter)
    {
        return $query->where('grading_quarter', $quarter);
    }

    /**
     * Scope to components belonging to a specific subject and block section combination.
     */
    public function scopeForSubjectSection($query, int $subjectId, int $blockSectionId)
    {
        return $query->where('subject_id', $subjectId)
                     ->where('block_section_id', $blockSectionId);
    }
}
