<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * The master identity record for a person in the admissions system.
 *
 * One physical person = one ApplicantPersonalData row, regardless of how many
 * times they apply. Each application is a separate Applicant row linked here
 * via applicant_personal_data_id.
 *
 * The same row is also the anchor for:
 *   - ApplicantFamilyBackground (1-to-1)
 *   - ApplicantSiblings (1-to-many)
 *   - PortalCredential (1-to-1) — the student portal login
 *   - Student (1-to-1) — created when the applicant is enrolled
 *
 * health_conditions is stored as JSON and cast to array. The form may submit
 * null or empty-string items; normalise with formatHealthConditions() before
 * saving (see ApplicationController).
 *
 * When deleting an applicant via ApplicantController::destroy(), this row is
 * only deleted when no other Applicant rows reference it (i.e. the person has
 * no other active applications).
 */
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

    protected $casts = ['health_conditions' => 'array', 'date_of_birth' => 'date'];

    /**
     * Get the enrolled student record created from this person's personal data.
     */
    public function student()
    {
        return $this->hasOne(Student::class, 'applicant_personal_data_id');
    }

    /**
     * Get all application records for this person — one per school year they applied.
     */
    public function applications()
    {
        return $this->hasMany(Applicant::class, 'applicant_personal_data_id');
    }

    /**
     * Get the family background record for this person.
     */
    public function familyBackground()
    {
        return $this->hasOne(ApplicantFamilyBackground::class, 'applicant_personal_data_id');
    }

    /**
     * Get the sibling records for this person.
     */
    public function siblings()
    {
        return $this->hasMany(ApplicantSiblings::class, 'applicant_personal_data_id');
    }

    /**
     * Get the student portal credential tied to this person's identity.
     */
    public function portalCredential()
    {
        return $this->hasOne(PortalCredential::class, 'applicant_personal_data_id');
    }
}
