<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\BlockSection;
use App\Models\StudentEnrollment;
use App\Models\StudentEnrollmentSubject;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class GradesController extends Controller
{
    /**
     * Display a listing of block sections for grade management.
     */
    public function index(Request $request)
    {
        $query = BlockSection::query()
            ->withCount(['subjects'])
            ->addSelect(['enrolled_count' => StudentEnrollment::selectRaw('count(*)')
                ->whereColumn('block_section_id', 'block_sections.id')
            ]);

        // Search filter
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('code', 'like', "%{$search}%")
                    ->orWhere('name', 'like', "%{$search}%")
                    ->orWhere('adviser', 'like', "%{$search}%");
            });
        }

        // School year filter
        if ($request->filled('school_year')) {
            $query->where('school_year', $request->school_year);
        }

        // Semester filter
        if ($request->filled('semester')) {
            $query->where('semester', $request->semester);
        }

        // Grade level filter
        if ($request->filled('grade_level')) {
            $query->where('grade_level', $request->grade_level);
        }

        // Faculty filter — faculty members only see sections where they teach a subject
        $user = auth()->user();
        if ($user && $user->hasRole('faculty')) {
            $query->whereHas('subjects', function ($q) use ($user) {
                $q->where('subjects.user_id', $user->id);
            });
        }

        $blockSections = $query->orderBy('school_year', 'desc')
            ->orderBy('code')
            ->paginate(15)
            ->withQueryString();

        // Get distinct school years and semesters for filter dropdowns
        $schoolYears = BlockSection::distinct()->orderBy('school_year', 'desc')->pluck('school_year')->filter()->values();
        $semesters = BlockSection::distinct()->pluck('semester')->filter()->values();

        return Inertia::render('Admin/Grades/Index', [
            'blockSections' => $blockSections,
            'filters' => $request->only(['search', 'school_year', 'semester', 'grade_level']),
            'schoolYears' => $schoolYears,
            'semesters' => $semesters,
        ]);
    }

    /**
     * Display the grade sheet for a specific block section.
     */
    public function show(BlockSection $blockSection, Request $request)
    {
        // Load the section's subjects
        $blockSection->load('subjects');

        // Determine subject filter for faculty — they only see their assigned subjects
        $user = auth()->user();
        $assignedSubjectIds = null;
        if ($user && $user->hasRole('faculty')) {
            $assignedSubjectIds = $blockSection->subjects()
                ->where('subjects.user_id', $user->id)
                ->pluck('subjects.id')
                ->toArray();
            // Filter the subjects relation so column headers only show assigned subjects
            $blockSection->setRelation(
                'subjects',
                $blockSection->subjects->whereIn('id', $assignedSubjectIds)->values()
            );
        }

        // Get all enrollments for this section with students and their subject grades
        $enrollments = StudentEnrollment::where('block_section_id', $blockSection->id)
            ->with([
                'student.personalData:id,last_name,first_name,middle_name',
                'enrollmentSubjects.subject:id,code,name,units',
            ])
            ->orderBy(
                DB::raw('(SELECT last_name FROM applicant_personal_data
                    JOIN students ON students.applicant_personal_data_id = applicant_personal_data.id
                    WHERE students.id = student_enrollments.student_id)'),
                'asc'
            )
            ->get();

        // Transform enrollments for the frontend
        $students = $enrollments->map(function ($enrollment) use ($assignedSubjectIds) {
            $student = $enrollment->student;
            $personalData = $student?->personalData;

            $enrollmentSubjects = $enrollment->enrollmentSubjects;
            if ($assignedSubjectIds !== null) {
                $enrollmentSubjects = $enrollmentSubjects->whereIn('subject_id', $assignedSubjectIds);
            }

            return [
                'enrollment_id' => $enrollment->id,
                'student_id' => $student?->id,
                'student_id_number' => $student?->student_id_number,
                'last_name' => $personalData?->last_name,
                'first_name' => $personalData?->first_name,
                'middle_name' => $personalData?->middle_name,
                'gwa' => $enrollment->gwa,
                'status' => $enrollment->status,
                'subjects' => $enrollmentSubjects->map(function ($es) {
                    return [
                        'id' => $es->id,
                        'subject_id' => $es->subject_id,
                        'subject_code' => $es->subject?->code,
                        'subject_name' => $es->subject?->name,
                        'units' => $es->units,
                        'grade' => $es->grade,
                        'grade_status' => $es->grade_status,
                    ];
                }),
            ];
        });

        // Compute statistics (scoped to faculty's subjects if applicable)
        $allSubjectGrades = $enrollments->flatMap(function ($e) use ($assignedSubjectIds) {
            $subjects = $e->enrollmentSubjects;
            if ($assignedSubjectIds !== null) {
                $subjects = $subjects->whereIn('subject_id', $assignedSubjectIds);
            }
            return $subjects;
        });
        $gradedCount = $allSubjectGrades->whereNotNull('grade')->count();
        $totalSubjectEntries = $allSubjectGrades->count();
        $passedCount = $allSubjectGrades->where('grade_status', 'Passed')->count();
        $failedCount = $allSubjectGrades->where('grade_status', 'Failed')->count();
        $incCount = $allSubjectGrades->where('grade_status', 'INC')->count();

        $avgGwa = $enrollments->whereNotNull('gwa')->avg('gwa');

        $statistics = [
            'total_students' => $enrollments->count(),
            'graded_count' => $gradedCount,
            'total_subject_entries' => $totalSubjectEntries,
            'passed_count' => $passedCount,
            'failed_count' => $failedCount,
            'incomplete_count' => $incCount,
            'average_gwa' => $avgGwa ? round($avgGwa, 2) : null,
            'pass_rate' => $gradedCount > 0 ? round(($passedCount / max($passedCount + $failedCount, 1)) * 100, 1) : null,
        ];

        return Inertia::render('Admin/Grades/GradeSheet', [
            'blockSection' => $blockSection,
            'students' => $students,
            'statistics' => $statistics,
        ]);
    }

    /**
     * Update grades for a block section.
     */
    public function update(Request $request, BlockSection $blockSection)
    {
        $request->validate([
            'grades' => 'required|array',
            'grades.*.id' => 'required|exists:student_enrollment_subjects,id',
            'grades.*.grade' => 'nullable|numeric|min:1|max:5',
            'grades.*.grade_status' => 'nullable|in:Passed,Failed,INC,DRP,W',
        ]);

        // Determine which subject IDs the current user is allowed to grade
        $user = auth()->user();
        $allowedSubjectIds = null;
        if ($user && $user->hasRole('faculty')) {
            $allowedSubjectIds = $blockSection->subjects()
                ->where('subjects.user_id', $user->id)
                ->pluck('subjects.id')
                ->toArray();
        }

        DB::transaction(function () use ($request, $allowedSubjectIds) {
            $enrollmentIds = collect();

            foreach ($request->grades as $gradeEntry) {
                $enrollmentSubject = StudentEnrollmentSubject::findOrFail($gradeEntry['id']);

                // Faculty can only update grades for their assigned subjects
                if ($allowedSubjectIds !== null && !in_array($enrollmentSubject->subject_id, $allowedSubjectIds)) {
                    continue;
                }

                if (isset($gradeEntry['grade_status']) && in_array($gradeEntry['grade_status'], ['INC', 'DRP', 'W'])) {
                    // Special status - no numeric grade
                    if ($gradeEntry['grade_status'] === 'INC') {
                        $enrollmentSubject->markAsIncomplete();
                    } elseif ($gradeEntry['grade_status'] === 'DRP') {
                        $enrollmentSubject->markAsDropped();
                    } else {
                        $enrollmentSubject->update([
                            'grade' => null,
                            'grade_status' => 'W',
                        ]);
                    }
                } elseif (isset($gradeEntry['grade']) && $gradeEntry['grade'] !== null) {
                    // Numeric grade - setGrade auto-determines pass/fail
                    $enrollmentSubject->setGrade((float) $gradeEntry['grade']);
                }

                $enrollmentIds->push($enrollmentSubject->student_enrollment_id);
            }

            // Recalculate GWA for all affected enrollments
            $enrollmentIds->unique()->each(function ($enrollmentId) {
                $enrollment = StudentEnrollment::find($enrollmentId);
                if ($enrollment) {
                    $enrollment->calculateGWA();
                    $enrollment->getUnitsEarned();
                }
            });
        });

        return back()->with('success', 'Grades saved successfully.');
    }
}
