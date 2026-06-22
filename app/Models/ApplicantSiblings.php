<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Siblings of an applicant who are currently enrolled in the same school.
 *
 * Many rows per ApplicantPersonalData. Used to determine eligibility for the
 * Sibling Discount: if the applicant has at least one sibling_id_number on
 * record (i.e. the sibling is an enrolled student), the Sibling Discount can
 * be applied to the assessment.
 *
 * Managed via a delete-and-recreate sync in ApplicantService::handleSiblings()
 * on every create/update cycle. This is simpler than diffing individual rows
 * because the form always submits the full sibling list.
 */
class ApplicantSiblings extends Model
{
    use HasFactory;

    protected $table = 'applicant_siblings'; // If it doesn't have 's'

    protected $fillable = [
        // Application Information
        'applicant_personal_data_id',
        'sibling_full_name',
        'sibling_grade_level',
        'sibling_id_number',
    ];

    public function personalData()
    {
        return $this->belongsTo(ApplicantPersonalData::class);
    }

    protected $casts = [];
}
