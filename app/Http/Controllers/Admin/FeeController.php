<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Fee;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class FeeController extends Controller
{
    public function index(Request $request)
    {
        $query = Fee::orderBy('school_year', 'desc')
            ->orderBy('semester')
            ->orderBy('school_level')
            ->orderBy('category')
            ->orderBy('name');

        if ($request->filled('school_year')) {
            $query->where('school_year', $request->school_year);
        }
        if ($request->filled('semester')) {
            $query->where('semester', $request->semester);
        }
        if ($request->filled('school_level')) {
            $query->where('school_level', $request->school_level);
        }
        if ($request->filled('category')) {
            $query->where('category', $request->category);
        }

        $fees = $query->get();
        $schoolYears = Fee::distinct()->pluck('school_year')->sort()->reverse()->values();

        return Inertia::render('Admin/Fees/Index', [
            'fees'        => $fees,
            'schoolYears' => $schoolYears,
            'categories'  => Fee::$categories,
            'schoolLevels'=> Fee::$schoolLevels,
            'semesters'   => Fee::$semesters,
            'filters'     => $request->only(['school_year', 'semester', 'school_level', 'category']),
        ]);
    }

    public function create()
    {
        return Inertia::render('Admin/Fees/Create', [
            'categories'   => Fee::$categories,
            'schoolLevels' => Fee::$schoolLevels,
            'semesters'    => Fee::$semesters,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'           => 'required|string|max:255',
            'code'           => 'required|string|max:20',
            'category'       => 'required|in:tuition,miscellaneous,laboratory,special',
            'is_per_unit'    => 'boolean',
            'is_required'    => 'boolean',
            'school_level'   => 'required|in:all,LES,JHS,SHS',
            'school_year'    => 'required|string|max:20',
            'semester'       => 'required|in:1st Semester,2nd Semester,Summer,Yearly',
            'amount'         => 'required|numeric|min:0',
            'description'    => 'nullable|string',
            'effective_date' => 'nullable|date',
            'is_active'      => 'boolean',
        ]);

        $exists = Fee::where('code', $validated['code'])
            ->where('school_year', $validated['school_year'])
            ->where('semester', $validated['semester'])
            ->where('school_level', $validated['school_level'])
            ->exists();

        if ($exists) {
            return back()->withErrors(['code' => 'A fee with this code already exists for the selected school year, semester, and level.']);
        }

        Fee::create($validated);

        return redirect()->route('admin.fees.index')
            ->with('success', 'Fee created successfully.');
    }

    public function show(Fee $fee)
    {
        return Inertia::render('Admin/Fees/Show', [
            'fee'          => $fee,
            'categories'   => Fee::$categories,
            'schoolLevels' => Fee::$schoolLevels,
            'semesters'    => Fee::$semesters,
        ]);
    }

    public function edit(Fee $fee)
    {
        return Inertia::render('Admin/Fees/Edit', [
            'fee'          => $fee,
            'categories'   => Fee::$categories,
            'schoolLevels' => Fee::$schoolLevels,
            'semesters'    => Fee::$semesters,
        ]);
    }

    public function update(Request $request, Fee $fee)
    {
        $validated = $request->validate([
            'name'           => 'required|string|max:255',
            'code'           => 'required|string|max:20',
            'category'       => 'required|in:tuition,miscellaneous,laboratory,special',
            'is_per_unit'    => 'boolean',
            'is_required'    => 'boolean',
            'school_level'   => 'required|in:all,LES,JHS,SHS',
            'school_year'    => 'required|string|max:20',
            'semester'       => 'required|in:1st Semester,2nd Semester,Summer,Yearly',
            'amount'         => 'required|numeric|min:0',
            'description'    => 'nullable|string',
            'effective_date' => 'nullable|date',
            'is_active'      => 'boolean',
        ]);

        $exists = Fee::where('code', $validated['code'])
            ->where('school_year', $validated['school_year'])
            ->where('semester', $validated['semester'])
            ->where('school_level', $validated['school_level'])
            ->where('id', '!=', $fee->id)
            ->exists();

        if ($exists) {
            return back()->withErrors(['code' => 'A fee with this code already exists for the selected school year, semester, and level.']);
        }

        $fee->update($validated);

        return redirect()->route('admin.fees.index')
            ->with('success', 'Fee updated successfully.');
    }

    public function destroy(Fee $fee)
    {
        if ($fee->lineItems()->exists()) {
            return back()->withErrors(['error' => 'Cannot delete a fee that has been used in student assessments.']);
        }

        $fee->delete();

        return redirect()->route('admin.fees.index')
            ->with('success', 'Fee deleted successfully.');
    }

    public function toggleStatus(Fee $fee)
    {
        $fee->update(['is_active' => !$fee->is_active]);

        return back()->with('success', 'Fee status updated successfully.');
    }

    public function copyFromYear(Request $request)
    {
        $validated = $request->validate([
            'source_year'        => 'required|string',
            'target_year'        => 'required|string|different:source_year',
            'adjust_percentage'  => 'nullable|numeric|min:-100|max:100',
        ]);

        $sourceFees = Fee::where('school_year', $validated['source_year'])->get();

        if ($sourceFees->isEmpty()) {
            return back()->withErrors(['error' => 'No fees found for the source school year.']);
        }

        $multiplier = 1 + (($validated['adjust_percentage'] ?? 0) / 100);
        $copied = 0;

        foreach ($sourceFees as $fee) {
            $exists = Fee::where('code', $fee->code)
                ->where('school_year', $validated['target_year'])
                ->where('semester', $fee->semester)
                ->where('school_level', $fee->school_level)
                ->exists();

            if (!$exists) {
                Fee::create([
                    'name'           => $fee->name,
                    'code'           => $fee->code,
                    'category'       => $fee->category,
                    'is_per_unit'    => $fee->is_per_unit,
                    'is_required'    => $fee->is_required,
                    'school_level'   => $fee->school_level,
                    'school_year'    => $validated['target_year'],
                    'semester'       => $fee->semester,
                    'amount'         => round($fee->amount * $multiplier, 2),
                    'description'    => $fee->description,
                    'is_active'      => true,
                ]);
                $copied++;
            }
        }

        return back()->with('success', "Copied {$copied} fees to {$validated['target_year']}.");
    }
}
