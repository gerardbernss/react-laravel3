<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreProgramRequest;
use App\Http\Requests\Admin\UpdateProgramRequest;
use App\Models\Program;
use App\Repositories\ProgramRepository;
use App\Services\Admin\ProgramService;
use Inertia\Inertia;

class ProgramsController extends Controller
{
    public function __construct(
        private ProgramRepository $programRepository,
        private ProgramService $programService,
    ) {
    }

    /**
     * List all programs ordered by code.
     */
    public function index()
    {
        return Inertia::render('Admin/Programs/Index', [
            'programs' => $this->programRepository->allOrderedByCode(),
            'schools' => Program::$schools,
        ]);
    }

    /**
     * Show the create program form.
     */
    public function create()
    {
        return Inertia::render('Admin/Programs/Create', [
            'schools' => Program::$schools,
        ]);
    }

    /**
     * Save a new program.
     */
    public function store(StoreProgramRequest $request)
    {
        $this->programService->create($request->validated());

        return redirect()->route('admin.programs.index')
            ->with('success', 'Program created successfully.');
    }

    /**
     * Show the edit form for an existing program.
     */
    public function edit(Program $program)
    {
        return Inertia::render('Admin/Programs/Edit', [
            'program' => $program,
            'schools' => Program::$schools,
        ]);
    }

    /**
     * Update an existing program's details.
     */
    public function update(UpdateProgramRequest $request, Program $program)
    {
        $this->programService->update($program, $request->validated());

        return redirect()->route('admin.programs.index')
            ->with('success', 'Program updated successfully.');
    }

    /**
     * Delete a program.
     */
    public function destroy(Program $program)
    {
        $this->programRepository->delete($program);

        return redirect()->route('admin.programs.index')
            ->with('success', 'Program deleted successfully.');
    }

    /**
     * Toggle the active/inactive status of a program.
     */
    public function toggleStatus(Program $program)
    {
        $this->programService->toggleStatus($program);

        return back()->with('success', 'Program status updated successfully.');
    }
}
