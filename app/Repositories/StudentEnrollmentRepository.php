<?php

namespace App\Repositories;

use App\Models\StudentEnrollment;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Collection as SupportCollection;

class StudentEnrollmentRepository
{
    /**
     * Returns all completed enrollments for the given school year and semester, with their block section eager-loaded.
     */
    public function completedForPeriod(string $schoolYear, string $semester): Collection
    {
        return StudentEnrollment::with('blockSection')
            ->where('school_year', $schoolYear)
            ->where('semester', $semester)
            ->where('status', StudentEnrollment::STATUS_COMPLETED)
            ->get();
    }

    /**
     * Returns the student IDs of all enrollments for the given school year and semester — used to check who is already enrolled before re-enrolling.
     */
    public function enrolledStudentIdsForPeriod(string $schoolYear, string $semester): SupportCollection
    {
        return StudentEnrollment::where('school_year', $schoolYear)
            ->where('semester', $semester)
            ->pluck('student_id');
    }

    /**
     * Creates and returns a new student enrollment record.
     */
    public function create(array $data): StudentEnrollment
    {
        return StudentEnrollment::create($data);
    }
}
