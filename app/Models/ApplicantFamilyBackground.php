<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ApplicantFamilyBackground extends Model
{
    use HasFactory;

    protected $table    = 'applicant_family_background'; // If it doesn't have 's'
    protected $fillable = [
        // Application Information
        'applicant_personal_data_id',
        'father_lname',
        'father_fname',
        'father_mname',
        'father_living',
        'father_citizenship',
        'father_religion',
        'father_highest_educ',
        'father_occupation',
        'father_income',
        'father_business_emp',
        'father_business_address',
        'father_contact_no',
        'father_email',
        'father_slu_employee',
        'father_slu_dept',

        'mother_lname',
        'mother_fname',
        'mother_mname',
        'mother_living',
        'mother_citizenship',
        'mother_religion',
        'mother_highest_educ',
        'mother_occupation',
        'mother_income',
        'mother_business_emp',
        'mother_business_address',
        'mother_contact_no',
        'mother_email',
        'mother_slu_employee',
        'mother_slu_dept',

        'guardian_lname',
        'guardian_fname',
        'guardian_mname',
        'guardian_relationship',
        'guardian_citizenship',
        'guardian_religion',
        'guardian_highest_educ',
        'guardian_occupation',
        'guardian_income',
        'guardian_business_emp',
        'guardian_business_address',
        'guardian_contact_no',
        'guardian_email',
        'guardian_slu_employee',
        'guardian_slu_dept',

        'emergency_contact_name',
        'emergency_relationship',
        'emergency_email',
        'emergency_home_phone',
        'emergency_mobile_phone',

    ];

    public function personalData()
    {
        return $this->belongsTo(ApplicantPersonalData::class, 'applicant_personal_data_id');
    }

    protected $casts = [];

    // Optional: Add accessors for full name
    // public function getFullNameAttribute(): string
    // {
    //    return trim("{$this->first_name} {$this->middle_name} {$this->last_name} {$this->suffix}");
    // }
}
