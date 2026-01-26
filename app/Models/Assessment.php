<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Assessment extends Model
{
    use HasFactory;

    protected $fillable = [
        'applicant_application_info_id',
        'applicant_personal_data_id',
        'assessment_type',
        'assessment_date',
        'assessment_status',
        'score',
        'total_score',
        'assessor_remarks',
        'assessed_by',
        'feedback',
        'result',
    ];

    protected $casts = [
        'assessment_date' => 'datetime',
        'score'           => 'decimal:2',
        'total_score'     => 'decimal:2',
    ];

    /**
     * Relationships
     */
    public function application()
    {
        return $this->belongsTo(ApplicantApplicationInfo::class, 'applicant_application_info_id');
    }

    public function personalData()
    {
        return $this->belongsTo(ApplicantPersonalData::class, 'applicant_personal_data_id');
    }

    /**
     * Scopes
     */
    public function scopePending($query)
    {
        return $query->where('assessment_status', 'Pending');
    }

    public function scopeCompleted($query)
    {
        return $query->where('assessment_status', 'Completed');
    }

    public function scopePassed($query)
    {
        return $query->where('result', 'Pass');
    }

    public function scopeFailed($query)
    {
        return $query->where('result', 'Fail');
    }

    /**
     * Calculate percentage score
     */
    public function getScorePercentageAttribute()
    {
        if ($this->total_score == 0) {
            return 0;
        }
        return round(($this->score / $this->total_score) * 100, 2);
    }
}
