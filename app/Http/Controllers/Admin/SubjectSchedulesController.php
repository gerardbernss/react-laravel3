<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreSubjectScheduleRequest;
use App\Http\Requests\Admin\UpdateSubjectScheduleRequest;
use App\Models\Schedule;
use App\Services\Admin\SubjectSchedulesService;
use Inertia\Inertia;

class SubjectSchedulesController extends Controller
{
    public function __construct(private SubjectSchedulesService $subjectSchedulesService)
    {
    }

    /**
     * List all subject schedules with their subject and block section.
     */
    public function index()
    {
        return Inertia::render('Admin/SubjectSchedules/Index', $this->subjectSchedulesService->indexData());
    }

    /**
     * Show the create schedule form.
     */
    public function create()
    {
        return Inertia::render('Admin/SubjectSchedules/Create', $this->subjectSchedulesService->createData());
    }

    /**
     * Save a new schedule, either as a subject's default or assigned to one or more block sections.
     */
    public function store(StoreSubjectScheduleRequest $request)
    {
        $result = $this->subjectSchedulesService->store($request->validated());

        if (! empty($result['error_field'])) {
            return back()->withErrors([$result['error_field'] => $result['error_message']]);
        }

        return redirect()->route('admin.subject-schedules.index')->with('success', 'Schedule created successfully.');
    }

    /**
     * Show the edit form for an existing schedule.
     */
    public function edit(Schedule $subjectSchedule)
    {
        return Inertia::render('Admin/SubjectSchedules/Edit', $this->subjectSchedulesService->editData($subjectSchedule));
    }

    /**
     * Update a schedule's days/time/room/code and block section assignment.
     */
    public function update(UpdateSubjectScheduleRequest $request, Schedule $subjectSchedule)
    {
        $this->subjectSchedulesService->update($subjectSchedule, $request->validated());

        return redirect()->route('admin.subject-schedules.index')->with('success', 'Schedule updated successfully.');
    }

    /**
     * Delete a schedule.
     */
    public function destroy(Schedule $subjectSchedule)
    {
        $this->subjectSchedulesService->destroy($subjectSchedule);

        return redirect()->route('admin.subject-schedules.index')->with('success', 'Schedule deleted successfully.');
    }
}
