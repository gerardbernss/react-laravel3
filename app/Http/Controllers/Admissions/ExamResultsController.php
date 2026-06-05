<?php

namespace App\Http\Controllers\Admissions;

use App\Http\Controllers\Controller;
use App\Models\Applicant;
use App\Models\ApplicantExamResult;
use App\Models\ApplicantPersonalData;
use App\Mail\Admissions\ExamResultMail;
use App\Models\AppSetting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;

/**
 * Manages entrance exam result upload, ranking, and applicant status updates.
 *
 * Requires 'manage-exam-results' permission. The primary workflow is:
 *   1. Admin uploads a CSV via create()/store() — results are parsed and validated
 *   2. If conflicts exist (applicant already has a result), admin is shown a
 *      conflict resolution screen and calls confirmStore() to overwrite or skip
 *   3. updateRankings()         — re-rank all results by total_score descending
 *   4. updateApplicantStatuses() — bulk-flip applicant status to 'Exam Passed'
 *      or 'Exam Failed' based on the result column
 *   5. sendAllResults() / sendResult() — email individual or all results
 *
 * The passing threshold is stored in app_settings as 'exam_passing_percentage'
 * (default 75). It is configurable via updateSettings() without a code deploy.
 *
 * CSV format requires these headers (exact, case-insensitive, spaces→underscores):
 *   applicant_number, applicant_personal_data_id, exam_date, exam_time,
 *   exam_venue, math_score, english_score, science_score, total_score,
 *   percentage_score
 *
 * Intra-file duplicates (same applicant_personal_data_id appearing twice in
 * one upload) are detected and skipped — first occurrence wins.
 * Pending rows are stored in the session between the conflict-check redirect
 * and the confirmStore() call so the upload does not need to be re-parsed.
 */
