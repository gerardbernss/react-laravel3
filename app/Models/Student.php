<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Student extends Model
{
    use HasFactory;

    protected $fillable = [
        'student_id_number',
        'applicant_personal_data_id',
        'applicant_application_info_id',
        'enrollment_date',
        'enrollment_status',
        'portal_enrollment_date',
        'portal_username',
        'portal_access_active',
        'current_year_level',
        'current_semester',
        'current_school_year',
        'remarks',
    ];

    protected $casts = [
        'enrollment_date'        => 'datetime',
        'portal_enrollment_date' => 'datetime',
        'portal_access_active'   => 'boolean',
    ];

    /**
     * Relationships
     */
    public function personalData()
    {
        return $this->belongsTo(ApplicantPersonalData::class, 'applicant_personal_data_id');
    }

    public function application()
    {
        return $this->belongsTo(ApplicantApplicationInfo::class, 'applicant_application_info_id');
    }

    public function portalCredential()
    {
        return $this->hasOne(PortalCredential::class, 'applicant_personal_data_id', 'applicant_personal_data_id');
    }

    public function auditLogs()
    {
        return $this->hasMany(EnrollmentAuditLog::class);
    }

    public function assessments()
    {
        return $this->hasManyThrough(
            Assessment::class,
            ApplicantApplicationInfo::class,
            'applicant_personal_data_id',
            'applicant_application_info_id',
            'applicant_personal_data_id',
            'id'
        );
    }

    public function entranceExam()
    {
        return $this->hasOneThrough(
            EntranceExam::class,
            ApplicantApplicationInfo::class,
            'applicant_personal_data_id',
            'applicant_application_info_id',
            'applicant_personal_data_id',
            'id'
        );
    }

    /**
     * Scopes
     */
    public function scopeActive($query)
    {
        return $query->where('enrollment_status', 'Active');
    }

    public function scopePending($query)
    {
        return $query->where('enrollment_status', 'Pending');
    }

    public function scopeInactive($query)
    {
        return $query->where('enrollment_status', 'Inactive');
    }

    public function scopePortalAccessActive($query)
    {
        return $query->where('portal_access_active', true);
    }

    /**
     * Methods
     */
    public function activatePortalAccess()
    {
        $this->update([
            'portal_access_active'   => true,
            'portal_enrollment_date' => now(),
        ]);
    }

    public function deactivatePortalAccess()
    {
        $this->update([
            'portal_access_active' => false,
        ]);
    }

    public function completeEnrollment()
    {
        $this->update([
            'enrollment_status' => 'Active',
        ]);
    }
}
