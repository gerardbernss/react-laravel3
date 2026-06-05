<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ConductCategory;
use App\Models\ConductCriteria;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ConductCategoryController extends Controller
{
    public function index()
    {
        $categories = ConductCategory::with('criteria')
            ->orderBy('order')
            ->orderBy('name')
            ->get();

        return Inertia::render('Admin/Conduct/Index', [
            'categories' => $categories,
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name'        => 'required|string|max:100',
            'description' => 'nullable|string|max:500',
            'order'       => 'nullable|integer|min:0',
        ]);

        ConductCategory::create($data + ['is_active' => true]);

        return back()->with('success', 'Category created.');
    }

    public function update(Request $request, ConductCategory $conductCategory)
    {
        $data = $request->validate([
            'name'        => 'required|string|max:100',
            'description' => 'nullable|string|max:500',
            'order'       => 'nullable|integer|min:0',
            'is_active'   => 'boolean',
        ]);

        $conductCategory->update($data);

        return back()->with('success', 'Category updated.');
    }

    public function destroy(ConductCategory $conductCategory)
    {
        if ($conductCategory->criteria()->whereHas('grades')->exists()) {
            return back()->withErrors(['error' => 'Cannot delete a category that has grades recorded.']);
        }

        $conductCategory->delete();

        return back()->with('success', 'Category deleted.');
    }

    public function storeCriteria(Request $request, ConductCategory $conductCategory)
    {
        $data = $request->validate([
            'name'        => 'required|string|max:100',
            'description' => 'nullable|string|max:500',
            'max_score'   => 'required|numeric|min:1|max:100',
            'order'       => 'nullable|integer|min:0',
        ]);

        $conductCategory->criteria()->create($data);

        return back()->with('success', 'Criterion added.');
    }

    public function destroyCriteria(ConductCriteria $conductCriteria)
    {
        if ($conductCriteria->grades()->exists()) {
            return back()->withErrors(['error' => 'Cannot delete a criterion that has grades recorded.']);
        }

        $conductCriteria->delete();

        return back()->with('success', 'Criterion deleted.');
    }
}
