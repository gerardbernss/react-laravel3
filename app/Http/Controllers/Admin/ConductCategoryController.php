<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreConductCategoryRequest;
use App\Http\Requests\Admin\StoreConductCriteriaRequest;
use App\Http\Requests\Admin\UpdateConductCategoryRequest;
use App\Models\ConductCategory;
use App\Models\ConductCriteria;
use App\Repositories\ConductCategoryRepository;
use App\Services\Admin\ConductCategoryService;
use Inertia\Inertia;

class ConductCategoryController extends Controller
{
    public function __construct(
        private ConductCategoryRepository $conductCategoryRepository,
        private ConductCategoryService $conductCategoryService,
    ) {
    }

    /**
     * List all conduct categories with their criteria.
     */
    public function index()
    {
        return Inertia::render('Admin/Conduct/Index', [
            'categories' => $this->conductCategoryRepository->allWithCriteria(),
        ]);
    }

    /**
     * Save a new conduct category.
     */
    public function store(StoreConductCategoryRequest $request)
    {
        $this->conductCategoryService->create($request->validated());

        return back()->with('success', 'Category created.');
    }

    /**
     * Update an existing conduct category's name or details.
     */
    public function update(UpdateConductCategoryRequest $request, ConductCategory $conductCategory)
    {
        $this->conductCategoryService->update($conductCategory, $request->validated());

        return back()->with('success', 'Category updated.');
    }

    /**
     * Delete a conduct category — blocked if any of its criteria have grades recorded.
     */
    public function destroy(ConductCategory $conductCategory)
    {
        if (! $this->conductCategoryService->delete($conductCategory)) {
            return back()->withErrors(['error' => 'Cannot delete a category that has grades recorded.']);
        }

        return back()->with('success', 'Category deleted.');
    }

    /**
     * Add a new criterion under the given conduct category.
     */
    public function storeCriteria(StoreConductCriteriaRequest $request, ConductCategory $conductCategory)
    {
        $this->conductCategoryService->addCriteria($conductCategory, $request->validated());

        return back()->with('success', 'Criterion added.');
    }

    /**
     * Delete a conduct criterion — blocked if it has grades recorded.
     */
    public function destroyCriteria(ConductCriteria $conductCriteria)
    {
        if (! $this->conductCategoryService->deleteCriteria($conductCriteria)) {
            return back()->withErrors(['error' => 'Cannot delete a criterion that has grades recorded.']);
        }

        return back()->with('success', 'Criterion deleted.');
    }
}
