<?php

namespace App\Repositories;

use App\Models\ApplicantAssessment;
use App\Models\EnrollmentPeriod;
use Illuminate\Database\Eloquent\Collection;

class ApplicantAssessmentRepository
{
    /**
     * Updates the given applicant assessment with the supplied data.
     */
    public function update(ApplicantAssessment $assessment, array $data): void
    {
        $assessment->update($data);
    }

    /**
     * Returns all pending assessments with applicant personal data eager-loaded, optionally scoped to the given enrollment period.
     */
    public function pendingForPeriod(?EnrollmentPeriod $period): Collection
    {
        return ApplicantAssessment::with(['applicant.personalData'])
            ->where('status', 'pending')
            ->when($period, fn ($q) => $period->applyTo($q))
            ->latest()
            ->get();
    }

    /**
     * Generates the next sequential assessment number for the given school year in the format APP-YYYYYYY-00001.
     * Finds the current highest number by scanning existing records and increments it.
     */
    public function generateAssessmentNumber(string $schoolYear): string
    {
        $year = str_replace('-', '', $schoolYear);
        $last = ApplicantAssessment::where('assessment_number', 'like', "APP-{$year}-%")->max('assessment_number');
        $next = $last ? (int) substr($last, -5) + 1 : 1;
        return 'APP-' . $year . '-' . str_pad($next, 5, '0', STR_PAD_LEFT);
    }
}
