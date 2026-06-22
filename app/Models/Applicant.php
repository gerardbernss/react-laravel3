<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Represents a single school-year application submitted by a prospective student.
 *
 * One physical person (ApplicantPersonalData) can have multiple Applicant rows —
 * one per application attempt or school year. The application_status field drives
 * the admissions pipeline state machine:
 *
 *   Pending → For Revision → For Exam → Exam Taken → Exam Passed → Enrolled
 *                                                   → Exam Failed
 *   Pending → Rejected  (at any point before enrollment)
 *
 * The application_number is auto-generated as E#### (Elementary/Grades 1-6) or
 * H#### (High School/Grades 7-12) by ApplicationController::generateApplicationNumber().
 *
 * @property int    $id
 * @property int    $applicant_personal_data_id
 * @property string $application_status
 * @property string $application_number
 * @property string $student_category   LES | JHS | SHS
 * @property string $school_year        e.g. "2025-2026"
 * @property string $semester
 */
class Applicant extends Model
{
    use HasFactory;

    protected $fillable = [
        // Application Information
        'applicant_personal_data_id',
        'application_status',
        'application_number',
        'application_date',
        'year_level',
        'school_year',
        'semester',
        'student_category',
        'strand',
        'classification',
        'learning_mode',
        'accomplished_by_name',

        'examination_date',
        'student_id_number',
        'application_type',
        'remarks',
        'preferred_payment_plan',
        'preferred_payment_mode',
    ];

    /**
     * All valid values for application_status.
     * Used by admin UI dropdowns and validation rules.
     * Note: 'For Revision', 'Approved', 'Rejected', and 'Pending Enrollment' are set
     * programmatically but not listed here because they are not selectable from the status dropdown.
     */
    public static $statuses = [
        'Pending',
        'For Exam',
        'Exam Taken',
        'Exam Passed',
        'Exam Failed',
        'Enrolled',
    ];
    protected $casts = ['application_date' => 'date', 'examination_date' => 'date'];

    public function personalData()
    {
        return $this->belongsTo(ApplicantPersonalData::class, 'applicant_personal_data_id');
    }

    public function educationalBackground()
    {
        return $this->hasMany(ApplicantEducationalBackground::class, 'applicant_id');
    }

    public function documents()
    {
        return $this->hasOne(ApplicantDocuments::class, 'applicant_id');
    }

    public function portalCredential()
    {
        return $this->hasOne(PortalCredential::class, 'applicant_id');
    }

    public function student()
    {
        return $this->hasOne(Student::class, 'applicant_id');
    }

    public function assessment()
    {
        return $this->hasOne(ApplicantAssessment::class);
    }

    public function auditLogs()
    {
        return $this->hasMany(EnrollmentAuditLog::class, 'applicant_id');
    }

    public function examAssignment()
    {
        return $this->hasOne(ApplicantExamAssignment::class, 'applicant_id');
    }

    /**
     * Scopes
     */
    public function scopeEnrolled($query)
    {
        return $query->where('application_status', 'Enrolled');
    }

    public function scopePending($query)
    {
        return $query->where('application_status', 'Pending');
    }

    public function scopeExamTaken($query)
    {
        return $query->where('application_status', 'Exam Taken');
    }
}
