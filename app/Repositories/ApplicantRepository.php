<?php

namespace App\Repositories;

use App\Models\Applicant;
use App\Models\ApplicantPersonalData;
use App\Models\EnrollmentPeriod;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Storage;

class ApplicantRepository
{
    public function allForPeriod(?EnrollmentPeriod $period): Collection
    {
        return Applicant::with(['personalData'])
            ->when($period, fn ($q) => $period->applyTo($q))
            ->get();
    }

    public function findWithShowRelations(int $id): Applicant
    {
        return Applicant::with([
            'personalData.familyBackground',
            'personalData.siblings',
            'educationalBackground',
            'documents',
            'assessment',
        ])->findOrFail($id);
    }

    public function findWithEditRelations(int $id): Applicant
    {
        return Applicant::with([
            'personalData',
            'personalData.familyBackground',
            'educationalBackground',
            'personalData.siblings',
            'documents',
        ])->findOrFail($id);
    }

    public function findWithUpdateRelations(int $id): Applicant
    {
        return Applicant::with([
            'personalData.familyBackground',
            'personalData.siblings',
            'educationalBackground',
            'documents',
        ])->findOrFail($id);
    }

    public function findWithDestroyRelations(int $id): Applicant
    {
        return Applicant::with(['documents', 'educationalBackground', 'personalData'])->findOrFail($id);
    }

    public function otherApplicationsCount(ApplicantPersonalData $personalData, int $excludeId): int
    {
        return $personalData->applications()->where('id', '!=', $excludeId)->count();
    }

    public function deleteDocumentFiles(array $paths): void
    {
        foreach ($paths as $path) {
            if (! empty($path)) {
                Storage::disk('public')->delete($path);
            }
        }
    }

    public function deleteDocumentsRecord(Applicant $application): void
    {
        $application->documents()->delete();
    }

    public function deletePersonalDataCascade(int $personalDataId): void
    {
        ApplicantPersonalData::destroy($personalDataId);
    }

    public function deleteEducationalBackgroundAndApplication(Applicant $application): void
    {
        $application->educationalBackground()->delete();
        Applicant::destroy($application->id);
    }

    public function findOrFail(int $id): Applicant
    {
        return Applicant::findOrFail($id);
    }

    public function update(Applicant $applicant, array $data): void
    {
        $applicant->update($data);
    }

    public function findWithPersonalDataAndAssessment(int $id): Applicant
    {
        return Applicant::with(['personalData', 'assessment'])->findOrFail($id);
    }

    public function findWithPersonalData(int $id): Applicant
    {
        return Applicant::with('personalData')->findOrFail($id);
    }

    public function create(array $data): Applicant
    {
        return Applicant::forceCreate($data);
    }

    public function applicationNumberExists(string $number): bool
    {
        return Applicant::where('application_number', $number)->exists();
    }

    public function applicationNumberExistsExcept(string $number, int $exceptId): bool
    {
        return Applicant::where('application_number', $number)
            ->where('id', '!=', $exceptId)
            ->exists();
    }

    public function lastApplicationNumberWithPrefix(string $letter): ?Applicant
    {
        return Applicant::where('application_number', 'like', $letter . '%')
            ->orderBy('application_number', 'desc')
            ->first();
    }

    public function replaceEducationalBackground(Applicant $application, array $schools): void
    {
        $application->educationalBackground()->delete();

        foreach ($schools as $school) {
            if (is_array($school) && ! empty($school['school_name'])) {
                $application->educationalBackground()->create([
                    'school_name' => $school['school_name'],
                    'school_address' => $school['school_address'] ?? null,
                    'from_grade' => $school['from_grade'] ?? null,
                    'to_grade' => $school['to_grade'] ?? null,
                    'from_year' => $school['from_year'] ?? null,
                    'to_year' => $school['to_year'] ?? null,
                    'honors_awards' => $school['honors_awards'] ?? null,
                    'general_average' => $school['general_average'] ?? null,
                    'class_rank' => $school['class_rank'] ?? null,
                    'class_size' => $school['class_size'] ?? null,
                ]);
            }
        }
    }

