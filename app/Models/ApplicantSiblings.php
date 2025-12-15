<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

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

    // Optional: Add accessors for full name
    // public function getFullNameAttribute(): string
    // {
    //    return trim("{$this->first_name} {$this->middle_name} {$this->last_name} {$this->suffix}");
    // }
}
