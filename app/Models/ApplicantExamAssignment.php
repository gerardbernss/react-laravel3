<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ApplicantExamAssignment extends Model
{
    use HasFactory;

    protected $fillable = [
        'applicant_application_info_id',
        'exam_schedule_id',
        'seat_number',
        'status',
        'notes',
        'assigned_at',
        'confirmed_at',
    ];

    protected $casts = [
        'assigned_at' => 'datetime',
        'confirmed_at' => 'datetime',
    ];

    /**
     * Get the application info for this assignment.
     */
    public function applicationInfo(): BelongsTo
    {
        return $this->belongsTo(ApplicantApplicationInfo::class, 'applicant_application_info_id');
    }

    /**
     * Get the exam schedule for this assignment.
     */
    public function examSchedule(): BelongsTo
    {
        return $this->belongsTo(ExamSchedule::class);
    }

    /**
     * Scope for active assignments (not cancelled).
     */
    public function scopeActive($query)
    {
        return $query->whereNotIn('status', ['cancelled']);
    }

    /**
     * Scope by status.
     */
    public function scopeByStatus($query, $status)
    {
        return $query->where('status', $status);
    }
}
