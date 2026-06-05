<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\BlockSection;
use App\Models\GradeValidation;
use App\Models\Subject;
use Illuminate\Http\Request;
use Inertia\Inertia;

class GradeValidationController extends Controller
{
    private const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'];

    /**
     * List sections (admin) or own subjects (faculty) — mirrors GradebookController@index.
     */
    public function index()
    {
        $user = auth()->user();
        $isFaculty = $user && $user->hasRole('faculty');

        if ($isFaculty) {
            $subjects = Subject::where('user_id', $user->id)
                ->with('blockSections')
                ->get();

            $mySubjects = $subjects->flatMap(function ($subject) {
                return $subject->blockSections->map(fn($section) => [
                    'subject_id'       => $subject->id,
                    'subject_code'     => $subject->code,
                    'subject_name'     => $subject->name,
                    'block_section_id' => $section->id,
                    'section_code'     => $section->code,
                    'section_name'     => $section->name,
                    'grade_level'      => $section->grade_level,
                    'school_year'      => $section->school_year,
                ]);
            })->values();

            return Inertia::render('Admin/Gradebook/Validations/Index', [
                'isFaculty'   => true,
                'mySubjects'  => $mySubjects,
                'sections'    => [],
                'canFinalize' => false,
            ]);
        }

        $sections = BlockSection::query()
            ->withCount('subjects')
            ->orderBy('school_year', 'desc')
            ->orderBy('code')
            ->get();

        return Inertia::render('Admin/Gradebook/Validations/Index', [
            'isFaculty'   => false,
            'mySubjects'  => [],
            'sections'    => $sections,
            'canFinalize' => $user?->hasPermission('finalize-grades') ?? false,
        ]);
    }

    /**
     * Show subject × quarter validation grid for one section.
     */
    public function show(BlockSection $blockSection)
    {
        $user = auth()->user();
        $isFaculty = $user && $user->hasRole('faculty');

        $blockSection->load('subjects.faculty');
        $subjects = $blockSection->subjects;

        if ($isFaculty) {
            $subjects = $subjects->where('user_id', $user->id)->values();
            abort_if($subjects->isEmpty(), 403, 'You have no subjects in this section.');
        }

        $allValidations = GradeValidation::where('block_section_id', $blockSection->id)
            ->get()
            ->keyBy(fn($v) => "{$v->subject_id}_{$v->grading_quarter}");

        $subjectRows = $subjects->map(function ($subject) use ($allValidations) {
            $quarters = collect(self::QUARTERS)->mapWithKeys(function ($q) use ($subject, $allValidations) {
                $key = "{$subject->id}_{$q}";
                $validation = $allValidations->get($key);
                return [$q => [
                    'status'        => $validation?->status ?? 'draft',
                    'validation_id' => $validation?->id,
                ]];
            });

            return [
                'id'           => $subject->id,
                'code'         => $subject->code,
                'name'         => $subject->name,
                'faculty_name' => $subject->faculty?->name,
                'quarters'     => $quarters,
            ];
        })->values();

        return Inertia::render('Admin/Gradebook/Validations/Show', [
            'blockSection' => [
                'id'          => $blockSection->id,
                'code'        => $blockSection->code,
                'name'        => $blockSection->name,
                'grade_level' => $blockSection->grade_level,
                'school_year' => $blockSection->school_year,
            ],
            'subjects'    => $subjectRows,
            'quarters'    => self::QUARTERS,
            'isFaculty'   => $isFaculty,
            'canFinalize' => $user?->hasPermission('finalize-grades') ?? false,
        ]);
    }

    /**
     * Faculty submits grades for a subject/section/quarter.
     */
    public function submit(BlockSection $blockSection, Subject $subject, string $quarter)
    {
        abort_unless(in_array($quarter, self::QUARTERS), 404);
        $this->authorizeSubjectAccess($subject);

        $validation = GradeValidation::firstOrCreate(
            [
                'block_section_id' => $blockSection->id,
                'subject_id'       => $subject->id,
                'grading_quarter'  => $quarter,
                'school_year'      => $blockSection->school_year,
            ],
            ['status' => 'draft']
        );

        abort_if($validation->isLocked(), 403, 'These grades are already finalized.');
        abort_if($validation->isSubmitted(), 409, 'These grades are already submitted and awaiting approval.');

        $validation->update([
            'status'       => 'submitted',
            'submitted_at' => now(),
            'submitted_by' => auth()->id(),
            'rejection_reason' => null,
        ]);

        return back()->with('success', 'Grades submitted for validation.');
    }

    /**
     * Admin finalizes (approves) a submitted validation.
     */
    public function finalize(GradeValidation $gradeValidation)
    {
        abort_unless($gradeValidation->isSubmitted(), 409, 'Only submitted grades can be finalized.');

        $gradeValidation->update([
            'status'       => 'finalized',
            'finalized_at' => now(),
            'finalized_by' => auth()->id(),
        ]);

        return back()->with('success', 'Grades finalized.');
    }

    /**
     * Admin rejects a submitted validation (returns to draft).
     */
    public function reject(Request $request, GradeValidation $gradeValidation)
    {
        abort_unless($gradeValidation->isSubmitted(), 409, 'Only submitted grades can be rejected.');

        $request->validate([
            'rejection_reason' => 'required|string|max:500',
        ]);

        $gradeValidation->update([
            'status'           => 'draft',
            'submitted_at'     => null,
            'submitted_by'     => null,
            'rejection_reason' => $request->rejection_reason,
        ]);

        return back()->with('success', 'Grades returned to faculty for revision.');
    }

    private function authorizeSubjectAccess(Subject $subject): void
    {
        $user = auth()->user();
        if ($user && $user->hasRole('faculty') && $subject->user_id !== $user->id) {
            abort(403, 'You are not assigned to this subject.');
        }
    }
}
