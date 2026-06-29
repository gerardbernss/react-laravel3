<?php

namespace App\Repositories;

use App\Models\StudentEnrollment;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Collection as SupportCollection;

class StudentEnrollmentRepository
{
    public function completedForPeriod(string $schoolYear, string $semester): Collection
    {
        return StudentEnrollment::with('blockSection')
            ->where('school_year', $schoolYear)
            ->where('semester', $semester)
            ->where('status', StudentEnrollment::STATUS_COMPLETED)
            ->get();
    }

    public function enrolledStudentIdsForPeriod(string $schoolYear, string $semester): SupportCollection
    {
        return StudentEnrollment::where('school_year', $schoolYear)
            ->where('semester', $semester)
            ->pluck('student_id');
    }

    public function create(array $data): StudentEnrollment
    {
        return StudentEnrollment::create($data);
    }
}
