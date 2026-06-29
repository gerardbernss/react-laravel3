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

    public function index()
    {
        return Inertia::render('Admin/DiscountTypes/Index', $this->discountTypeService->indexData());
    }

    public function create()
    {
        return Inertia::render('Admin/DiscountTypes/Create', $this->discountTypeService->formOptions());
    }

    public function store(StoreDiscountTypeRequest $request)
    {
        $result = $this->discountTypeService->store($request->validated());

        if (! empty($result['error_field'])) {
            return back()->withErrors([$result['error_field'] => $result['error_message']]);
        }

        return redirect()->route('admin.discount-types.index')->with('success', 'Discount type created successfully.');
    }

    public function show(DiscountType $discountType)
    {
        return Inertia::render('Admin/DiscountTypes/Show', $this->discountTypeService->showData($discountType));
    }

    public function edit(DiscountType $discountType)
    {
        return Inertia::render('Admin/DiscountTypes/Edit', $this->discountTypeService->showData($discountType));
    }

    public function update(UpdateDiscountTypeRequest $request, DiscountType $discountType)
    {
        $result = $this->discountTypeService->update($discountType, $request->validated());

        if (! empty($result['error_field'])) {
            return back()->withErrors([$result['error_field'] => $result['error_message']]);
        }

        return redirect()->route('admin.discount-types.index')->with('success', 'Discount type updated successfully.');
    }

    public function destroy(DiscountType $discountType)
    {
        $result = $this->discountTypeService->destroy($discountType);

        if (! empty($result['error'])) {
            return back()->withErrors(['error' => $result['error']]);
        }

        return redirect()->route('admin.discount-types.index')->with('success', 'Discount type deleted successfully.');
    }

    public function toggleStatus(DiscountType $discountType)
    {
        $this->discountTypeService->toggleStatus($discountType);

        return back()->with('success', 'Discount type status updated successfully.');
    }
}
