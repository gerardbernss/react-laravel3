<?php

namespace App\Repositories;

use App\Models\Applicant;
use App\Models\EnrollmentAuditLog;
use Illuminate\Database\Eloquent\Collection;

class EnrollmentAuditLogRepository
{
    public function create(array $data): void
    {
        EnrollmentAuditLog::create($data);
    }

    public function getAllFor(Applicant $applicant): Collection
    {
        return $applicant->auditLogs()->orderBy('created_at', 'desc')->get();
    }
}
