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

    public function create()
    {
        return Inertia::render('Admin/Fees/Create', [
            'categories' => Fee::$categories,
            'schoolLevels' => Fee::$schoolLevels,
            'semesters' => Fee::$semesters,
        ]);
    }

    public function store(StoreFeeRequest $request)
    {
        if (! $this->feeService->create($request->validated())) {
            return back()->withErrors(['code' => 'A fee with this code already exists for the selected school year, semester, and level.']);
        }

        return redirect()->route('admin.fees.index')->with('success', 'Fee created successfully.');
    }

    public function show(Fee $fee)
    {
        return Inertia::render('Admin/Fees/Show', [
            'fee' => $fee,
            'categories' => Fee::$categories,
            'schoolLevels' => Fee::$schoolLevels,
            'semesters' => Fee::$semesters,
        ]);
    }

    public function edit(Fee $fee)
    {
        return Inertia::render('Admin/Fees/Edit', [
            'fee' => $fee,
            'categories' => Fee::$categories,
            'schoolLevels' => Fee::$schoolLevels,
            'semesters' => Fee::$semesters,
        ]);
    }

    public function update(UpdateFeeRequest $request, Fee $fee)
    {
        if (! $this->feeService->update($fee, $request->validated())) {
            return back()->withErrors(['code' => 'A fee with this code already exists for the selected school year, semester, and level.']);
        }

        return redirect()->route('admin.fees.index')->with('success', 'Fee updated successfully.');
    }

    public function destroy(Fee $fee)
    {
        if (! $this->feeService->delete($fee)) {
            return back()->withErrors(['error' => 'Cannot delete a fee that has been used in student assessments.']);
        }

        return redirect()->route('admin.fees.index')->with('success', 'Fee deleted successfully.');
    }

    public function toggleStatus(Fee $fee)
    {
        $this->feeService->toggleStatus($fee);

        return back()->with('success', 'Fee status updated successfully.');
    }

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
