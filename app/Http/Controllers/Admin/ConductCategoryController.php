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

    public function index()
    {
        return Inertia::render('Admin/Conduct/Index', [
            'categories' => $this->conductCategoryRepository->allWithCriteria(),
        ]);
    }

    public function store(StoreConductCategoryRequest $request)
    {
        $this->conductCategoryService->create($request->validated());

        return back()->with('success', 'Category created.');
    }

    public function update(UpdateConductCategoryRequest $request, ConductCategory $conductCategory)
    {
        $this->conductCategoryService->update($conductCategory, $request->validated());

        return back()->with('success', 'Category updated.');
    }

    public function destroy(ConductCategory $conductCategory)
    {
        if (! $this->conductCategoryService->delete($conductCategory)) {
            return back()->withErrors(['error' => 'Cannot delete a category that has grades recorded.']);
        }

        return back()->with('success', 'Category deleted.');
    }

    public function storeCriteria(StoreConductCriteriaRequest $request, ConductCategory $conductCategory)
    {
        $this->conductCategoryService->addCriteria($conductCategory, $request->validated());

        return back()->with('success', 'Criterion added.');
    }

    public function destroyCriteria(ConductCriteria $conductCriteria)
    {
        if (! $this->conductCategoryService->deleteCriteria($conductCriteria)) {
            return back()->withErrors(['error' => 'Cannot delete a criterion that has grades recorded.']);
        }

        return back()->with('success', 'Criterion deleted.');
    }
}
