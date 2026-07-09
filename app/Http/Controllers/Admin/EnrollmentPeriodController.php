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

    /**
     * List all enrollment periods with their open/closed status.
     */
    public function index()
    {
        return Inertia::render('Admin/EnrollmentPeriods/Index', $this->enrollmentPeriodService->indexData());
    }

    /**
     * Save a new enrollment period — blocked if an open period of the same type already exists.
     */
    public function store(StoreEnrollmentPeriodRequest $request)
    {
        $result = $this->enrollmentPeriodService->store($request->validated());

        if (! empty($result['error'])) {
            return back()->withErrors(['error' => $result['error']]);
        }

        return back()->with('success', $result['message']);
    }

    /**
     * Open an enrollment period, transitioning Pending students to Not Enrolled if needed.
     */
    public function open(OpenEnrollmentPeriodRequest $request, EnrollmentPeriod $period)
    {
        $result = $this->enrollmentPeriodService->open($period, $request->validated());

        if (! empty($result['error'])) {
            return back()->withErrors(['error' => $result['error']]);
        }

        return back()->with('success', $result['message']);
    }

    /**
     * Update an enrollment period's dates or settings.
     */
    public function update(UpdateEnrollmentPeriodRequest $request, EnrollmentPeriod $period)
    {
        $this->enrollmentPeriodService->update($period, $request->validated());

        return back()->with('success', 'Enrollment period updated.');
    }

    /**
     * Close an enrollment period and mark all Active students as Pending for the next cycle.
     */
    public function close(EnrollmentPeriod $period)
    {
        $this->enrollmentPeriodService->close($period);

        return back()->with('success', 'Enrollment has been closed.');
    }

    /**
     * Delete an enrollment period — blocked if it has associated student enrollments or assessments.
     */
    public function destroy(EnrollmentPeriod $period)
    {
        $result = $this->enrollmentPeriodService->destroy($period);

        if (! empty($result['error'])) {
            return back()->withErrors(['error' => $result['error']]);
        }

        return back()->with('success', 'Enrollment period deleted.');
    }

    /**
     * Generate student assessment records for all enrolled students in the period who don't yet have one.
     */
    public function generateAssessments(EnrollmentPeriod $period)
    {
        $result = $this->enrollmentPeriodService->generateAssessments($period);

        if (! empty($result['error'])) {
            return back()->withErrors(['error' => $result['error']]);
        }

        return back()->with('success', $result['message']);
    }
}
