<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Program;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ProgramsController extends Controller
{
    /**
     * Display a listing of programs.
     */
    public function index(Request $request)
    {
        $query = Program::query();

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('code', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        if ($request->filled('school')) {
            $query->where('school', $request->school);
        }

        if ($request->filled('status')) {
            $query->where('is_active', $request->status === 'active');
        }

        $programs = $query->orderBy('code')->paginate(15)->withQueryString();

        return Inertia::render('Admin/Programs/Index', [
            'programs' => $programs,
            'filters' => $request->only(['search', 'school', 'status']),
            'schools' => Program::$schools,
        ]);
    }

    /**
     * Show the form for creating a new program.
     */
    public function create()
    {
        return Inertia::render('Admin/Programs/Create', [
            'schools' => Program::$schools,
        ]);
    }

    /**
     * Store a newly created program.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'code' => 'required|string|max:20|unique:programs,code',
            'description' => 'required|string|max:255',
            'school' => 'required|in:Laboratory Elementary School,Junior High School,Senior High School',
            'vocational' => 'boolean',
            'is_active' => 'boolean',
            'max_load' => 'required|integer|min:0|max:100',
        ]);

        Program::create($validated);

        return redirect()->route('programs.index')
            ->with('success', 'Program created successfully.');
    }

    /**
     * Show the form for editing the specified program.
     */
    public function edit(Program $program)
    {
        return Inertia::render('Admin/Programs/Edit', [
            'program' => $program,
            'schools' => Program::$schools,
        ]);
    }

    /**
     * Update the specified program.
     */
    public function update(Request $request, Program $program)
    {
        $validated = $request->validate([
            'code' => 'required|string|max:20|unique:programs,code,' . $program->id,
            'description' => 'required|string|max:255',
            'school' => 'required|in:Laboratory Elementary School,Junior High School,Senior High School',
            'vocational' => 'boolean',
            'is_active' => 'boolean',
            'max_load' => 'required|integer|min:0|max:100',
        ]);

        $program->update($validated);

        return redirect()->route('programs.index')
            ->with('success', 'Program updated successfully.');
    }

    /**
     * Remove the specified program.
     */
    public function destroy(Program $program)
    {
        $program->delete();

        return redirect()->route('programs.index')
            ->with('success', 'Program deleted successfully.');
    }

    /**
     * Toggle program active status.
     */
    public function toggleStatus(Program $program)
    {
        $program->update(['is_active' => !$program->is_active]);

        return back()->with('success', 'Program status updated successfully.');
    }
}
