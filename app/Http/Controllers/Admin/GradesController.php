<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateGradesRequest;
use App\Models\BlockSection;
use App\Models\StudentEnrollment;
use App\Services\Admin\GradeService;
use Inertia\Inertia;

class GradesController extends Controller
{
    public function __construct(private GradeService $gradeService)
    {
    }

    public function index()
    {
        $user = auth()->user();

        $data = $user && $user->hasRole('faculty')
            ? $this->gradeService->facultyIndexData($user)
            : $this->gradeService->adminIndexData();

        return Inertia::render('Admin/Grades/Index', $data);
    }

    public function show(BlockSection $blockSection)
    {
        return Inertia::render(
            'Admin/Grades/GradeSheet',
            $this->gradeService->gradeSheetData($blockSection, auth()->user())
        );
    }

    public function showStudent(BlockSection $blockSection, StudentEnrollment $studentEnrollment)
    {
        return Inertia::render(
            'Admin/Grades/StudentGradeSheet',
            $this->gradeService->studentGradeSheetData($blockSection, $studentEnrollment, auth()->user())
        );
    }

    public function update(UpdateGradesRequest $request, BlockSection $blockSection)
    {
        $this->gradeService->saveGrades($blockSection, $request->validated('grades'), auth()->user());

        return back()->with('success', 'Grades saved successfully.');
    }
}
