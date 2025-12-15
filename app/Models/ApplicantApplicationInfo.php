<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ApplicantApplicationInfo extends Model
{
    use HasFactory;

    protected $table    = 'applicant_application_info';
    protected $fillable = [
        // Application Information
        'applicant_personal_data_id',
        'application_status',
        'application_number',
        'application_date',
        'year_level',
        'semester',
        'student_category',
        'strand',
        'classification',
        'learning_mode',
        'accomplished_by_name',

        'examination_date',
        'student_id_number',
        'application_type',
        'remarks',
    ];

    public static $statuses = [
        'Pending',
        'Exam Taken',
        'Enrolled',
    ];
    protected $casts = ['application_date' => 'date', 'examination_date' => 'date'];

    public function personalData()
    {
        return $this->belongsTo(ApplicantPersonalData::class, 'applicant_personal_data_id');
    }

    public function educationalBackground()
    {
        return $this->hasMany(ApplicantEducationalBackground::class, 'applicant_application_info_id');
    }

    public function documents()
    {
        return $this->hasOne(ApplicantDocuments::class, 'applicant_application_info_id');
    }

}
