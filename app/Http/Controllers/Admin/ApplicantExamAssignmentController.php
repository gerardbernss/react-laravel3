<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\BulkStoreApplicantExamAssignmentRequest;
use App\Http\Requests\Admin\MarkExamResultRequest;
use App\Http\Requests\Admin\StoreApplicantExamAssignmentRequest;
use App\Http\Requests\Admin\UpdateAssignmentStatusRequest;
use App\Models\ApplicantExamAssignment;
use App\Services\Admin\ApplicantExamAssignmentService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ApplicantExamAssignmentController extends Controller
{
    public function __construct(private ApplicantExamAssignmentService $assignmentService)
    {
    }

    public function index()
    {
        return Inertia::render('Admin/ExamAssignments/Index', $this->assignmentService->indexData());
    }

    public function create(Request $request)
    {
        $data = $this->assignmentService->createData($request->search);

        return Inertia::render('Admin/ExamAssignments/Create', [
            'applicants' => $data['applicants'],
            'schedules' => $data['schedules'],
            'filters' => $request->only(['search']),
        ]);
    }

    public function store(StoreApplicantExamAssignmentRequest $request)
    {
        $result = $this->assignmentService->store($request->validated());

        if (! empty($result['error'])) {
            return back()->withErrors(['error' => $result['error']]);
        }

        return redirect()->route('exam-assignments.index')
            ->with('success', 'Applicant assigned to exam schedule successfully.');
    }

    public function bulkStore(BulkStoreApplicantExamAssignmentRequest $request)
    {
        $result = $this->assignmentService->bulkStore($request->validated());

        if (! empty($result['error'])) {
            return back()->withErrors(['error' => $result['error']]);
        }

        return redirect()->route('exam-assignments.index')
            ->with('success', "{$result['assigned']} applicant(s) assigned to exam schedule successfully.");
    }

    public function updateStatus(UpdateAssignmentStatusRequest $request, ApplicantExamAssignment $assignment)
    {
        $this->assignmentService->updateStatus($assignment, $request->validated());

        return back()->with('success', 'Assignment status updated successfully.');
    }

    public function markResult(MarkExamResultRequest $request, ApplicantExamAssignment $assignment)
    {
        $this->assignmentService->markResult($assignment, $request->validated());

        return back()->with('success', 'Exam result recorded successfully.');
    }

    public function destroy(ApplicantExamAssignment $assignment)
    {
        $this->assignmentService->delete($assignment);

        return redirect()->route('exam-assignments.index')
            ->with('success', 'Assignment removed successfully.');
    }
}