class ExamResultsController extends Controller
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

    public function index()
    {
        $results = ApplicantExamResult::with(['personalData', 'applicant'])
            ->orderByRaw("CAST(ranking AS INTEGER) ASC NULLS LAST")
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn($r) => [
                'id'                         => $r->id,
                'applicant_number'           => $r->applicant_number,
                'applicant_personal_data_id' => $r->applicant_personal_data_id,
                'first_name'                 => $r->personalData?->first_name,
                'last_name'                  => $r->personalData?->last_name,
                'exam_date'                  => $r->exam_date?->toDateString(),
                'exam_time'                  => $r->exam_time,
                'exam_venue'                 => $r->exam_venue,
                'math_score'                 => $r->math_score,
                'english_score'              => $r->english_score,
                'science_score'              => $r->science_score,
                'total_score'                => $r->total_score,
                'percentage_score'           => $r->percentage_score,
                'result'                     => $r->result,
                'ranking'                    => $r->ranking,
                'result_sent_at'             => $r->result_sent_at?->toDateTimeString(),
                'application_status'         => $r->applicant?->application_status,
            ]);

        return Inertia::render('Admissions/ExamResults/Index', [
            'results'           => $results,
            'passingPercentage' => (float) AppSetting::get('exam_passing_percentage', 75),
        ]);
    }

    public function create()
    {
        return Inertia::render('Admissions/ExamResults/Upload', [
            'importConflicts' => session('importConflicts'),
            'importWarning'   => session('importWarning'),
            'hasPending'      => session()->has('exam_import_pending'),
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'file' => ['required', 'file', 'mimes:csv,txt', 'max:5120'],
        ]);

        $file   = $request->file('file');
        $handle = fopen($file->getRealPath(), 'r');

        $rawHeaders = fgetcsv($handle);
        if (! $rawHeaders) {
            fclose($handle);
            return back()->withErrors(['file' => 'The CSV file is empty or unreadable.']);
        }

        $headers = array_map(fn($h) => strtolower(trim(str_replace(' ', '_', $h))), $rawHeaders);

        $missing = array_diff(self::EXPECTED_HEADERS, $headers);
        if (! empty($missing)) {
            fclose($handle);
            return back()->withErrors([
                'file' => 'Missing required columns: ' . implode(', ', $missing),
            ]);
        }

        $threshold   = (float) AppSetting::get('exam_passing_percentage', 75);
        $inBatchSeen = [];
        $pendingRows = [];
        $conflicts   = [];
        $inBatchDups = 0;
        $skipped     = 0;
        $row         = 2;

        while (($data = fgetcsv($handle)) !== false) {
            if (count($data) < count($headers)) {
                $row++;
                continue;
            }

            $record = array_combine($headers, $data);

            $applicantId    = null;
            $personalDataId = ! empty($record['applicant_personal_data_id'])
                ? (int) $record['applicant_personal_data_id']
                : null;

            if (! empty($record['applicant_number'])) {
                $applicant   = Applicant::query()->where('application_number', trim($record['applicant_number']))->first();
                $applicantId = $applicant?->id;
                if ($applicant && ! $personalDataId) {
                    $personalDataId = $applicant->applicant_personal_data_id;
                }
            }

            if (! $applicantId && $personalDataId) {
                $applicant   = Applicant::query()->where('applicant_personal_data_id', $personalDataId)->first();
                $applicantId = $applicant?->id;
            }

            if (! $personalDataId && ! $applicantId) {
                $skipped++;
                $row++;
                continue;
            }

            // Intra-batch duplicate: first occurrence wins
            if ($personalDataId && in_array($personalDataId, $inBatchSeen)) {
                $inBatchDups++;
                $row++;
                continue;
            }
            if ($personalDataId) {
                $inBatchSeen[] = $personalDataId;
            }

            $pct    = is_numeric($record['percentage_score'] ?? null) ? (float) $record['percentage_score'] : null;
            $result = null;
            if ($pct !== null) {
                $result = $pct >= $threshold ? 'Passed' : 'Failed';
            }

            $personalData = $personalDataId ? ApplicantPersonalData::find($personalDataId) : null;
            $name         = $personalData
                ? trim(($personalData->first_name ?? '') . ' ' . ($personalData->last_name ?? ''))
                : trim($record['applicant_number'] ?? 'Unknown');

            $resolved = [
                'applicant_personal_data_id' => $personalDataId,
                'applicant_id'               => $applicantId,
                'applicant_number'           => trim($record['applicant_number'] ?? ''),
                'exam_date'                  => ! empty($record['exam_date']) ? $record['exam_date'] : null,
                'exam_time'                  => ! empty($record['exam_time']) ? trim($record['exam_time']) : null,
                'exam_venue'                 => ! empty($record['exam_venue']) ? trim($record['exam_venue']) : null,
                'math_score'                 => is_numeric($record['math_score'] ?? null) ? (float) $record['math_score'] : null,
                'english_score'              => is_numeric($record['english_score'] ?? null) ? (float) $record['english_score'] : null,
                'science_score'              => is_numeric($record['science_score'] ?? null) ? (float) $record['science_score'] : null,
                'total_score'                => is_numeric($record['total_score'] ?? null) ? (float) $record['total_score'] : null,
                'percentage_score'           => $pct,
                'result'                     => $result,
                'ranking'                    => null,
                'uploaded_by'                => Auth::id(),
                '_name'                      => $name,
            ];

            // Check if this applicant already has a result in the DB
            if (ApplicantExamResult::where('applicant_personal_data_id', $personalDataId)->exists()) {
                $conflicts[] = [
                    'applicant_number' => $resolved['applicant_number'],
                    'name'             => $name,
                ];
            }

            $pendingRows[] = $resolved;
            $row++;
        }

        fclose($handle);

        // If there are existing-record conflicts, pause and ask admin what to do
        if (! empty($conflicts)) {
            session(['exam_import_pending' => $pendingRows]);
            $warning = $inBatchDups > 0
                ? "{$inBatchDups} duplicate row(s) in the file were also skipped."
                : null;
            return redirect()->route('exam-results.create')
                ->with('importConflicts', $conflicts)
                ->with('importWarning', $warning);
        }

        // No conflicts — process immediately
        $imported = 0;
        foreach ($pendingRows as $row) {
            unset($row['_name']);
            ApplicantExamResult::updateOrCreate(
                ['applicant_personal_data_id' => $row['applicant_personal_data_id']],
                $row
            );
            $imported++;
        }

        $message = "Imported {$imported} result(s).";
        if ($inBatchDups > 0) {
            $message .= " {$inBatchDups} duplicate row(s) in the file were skipped.";
        }
        if ($skipped > 0) {
            $message .= " {$skipped} row(s) skipped (applicant not found).";
        }

        return redirect()->route('exam-results.index')->with('success', $message);
    }

    public function confirmStore(Request $request): RedirectResponse
    {
        $request->validate(['overwrite' => 'required|boolean']);

        $pendingRows = session('exam_import_pending', []);
        session()->forget('exam_import_pending');

        if (empty($pendingRows)) {
            return redirect()->route('exam-results.create')
                ->withErrors(['file' => 'Session expired. Please re-upload the file.']);
        }

        $overwrite = (bool) $request->input('overwrite');
        $imported  = 0;
        $kept      = 0;

        foreach ($pendingRows as $row) {
            unset($row['_name']);
            $exists = ApplicantExamResult::where('applicant_personal_data_id', $row['applicant_personal_data_id'])->exists();

            if ($exists && ! $overwrite) {
                $kept++;
                continue;
            }

            ApplicantExamResult::updateOrCreate(
                ['applicant_personal_data_id' => $row['applicant_personal_data_id']],
                $row
            );
            $imported++;
        }

        $message = "Imported {$imported} result(s).";
        if ($kept > 0) {
            $message .= " {$kept} existing record(s) were kept unchanged.";
        }

        return redirect()->route('exam-results.index')->with('success', $message);
    }

    public function updateRankings(): RedirectResponse
    {
        $results = ApplicantExamResult::orderByDesc('total_score')
            ->orderByDesc('percentage_score')
            ->get();

        foreach ($results as $index => $result) {
            /** @var ApplicantExamResult $result */
            $result->update(['ranking' => $index + 1]);
        }

        return redirect()->route('exam-results.index')
            ->with('success', 'Rankings updated for ' . $results->count() . ' record(s).');
    }

    public function updateSettings(Request $request): RedirectResponse
    {
        $request->validate(['passing_percentage' => 'required|numeric|min:0|max:100']);
        AppSetting::set('exam_passing_percentage', $request->input('passing_percentage'));
        return redirect()->route('exam-results.index')->with('success', 'Passing threshold updated.');
    }

    public function sendResult(ApplicantExamResult $result): RedirectResponse
    {
        $personalData = $result->personalData;

        if (! $personalData?->email) {
            return redirect()->route('exam-results.index')
                ->with('error', 'This applicant has no email address on file.');
        }

        Mail::to($personalData->email)->send(new ExamResultMail($result, $personalData));
        $result->update(['result_sent_at' => now()]);

        $name = trim(($personalData->first_name ?? '') . ' ' . ($personalData->last_name ?? ''));
        return redirect()->route('exam-results.index')
            ->with('success', "Result sent to {$name} ({$personalData->email}).");
    }

    public function sendAllResults(Request $request): RedirectResponse
    {
        $request->validate(['scope' => 'required|in:all,new']);

        $query = ApplicantExamResult::with('personalData');
        if ($request->input('scope') === 'new') {
            $query->whereNull('result_sent_at');
        }

        $results = $query->get();
        $sent    = 0;
        $skipped = 0;

        foreach ($results as $result) {
            /** @var ApplicantExamResult $result */
            $email = $result->personalData?->email;
            if (! $email) {
                $skipped++;
                continue;
            }
            Mail::to($email)->send(new ExamResultMail($result, $result->personalData));
            $result->update(['result_sent_at' => now()]);
            $sent++;
        }

        $message = "Results sent to {$sent} applicant(s).";
        if ($skipped > 0) {
            $message .= " {$skipped} skipped (no email on file).";
        }

        return redirect()->route('exam-results.index')->with('success', $message);
    }

    public function updateApplicantStatuses(): RedirectResponse
    {
        $results = ApplicantExamResult::with('applicant')
            ->whereNotNull('result')
            ->whereNotNull('applicant_id')
            ->get();

        $updated = 0;
        $skipped = 0;

        foreach ($results as $result) {
            /** @var ApplicantExamResult $result */
            $applicant = $result->applicant;
            if (! $applicant) {
                $skipped++;
                continue;
            }
            $newStatus = $result->result === 'Passed' ? 'Exam Passed' : 'Exam Failed';
            $applicant->update(['application_status' => $newStatus]);
            $updated++;
        }

        $message = "Updated {$updated} applicant status(es).";
        if ($skipped > 0) {
            $message .= " {$skipped} skipped (no linked applicant).";
        }

        return redirect()->route('exam-results.index')->with('success', $message);
    }

    public function updateApplicantStatus(ApplicantExamResult $result): RedirectResponse
    {
        $applicant = $result->applicant;

        if (! $applicant) {
            return redirect()->route('exam-results.index')
                ->with('error', 'No linked applicant found for this record.');
        }

        if (! $result->result) {
            return redirect()->route('exam-results.index')
                ->with('error', 'This record has no result yet — upload scores first.');
        }

        $newStatus = $result->result === 'Passed' ? 'Exam Passed' : 'Exam Failed';
        $applicant->update(['application_status' => $newStatus]);

        $name = trim(($result->personalData?->first_name ?? '') . ' ' . ($result->personalData?->last_name ?? ''));
        return redirect()->route('exam-results.index')
            ->with('success', "Updated {$name}'s status to \"{$newStatus}\".");
    }
}
