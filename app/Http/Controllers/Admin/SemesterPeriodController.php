<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateSemesterPeriodRequest;
use App\Models\SemesterPeriod;
use App\Repositories\SemesterPeriodRepository;
use App\Services\Admin\SemesterPeriodService;
use Inertia\Inertia;

class SemesterPeriodController extends Controller
{
    public function __construct(
        private SemesterPeriodRepository $semesterPeriodRepository,
        private SemesterPeriodService $semesterPeriodService,
    ) {
    }

    public function index()
    {
        return Inertia::render('Admin/SemesterPeriods/Index', [
            'periods' => $this->semesterPeriodRepository->allOrderedByStartMonth(),
        ]);
    }

    public function update(UpdateSemesterPeriodRequest $request, SemesterPeriod $semesterPeriod)
    {
        $this->semesterPeriodService->update($semesterPeriod, $request->validated());

        return back()->with('success', 'Semester period updated.');
    }
}
