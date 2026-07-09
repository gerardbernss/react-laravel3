<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreDiscountTypeRequest;
use App\Http\Requests\Admin\UpdateDiscountTypeRequest;
use App\Models\DiscountType;
use App\Services\Admin\DiscountTypeService;
use Inertia\Inertia;

class DiscountTypeController extends Controller
{
    public function __construct(private DiscountTypeService $discountTypeService)
    {
    }

    /**
     * List all discount types with usage counts.
     */
    public function index()
    {
        return Inertia::render('Admin/DiscountTypes/Index', $this->discountTypeService->indexData());
    }

    /**
     * Show the create discount type form.
     */
    public function create()
    {
        return Inertia::render('Admin/DiscountTypes/Create', $this->discountTypeService->formOptions());
    }

    /**
     * Save a new discount type, enforcing the one-non-stackable rule.
     */
    public function store(StoreDiscountTypeRequest $request)
    {
        $result = $this->discountTypeService->store($request->validated());

        if (! empty($result['error_field'])) {
            return back()->withErrors([$result['error_field'] => $result['error_message']]);
        }

        return redirect()->route('admin.discount-types.index')->with('success', 'Discount type created successfully.');
    }

    /**
     * Show a discount type's details.
     */
    public function show(DiscountType $discountType)
    {
        return Inertia::render('Admin/DiscountTypes/Show', $this->discountTypeService->showData($discountType));
    }

    /**
     * Show the edit form for an existing discount type.
     */
    public function edit(DiscountType $discountType)
    {
        return Inertia::render('Admin/DiscountTypes/Edit', $this->discountTypeService->showData($discountType));
    }

    /**
     * Update an existing discount type, enforcing the one-non-stackable rule.
     */
    public function update(UpdateDiscountTypeRequest $request, DiscountType $discountType)
    {
        $result = $this->discountTypeService->update($discountType, $request->validated());

        if (! empty($result['error_field'])) {
            return back()->withErrors([$result['error_field'] => $result['error_message']]);
        }

        return redirect()->route('admin.discount-types.index')->with('success', 'Discount type updated successfully.');
    }

    /**
     * Delete a discount type — blocked if it is in use on any assessment.
     */
    public function destroy(DiscountType $discountType)
    {
        $result = $this->discountTypeService->destroy($discountType);

        if (! empty($result['error'])) {
            return back()->withErrors(['error' => $result['error']]);
        }

        return redirect()->route('admin.discount-types.index')->with('success', 'Discount type deleted successfully.');
    }

    /**
     * Toggle the active/inactive status of a discount type.
     */
    public function toggleStatus(DiscountType $discountType)
    {
        $this->discountTypeService->toggleStatus($discountType);

        return back()->with('success', 'Discount type status updated successfully.');
    }
}
