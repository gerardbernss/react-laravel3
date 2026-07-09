<?php

namespace App\Repositories;

use App\Models\Applicant;
use App\Models\ApplicantExamResult;
use App\Models\ApplicantPersonalData;
use App\Models\EnrollmentPeriod;
use Illuminate\Database\Eloquent\Collection;

class ExamResultRepository
{
    /**
     * Returns exam results for the index table, optionally scoped to an enrollment period, ordered by ranking (nulls last) then newest first.
     */
    public function forIndex(?EnrollmentPeriod $period): Collection
    {
        return ApplicantExamResult::with(['personalData', 'applicant'])
            ->when($period, fn ($q) => $q->whereHas('applicant', fn ($q) => $period->applyTo($q, dateColumn: 'application_date')))
            ->orderByRaw('CAST(ranking AS INTEGER) ASC NULLS LAST')
            ->orderBy('created_at', 'desc')
            ->get();
    }

    /**
     * Finds an existing exam result for the given personal data ID, or returns null if none exists.
     */
    public function findForPersonalData(?int $personalDataId): ?ApplicantExamResult
    {
        return ApplicantExamResult::where('applicant_personal_data_id', $personalDataId)->first();
    }

    /**
     * Finds an applicant by their application number — used during CSV import to match a result row to an existing application.
     */
    public function findApplicantByNumber(string $applicationNumber): ?Applicant
    {
        return Applicant::query()->where('application_number', $applicationNumber)->first();
    }

    /**
     * Finds the applicant linked to the given personal data ID, or returns null if no application exists yet.
     */
    public function findApplicantByPersonalDataId(int $personalDataId): ?Applicant
    {
        return Applicant::query()->where('applicant_personal_data_id', $personalDataId)->first();
    }

    /**
     * Finds an applicant's personal data record by ID, or returns null if not found.
     */
    public function findPersonalData(int $personalDataId): ?ApplicantPersonalData
    {
        return ApplicantPersonalData::find($personalDataId);
    }

    /**
     * Returns true if an exam result already exists for the given personal data ID — used to decide between insert and update during CSV import.
     */
    public function existsForPersonalData(?int $personalDataId): bool
    {
        return ApplicantExamResult::where('applicant_personal_data_id', $personalDataId)->exists();
    }

    /**
     * Creates or updates the exam result for the given personal data ID with the supplied score data.
     */
    public function updateOrCreate(?int $personalDataId, array $data): void
    {
        ApplicantExamResult::updateOrCreate(['applicant_personal_data_id' => $personalDataId], $data);
    }

    /**
     * Returns all exam results for the period with their applicant eager-loaded, ordered by total score then percentage score descending — used to compute rankings.
     */
    public function rankableForPeriod(?EnrollmentPeriod $period): Collection
    {
        return ApplicantExamResult::with('applicant')
            ->when($period, fn ($q) => $q->whereHas('applicant', fn ($q) => $period->applyTo($q, dateColumn: 'application_date')))
            ->orderByDesc('total_score')
            ->orderByDesc('percentage_score')
            ->get();
    }

    /**
     * Updates the given exam result record with the supplied data.
     */
    public function update(ApplicantExamResult $result, array $data): void
    {
        $result->update($data);
    }

    /**
     * Returns exam results with personal data for bulk email sending, optionally scoped to a period and filtered to only results not yet sent.
     */
    public function forSendAll(?EnrollmentPeriod $period, bool $onlyNew): Collection
    {
        return ApplicantExamResult::with('personalData')
            ->when($period, fn ($q) => $q->whereHas('applicant', fn ($q) => $period->applyTo($q, dateColumn: 'application_date')))
            ->when($onlyNew, fn ($q) => $q->whereNull('result_sent_at'))
            ->get();
    }

    /**
     * Returns exam results that have a result value and a linked applicant, scoped to the period — used to batch-update application statuses after results are released.
     */
    public function withResultAndApplicantForPeriod(?EnrollmentPeriod $period): Collection
    {
        return ApplicantExamResult::with('applicant')
            ->whereNotNull('result')
            ->whereNotNull('applicant_id')
            ->when($period, fn ($q) => $q->whereHas('applicant', fn ($q) => $period->applyTo($q, dateColumn: 'application_date')))
            ->get();
    }
}
