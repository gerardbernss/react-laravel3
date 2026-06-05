<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ApplicantExamResult extends Model
{
    protected $fillable = [
        'applicant_id',
        'applicant_personal_data_id',
        'applicant_number',
        'exam_date',
        'exam_time',
        'exam_venue',
        'math_score',
        'english_score',
        'science_score',
        'total_score',
        'percentage_score',
        'result',
        'ranking',
        'uploaded_by',
        'result_sent_at',
    ];

    protected $casts = [
        'exam_date'        => 'date',
        'result_sent_at'   => 'datetime',
        'math_score'       => 'decimal:2',
        'english_score'    => 'decimal:2',
        'science_score'    => 'decimal:2',
        'total_score'      => 'decimal:2',
        'percentage_score' => 'decimal:2',
    ];

    public function applicant()
    {
        return $this->belongsTo(Applicant::class);
    }

    public function personalData()
    {
        return $this->belongsTo(ApplicantPersonalData::class, 'applicant_personal_data_id');
    }

    public function uploadedBy()
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }
}
