<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ProcessAssessmentPaymentRequest;
use App\Http\Requests\Admin\UpdateAssessmentMinimumAmountRequest;
use App\Http\Requests\Admin\UpdateAssessmentPaymentRequest;
use App\Models\StudentAssessment;
use App\Models\StudentPayment;
use App\Services\Admin\StudentAssessmentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;

class StudentAssessmentsController extends Controller
{
    public function __construct(private StudentAssessmentService $studentAssessmentService)
    {
    }

    public function index()
    {
        return Inertia::render('Admin/Finance/Assessments/Index', $this->studentAssessmentService->indexData());
    }

    public function show(StudentAssessment $assessment)
    {
        return Inertia::render('Admin/Finance/Assessments/Show', $this->studentAssessmentService->showData($assessment));
    }

    public function processPayment(ProcessAssessmentPaymentRequest $request, StudentAssessment $assessment)
    {
        $result = $this->studentAssessmentService->processPayment($assessment, $request->validated());

        if (! empty($result['error'])) {
            return back()->withErrors(['error' => $result['error']]);
        }

        return back()->with('success', $result['message']);
    }

    public function updatePayment(UpdateAssessmentPaymentRequest $request, StudentAssessment $assessment, StudentPayment $payment)
    {
        $this->studentAssessmentService->updatePayment($assessment, $payment, $request->validated());

        return back()->with('success', 'Payment updated successfully.');
    }

    public function deletePayment(StudentAssessment $assessment, StudentPayment $payment)
    {
        $this->studentAssessmentService->deletePayment($assessment, $payment);

        return back()->with('success', 'Payment deleted.');
    }

    public function syncStatus(StudentAssessment $assessment): RedirectResponse
    {
        $this->studentAssessmentService->syncStatus($assessment);

        return back()->with('success', 'Enrollment status synced.');
    }

    public function debugStatus(StudentAssessment $assessment): JsonResponse
    {
        return response()->json($this->studentAssessmentService->debugStatus($assessment));
    }

    public function updateMinimumAmount(UpdateAssessmentMinimumAmountRequest $request, StudentAssessment $assessment): RedirectResponse
    {
        $this->studentAssessmentService->updateMinimumAmount($assessment, $request->validated());

        return back()->with('success', 'Minimum amount updated.');
    }
}
