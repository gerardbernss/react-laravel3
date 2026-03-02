<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\BlockSection;
use App\Models\Subject;
use Illuminate\Http\Request;
use Inertia\Inertia;

class BlockSectionsController extends Controller
{
    /**
     * Display a listing of block sections.
     */
    public function index(Request $request)
    {
        $query = BlockSection::with('subjects');

        // Search filter
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('code', 'like', "%{$search}%")
                    ->orWhere('name', 'like', "%{$search}%");
            });
        }

        // Grade level filter
        if ($request->filled('grade_level')) {
            $query->where('grade_level', $request->grade_level);
        }

        // School year filter
        if ($request->filled('school_year')) {
            $query->where('school_year', $request->school_year);
        }

        // Status filter
        if ($request->filled('status')) {
            $query->where('is_active', $request->status === 'active');
        }

        $blockSections = $query->orderBy('grade_level')
            ->orderBy('name')
            ->paginate(15)
            ->withQueryString();

        // Get unique school years for filter
        $schoolYears = BlockSection::distinct()->pluck('school_year')->sort()->values();

        return Inertia::render('Admin/BlockSections/Index', [
            'blockSections' => $blockSections,
            'filters' => $request->only(['search', 'grade_level', 'school_year', 'status']),
            'schoolYears' => $schoolYears,
        ]);
    }

    /**
     * Show the form for creating a new block section.
     */
    public function create()
    {
        $subjects = Subject::active()->orderBy('code')->get();

        return Inertia::render('Admin/BlockSections/Create', [
            'subjects' => $subjects,
        ]);
    }

    /**
     * Store a newly created block section.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:block_sections,code',
            'grade_level' => 'required|string',
            'school_year' => 'required|string',
            'semester' => 'nullable|in:First Semester,Second Semester,Summer,Full Year',
            'adviser' => 'nullable|string|max:255',
            'room' => 'nullable|string|max:50',
            'capacity' => 'required|integer|min:1|max:100',
            'schedule' => 'nullable|string',
            'is_active' => 'boolean',
            'subjects' => 'nullable|array',
            'subjects.*.subject_id' => 'required|exists:subjects,id',
        ]);

        $blockSection = BlockSection::create([
            'name' => $validated['name'],
            'code' => $validated['code'],
            'grade_level' => $validated['grade_level'],
            'school_year' => $validated['school_year'],
            'semester' => $validated['semester'] ?? null,
            'adviser' => $validated['adviser'] ?? null,
            'room' => $validated['room'] ?? null,
            'capacity' => $validated['capacity'],
            'schedule' => $validated['schedule'] ?? null,
            'is_active' => $validated['is_active'] ?? true,
        ]);

        // Attach subjects if provided
        if (!empty($validated['subjects'])) {
            $subjectIds = array_column($validated['subjects'], 'subject_id');
            $blockSection->subjects()->attach($subjectIds);
        }

        return redirect()->route('block-sections.index')
            ->with('success', 'Block section created successfully.');
    }

    /**
     * Display the specified block section.
     */
    public function show(BlockSection $blockSection)
    {
        $blockSection->load('subjects');

        return Inertia::render('Admin/BlockSections/Show', [
            'blockSection' => $blockSection,
        ]);
    }

    /**
     * Show the form for editing the specified block section.
     */
    public function edit(BlockSection $blockSection)
    {
        $blockSection->load('subjects');
        $subjects = Subject::active()->orderBy('code')->get();

        return Inertia::render('Admin/BlockSections/Edit', [
            'blockSection' => $blockSection,
            'subjects' => $subjects,
        ]);
    }

    /**
     * Update the specified block section.
     */
    public function update(Request $request, BlockSection $blockSection)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:block_sections,code,' . $blockSection->id,
            'grade_level' => 'required|string',
            'school_year' => 'required|string',
            'semester' => 'nullable|in:First Semester,Second Semester,Summer,Full Year',
            'adviser' => 'nullable|string|max:255',
            'room' => 'nullable|string|max:50',
            'capacity' => 'required|integer|min:1|max:100',
            'schedule' => 'nullable|string',
            'is_active' => 'boolean',
            'subjects' => 'nullable|array',
            'subjects.*.subject_id' => 'required|exists:subjects,id',
        ]);

        $blockSection->update([
            'name' => $validated['name'],
            'code' => $validated['code'],
            'grade_level' => $validated['grade_level'],
            'school_year' => $validated['school_year'],
            'semester' => $validated['semester'] ?? null,
            'adviser' => $validated['adviser'] ?? null,
            'room' => $validated['room'] ?? null,
            'capacity' => $validated['capacity'],
            'schedule' => $validated['schedule'] ?? null,
            'is_active' => $validated['is_active'] ?? true,
        ]);

        // Sync subjects
        $subjectIds = !empty($validated['subjects'])
            ? array_column($validated['subjects'], 'subject_id')
            : [];
        $blockSection->subjects()->sync($subjectIds);

        return redirect()->route('block-sections.index')
            ->with('success', 'Block section updated successfully.');
    }

    /**
     * Remove the specified block section.
     */
    public function destroy(BlockSection $blockSection)
    {
        // Check if any students are enrolled
        if ($blockSection->current_enrollment > 0) {
            return back()->withErrors([
                'error' => 'Cannot delete block section. Students are currently enrolled.',
            ]);
        }

        $blockSection->subjects()->detach();
        $blockSection->delete();

        return redirect()->route('block-sections.index')
            ->with('success', 'Block section deleted successfully.');
    }

    /**
     * Toggle block section active status.
     */
    public function toggleStatus(BlockSection $blockSection)
    {
        $blockSection->update(['is_active' => !$blockSection->is_active]);

        return back()->with('success', 'Block section status updated successfully.');
    }
}
