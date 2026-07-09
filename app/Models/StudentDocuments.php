<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StudentDocuments extends Model
{
    use HasFactory;

    protected $table = 'student_documents';

    protected $fillable = [
        'student_personal_data_id',
        'certificate_of_enrollment',
        'birth_certificate',
        'latest_report_card_front',
        'latest_report_card_back',
    ];

    /**
     * Get the student personal data record these documents belong to.
     */
    public function studentPersonalData(): BelongsTo
    {
        return $this->belongsTo(StudentPersonalData::class, 'student_personal_data_id');
    }
}
