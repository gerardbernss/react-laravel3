<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\OpenEnrollmentPeriodRequest;
use App\Http\Requests\Admin\StoreEnrollmentPeriodRequest;
use App\Http\Requests\Admin\UpdateEnrollmentPeriodRequest;
use App\Models\EnrollmentPeriod;
use App\Services\Admin\EnrollmentPeriodService;
use Inertia\Inertia;

class EnrollmentPeriodController extends Controller
{
    public function __construct(private EnrollmentPeriodService $enrollmentPeriodService)
    {
    }

    public function index()
    {
        return Inertia::render('Admin/EnrollmentPeriods/Index', $this->enrollmentPeriodService->indexData());
    }

    public function store(StoreEnrollmentPeriodRequest $request)
    {
        $result = $this->enrollmentPeriodService->store($request->validated());

        if (! empty($result['error'])) {
            return back()->withErrors(['error' => $result['error']]);
        }

        return back()->with('success', $result['message']);
    }

    public function open(OpenEnrollmentPeriodRequest $request, EnrollmentPeriod $period)
    {
        $result = $this->enrollmentPeriodService->open($period, $request->validated());

        if (! empty($result['error'])) {
            return back()->withErrors(['error' => $result['error']]);
        }

        return back()->with('success', $result['message']);
    }

    public function update(UpdateEnrollmentPeriodRequest $request, EnrollmentPeriod $period)
    {
        $this->enrollmentPeriodService->update($period, $request->validated());

        return back()->with('success', 'Enrollment period updated.');
    }

    public function close(EnrollmentPeriod $period)
    {
        $this->enrollmentPeriodService->close($period);

        return back()->with('success', 'Enrollment has been closed.');
    }

    public function destroy(EnrollmentPeriod $period)
    {
        $result = $this->enrollmentPeriodService->destroy($period);

        if (! empty($result['error'])) {
            return back()->withErrors(['error' => $result['error']]);
        }

        return back()->with('success', 'Enrollment period deleted.');
    }

    public function generateAssessments(EnrollmentPeriod $period)
    {
        $result = $this->enrollmentPeriodService->generateAssessments($period);

        if (! empty($result['error'])) {
            return back()->withErrors(['error' => $result['error']]);
        }

        return back()->with('success', $result['message']);
    }
}
