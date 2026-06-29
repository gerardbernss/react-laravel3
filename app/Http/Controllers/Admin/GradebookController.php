<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\SaveScoresRequest;
use App\Http\Requests\Admin\StoreGradeComponentRequest;
use App\Models\BlockSection;
use App\Models\GradeComponent;
use App\Models\Subject;
use App\Services\Admin\GradebookService;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class GradebookController extends Controller
{
    private const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'];

    public function __construct(private GradebookService $gradebookService)
    {
    }

    public function index()
    {
        return Inertia::render('Admin/Gradebook/Index', $this->gradebookService->indexData(Auth::user()));
    }

    public function show(BlockSection $blockSection)
    {
        $data = $this->gradebookService->showData($blockSection, Auth::user());

        return Inertia::render('Admin/Gradebook/Show', [
            'blockSection' => [
                'id' => $blockSection->id,
                'code' => $blockSection->code,
                'name' => $blockSection->name,
                'grade_level' => $blockSection->grade_level,
                'school_year' => $blockSection->school_year,
                'semester' => $blockSection->semester,
            ],
            'subjects' => $data['subjectData'],
            'quarters' => self::QUARTERS,
            'totalStudents' => $data['totalStudents'],
            'isFaculty' => $data['isFaculty'],
            'canManageConduct' => $data['canManageConduct'],
        ]);
    }

    public function components(BlockSection $blockSection, Subject $subject, string $quarter)
    {
        abort_unless(in_array($quarter, self::QUARTERS), 404);

        $data = $this->gradebookService->componentsData($blockSection, $subject, $quarter, Auth::user());

        return Inertia::render('Admin/Gradebook/Components', [
            'blockSection' => [
                'id' => $blockSection->id,
                'code' => $blockSection->code,
                'name' => $blockSection->name,
                'school_year' => $blockSection->school_year,
            ],
            'subject' => ['id' => $subject->id, 'code' => $subject->code, 'name' => $subject->name],
            'quarter' => $quarter,
            'components' => $data['components'],
            'weightTotal' => $data['weightTotal'],
        ]);
    }

    public function storeComponent(StoreGradeComponentRequest $request)
    {
        $this->gradebookService->storeComponent($request->validated(), Auth::user());

        return back()->with('success', 'Component added successfully.');
    }

    public function deleteComponent(GradeComponent $component)
    {
        $this->gradebookService->deleteComponent($component, Auth::user());

        return back()->with('success', 'Component deleted.');
    }

    public function entry(BlockSection $blockSection, Subject $subject, string $quarter)
    {
        abort_unless(in_array($quarter, self::QUARTERS), 404);

        $data = $this->gradebookService->entryData($blockSection, $subject, $quarter, Auth::user());

        return Inertia::render('Admin/Gradebook/Entry', [
            'blockSection' => [
                'id' => $blockSection->id,
                'code' => $blockSection->code,
                'name' => $blockSection->name,
                'school_year' => $blockSection->school_year,
            ],
            'subject' => ['id' => $subject->id, 'code' => $subject->code, 'name' => $subject->name],
            'quarter' => $quarter,
            'components' => $data['components'],
            'students' => $data['students'],
            'weightTotal' => $data['weightTotal'],
            'validationStatus' => $data['validationStatus'],
            'validationId' => $data['validationId'],
            'canSubmit' => $data['canSubmit'],
            'canFinalize' => $data['canFinalize'],
        ]);
    }

    public function saveScores(SaveScoresRequest $request, BlockSection $blockSection, Subject $subject, string $quarter)
    {
        abort_unless(in_array($quarter, self::QUARTERS), 404);

        $this->gradebookService->saveScores($request->validated('scores'), $blockSection, $subject, $quarter, Auth::user());

        return back()->with('success', 'Scores saved successfully.');
    }
}
