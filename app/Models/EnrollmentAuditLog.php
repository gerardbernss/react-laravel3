<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EnrollmentAuditLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'student_id',
        'applicant_id',
        'action',
        'previous_status',
        'new_status',
        'description',
        'performed_by',
        'ip_address',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the student this log entry belongs to.
     */
    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    /**
     * Get the applicant record associated with this log entry, if any.
     */
    public function application()
    {
        return $this->belongsTo(Applicant::class, 'applicant_id');
    }

    /**
     * Scope to entries for a specific action type (e.g. "enrolled", "withdrawn").
     */
    public function scopeByAction($query, $action)
    {
        return $query->where('action', $action);
    }

    /**
     * Scope to entries for a specific student ID.
     */
    public function scopeByStudent($query, $studentId)
    {
        return $query->where('student_id', $studentId);
    }

    /**
     * Scope to entries created within the last N days (default 30).
     */
    public function scopeRecent($query, $days = 30)
    {
        return $query->where('created_at', '>=', now()->subDays($days));
    }

    /**
     * Create an audit log entry for a student enrollment action.
     */
    public static function logAction(
        Student $student,
        string $action,
        ?string $newStatus = null,
        ?string $previousStatus = null,
        ?string $description = null,
        ?string $performedBy = null,
        ?string $ipAddress = null,
        ?Applicant $application = null
    ) {
        return self::create([
            'student_id'   => $student->id,
            'applicant_id' => $application?->id,
            'action'       => $action,
            'new_status'   => $newStatus,
            'previous_status' => $previousStatus,
            'description'  => $description,
            'performed_by' => $performedBy,
            'ip_address'   => $ipAddress,
        ]);
    }
}