    public function createOrUpdateDocuments(Applicant $application, array $uploads): void
    {
        $application->documents()->updateOrCreate(
            ['applicant_id' => $application->id],
            $uploads
        );
    }

    public function paginatedForDashboard(?EnrollmentPeriod $period, ?string $status, ?string $search, ?string $category): LengthAwarePaginator
    {
        return Applicant::with(['personalData', 'documents', 'portalCredential'])
            ->whereIn('application_status', ['Exam Passed', 'Pending', 'Enrolled'])
            ->when($period, fn ($q) => $period->applyTo($q))
            ->when($status, fn ($q) => $q->where('application_status', $status))
            ->when($search, function ($q) use ($search) {
                $q->whereHas('personalData', function ($q) use ($search) {
                    $q->where('first_name', 'like', "%{$search}%")
                        ->orWhere('last_name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            })
            ->when($category, fn ($q) => $q->where('student_category', $category))
            ->orderBy('created_at', 'desc')
            ->paginate(15);
    }

    public function dashboardStatusCounts(?EnrollmentPeriod $period): array
    {
        return [
            'pending' => Applicant::query()->where('application_status', 'Pending')
                ->when($period, fn ($q) => $period->applyTo($q))
                ->count(),
            'enrolled' => Applicant::query()->where('application_status', 'Enrolled')
                ->when($period, fn ($q) => $period->applyTo($q))
                ->count(),
            'total' => Applicant::query()->whereIn('application_status', ['Pending', 'Enrolled'], 'and', false)
                ->when($period, fn ($q) => $period->applyTo($q))
                ->count(),
        ];
    }

    public function loadEnrollmentShowRelations(Applicant $applicant): void
    {
        $applicant->load([
            'personalData.familyBackground',
            'personalData.siblings',
            'educationalBackground',
            'documents',
            'portalCredential',
            'auditLogs' => function ($q) {
                $q->orderBy('created_at', 'desc')->limit(20);
            },
        ]);
    }

    public function forReport(array $filters): Collection
    {
        return Applicant::with(['personalData'])
            ->whereIn('application_status', ['Pending', 'Enrolled'])
            ->when(! empty($filters['status']), fn ($q) => $q->where('application_status', $filters['status']))
            ->when(! empty($filters['category']), fn ($q) => $q->where('student_category', $filters['category']))
            ->when(! empty($filters['school_year']), fn ($q) => $q->where('school_year', $filters['school_year']))
            ->get();
    }

    public function distinctSchoolYears(): Collection
    {
        return Applicant::distinct()->pluck('school_year')->filter()->sort()->values();
    }

    public function enrolledForIdAssignment(?EnrollmentPeriod $period): Collection
    {
        return Applicant::with(['personalData.student'])
            ->where('application_status', 'Enrolled')
            ->when($period, fn ($q) => $period->applyTo($q))
            ->get();
    }

    public function enrolledWithYearLevelForPeriod(?EnrollmentPeriod $period): Collection
    {
        return Applicant::with('personalData.student')
            ->where('application_status', 'Enrolled')
            ->when($period, fn ($q) => $period->applyTo($q))
            ->whereNotNull('year_level')
            ->get();
    }

    public function findWithPersonalDataStudent(int $id): Applicant
    {
        return Applicant::with(['personalData.student'])->findOrFail($id);
    }

    public function findByPersonalDataId(int $personalDataId): ?Applicant
    {
        return Applicant::where('applicant_personal_data_id', $personalDataId)->latest()->first();
    }

    public function countByStatus(string $status): int
    {
        return Applicant::where('application_status', $status)->count();
    }

    public function bulkUpdateStatus(string $fromStatus, string $toStatus): void
    {
        Applicant::where('application_status', $fromStatus)->update(['application_status' => $toStatus]);
    }
}
