<?php

namespace App\Services\Admissions;

use App\Mail\Admissions\ExamResultMail;
use App\Models\ApplicantExamResult;
use App\Models\AppSetting;
use App\Models\EnrollmentPeriod;
use App\Repositories\ApplicantRepository;
use App\Repositories\ExamResultRepository;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;

class ExamResultService
{
    private const EXPECTED_HEADERS = [
        'applicant_number',
        'applicant_personal_data_id',
        'exam_date',
        'exam_time',
        'exam_venue',
        'math_score',
        'english_score',
        'science_score',
        'total_score',
        'percentage_score',
    ];

    public function __construct(
        private readonly ExamResultRepository $examResultRepository,
        private readonly ApplicantRepository $applicantRepository,
    ) {
    }

    public function indexData(): array
    {
        $results = $this->examResultRepository->forIndex(EnrollmentPeriod::current())->map(fn ($r) => [
            'id' => $r->id,
            'applicant_number' => $r->applicant_number,
            'applicant_personal_data_id' => $r->applicant_personal_data_id,
            'first_name' => $r->personalData?->first_name,
            'last_name' => $r->personalData?->last_name,
            'exam_date' => $r->exam_date?->toDateString(),
            'exam_time' => $r->exam_time,
            'exam_venue' => $r->exam_venue,
            'math_score' => $r->math_score,
            'english_score' => $r->english_score,
            'science_score' => $r->science_score,
            'total_score' => $r->total_score,
            'percentage_score' => $r->percentage_score,
            'result' => $r->result,
            'ranking' => $r->ranking,
            'result_sent_at' => $r->result_sent_at?->toDateTimeString(),
            'application_status' => $r->applicant?->application_status,
        ]);

        return [
            'results' => $results,
            'passingPercentage' => (float) AppSetting::get('exam_passing_percentage', 75),
        ];
    }

    public function importCsv(UploadedFile $file): array
    {
        $handle = fopen($file->getRealPath(), 'r');
        $rawHeaders = fgetcsv($handle);

        if (! $rawHeaders) {
            fclose($handle);

            return ['status' => 'error', 'errors' => ['file' => 'The CSV file is empty or unreadable.']];
        }

        $headers = array_map(fn ($h) => strtolower(trim(str_replace(' ', '_', $h))), $rawHeaders);
        $missing = array_diff(self::EXPECTED_HEADERS, $headers);

        if (! empty($missing)) {
            fclose($handle);

            return ['status' => 'error', 'errors' => ['file' => 'Missing required columns: '.implode(', ', $missing)]];
        }

        [$pendingRows, $conflicts, $inBatchDups, $skipped] = $this->parseRows($handle, $headers);
        fclose($handle);

        if (! empty($conflicts)) {
            return [
                'status' => 'conflicts',
                'pendingRows' => $pendingRows,
                'conflicts' => $conflicts,
                'warning' => $inBatchDups > 0 ? "{$inBatchDups} duplicate row(s) in the file were also skipped." : null,
            ];
        }

        $imported = $this->persistRows($pendingRows);

        $message = "Imported {$imported} result(s).";
        if ($inBatchDups > 0) {
            $message .= " {$inBatchDups} duplicate row(s) in the file were skipped.";
        }
        if ($skipped > 0) {
            $message .= " {$skipped} row(s) skipped (applicant not found).";
        }

        return ['status' => 'imported', 'message' => $message];
    }

    public function confirmImport(array $pendingRows, bool $overwrite): string
    {
        [$imported, $kept] = DB::transaction(function () use ($pendingRows, $overwrite) {
            $imported = 0;
            $kept = 0;

            foreach ($pendingRows as $row) {
                unset($row['_name']);
                $exists = $this->examResultRepository->existsForPersonalData($row['applicant_personal_data_id']);

                if ($exists && ! $overwrite) {
                    $kept++;
                    continue;
                }

                $this->examResultRepository->updateOrCreate($row['applicant_personal_data_id'], $row);
                $imported++;
            }

            return [$imported, $kept];
        });

        $message = "Imported {$imported} result(s).";
        if ($kept > 0) {
            $message .= " {$kept} existing record(s) were kept unchanged.";
        }

        return $message;
    }

