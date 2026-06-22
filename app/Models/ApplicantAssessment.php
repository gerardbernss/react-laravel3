<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ApplicantAssessment extends Model
{
    protected $fillable = [
        'applicant_id',
        'assessment_number',
        'school_year',
        'semester',
        'total_tuition',
        'total_misc_fees',
        'total_lab_fees',
        'total_other_fees',
        'gross_amount',
        'total_discounts',
        'net_amount',
        'minimum_amount',
        'mode_of_payment',
        'status',
        'generated_at',
    ];

    protected $casts = [
        'generated_at'    => 'datetime',
        'total_tuition'   => 'float',
        'total_misc_fees' => 'float',
        'total_lab_fees'  => 'float',
        'total_other_fees'=> 'float',
        'gross_amount'    => 'float',
        'total_discounts' => 'float',
        'net_amount'      => 'float',
        'minimum_amount'  => 'float',
    ];

    public function applicant()
    {
        return $this->belongsTo(Applicant::class);
    }

    public function subjects()
    {
        return $this->hasMany(ApplicantAssessmentSubject::class);
    }

    public static function generateAssessmentNumber(string $schoolYear): string
    {
        $year = str_replace('-', '', $schoolYear);
        $last = static::where('assessment_number', 'like', "APP-{$year}-%")->max('assessment_number');
        $next = $last ? (int) substr($last, -5) + 1 : 1;
        return 'APP-' . $year . '-' . str_pad($next, 5, '0', STR_PAD_LEFT);
    }
}
