<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class StudentPersonalData extends Model
{
    use HasFactory;

    protected $table = 'student_personal_data';

    protected $fillable = [
        'last_name',
        'first_name',
        'middle_name',
        'suffix',
        'learner_reference_number',
        'gender',
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
        'has_doctors_note',
        'doctors_note_file',
    ];

    protected $casts = [
        'health_conditions' => 'array',
        'date_of_birth'     => 'date',
        'has_sibling'       => 'boolean',
        'has_doctors_note'  => 'boolean',
    ];

    public function student(): HasOne
    {
        return $this->hasOne(Student::class, 'student_personal_data_id');
    }

    public function familyBackground(): HasOne
    {
        return $this->hasOne(StudentFamilyBackground::class, 'student_personal_data_id');
    }

    public function siblings(): HasMany
    {
        return $this->hasMany(StudentSiblings::class, 'student_personal_data_id');
    }

    public function documents(): HasOne
    {
        return $this->hasOne(StudentDocuments::class, 'student_personal_data_id');
    }

    /**
     * Full name accessor.
     */
    public function getFullNameAttribute(): string
    {
        return trim("{$this->first_name} {$this->middle_name} {$this->last_name}" . ($this->suffix ? ", {$this->suffix}" : ''));
    }
}
