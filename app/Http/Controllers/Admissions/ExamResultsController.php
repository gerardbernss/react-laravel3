<?php

namespace App\Http\Controllers\Admissions;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admissions\ConfirmExamResultsImportRequest;
use App\Http\Requests\Admissions\SendAllExamResultsRequest;
use App\Http\Requests\Admissions\UpdateExamPassingThresholdRequest;
use App\Http\Requests\Admissions\UploadExamResultsRequest;
use App\Models\ApplicantExamResult;
use App\Services\Admissions\ExamResultService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;

/**
 * Manages entrance exam result upload, ranking, and applicant status updates.
 *
 * Requires 'manage-exam-results' permission. CSV parsing, conflict detection,
 * ranking, and applicant-status logic live in ExamResultService. Session
 * handling for the upload/confirm pause-and-resume flow stays here since it is
 * part of the HTTP request/response cycle.
 */
class ExamResultsController extends Controller
{
    public function __construct(private readonly ExamResultService $examResultService)
    {
    }

    /**
     * List all imported exam results with rankings and current applicant statuses.
     */
    public function index()
    {
        return Inertia::render('Admissions/ExamResults/Index', $this->examResultService->indexData());
    }

    /**
     * Show the CSV upload form, restoring any pending conflict session data from a previous upload.
     */
    public function create()
    {
        return Inertia::render('Admissions/ExamResults/Upload', [
            'importConflicts' => session('importConflicts'),
            'importWarning' => session('importWarning'),
            'hasPending' => session()->has('exam_import_pending'),
        ]);
    }

    /**
     * Parse the uploaded CSV and either import clean rows immediately or pause for conflict resolution.
     */
    public function store(UploadExamResultsRequest $request)
    {
        $result = $this->examResultService->importCsv($request->file('file'));

        if ($result['status'] === 'error') {
            return back()->withErrors($result['errors']);
        }

        if ($result['status'] === 'conflicts') {
            session(['exam_import_pending' => $result['pendingRows']]);

            return redirect()->route('admin.exam-results.upload')
                ->with('importConflicts', $result['conflicts'])
                ->with('importWarning', $result['warning']);
        }

        return redirect()->route('admin.exam-results.index')->with('success', $result['message']);
    }

    /**
     * Commit the pending rows from session after the user resolves conflicts, optionally overwriting existing scores.
     */
    public function confirmStore(ConfirmExamResultsImportRequest $request): RedirectResponse
    {
        $pendingRows = session('exam_import_pending', []);
        session()->forget('exam_import_pending');

        if (empty($pendingRows)) {
            return redirect()->route('admin.exam-results.upload')
                ->withErrors(['file' => 'Session expired. Please re-upload the file.']);
        }

        $message = $this->examResultService->confirmImport($pendingRows, (bool) $request->validated('overwrite'));

        return redirect()->route('admin.exam-results.index')->with('success', $message);
    }

    /**
     * Recalculate and persist the rank ordering for all current exam results.
     */
    public function updateRankings(): RedirectResponse
    {
        $count = $this->examResultService->updateRankings();

        return redirect()->route('admin.exam-results.index')->with('success', "Rankings updated for {$count} record(s).");
    }

    /**
     * Update the passing percentage threshold used to determine pass/fail status.
     */
    public function updateSettings(UpdateExamPassingThresholdRequest $request): RedirectResponse
    {
        $this->examResultService->updatePassingThreshold((float) $request->validated('passing_percentage'));

        return redirect()->route('admin.exam-results.index')->with('success', 'Passing threshold updated.');
    }

    /**
     * Send the exam result email notification to a single applicant.
     */
    public function sendResult(ApplicantExamResult $result): RedirectResponse
    {
        $outcome = $this->examResultService->sendResult($result);

        return redirect()->route('admin.exam-results.index')->with($outcome['success'] ? 'success' : 'error', $outcome['message']);
    }

    /**
     * Send exam result emails to all applicants matching the given scope (e.g. passed, failed, or all).
     */
    public function sendAllResults(SendAllExamResultsRequest $request): RedirectResponse
    {
        $message = $this->examResultService->sendAllResults($request->validated('scope'));

        return redirect()->route('admin.exam-results.index')->with('success', $message);
    }

    /**
     * Recalculate rankings and sync applicant statuses for all results in one operation.
     */
    public function updateAll(): RedirectResponse
    {
        $message = $this->examResultService->updateAllRankingsAndStatuses();

        return redirect()->route('admin.exam-results.index')->with('success', $message);
    }

    /**
     * Sync applicant application statuses based on pass/fail outcomes for all exam results.
     */
    public function updateApplicantStatuses(): RedirectResponse
    {
        $message = $this->examResultService->updateApplicantStatuses();

        return redirect()->route('admin.exam-results.index')->with('success', $message);
    }

    /**
     * Sync the applicant status for a single exam result record.
     */
    public function updateApplicantStatus(ApplicantExamResult $result): RedirectResponse
    {
        $outcome = $this->examResultService->updateApplicantStatus($result);

        return redirect()->route('admin.exam-results.index')->with($outcome['success'] ? 'success' : 'error', $outcome['message']);
    }
}
