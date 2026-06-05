<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Attendance;
use App\Models\BlockSection;
use App\Models\GradeComponent;
use App\Models\GradeValidation;
use App\Models\StudentEnrollment;
use App\Models\StudentEnrollmentSubject;
use App\Models\StudentRawScore;
use App\Models\Subject;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class GradebookController extends Controller
{
    private const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'];

    /**
     * List block sections (same faculty filtering as GradesController).
     */
    public function index()
    {
        $user = Auth::user();

        if ($user && $user->hasRole('faculty')) {
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
                    'semester'         => $section->semester,
                ]);
            })->values();

            return Inertia::render('Admin/Gradebook/Index', [
                'isFaculty'     => true,
                'mySubjects'    => $mySubjects,
                'blockSections' => [],
            ]);
        }

        $blockSections = BlockSection::query()
            ->withCount('subjects')
            ->withCount('enrollments')
            ->orderBy('school_year', 'desc')
            ->orderBy('code')
            ->get();

        return Inertia::render('Admin/Gradebook/Index', [
            'isFaculty'     => false,
            'mySubjects'    => [],
            'blockSections' => $blockSections,
        ]);
    }

    /**
     * Show subject × quarter matrix for a block section.
     */
    public function show(BlockSection $blockSection)
    {
        $user = Auth::user();
        $blockSection->load('subjects.faculty');

        $subjects = $blockSection->subjects;
        if ($user && $user->hasRole('faculty')) {
            $subjects = $subjects->where('user_id', $user->id)->values();
        }

        $totalStudents = StudentEnrollment::where('block_section_id', $blockSection->id)->count();

        $subjectData = $subjects->map(function ($subject) use ($blockSection, $totalStudents) {
            $quarterData = collect(self::QUARTERS)->mapWithKeys(function ($quarter) use ($subject, $blockSection, $totalStudents) {
                $components = GradeComponent::forSubjectSection($subject->id, $blockSection->id)
                    ->forQuarter($quarter)
                    ->orderBy('order')
                    ->get();

                $scoredStudents = 0;
                if ($components->isNotEmpty() && $totalStudents > 0) {
                    $scoredStudents = StudentRawScore::whereIn('grade_component_id', $components->pluck('id'))
                        ->whereNotNull('raw_score')
                        ->distinct('student_enrollment_subject_id')
                        ->count('student_enrollment_subject_id');
                }

                $validation = GradeValidation::forSubjectSectionQuarter($subject->id, $blockSection->id, $quarter)->first();

                return [$quarter => [
                    'component_count'    => $components->count(),
                    'scored_students'    => $scoredStudents,
                    'total_students'     => $totalStudents,
                    'weight_total'       => $components->sum('weight'),
                    'validation_status'  => $validation?->status ?? 'draft',
                ]];
            });

            return [
                'id'           => $subject->id,
                'code'         => $subject->code,
                'name'         => $subject->name,
                'faculty_name' => $subject->faculty?->name,
                'quarters'     => $quarterData,
            ];
        });

        /** @var \App\Models\User|null $user */
        $user = Auth::user();

        return Inertia::render('Admin/Gradebook/Show', [
            'blockSection' => [
                'id'          => $blockSection->id,
                'code'        => $blockSection->code,
                'name'        => $blockSection->name,
                'grade_level' => $blockSection->grade_level,
                'school_year' => $blockSection->school_year,
                'semester'    => $blockSection->semester,
            ],
            'subjects'         => $subjectData,
            'quarters'         => self::QUARTERS,
            'totalStudents'    => $totalStudents,
            'isFaculty'        => $user?->hasRole('faculty') ?? false,
            'canManageConduct' => $user?->hasPermission('manage-conduct-grades') ?? false,
        ]);
    }

    /**
     * Show/manage grading components for a subject + quarter.
     */
    public function components(BlockSection $blockSection, Subject $subject, string $quarter)
    {
        abort_unless(in_array($quarter, self::QUARTERS), 404);
        $this->authorizeSubjectAccess($blockSection, $subject);

        $components = GradeComponent::forSubjectSection($subject->id, $blockSection->id)
            ->forQuarter($quarter)
            ->orderBy('order')
            ->get();

        return Inertia::render('Admin/Gradebook/Components', [
            'blockSection' => [
                'id'          => $blockSection->id,
                'code'        => $blockSection->code,
                'name'        => $blockSection->name,
                'school_year' => $blockSection->school_year,
            ],
            'subject'    => ['id' => $subject->id, 'code' => $subject->code, 'name' => $subject->name],
            'quarter'    => $quarter,
            'components' => $components,
            'weightTotal' => $components->sum('weight'),
        ]);
    }

    /**
     * Create a grading component.
     */
    public function storeComponent(Request $request)
    {
        $data = $request->validate([
            'block_section_id' => 'required|exists:block_sections,id',
            'subject_id'       => 'required|exists:subjects,id',
            'grading_quarter'  => 'required|in:Q1,Q2,Q3,Q4',
            'name'             => 'required|string|max:100',
            'hps'              => 'required|numeric|min:0.01|max:9999',
            'weight'           => 'required|numeric|min:0.01|max:100',
        ]);

        $blockSection = BlockSection::findOrFail($data['block_section_id']);
        $subject = Subject::findOrFail($data['subject_id']);
        $this->authorizeSubjectAccess($blockSection, $subject);
        $this->abortIfLocked($blockSection->id, $subject->id, $data['grading_quarter']);

        $maxOrder = GradeComponent::forSubjectSection($subject->id, $blockSection->id)
            ->forQuarter($data['grading_quarter'])
            ->max('order') ?? 0;

        GradeComponent::create([
            ...$data,
            'order'       => $maxOrder + 1,
            'school_year' => $blockSection->school_year,
            'created_by'  => Auth::id(),
        ]);

        return back()->with('success', 'Component added successfully.');
    }

    /**
     * Delete a grading component (also deletes its raw scores via cascade).
     */
    public function deleteComponent(GradeComponent $component)
    {
        $blockSection = BlockSection::findOrFail($component->block_section_id);
        $subject = Subject::findOrFail($component->subject_id);
        $this->authorizeSubjectAccess($blockSection, $subject);
        $this->abortIfLocked($blockSection->id, $subject->id, $component->grading_quarter);

        $component->delete();

        return back()->with('success', 'Component deleted.');
    }

    /**
     * Show the bulk score entry grid.
     */
    public function entry(BlockSection $blockSection, Subject $subject, string $quarter)
    {
        abort_unless(in_array($quarter, self::QUARTERS), 404);
        $this->authorizeSubjectAccess($blockSection, $subject);

        $components = GradeComponent::forSubjectSection($subject->id, $blockSection->id)
            ->forQuarter($quarter)
            ->orderBy('order')
            ->get();

        $enrollments = StudentEnrollment::where('block_section_id', $blockSection->id)
            ->with([
                'student.personalData:id,last_name,first_name,middle_name',
                'enrollmentSubjects' => fn($q) => $q->where('subject_id', $subject->id),
            ])
            ->get()
            ->filter(fn($e) => $e->enrollmentSubjects->isNotEmpty());

        $componentIds = $components->pluck('id');

        // Attendance summary keyed by enrollment_id
        $enrollmentIds = $enrollments->pluck('id');
        $attendanceRecords = Attendance::whereIn('student_enrollment_id', $enrollmentIds)
            ->where('subject_id', $subject->id)
            ->get()
            ->groupBy('student_enrollment_id');

        $students = $enrollments->map(function ($enrollment) use ($subject, $components, $componentIds, $attendanceRecords) {
            $es = $enrollment->enrollmentSubjects->first();
            $personalData = $enrollment->student?->personalData;

            $scores = [];
            if ($es) {
                $rawScores = StudentRawScore::where('student_enrollment_subject_id', $es->id)
                    ->whereIn('grade_component_id', $componentIds)
                    ->get()
                    ->keyBy('grade_component_id');

                foreach ($components as $component) {
                    $scores[$component->id] = $rawScores->get($component->id)?->raw_score;
                }
            }

            $attRecords = $attendanceRecords->get($enrollment->id, collect());

            return [
                'enrollment_id'              => $enrollment->id,
                'enrollment_subject_id'      => $es?->id,
                'student_id_number'          => $enrollment->student?->student_id_number,
                'last_name'                  => $personalData?->last_name,
                'first_name'                 => $personalData?->first_name,
                'middle_name'                => $personalData?->middle_name,
                'grade'                      => $es?->grade,
                'grade_status'               => $es?->grade_status,
                'scores'                     => $scores,
                'absences'                   => $attRecords->where('status', Attendance::STATUS_ABSENT)->count(),
                'tardies'                    => $attRecords->where('status', Attendance::STATUS_LATE)->count(),
            ];
        })->sortBy('last_name')->values();

        $validation = GradeValidation::forSubjectSectionQuarter($subject->id, $blockSection->id, $quarter)->first();
        $validationStatus = $validation?->status ?? 'draft';
        /** @var \App\Models\User|null $user */
        $user = Auth::user();

        return Inertia::render('Admin/Gradebook/Entry', [
            'blockSection' => [
                'id'          => $blockSection->id,
                'code'        => $blockSection->code,
                'name'        => $blockSection->name,
                'school_year' => $blockSection->school_year,
            ],
            'subject'          => ['id' => $subject->id, 'code' => $subject->code, 'name' => $subject->name],
            'quarter'          => $quarter,
            'components'       => $components,
            'students'         => $students,
            'weightTotal'      => $components->sum('weight'),
            'validationStatus' => $validationStatus,
            'validationId'     => $validation?->id,
            'canSubmit'        => $user?->hasPermission('submit-grades') ?? false,
            'canFinalize'      => $user?->hasPermission('finalize-grades') ?? false,
        ]);
    }

    /**
     * Save raw scores and recompute equivalent grades.
     */
    public function saveScores(Request $request, BlockSection $blockSection, Subject $subject, string $quarter)
    {
        abort_unless(in_array($quarter, self::QUARTERS), 404);
        $this->authorizeSubjectAccess($blockSection, $subject);
        $this->abortIfLocked($blockSection->id, $subject->id, $quarter);

        $components = GradeComponent::forSubjectSection($subject->id, $blockSection->id)
            ->forQuarter($quarter)
            ->get()
            ->keyBy('id');

        $request->validate([
            'scores'   => 'required|array',
            'scores.*' => 'required|array',
        ]);

        DB::transaction(function () use ($request, $components, $subject, $blockSection) {
            $affectedEnrollmentIds = collect();

            foreach ($request->scores as $enrollmentSubjectId => $componentScores) {
                $es = StudentEnrollmentSubject::findOrFail($enrollmentSubjectId);

                foreach ($componentScores as $componentId => $rawScore) {
                    $component = $components->get($componentId);
                    if (!$component) {
                        continue;
                    }

                    $value = $rawScore === null || $rawScore === '' ? null : (float) $rawScore;

                    // Clamp to HPS
                    if ($value !== null) {
                        $value = max(0, min($value, $component->hps));
                    }

                    StudentRawScore::updateOrCreate(
                        [
                            'grade_component_id'             => $componentId,
                            'student_enrollment_subject_id'  => $enrollmentSubjectId,
                        ],
                        ['raw_score' => $value]
                    );
                }

                // Recompute equivalent grade for this subject
                $this->recomputeEquivalentGrade($es, $subject->id, $blockSection->id);
                $affectedEnrollmentIds->push($es->student_enrollment_id);
            }

            // Recalculate GWA for affected enrollments
            $affectedEnrollmentIds->unique()->each(function ($enrollmentId) {
                $enrollment = StudentEnrollment::find($enrollmentId);
                if ($enrollment) {
                    $enrollment->calculateGWA();
                    $enrollment->getUnitsEarned();
                }
            });
        });

        return back()->with('success', 'Scores saved successfully.');
    }

    /**
     * Compute the DepEd equivalent grade from all quarters' raw scores for a subject.
     * EG = (PS × 0.50) + 50, clamped to [60, 100].
     */
    private function recomputeEquivalentGrade(StudentEnrollmentSubject $es, int $subjectId, int $blockSectionId): void
    {
        $allComponents = GradeComponent::forSubjectSection($subjectId, $blockSectionId)
            ->with(['rawScores' => fn($q) => $q->where('student_enrollment_subject_id', $es->id)])
            ->get();

        if ($allComponents->isEmpty()) {
            return;
        }

        $totalWeight = $allComponents->sum('weight');
        if ($totalWeight == 0) {
            return;
        }

        $weightedSum = 0;
        $hasAnyScore = false;

        foreach ($allComponents as $component) {
            $rawScore = $component->rawScores->first();
            if ($rawScore === null || $rawScore->raw_score === null) {
                continue;
            }
            $hasAnyScore = true;
            $componentPct = $component->hps > 0 ? ($rawScore->raw_score / $component->hps) * 100 : 0;
            $weightedSum += $componentPct * ($component->weight / $totalWeight);
        }

        if (!$hasAnyScore) {
            return;
        }

        $ps = $weightedSum;
        $eg = ($ps * 0.50) + 50;
        $eg = max(60, min(100, $eg));

        $es->setGrade(round($eg, 2));
    }

    /**
     * Abort if a faculty member tries to access a subject they don't own.
     */
    private function authorizeSubjectAccess(BlockSection $blockSection, Subject $subject): void
    {
        $user = Auth::user();
        if ($user && $user->hasRole('faculty') && $subject->user_id !== $user->id) {
            abort(403, 'You are not assigned to this subject.');
        }
    }

    /**
     * Abort with 403 if grades are finalized (locked).
     */
    private function abortIfLocked(int $blockSectionId, int $subjectId, string $quarter): void
    {
        $validation = GradeValidation::forSubjectSectionQuarter($subjectId, $blockSectionId, $quarter)->first();
        if ($validation && $validation->isLocked()) {
            abort(403, 'Grades for this quarter are finalized and cannot be modified.');
        }
    }
}
