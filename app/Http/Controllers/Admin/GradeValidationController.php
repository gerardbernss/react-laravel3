<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\RejectGradeValidationRequest;
use App\Models\BlockSection;
use App\Models\GradeValidation;
use App\Models\Subject;
use App\Services\Admin\GradeValidationService;
use Inertia\Inertia;

class GradeValidationController extends Controller
{
    private const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'];

    public function __construct(private GradeValidationService $gradeValidationService)
    {
    }

    /**
     * List sections pending grade validation — faculty see only their sections, admins see all.
     */
    public function index()
    {
        $data = $this->gradeValidationService->indexData(auth()->user());

        return Inertia::render('Admin/Gradebook/Validations/Index', $data);
    }

    /**
     * Show the validation status of each subject and quarter for a section.
     */
    public function show(BlockSection $blockSection)
    {
        $data = $this->gradeValidationService->showData($blockSection, auth()->user());

        return Inertia::render('Admin/Gradebook/Validations/Show', [
            'blockSection' => [
                'id' => $blockSection->id,
                'code' => $blockSection->code,
                'name' => $blockSection->name,
                'grade_level' => $blockSection->grade_level,
                'school_year' => $blockSection->school_year,
            ],
            'subjects' => $data['subjectRows'],
            'quarters' => self::QUARTERS,
            'isFaculty' => $data['isFaculty'],
            'canFinalize' => $data['canFinalize'],
        ]);
    }

    /**
     * Submit grades for a subject and quarter for admin validation — returns 404 for invalid quarter values.
     */
    public function submit(BlockSection $blockSection, Subject $subject, string $quarter)
    {
        abort_unless(in_array($quarter, self::QUARTERS), 404);

        $this->gradeValidationService->submit($blockSection, $subject, $quarter, auth()->user());

        return back()->with('success', 'Grades submitted for validation.');
    }

    /**
     * Finalize a submitted grade validation, locking the grades from further edits.
     */
    public function finalize(GradeValidation $gradeValidation)
    {
        $this->gradeValidationService->finalize($gradeValidation, auth()->user());

        return back()->with('success', 'Grades finalized.');
    }

    /**
     * Reject a submitted grade validation and return it to the faculty with a reason for revision.
     */
    public function reject(RejectGradeValidationRequest $request, GradeValidation $gradeValidation)
    {
        $this->gradeValidationService->reject($gradeValidation, $request->validated('rejection_reason'));

        return back()->with('success', 'Grades returned to faculty for revision.');
    }
}
