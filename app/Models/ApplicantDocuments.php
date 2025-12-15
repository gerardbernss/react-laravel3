<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ApplicantDocuments extends Model
{
    use HasFactory;

    protected $table = 'applicant_documents'; // If it doesn't have 's'

    protected $fillable = [
        // Application Information
        'applicant_application_info_id',
        'certificate_of_enrollment',
        'birth_certificate',
        'latest_report_card_front',
        'latest_report_card_back',
    ];

    public function application()
    {
        return $this->belongsTo(ApplicantApplicationInfo::class, 'applicant_application_info_id');
    }

    protected $casts = [];

    // Optional: Add accessors for full name
    // public function getFullNameAttribute(): string
    // {
    //    return trim("{$this->first_name} {$this->middle_name} {$this->last_name} {$this->suffix}");
    // }
}
