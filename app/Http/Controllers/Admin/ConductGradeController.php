<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\SaveConductGradesRequest;
use App\Models\BlockSection;
use App\Services\Admin\ConductGradeService;
use Inertia\Inertia;

class ConductGradeController extends Controller
{
    private const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'];

    public function __construct(private ConductGradeService $conductGradeService)
    {
    }

    /**
     * Show the conduct grade entry sheet for a section and quarter — returns 404 for invalid quarter values.
     */
    public function index(BlockSection $blockSection, string $quarter)
    {
        abort_unless(in_array($quarter, self::QUARTERS), 404);

        $data = $this->conductGradeService->entryData($blockSection, $quarter);

        return Inertia::render('Admin/Conduct/Entry', [
            'blockSection' => [
                'id' => $blockSection->id,
                'code' => $blockSection->code,
                'name' => $blockSection->name,
                'school_year' => $blockSection->school_year,
            ],
            'quarter' => $quarter,
            'quarters' => self::QUARTERS,
            'categories' => $data['categories'],
            'students' => $data['students'],
        ]);
    }

    /**
     * Save conduct grades for all students in a section for the given quarter.
     */
    public function save(SaveConductGradesRequest $request, BlockSection $blockSection, string $quarter)
    {
        abort_unless(in_array($quarter, self::QUARTERS), 404);

        $this->conductGradeService->saveGrades($request->validated('grades'), $quarter);

        return back()->with('success', 'Conduct grades saved.');
    }
}
