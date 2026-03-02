<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Subject;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SubjectsController extends Controller
{
    /**
     * Display a listing of subjects.
     */
    public function index(Request $request)
    {
        $query = Subject::query();

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

        // Type filter
        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        // Status filter
        if ($request->filled('status')) {
            $query->where('is_active', $request->status === 'active');
        }

        $subjects = $query->orderBy('code')->paginate(15)->withQueryString();

        return Inertia::render('Admin/Subjects/Index', [
            'subjects' => $subjects,
            'filters' => $request->only(['search', 'grade_level', 'type', 'status']),
        ]);
    }

    /**
     * Show the form for creating a new subject.
     */
    public function create()
    {
        $facultyUsers = User::whereHas('roles', fn($q) => $q->where('slug', 'faculty'))
            ->orderBy('name')
            ->get(['id', 'name']);

        return Inertia::render('Admin/Subjects/Create', [
            'facultyUsers' => $facultyUsers,
        ]);
    }

    /**
     * Store a newly created subject.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'code' => 'required|string|max:50|unique:subjects,code',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'units' => 'required|integer|min:1|max:10',
            'type' => 'required|in:Core,Major,Minor,Elective,Specialized',
            'grade_level' => 'nullable|string',
            'semester' => 'nullable|in:First Semester,Second Semester,Summer,Full Year',
            'schedule' => 'nullable|string|max:255',
            'room' => 'nullable|string|max:100',
            'user_id' => 'nullable|exists:users,id',
            'is_active' => 'boolean',
        ]);

        Subject::create($validated);

        return redirect()->route('subjects.index')
            ->with('success', 'Subject created successfully.');
    }

    /**
     * Display the specified subject.
     */
    public function show(Subject $subject)
    {
        $subject->load('blockSections');

        return Inertia::render('Admin/Subjects/Show', [
            'subject' => $subject,
        ]);
    }

    /**
     * Show the form for editing the specified subject.
     */
    public function edit(Subject $subject)
    {
        $facultyUsers = User::whereHas('roles', fn($q) => $q->where('slug', 'faculty'))
            ->orderBy('name')
            ->get(['id', 'name']);

        return Inertia::render('Admin/Subjects/Edit', [
            'subject' => $subject,
            'facultyUsers' => $facultyUsers,
        ]);
    }

    /**
     * Update the specified subject.
     */
    public function update(Request $request, Subject $subject)
    {
        $validated = $request->validate([
            'code' => 'required|string|max:50|unique:subjects,code,' . $subject->id,
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'units' => 'required|integer|min:1|max:10',
            'type' => 'required|in:Core,Major,Minor,Elective,Specialized',
            'grade_level' => 'nullable|string',
            'semester' => 'nullable|in:First Semester,Second Semester,Summer,Full Year',
            'schedule' => 'nullable|string|max:255',
            'room' => 'nullable|string|max:100',
            'user_id' => 'nullable|exists:users,id',
            'is_active' => 'boolean',
        ]);

        $subject->update($validated);

        return redirect()->route('subjects.index')
            ->with('success', 'Subject updated successfully.');
    }

    /**
     * Remove the specified subject.
     */
    public function destroy(Subject $subject)
    {
        // Check if subject is assigned to any block sections
        if ($subject->blockSections()->count() > 0) {
            return back()->withErrors([
                'error' => 'Cannot delete subject. It is assigned to one or more block sections.',
            ]);
        }

        $subject->delete();

        return redirect()->route('subjects.index')
            ->with('success', 'Subject deleted successfully.');
    }

    /**
     * Toggle subject active status.
     */
    public function toggleStatus(Subject $subject)
    {
        $subject->update(['is_active' => !$subject->is_active]);

        return back()->with('success', 'Subject status updated successfully.');
    }
}
