<?php

namespace App\Repositories;

use App\Models\Applicant;
use App\Models\ApplicantExamResult;
use App\Models\ApplicantPersonalData;
use App\Models\EnrollmentPeriod;
use Illuminate\Database\Eloquent\Collection;

class ExamResultRepository
{
    public function forIndex(?EnrollmentPeriod $period): Collection
    {
        return ApplicantExamResult::with(['personalData', 'applicant'])
            ->when($period, fn ($q) => $q->whereHas('applicant', fn ($q) => $period->applyTo($q)))
            ->orderByRaw('CAST(ranking AS INTEGER) ASC NULLS LAST')
            ->orderBy('created_at', 'desc')
            ->get();
    }

    public function findForPersonalData(?int $personalDataId): ?ApplicantExamResult
    {
        return ApplicantExamResult::where('applicant_personal_data_id', $personalDataId)->first();
    }

    public function findApplicantByNumber(string $applicationNumber): ?Applicant
    {
        return Applicant::query()->where('application_number', $applicationNumber)->first();
    }

    public function findApplicantByPersonalDataId(int $personalDataId): ?Applicant
    {
        return Applicant::query()->where('applicant_personal_data_id', $personalDataId)->first();
    }

    public function findPersonalData(int $personalDataId): ?ApplicantPersonalData
    {
        return ApplicantPersonalData::find($personalDataId);
    }

    public function existsForPersonalData(?int $personalDataId): bool
    {
        return ApplicantExamResult::where('applicant_personal_data_id', $personalDataId)->exists();
    }

    public function updateOrCreate(?int $personalDataId, array $data): void
    {
        ApplicantExamResult::updateOrCreate(['applicant_personal_data_id' => $personalDataId], $data);
    }

    public function rankableForPeriod(?EnrollmentPeriod $period): Collection
    {
        return ApplicantExamResult::with('applicant')
            ->when($period, fn ($q) => $q->whereHas('applicant', fn ($q) => $period->applyTo($q)))
            ->orderByDesc('total_score')
            ->orderByDesc('percentage_score')
            ->get();
    }

    public function update(ApplicantExamResult $result, array $data): void
    {
        $result->update($data);
    }

    public function forSendAll(?EnrollmentPeriod $period, bool $onlyNew): Collection
    {
        return ApplicantExamResult::with('personalData')
            ->when($period, fn ($q) => $q->whereHas('applicant', fn ($q) => $period->applyTo($q)))
            ->when($onlyNew, fn ($q) => $q->whereNull('result_sent_at'))
            ->get();
    }

    public function withResultAndApplicantForPeriod(?EnrollmentPeriod $period): Collection
    {
        return ApplicantExamResult::with('applicant')
            ->whereNotNull('result')
            ->whereNotNull('applicant_id')
            ->when($period, fn ($q) => $q->whereHas('applicant', fn ($q) => $period->applyTo($q)))
            ->get();
    }
}