    public function updateRankings(): int
    {
        $results = $this->examResultRepository->rankableForPeriod(EnrollmentPeriod::current());

        DB::transaction(function () use ($results) {
            foreach ($results as $index => $result) {
                $this->examResultRepository->update($result, ['ranking' => $index + 1]);
            }
        });

        return $results->count();
    }

    public function updatePassingThreshold(float $percentage): void
    {
        AppSetting::set('exam_passing_percentage', $percentage);
    }

    public function sendResult(ApplicantExamResult $result): array
    {
        $personalData = $result->personalData;

        if (! $personalData?->email) {
            return ['success' => false, 'message' => 'This applicant has no email address on file.'];
        }

        Mail::to($personalData->email)->send(new ExamResultMail($result, $personalData));
        $this->examResultRepository->update($result, ['result_sent_at' => now()]);

        $name = trim(($personalData->first_name ?? '').' '.($personalData->last_name ?? ''));

        return ['success' => true, 'message' => "Result sent to {$name} ({$personalData->email})."];
    }

    public function sendAllResults(string $scope): string
    {
        $results = $this->examResultRepository->forSendAll(EnrollmentPeriod::current(), onlyNew: $scope === 'new');

        $sent = 0;
        $skipped = 0;

        foreach ($results as $result) {
            $email = $result->personalData?->email;
            if (! $email) {
                $skipped++;
                continue;
            }
            Mail::to($email)->send(new ExamResultMail($result, $result->personalData));
            $this->examResultRepository->update($result, ['result_sent_at' => now()]);
            $sent++;
        }

        $message = "Results sent to {$sent} applicant(s).";
        if ($skipped > 0) {
            $message .= " {$skipped} skipped (no email on file).";
        }

        return $message;
    }

    public function updateAllRankingsAndStatuses(): string
    {
        $results = $this->examResultRepository->rankableForPeriod(EnrollmentPeriod::current());

        $updated = DB::transaction(function () use ($results) {
            foreach ($results as $index => $result) {
                $this->examResultRepository->update($result, ['ranking' => $index + 1]);
            }

            $updated = 0;
            foreach ($results as $result) {
                if (! $result->result || ! $result->applicant_id || ! $result->applicant) {
                    continue;
                }
                $this->applicantRepository->update($result->applicant, ['application_status' => $result->result === 'Passed' ? 'Exam Passed' : 'Exam Failed']);
                $updated++;
            }

            return $updated;
        });

        return "Rankings updated for {$results->count()} record(s) and {$updated} applicant status(es) updated.";
    }

    public function updateApplicantStatuses(): string
    {
        $results = $this->examResultRepository->withResultAndApplicantForPeriod(EnrollmentPeriod::current());

        [$updated, $skipped] = DB::transaction(function () use ($results) {
            $updated = 0;
            $skipped = 0;

            foreach ($results as $result) {
                $applicant = $result->applicant;
                if (! $applicant) {
                    $skipped++;
                    continue;
                }
                $this->applicantRepository->update($applicant, ['application_status' => $result->result === 'Passed' ? 'Exam Passed' : 'Exam Failed']);
                $updated++;
            }

            return [$updated, $skipped];
        });

        $message = "Updated {$updated} applicant status(es).";
        if ($skipped > 0) {
            $message .= " {$skipped} skipped (no linked applicant).";
        }

        return $message;
    }

    public function updateApplicantStatus(ApplicantExamResult $result): array
    {
        $applicant = $result->applicant;

        if (! $applicant) {
            return ['success' => false, 'message' => 'No linked applicant found for this record.'];
        }

        if (! $result->result) {
            return ['success' => false, 'message' => 'This record has no result yet — upload scores first.'];
        }

        $newStatus = $result->result === 'Passed' ? 'Exam Passed' : 'Exam Failed';
        $this->applicantRepository->update($applicant, ['application_status' => $newStatus]);

        $name = trim(($result->personalData?->first_name ?? '').' '.($result->personalData?->last_name ?? ''));

        return ['success' => true, 'message' => "Updated {$name}'s status to \"{$newStatus}\"."];
    }

