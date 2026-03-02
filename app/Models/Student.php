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

    public function enrollments()
    {
        return $this->hasMany(StudentEnrollment::class);
    }

    /**
     * Get complete enrollment history with subjects
     */
    public function getEnrollmentHistory()
    {
        return $this->enrollments()
            ->with(['enrollmentSubjects.subject', 'blockSection'])
            ->orderBy('school_year', 'desc')
            ->orderByRaw("FIELD(semester, 'Summer', 'Second', 'First')")
            ->get();
    }

    /**
     * Get enrollment for a specific semester
     */
    public function getEnrollmentFor(string $schoolYear, string $semester)
    {
        return $this->enrollments()
            ->where('school_year', $schoolYear)
            ->where('semester', $semester)
            ->with(['enrollmentSubjects.subject', 'blockSection'])
            ->first();
    }

    /**
     * Get all subjects ever taken by this student
     */
    public function getAllSubjectsTaken()
    {
        return StudentEnrollmentSubject::whereHas('enrollment', function ($query) {
            $query->where('student_id', $this->id);
        })->with('subject')->get();
    }

    /**
     * Check if student has taken a specific subject
     */
    public function hasTakenSubject(int $subjectId): bool
    {
        return StudentEnrollmentSubject::whereHas('enrollment', function ($query) {
            $query->where('student_id', $this->id);
        })->where('subject_id', $subjectId)->exists();
    }

    /**
     * Get cumulative GWA across all enrollments
     */
    public function getCumulativeGWA(): ?float
    {
        $enrollments = $this->enrollments()
            ->whereNotNull('gwa')
            ->where('status', 'Completed')
            ->get();

        if ($enrollments->isEmpty()) {
            return null;
        }

        $totalWeightedGWA = 0;
        $totalUnits = 0;

        foreach ($enrollments as $enrollment) {
            $totalWeightedGWA += $enrollment->gwa * $enrollment->total_units;
            $totalUnits += $enrollment->total_units;
        }

        if ($totalUnits === 0) {
            return null;
        }

        return round($totalWeightedGWA / $totalUnits, 2);
    }

    /**
     * Get total units earned across all enrollments
     */
    public function getTotalUnitsEarned(): int
    {
        return (int) $this->enrollments()->sum('units_earned');
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
