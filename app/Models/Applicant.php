<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Applicant extends Model
{
    use HasFactory;

    protected $fillable = [
        // Application Information
        'application_date',
        'prio_no',
        'business_unit',
        'campus_site',
        'entry_class',
        'stud_batch',
        'semester',
        'schedule_pref',
        'pchoice1',
        'pchoice2',
        'pchoice3',
        'curr_code',
        'year_level',

        // Personal Information
        'lrn',
        'first_name',
        'middle_name',
        'last_name',
        'suffix',
        'gender',
        'citizenship',
        'religion',
        'date_of_birth',
        'place_of_birth',
        'civil_status',
        'birth_order',
        'mother_tongue',
        'ethnicity',

        // Contact Information
        'phone',
        'email',
        'street',
        'brgy',
        'city',
        'state',
        'zip_code',
        'father_name',
        'father_number',
        'mother_name',
        'mother_number',
        'emergency_contact_name',
        'emergency_contact_number',

        // Other Information
        'financial_source',
        'exam_schedule',
    ];

    protected $casts = [
        'application_date' => 'date',
        'date_of_birth' => 'date',
        'exam_schedule' => 'date',
    ];

    // Optional: Add accessors for full name
    public function getFullNameAttribute(): string
    {
        return trim("{$this->first_name} {$this->middle_name} {$this->last_name} {$this->suffix}");
    }
}
