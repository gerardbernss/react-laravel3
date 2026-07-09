<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\AddBlockSectionStudentRequest;
use App\Http\Requests\Admin\CopyBlockSectionsRequest;
use App\Http\Requests\Admin\StoreBlockSectionRequest;
use App\Http\Requests\Admin\UpdateBlockSectionRequest;
use App\Models\BlockSection;
use App\Models\StudentEnrollment;
use App\Services\Admin\BlockSectionService;
use Inertia\Inertia;

class BlockSectionsController extends Controller
{
    public function __construct(private BlockSectionService $blockSectionService)
    {
    }

    /**
     * List all block sections with subject and enrollment counts.
     */
    public function index()
    {
        return Inertia::render('Admin/BlockSections/Index', $this->blockSectionService->indexData());
    }

    /**
     * Copy all sections from one school year to another, preserving subjects and schedules.
     */
    public function copyToNewYear(CopyBlockSectionsRequest $request)
    {
        $validated = $request->validated();
        $result = $this->blockSectionService->copyToNewYear($validated['from_school_year'], $validated['to_school_year']);

        if (! empty($result['error'])) {
            return back()->withErrors(['error' => $result['error']]);
        }

        return back()->with('success', $result['message']);
    }

    /**
     * Show the create block section form.
     */
    public function create()
    {
        return Inertia::render('Admin/BlockSections/Create', $this->blockSectionService->createData());
    }

    /**
     * Save a new block section with its assigned subjects.
     */
    public function store(StoreBlockSectionRequest $request)
    {
        $result = $this->blockSectionService->store($request->validated());

        if (! empty($result['error_field'])) {
            return back()->withErrors([$result['error_field'] => $result['error_message']]);
        }

        return redirect()->route('admin.block-sections.index')->with('success', 'Block section created successfully.');
    }

    /**
     * Show a block section's details including enrolled students and assigned subjects.
     */
    public function show(BlockSection $blockSection)
    {
        return Inertia::render('Admin/BlockSections/Show', $this->blockSectionService->showData($blockSection));
    }

    /**
     * Enroll a student into the block section, checking capacity and duplicate enrollment.
     */
    public function addStudent(AddBlockSectionStudentRequest $request, BlockSection $blockSection)
    {
        $result = $this->blockSectionService->addStudent($blockSection, $request->validated()['student_id']);

        if (! empty($result['error'])) {
            return back()->withErrors(['error' => $result['error']]);
        }

        return back()->with('success', 'Student added to section successfully.');
    }

    /**
     * Remove a student from the block section and decrement the enrollment count.
     */
    public function removeStudent(BlockSection $blockSection, StudentEnrollment $studentEnrollment)
    {
        $this->blockSectionService->removeStudent($blockSection, $studentEnrollment);

        return back()->with('success', 'Student removed from section.');
    }

    /**
     * Show the edit form for an existing block section.
     */
    public function edit(BlockSection $blockSection)
    {
        return Inertia::render('Admin/BlockSections/Edit', $this->blockSectionService->editData($blockSection));
    }

    /**
     * Update a block section's details and sync its assigned subjects.
     */
    public function update(UpdateBlockSectionRequest $request, BlockSection $blockSection)
    {
        $result = $this->blockSectionService->update($blockSection, $request->validated());

        if (! empty($result['error_field'])) {
            return back()->withErrors([$result['error_field'] => $result['error_message']]);
        }

        return redirect()->route('admin.block-sections.index')->with('success', 'Block section updated successfully.');
    }

    /**
     * Delete a block section if it has no enrolled students.
     */
    public function destroy(BlockSection $blockSection)
    {
        $result = $this->blockSectionService->destroy($blockSection);

        if (! empty($result['error'])) {
            return back()->withErrors(['error' => $result['error']]);
        }

        return redirect()->route('admin.block-sections.index')->with('success', 'Block section deleted successfully.');
    }

    /**
     * Toggle the active/inactive status of a block section.
     */
    public function toggleStatus(BlockSection $blockSection)
    {
        $this->blockSectionService->toggleStatus($blockSection);

        return back()->with('success', 'Block section status updated successfully.');
    }
}
