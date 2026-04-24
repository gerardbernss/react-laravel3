<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StudentFamilyBackground extends Model
{
    use HasFactory;

    protected $table = 'student_family_background';

    protected $fillable = [
        'student_personal_data_id',
        // Father
        'father_lname', 'father_fname', 'father_mname', 'father_living',
        'father_citizenship', 'father_religion', 'father_highest_educ',
        'father_occupation', 'father_income', 'father_business_emp',
        'father_business_address', 'father_contact_no', 'father_email',
        'father_slu_employee', 'father_slu_dept',
        // Mother
        'mother_lname', 'mother_fname', 'mother_mname', 'mother_living',
        'mother_citizenship', 'mother_religion', 'mother_highest_educ',
        'mother_occupation', 'mother_income', 'mother_business_emp',
        'mother_business_address', 'mother_contact_no', 'mother_email',
        'mother_slu_employee', 'mother_slu_dept',
        // Guardian
        'guardian_lname', 'guardian_fname', 'guardian_mname', 'guardian_relationship',
        'guardian_citizenship', 'guardian_religion', 'guardian_highest_educ',
        'guardian_occupation', 'guardian_income', 'guardian_business_emp',
        'guardian_business_address', 'guardian_contact_no', 'guardian_email',
        'guardian_slu_employee', 'guardian_slu_dept',
        // Emergency contact
        'emergency_contact_name', 'emergency_relationship', 'emergency_email',
        'emergency_home_phone', 'emergency_mobile_phone',
    ];

    protected $casts = [
        'father_slu_employee'   => 'boolean',
        'mother_slu_employee'   => 'boolean',
        'guardian_slu_employee' => 'boolean',
    ];

    public function studentPersonalData(): BelongsTo
    {
        return $this->belongsTo(StudentPersonalData::class, 'student_personal_data_id');
    }
}
