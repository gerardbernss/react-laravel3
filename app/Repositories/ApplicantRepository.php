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
    /**
     * Returns all applicants with personal data eager-loaded, optionally scoped to the given enrollment period.
     */
    public function allForPeriod(?EnrollmentPeriod $period): Collection
    {
        return Applicant::with(['personalData'])
            ->when($period, fn ($q) => $period->applyTo($q))
            ->get();
    }

    /**
     * Finds an applicant by ID with all relations needed for the show page eager-loaded, or throws ModelNotFoundException.
     */
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

    /**
     * Finds an applicant by ID with all relations needed for the edit form eager-loaded, or throws ModelNotFoundException.
     */
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

    /**
     * Finds an applicant by ID with the relations needed during an update operation eager-loaded, or throws ModelNotFoundException.
     */
    public function findWithUpdateRelations(int $id): Applicant
    {
        return Applicant::with([
            'personalData.familyBackground',
            'personalData.siblings',
            'educationalBackground',
            'documents',
        ])->findOrFail($id);
    }

    /**
     * Finds an applicant by ID with documents, educational background, and personal data eager-loaded for deletion — or throws ModelNotFoundException.
     */
    public function findWithDestroyRelations(int $id): Applicant
    {
        return Applicant::with(['documents', 'educationalBackground', 'personalData'])->findOrFail($id);
    }

    /**
     * Returns the number of applications linked to this personal data record excluding the given application ID — used to decide whether personal data should be deleted along with an application.
     */
    public function otherApplicationsCount(ApplicantPersonalData $personalData, int $excludeId): int
    {
        return $personalData->applications()->where('id', '!=', $excludeId)->count();
    }

    /**
     * Deletes each file path from the public storage disk, skipping any empty entries.
     */
    public function deleteDocumentFiles(array $paths): void
    {
        foreach ($paths as $path) {
            if (! empty($path)) {
                Storage::disk('public')->delete($path);
            }
        }
    }

    /**
     * Deletes the document records associated with the given application.
     */
    public function deleteDocumentsRecord(Applicant $application): void
    {
        $application->documents()->delete();
    }

    /**
     * Deletes the applicant personal data record by ID, which cascades to family background and siblings.
     */
    public function deletePersonalDataCascade(int $personalDataId): void
    {
        ApplicantPersonalData::destroy($personalDataId);
    }

    /**
     * Deletes the application's educational background records then deletes the application itself.
     */
    public function deleteEducationalBackgroundAndApplication(Applicant $application): void
    {
        $application->educationalBackground()->delete();
        Applicant::destroy($application->id);
    }

    /**
     * Finds an applicant by ID or throws a ModelNotFoundException if not found.
     */
    public function findOrFail(int $id): Applicant
    {
        return Applicant::findOrFail($id);
    }

    /**
     * Updates the given applicant record with the supplied data.
     */
    public function update(Applicant $applicant, array $data): void
    {
        $applicant->update($data);
    }

    /**
     * Finds an applicant by ID with personal data and assessment eager-loaded, or throws ModelNotFoundException.
     */
    public function findWithPersonalDataAndAssessment(int $id): Applicant
    {
        return Applicant::with(['personalData', 'assessment'])->findOrFail($id);
    }

    /**
     * Finds an applicant by ID with personal data eager-loaded, or throws ModelNotFoundException.
     */
    public function findWithPersonalData(int $id): Applicant
    {
        return Applicant::with('personalData')->findOrFail($id);
    }

    /**
     * Creates and returns a new applicant record using forceCreate to bypass mass-assignment protection.
     */
    public function create(array $data): Applicant
    {
        return Applicant::forceCreate($data);
    }

    /**
     * Returns true if the given application number is already in use.
     */
    public function applicationNumberExists(string $number): bool
    {
        return Applicant::where('application_number', $number)->exists();
    }

    /**
     * Returns true if the application number is used by any applicant other than the one with the given ID — used during updates to allow keeping the same number.
     */
    public function applicationNumberExistsExcept(string $number, int $exceptId): bool
    {
        return Applicant::where('application_number', $number)
            ->where('id', '!=', $exceptId)
            ->exists();
    }

    /**
     * Returns the applicant whose application number starts with the given prefix letter and sorts last alphabetically — used to derive the next sequential application number.
     */
    public function lastApplicationNumberWithPrefix(string $letter): ?Applicant
    {
        return Applicant::where('application_number', 'like', $letter . '%')
            ->orderBy('application_number', 'desc')
            ->first();
    }

    /**
     * Deletes all existing educational background records for the application and re-creates them from the given school data, skipping entries with no school name.
     */
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

    /**
     * Creates or updates the document record for the given application, merging new uploads into the existing record.
     */
    public function createOrUpdateDocuments(Applicant $application, array $uploads): void
    {
        $application->documents()->updateOrCreate(
            ['applicant_id' => $application->id],
            $uploads
        );
    }

    /**
     * Returns a paginated list of Exam Passed, Pending, and Enrolled applicants for the dashboard, filterable by period, status, name/email search, and student category.
     */
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

    /**
     * Returns counts of Pending and Enrolled applicants plus a combined total, optionally scoped to the given enrollment period.
     */
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

    /**
     * Eager-loads all relations needed for the enrollment show page, including audit logs.
     * Loads all audit logs then trims to 20 in PHP because Oracle rejects LIMIT inside eager-load subqueries.
     */
    public function loadEnrollmentShowRelations(Applicant $applicant): void
    {
        $applicant->load([
            'personalData.familyBackground',
            'personalData.siblings',
            'educationalBackground',
            'documents',
            'portalCredential',
            // Oracle does not support LIMIT inside eager load subqueries.
            // Load all logs ordered by date, then trim to 20 on the collection.
            'auditLogs' => function ($q) {
                $q->orderBy('created_at', 'desc');
            },
        ]);

        // Slice after loading — avoids generating a LIMIT clause that Oracle rejects.
        $applicant->setRelation('auditLogs', $applicant->auditLogs->take(20));
    }

    /**
     * Returns Pending and Enrolled applicants with personal data for reporting, filterable by status, student category, and school year.
     */
    public function forReport(array $filters): Collection
    {
        return Applicant::with(['personalData'])
            ->whereIn('application_status', ['Pending', 'Enrolled'])
            ->when(! empty($filters['status']), fn ($q) => $q->where('application_status', $filters['status']))
            ->when(! empty($filters['category']), fn ($q) => $q->where('student_category', $filters['category']))
            ->when(! empty($filters['school_year']), fn ($q) => $q->where('school_year', $filters['school_year']))
            ->get();
    }

    /**
     * Returns distinct school years from all applicants, sorted ascending — used for report filter dropdowns.
     */
    public function distinctSchoolYears(): Collection
    {
        return Applicant::distinct()->pluck('school_year')->filter()->sort()->values();
    }

    /**
     * Returns all Enrolled applicants with personal data and student eager-loaded for the student ID assignment workflow, optionally scoped to the given period.
     */
    public function enrolledForIdAssignment(?EnrollmentPeriod $period): Collection
    {
        return Applicant::with(['personalData.student'])
            ->where('application_status', 'Enrolled')
            ->when($period, fn ($q) => $period->applyTo($q))
            ->get();
    }

    /**
     * Returns Enrolled applicants with a non-null year level for the given period — used when auto-promoting students who need a year level to determine their next grade.
     */
    public function enrolledWithYearLevelForPeriod(?EnrollmentPeriod $period): Collection
    {
        return Applicant::with('personalData.student')
            ->where('application_status', 'Enrolled')
            ->when($period, fn ($q) => $period->applyTo($q))
            ->whereNotNull('year_level')
            ->get();
    }

    /**
     * Finds an applicant by ID with personal data and the linked student eager-loaded, or throws ModelNotFoundException.
     */
    public function findWithPersonalDataStudent(int $id): Applicant
    {
        return Applicant::with(['personalData.student'])->findOrFail($id);
    }

    /**
     * Returns the most recent application linked to the given personal data record, or null if none exists.
     */
    public function findByPersonalDataId(int $personalDataId): ?Applicant
    {
        return Applicant::where('applicant_personal_data_id', $personalDataId)->latest()->first();
    }

    /**
     * Returns the total number of applicants with the given status.
     */
    public function countByStatus(string $status): int
    {
        return Applicant::where('application_status', $status)->count();
    }

    /**
     * Updates all applicants with the given status to the new status in a single query — used for bulk status transitions such as marking all Pending as Archived.
     */
    public function bulkUpdateStatus(string $fromStatus, string $toStatus): void
    {
        Applicant::where('application_status', $fromStatus)->update(['application_status' => $toStatus]);
    }
}
