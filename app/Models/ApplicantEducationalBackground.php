<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ApplicantEducationalBackground extends Model
{
    use HasFactory;

    protected $table = 'applicant_educational_background'; // If it doesn't have 's'

    protected $fillable = [
        // Application Information
        'applicant_application_info_id',
        'school_name',
        'school_address',
        'from_grade',
        'to_grade',
        'from_year',
        'to_year',
        'honors_awards',
        'general_average',
        'class_rank',
        'class_size',
    ];

    public function application()
    {
        return $this->belongsTo(ApplicantApplicationInfo::class, 'applicant_application_info_id');
    }

    protected $casts = [];

}
