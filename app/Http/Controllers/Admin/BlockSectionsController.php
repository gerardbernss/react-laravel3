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

    public function index()
    {
        return Inertia::render('Admin/BlockSections/Index', $this->blockSectionService->indexData());
    }

    public function copyToNewYear(CopyBlockSectionsRequest $request)
    {
        $validated = $request->validated();
        $result = $this->blockSectionService->copyToNewYear($validated['from_school_year'], $validated['to_school_year']);

        if (! empty($result['error'])) {
            return back()->withErrors(['error' => $result['error']]);
        }

        return back()->with('success', $result['message']);
    }

    public function create()
    {
        return Inertia::render('Admin/BlockSections/Create', $this->blockSectionService->createData());
    }

    public function store(StoreBlockSectionRequest $request)
    {
        $result = $this->blockSectionService->store($request->validated());

        if (! empty($result['error_field'])) {
            return back()->withErrors([$result['error_field'] => $result['error_message']]);
        }

        return redirect()->route('block-sections.index')->with('success', 'Block section created successfully.');
    }

    public function show(BlockSection $blockSection)
    {
        return Inertia::render('Admin/BlockSections/Show', $this->blockSectionService->showData($blockSection));
    }

    public function addStudent(AddBlockSectionStudentRequest $request, BlockSection $blockSection)
    {
        $result = $this->blockSectionService->addStudent($blockSection, $request->validated()['student_id']);

        if (! empty($result['error'])) {
            return back()->withErrors(['error' => $result['error']]);
        }

        return back()->with('success', 'Student added to section successfully.');
    }

    public function removeStudent(BlockSection $blockSection, StudentEnrollment $studentEnrollment)
    {
        $this->blockSectionService->removeStudent($blockSection, $studentEnrollment);

        return back()->with('success', 'Student removed from section.');
    }

    public function edit(BlockSection $blockSection)
    {
        return Inertia::render('Admin/BlockSections/Edit', $this->blockSectionService->editData($blockSection));
    }

    public function update(UpdateBlockSectionRequest $request, BlockSection $blockSection)
    {
        $result = $this->blockSectionService->update($blockSection, $request->validated());

        if (! empty($result['error_field'])) {
            return back()->withErrors([$result['error_field'] => $result['error_message']]);
        }

        return redirect()->route('block-sections.index')->with('success', 'Block section updated successfully.');
    }

    public function destroy(BlockSection $blockSection)
    {
        $result = $this->blockSectionService->destroy($blockSection);

        if (! empty($result['error'])) {
            return back()->withErrors(['error' => $result['error']]);
        }

        return redirect()->route('block-sections.index')->with('success', 'Block section deleted successfully.');
    }

    public function toggleStatus(BlockSection $blockSection)
    {
        $this->blockSectionService->toggleStatus($blockSection);

        return back()->with('success', 'Block section status updated successfully.');
    }
}
