<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Stores the file paths for documents uploaded during an application.
 *
 * One row per Applicant (1-to-1). Each field holds a relative path within the
 * public storage disk (e.g. "documents/birth_certificates/123_DOE_JOHN.pdf").
 * Files are served via the /view-document/{base64path} route in web.php and
 * deleted from disk in ApplicantController::destroy() before the DB row is removed.
 *
 * Fields store paths only — never binary content. Use Storage::disk('public')
 * to read or delete the actual files.
 */
class ApplicantDocuments extends Model
{
    use HasFactory;

    protected $table = 'applicant_documents'; // If it doesn't have 's'

    protected $fillable = [
        // Application Information
        'applicant_id',
        'certificate_of_enrollment',
        'birth_certificate',
        'latest_report_card_front',
        'latest_report_card_back',
    ];

    public function application()
    {
        return $this->belongsTo(Applicant::class, 'applicant_id');
    }

    protected $casts = [];
}
