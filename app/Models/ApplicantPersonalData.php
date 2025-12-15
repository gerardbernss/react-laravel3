<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ApplicantPersonalData extends Model
{
    use HasFactory;

    protected $table    = 'applicant_personal_data'; // If it doesn't have 's'
    protected $fillable = [
        // Application Information
        'last_name',
        'first_name',
        'middle_name',
        'suffix',
        'learner_reference_number',
        'sex',
        'citizenship',
        'religion',
        'date_of_birth',
        'place_of_birth',
        'has_sibling',
        'email',
        'alt_email',
        'mobile_number',
        'present_street',
        'present_brgy',
        'present_city',
        'present_province',
        'present_zip',
        'permanent_street',
        'permanent_brgy',
        'permanent_city',
        'permanent_province',
        'permanent_zip',
        'stopped_studying',
        'accelerated',
        'health_conditions',

    ];

    protected $casts = ['health_conditions' => 'array', 'date_of_birth' => 'date'];

    public function student()
    {
        return $this->hasOne(Student::class, 'applicant_personal_data_id');
    }

    //1 student -> many applications
    public function applications()
    {
        return $this->hasMany(ApplicantApplicationInfo::class, 'applicant_personal_data_id');
    }

    public function familyBackground()
    {
        return $this->hasOne(ApplicantFamilyBackground::class, 'applicant_personal_data_id');
    }

    public function siblings()
    {
        return $this->hasMany(ApplicantSiblings::class, 'applicant_personal_data_id');
    }

}
