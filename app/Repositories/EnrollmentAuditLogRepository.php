<?php

namespace App\Repositories;

use App\Models\Applicant;
use App\Models\EnrollmentAuditLog;
use Illuminate\Database\Eloquent\Collection;

class EnrollmentAuditLogRepository
{
    /**
     * Creates a new audit log entry recording a change to an applicant's enrollment status.
     */
    public function create(array $data): void
    {
        EnrollmentAuditLog::create($data);
    }

    /**
     * Returns all audit log entries for the given applicant, newest first.
     */
    public function getAllFor(Applicant $applicant): Collection
    {
        return $applicant->auditLogs()->orderBy('created_at', 'desc')->get();
    }
}
