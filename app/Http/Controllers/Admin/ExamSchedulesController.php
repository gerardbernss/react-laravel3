<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreExamScheduleRequest;
use App\Http\Requests\Admin\UpdateExamScheduleRequest;
use App\Models\ExamSchedule;
use App\Repositories\ExaminationRoomRepository;
use App\Repositories\ExamScheduleRepository;
use App\Services\Admin\ExamScheduleService;
use Illuminate\Http\JsonResponse;
use Inertia\Inertia;

class ExamSchedulesController extends Controller
{
    public function __construct(
        private ExamScheduleRepository $examScheduleRepository,
        private ExaminationRoomRepository $examinationRoomRepository,
        private ExamScheduleService $examScheduleService,
    ) {
    }

    public function index()
    {
        return Inertia::render('Admin/ExamSchedules/Index', [
            'schedules' => $this->examScheduleRepository->allWithRoomAndAssignedCount(),
            'rooms' => $this->examinationRoomRepository->activeOrderedByName(),
        ]);
    }

    public function create()
    {
        return Inertia::render('Admin/ExamSchedules/Create', [
            'rooms' => $this->examinationRoomRepository->activeForDropdown(),
        ]);
    }

    public function store(StoreExamScheduleRequest $request)
    {
        $this->examScheduleService->create($request->validated());

        return redirect()->route('admin.exam-schedules.index')
            ->with('success', 'Exam schedule created successfully.');
    }

    public function show(ExamSchedule $examSchedule)
    {
        $this->examScheduleRepository->loadShowRelations($examSchedule);

        return Inertia::render('Admin/ExamSchedules/Show', [
            'schedule' => $examSchedule,
            'availableApplicants' => $this->examScheduleService->availableApplicantsFor($examSchedule),
        ]);
    }

    public function edit(ExamSchedule $examSchedule)
    {
        return Inertia::render('Admin/ExamSchedules/Edit', [
            'schedule' => $examSchedule,
            'rooms' => $this->examinationRoomRepository->activeForDropdown(),
        ]);
    }

    public function update(UpdateExamScheduleRequest $request, ExamSchedule $examSchedule)
    {
        $this->examScheduleService->update($examSchedule, $request->validated());

        return redirect()->route('admin.exam-schedules.index')
            ->with('success', 'Exam schedule updated successfully.');
    }

    public function destroy(ExamSchedule $examSchedule)
    {
        if (! $this->examScheduleService->delete($examSchedule)) {
            return back()->withErrors([
                'error' => 'Cannot delete schedule. It has applicants assigned.',
            ]);
        }

        return redirect()->route('admin.exam-schedules.index')
            ->with('success', 'Exam schedule deleted successfully.');
    }

    /**
     * Get available schedules for assignment (API).
     */
    public function getAvailableSchedules(): JsonResponse
    {
        return response()->json($this->examScheduleService->availableSchedulesPayload());
    }
}
