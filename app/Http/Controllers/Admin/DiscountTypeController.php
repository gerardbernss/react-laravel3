<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\DiscountType;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DiscountTypeController extends Controller
{
    /**
     * Display a listing of discount types.
     */
    public function index(Request $request)
    {
        $query = DiscountType::query();

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('code', 'like', "%{$search}%");
            });
        }

        if ($request->filled('type')) {
            $query->where('discount_type', $request->type);
        }

        if ($request->filled('status')) {
            $query->where('is_active', $request->status === 'active');
        }

        $discountTypes = $query->orderBy('name')->paginate(15);

        return Inertia::render('Admin/DiscountTypes/Index', [
            'discountTypes' => $discountTypes,
            'filters' => [
                'search' => $request->search,
                'type' => $request->type,
                'status' => $request->status,
            ],
            'discountTypeOptions' => DiscountType::$discountTypes,
            'appliesToOptions' => DiscountType::$appliesTo,
        ]);
    }

    /**
     * Show the form for creating a new discount type.
     */
    public function create()
    {
        return Inertia::render('Admin/DiscountTypes/Create', [
            'discountTypeOptions' => DiscountType::$discountTypes,
            'appliesToOptions' => DiscountType::$appliesTo,
        ]);
    }

    /**
     * Store a newly created discount type.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:20|unique:discount_types,code',
            'discount_type' => 'required|in:percentage,fixed_amount',
            'value' => 'required|numeric|min:0',
            'applies_to' => 'required|in:tuition_only,all_fees,miscellaneous_only',
            'requires_verification' => 'boolean',
            'is_stackable' => 'boolean',
            'max_discount_cap' => 'nullable|numeric|min:0',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        // Validate percentage doesn't exceed 100
        if ($validated['discount_type'] === 'percentage' && $validated['value'] > 100) {
            return back()->withErrors(['value' => 'Percentage discount cannot exceed 100%.']);
        }

        DiscountType::create($validated);

        return redirect()->route('admin.discount-types.index')
            ->with('success', 'Discount type created successfully.');
    }

    /**
     * Display the specified discount type.
     */
    public function show(DiscountType $discountType)
    {
        return Inertia::render('Admin/DiscountTypes/Show', [
            'discountType' => $discountType,
            'discountTypeOptions' => DiscountType::$discountTypes,
            'appliesToOptions' => DiscountType::$appliesTo,
        ]);
    }

    /**
     * Show the form for editing the specified discount type.
     */
    public function edit(DiscountType $discountType)
    {
        return Inertia::render('Admin/DiscountTypes/Edit', [
            'discountType' => $discountType,
            'discountTypeOptions' => DiscountType::$discountTypes,
            'appliesToOptions' => DiscountType::$appliesTo,
        ]);
    }

    /**
     * Update the specified discount type.
     */
    public function update(Request $request, DiscountType $discountType)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:20|unique:discount_types,code,' . $discountType->id,
            'discount_type' => 'required|in:percentage,fixed_amount',
            'value' => 'required|numeric|min:0',
            'applies_to' => 'required|in:tuition_only,all_fees,miscellaneous_only',
            'requires_verification' => 'boolean',
            'is_stackable' => 'boolean',
            'max_discount_cap' => 'nullable|numeric|min:0',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        // Validate percentage doesn't exceed 100
        if ($validated['discount_type'] === 'percentage' && $validated['value'] > 100) {
            return back()->withErrors(['value' => 'Percentage discount cannot exceed 100%.']);
        }

        $discountType->update($validated);

        return redirect()->route('admin.discount-types.index')
            ->with('success', 'Discount type updated successfully.');
    }

    /**
     * Remove the specified discount type.
     */
    public function destroy(DiscountType $discountType)
    {
        // Check if discount type has been used in any assessments
        if ($discountType->assessmentDiscounts()->exists()) {
            return back()->withErrors(['error' => 'Cannot delete discount type that has been used in assessments.']);
        }

        $discountType->delete();

        return redirect()->route('admin.discount-types.index')
            ->with('success', 'Discount type deleted successfully.');
    }

    /**
     * Toggle the active status of the discount type.
     */
    public function toggleStatus(DiscountType $discountType)
    {
        $discountType->update(['is_active' => !$discountType->is_active]);

        return back()->with('success', 'Discount type status updated successfully.');
    }
}