    private function parseRows($handle, array $headers): array
    {
        $threshold = (float) AppSetting::get('exam_passing_percentage', 75);
        $inBatchSeen = [];
        $pendingRows = [];
        $conflicts = [];
        $inBatchDups = 0;
        $skipped = 0;

        while (($data = fgetcsv($handle)) !== false) {
            if (count($data) < count($headers)) {
                continue;
            }

            $record = array_combine($headers, $data);
            [$applicantId, $personalDataId] = $this->resolveApplicant($record);

            if (! $personalDataId && ! $applicantId) {
                $skipped++;
                continue;
            }

            if ($personalDataId && in_array($personalDataId, $inBatchSeen)) {
                $inBatchDups++;
                continue;
            }
            if ($personalDataId) {
                $inBatchSeen[] = $personalDataId;
            }

            $row = $this->buildRow($record, $applicantId, $personalDataId, $threshold);

            if ($this->examResultRepository->existsForPersonalData($personalDataId)) {
                $conflicts[] = ['applicant_number' => $row['applicant_number'], 'name' => $row['_name']];
            }

            $pendingRows[] = $row;
        }

        return [$pendingRows, $conflicts, $inBatchDups, $skipped];
    }

    private function resolveApplicant(array $record): array
    {
        $applicantId = null;
        $personalDataId = ! empty($record['applicant_personal_data_id']) ? (int) $record['applicant_personal_data_id'] : null;

        if (! empty($record['applicant_number'])) {
            $applicant = $this->examResultRepository->findApplicantByNumber(trim($record['applicant_number']));
            $applicantId = $applicant?->id;
            if ($applicant && ! $personalDataId) {
                $personalDataId = $applicant->applicant_personal_data_id;
            }
        }

        if (! $applicantId && $personalDataId) {
            $applicant = $this->examResultRepository->findApplicantByPersonalDataId($personalDataId);
            $applicantId = $applicant?->id;
        }

        return [$applicantId, $personalDataId];
    }

    private function buildRow(array $record, ?int $applicantId, ?int $personalDataId, float $threshold): array
    {
        $pct = is_numeric($record['percentage_score'] ?? null) ? (float) $record['percentage_score'] : null;
        $result = $pct !== null ? ($pct >= $threshold ? 'Passed' : 'Failed') : null;

        $personalData = $personalDataId ? $this->examResultRepository->findPersonalData($personalDataId) : null;
        $name = $personalData
            ? trim(($personalData->first_name ?? '').' '.($personalData->last_name ?? ''))
            : trim($record['applicant_number'] ?? 'Unknown');

        return [
            'applicant_personal_data_id' => $personalDataId,
            'applicant_id' => $applicantId,
            'applicant_number' => trim($record['applicant_number'] ?? ''),
            'exam_date' => ! empty($record['exam_date']) ? $record['exam_date'] : null,
            'exam_time' => ! empty($record['exam_time']) ? trim($record['exam_time']) : null,
            'exam_venue' => ! empty($record['exam_venue']) ? trim($record['exam_venue']) : null,
            'math_score' => is_numeric($record['math_score'] ?? null) ? (float) $record['math_score'] : null,
            'english_score' => is_numeric($record['english_score'] ?? null) ? (float) $record['english_score'] : null,
            'science_score' => is_numeric($record['science_score'] ?? null) ? (float) $record['science_score'] : null,
            'total_score' => is_numeric($record['total_score'] ?? null) ? (float) $record['total_score'] : null,
            'percentage_score' => $pct,
            'result' => $result,
            'ranking' => null,
            'uploaded_by' => Auth::id(),
            '_name' => $name,
        ];
    }

    private function persistRows(array $pendingRows): int
    {
        return DB::transaction(function () use ($pendingRows) {
            $imported = 0;
            foreach ($pendingRows as $row) {
                unset($row['_name']);
                $this->examResultRepository->updateOrCreate($row['applicant_personal_data_id'], $row);
                $imported++;
            }

            return $imported;
        });
    }
}
