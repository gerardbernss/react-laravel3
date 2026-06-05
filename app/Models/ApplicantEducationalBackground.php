<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Records prior schooling history for an applicant (many per Applicant).
 *
 * Each row represents one school attended: the school name, address, grade
 * range, year range, and academic performance (general average, class rank).
 * The relationship is to Applicant (not ApplicantPersonalData) because the
 * educational background is specific to one application attempt — it may differ
 * if the same person re-applies for a different year level.
 *
 * On delete, these rows are removed by ApplicantController::destroy() before
 * the parent Applicant row is removed.
 */
class ApplicantEducationalBackground extends Model
{
    use HasFactory;

    protected $table = 'applicant_educational_background'; // If it doesn't have 's'

    protected $fillable = [
        // Application Information
        'applicant_id',
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
        return $this->belongsTo(Applicant::class, 'applicant_id');
    }

    protected $casts = [];

}
