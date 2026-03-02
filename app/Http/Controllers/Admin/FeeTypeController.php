<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\FeeType;
use Illuminate\Http\Request;
use Inertia\Inertia;

class FeeTypeController extends Controller
{
    /**
     * Display a listing of fee types.
     */
    public function index(Request $request)
    {
        $query = FeeType::query();

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('code', 'like', "%{$search}%");
            });
        }

        if ($request->filled('category')) {
            $query->where('category', $request->category);
        }

        if ($request->filled('status')) {
            $query->where('is_active', $request->status === 'active');
        }

        $feeTypes = $query->orderBy('category')->orderBy('name')->paginate(15);

        return Inertia::render('Admin/FeeTypes/Index', [
            'feeTypes' => $feeTypes,
            'filters' => [
                'search' => $request->search,
                'category' => $request->category,
                'status' => $request->status,
            ],
            'categories' => FeeType::$categories,
            'appliesTo' => FeeType::$appliesTo,
        ]);
    }

    /**
     * Show the form for creating a new fee type.
     */
    public function create()
    {
        return Inertia::render('Admin/FeeTypes/Create', [
            'categories' => FeeType::$categories,
            'appliesTo' => FeeType::$appliesTo,
        ]);
    }

    /**
     * Store a newly created fee type.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:20|unique:fee_types,code',
            'category' => 'required|in:tuition,miscellaneous,laboratory,special',
            'is_per_unit' => 'boolean',
            'is_required' => 'boolean',
            'applies_to' => 'required|in:all,LES,JHS,SHS',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        FeeType::create($validated);

        return redirect()->route('admin.fee-types.index')
            ->with('success', 'Fee type created successfully.');
    }

    /**
     * Display the specified fee type.
     */
    public function show(FeeType $feeType)
    {
        $feeType->load(['rates' => function ($query) {
            $query->orderBy('school_year', 'desc')
                  ->orderBy('semester')
                  ->orderBy('student_category');
        }]);

        return Inertia::render('Admin/FeeTypes/Show', [
            'feeType' => $feeType,
            'categories' => FeeType::$categories,
            'appliesTo' => FeeType::$appliesTo,
        ]);
    }

    /**
     * Show the form for editing the specified fee type.
     */
    public function edit(FeeType $feeType)
    {
        return Inertia::render('Admin/FeeTypes/Edit', [
            'feeType' => $feeType,
            'categories' => FeeType::$categories,
            'appliesTo' => FeeType::$appliesTo,
        ]);
    }

    /**
     * Update the specified fee type.
     */
    public function update(Request $request, FeeType $feeType)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:20|unique:fee_types,code,' . $feeType->id,
            'category' => 'required|in:tuition,miscellaneous,laboratory,special',
            'is_per_unit' => 'boolean',
            'is_required' => 'boolean',
            'applies_to' => 'required|in:all,LES,JHS,SHS',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $feeType->update($validated);

        return redirect()->route('admin.fee-types.index')
            ->with('success', 'Fee type updated successfully.');
    }

    /**
     * Remove the specified fee type.
     */
    public function destroy(FeeType $feeType)
    {
        // Check if fee type has any rates or line items
        if ($feeType->rates()->exists()) {
            return back()->withErrors(['error' => 'Cannot delete fee type with existing rates.']);
        }

        if ($feeType->lineItems()->exists()) {
            return back()->withErrors(['error' => 'Cannot delete fee type used in assessments.']);
        }

        $feeType->delete();

        return redirect()->route('admin.fee-types.index')
            ->with('success', 'Fee type deleted successfully.');
    }

    /**
     * Toggle the active status of the fee type.
     */
    public function toggleStatus(FeeType $feeType)
    {
        $feeType->update(['is_active' => !$feeType->is_active]);

        return back()->with('success', 'Fee type status updated successfully.');
    }
}
