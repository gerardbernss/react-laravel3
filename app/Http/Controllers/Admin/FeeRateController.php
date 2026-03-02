<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\FeeRate;
use App\Models\FeeType;
use Illuminate\Http\Request;
use Inertia\Inertia;

class FeeRateController extends Controller
{
    /**
     * Display a listing of fee rates.
     */
    public function index(Request $request)
    {
        $query = FeeRate::with('feeType');

        if ($request->filled('search')) {
            $search = $request->search;
            $query->whereHas('feeType', function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('code', 'like', "%{$search}%");
            });
        }

        if ($request->filled('school_year')) {
            $query->where('school_year', $request->school_year);
        }

        if ($request->filled('semester')) {
            $query->where('semester', $request->semester);
        }

        if ($request->filled('category')) {
            $query->where('student_category', $request->category);
        }

        if ($request->filled('fee_type_id')) {
            $query->where('fee_type_id', $request->fee_type_id);
        }

        $feeRates = $query->orderBy('school_year', 'desc')
            ->orderBy('semester')
            ->orderBy('student_category')
            ->paginate(15);

        // Get unique school years for filter
        $schoolYears = FeeRate::distinct()->pluck('school_year')->sort()->reverse()->values();

        return Inertia::render('Admin/FeeRates/Index', [
            'feeRates' => $feeRates,
            'filters' => [
                'search' => $request->search,
                'school_year' => $request->school_year,
                'semester' => $request->semester,
                'category' => $request->category,
                'fee_type_id' => $request->fee_type_id,
            ],
            'schoolYears' => $schoolYears,
            'semesters' => FeeRate::$semesters,
            'studentCategories' => FeeRate::$studentCategories,
            'feeTypes' => FeeType::active()->orderBy('name')->get(),
        ]);
    }

    /**
     * Show the form for creating a new fee rate.
     */
    public function create()
    {
        return Inertia::render('Admin/FeeRates/Create', [
            'feeTypes' => FeeType::active()->orderBy('category')->orderBy('name')->get(),
            'semesters' => FeeRate::$semesters,
            'studentCategories' => FeeRate::$studentCategories,
        ]);
    }

    /**
     * Store a newly created fee rate.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'fee_type_id' => 'required|exists:fee_types,id',
            'school_year' => 'required|string|max:20',
            'semester' => 'required|in:1st Semester,2nd Semester,Summer,Yearly',
            'student_category' => 'required|in:all,LES,JHS,SHS',
            'amount' => 'required|numeric|min:0',
            'effective_date' => 'nullable|date',
            'is_active' => 'boolean',
        ]);

        // Check for duplicate
        $exists = FeeRate::where('fee_type_id', $validated['fee_type_id'])
            ->where('school_year', $validated['school_year'])
            ->where('semester', $validated['semester'])
            ->where('student_category', $validated['student_category'])
            ->exists();

        if ($exists) {
            return back()->withErrors(['error' => 'A rate for this fee type, school year, semester, and category already exists.']);
        }

        FeeRate::create($validated);

        return redirect()->route('admin.fee-rates.index')
            ->with('success', 'Fee rate created successfully.');
    }

    /**
     * Display the specified fee rate.
     */
    public function show(FeeRate $feeRate)
    {
        $feeRate->load('feeType');

        return Inertia::render('Admin/FeeRates/Show', [
            'feeRate' => $feeRate,
            'semesters' => FeeRate::$semesters,
            'studentCategories' => FeeRate::$studentCategories,
        ]);
    }

    /**
     * Show the form for editing the specified fee rate.
     */
    public function edit(FeeRate $feeRate)
    {
        $feeRate->load('feeType');

        return Inertia::render('Admin/FeeRates/Edit', [
            'feeRate' => $feeRate,
            'feeTypes' => FeeType::active()->orderBy('category')->orderBy('name')->get(),
            'semesters' => FeeRate::$semesters,
            'studentCategories' => FeeRate::$studentCategories,
        ]);
    }

    /**
     * Update the specified fee rate.
     */
    public function update(Request $request, FeeRate $feeRate)
    {
        $validated = $request->validate([
            'fee_type_id' => 'required|exists:fee_types,id',
            'school_year' => 'required|string|max:20',
            'semester' => 'required|in:1st Semester,2nd Semester,Summer,Yearly',
            'student_category' => 'required|in:all,LES,JHS,SHS',
            'amount' => 'required|numeric|min:0',
            'effective_date' => 'nullable|date',
            'is_active' => 'boolean',
        ]);

        // Check for duplicate (excluding current record)
        $exists = FeeRate::where('fee_type_id', $validated['fee_type_id'])
            ->where('school_year', $validated['school_year'])
            ->where('semester', $validated['semester'])
            ->where('student_category', $validated['student_category'])
            ->where('id', '!=', $feeRate->id)
            ->exists();

        if ($exists) {
            return back()->withErrors(['error' => 'A rate for this fee type, school year, semester, and category already exists.']);
        }

        $feeRate->update($validated);

        return redirect()->route('admin.fee-rates.index')
            ->with('success', 'Fee rate updated successfully.');
    }

    /**
     * Remove the specified fee rate.
     */
    public function destroy(FeeRate $feeRate)
    {
        $feeRate->delete();

        return redirect()->route('admin.fee-rates.index')
            ->with('success', 'Fee rate deleted successfully.');
    }

    /**
     * Toggle the active status of the fee rate.
     */
    public function toggleStatus(FeeRate $feeRate)
    {
        $feeRate->update(['is_active' => !$feeRate->is_active]);

        return back()->with('success', 'Fee rate status updated successfully.');
    }

    /**
     * Bulk create rates for a new school year by copying from previous year.
     */
    public function copyFromYear(Request $request)
    {
        $validated = $request->validate([
            'source_year' => 'required|string',
            'target_year' => 'required|string|different:source_year',
            'adjust_percentage' => 'nullable|numeric|min:-100|max:100',
        ]);

        $sourceRates = FeeRate::where('school_year', $validated['source_year'])->get();

        if ($sourceRates->isEmpty()) {
            return back()->withErrors(['error' => 'No rates found for the source school year.']);
        }

        $adjustMultiplier = 1 + (($validated['adjust_percentage'] ?? 0) / 100);
        $copiedCount = 0;

        foreach ($sourceRates as $rate) {
            // Check if already exists
            $exists = FeeRate::where('fee_type_id', $rate->fee_type_id)
                ->where('school_year', $validated['target_year'])
                ->where('semester', $rate->semester)
                ->where('student_category', $rate->student_category)
                ->exists();

            if (!$exists) {
                FeeRate::create([
                    'fee_type_id' => $rate->fee_type_id,
                    'school_year' => $validated['target_year'],
                    'semester' => $rate->semester,
                    'student_category' => $rate->student_category,
                    'amount' => round($rate->amount * $adjustMultiplier, 2),
                    'is_active' => true,
                ]);
                $copiedCount++;
            }
        }

        return back()->with('success', "Successfully copied {$copiedCount} rates to {$validated['target_year']}.");
    }
}
