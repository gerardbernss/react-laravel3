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

    public function subject(): BelongsTo
    {
        return $this->belongsTo(Subject::class);
    }

    public function blockSection(): BelongsTo
    {
        return $this->belongsTo(BlockSection::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function rawScores(): HasMany
    {
        return $this->hasMany(StudentRawScore::class);
    }

    public function scopeForQuarter($query, string $quarter)
    {
        return $query->where('grading_quarter', $quarter);
    }

    public function scopeForSubjectSection($query, int $subjectId, int $blockSectionId)
    {
        return $query->where('subject_id', $subjectId)
                     ->where('block_section_id', $blockSectionId);
    }
}
