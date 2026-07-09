<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\CopyFeesFromYearRequest;
use App\Http\Requests\Admin\StoreFeeRequest;
use App\Http\Requests\Admin\UpdateFeeRequest;
use App\Models\Fee;
use App\Repositories\FeeRepository;
use App\Services\Admin\FeeService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class FeeController extends Controller
{
    public function __construct(
        private FeeRepository $feeRepository,
        private FeeService $feeService,
    ) {
    }

    /**
     * List fees filterable by school year, semester, school level, and category.
     */
    public function index(Request $request)
    {
        $filters = $request->only(['school_year', 'semester', 'school_level', 'category']);

        return Inertia::render('Admin/Fees/Index', [
            'fees' => $this->feeRepository->filteredOrdered($filters),
            'schoolYears' => $this->feeRepository->distinctSchoolYearsDesc(),
            'categories' => Fee::$categories,
            'schoolLevels' => Fee::$schoolLevels,
            'semesters' => Fee::$semesters,
            'filters' => $filters,
        ]);
    }

    /**
     * Show the create fee form with category, school level, and semester options.
     */
    public function create()
    {
        return Inertia::render('Admin/Fees/Create', [
            'categories' => Fee::$categories,
            'schoolLevels' => Fee::$schoolLevels,
            'semesters' => Fee::$semesters,
        ]);
    }

    /**
     * Save a new fee — blocked if a fee with the same code already exists for the same school year, semester, and level.
     */
    public function store(StoreFeeRequest $request)
    {
        if (! $this->feeService->create($request->validated())) {
            return back()->withErrors(['code' => 'A fee with this code already exists for the selected school year, semester, and level.']);
        }

        return redirect()->route('admin.fees.index')->with('success', 'Fee created successfully.');
    }

    /**
     * Show a fee's details.
     */
    public function show(Fee $fee)
    {
        return Inertia::render('Admin/Fees/Show', [
            'fee' => $fee,
            'categories' => Fee::$categories,
            'schoolLevels' => Fee::$schoolLevels,
            'semesters' => Fee::$semesters,
        ]);
    }

    /**
     * Show the edit form for an existing fee.
     */
    public function edit(Fee $fee)
    {
        return Inertia::render('Admin/Fees/Edit', [
            'fee' => $fee,
            'categories' => Fee::$categories,
            'schoolLevels' => Fee::$schoolLevels,
            'semesters' => Fee::$semesters,
        ]);
    }

    /**
     * Update an existing fee — blocked on duplicate code conflict for the same period and level.
     */
    public function update(UpdateFeeRequest $request, Fee $fee)
    {
        if (! $this->feeService->update($fee, $request->validated())) {
            return back()->withErrors(['code' => 'A fee with this code already exists for the selected school year, semester, and level.']);
        }

        return redirect()->route('admin.fees.index')->with('success', 'Fee updated successfully.');
    }

    /**
     * Delete a fee — blocked if it has already been applied to any student assessment.
     */
    public function destroy(Fee $fee)
    {
        if (! $this->feeService->delete($fee)) {
            return back()->withErrors(['error' => 'Cannot delete a fee that has been used in student assessments.']);
        }

        return redirect()->route('admin.fees.index')->with('success', 'Fee deleted successfully.');
    }

    /**
     * Toggle the active/inactive status of a fee.
     */
    public function toggleStatus(Fee $fee)
    {
        $this->feeService->toggleStatus($fee);

        return back()->with('success', 'Fee status updated successfully.');
    }

    /**
     * Copy all fees from a source school year to a target year, optionally applying a percentage adjustment to amounts.
     */
    public function copyFromYear(CopyFeesFromYearRequest $request)
    {
        $copied = $this->feeService->copyFromYear(
            $request->validated('source_year'),
            $request->validated('target_year'),
            $request->validated('adjust_percentage')
        );

        if ($copied === false) {
            return back()->withErrors(['error' => 'No fees found for the source school year.']);
        }

        return back()->with('success', "Copied {$copied} fees to {$request->validated('target_year')}.");
    }
}
