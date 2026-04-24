<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\BlockSection;
use App\Models\Student;
use App\Models\StudentEnrollment;
use App\Models\StudentEnrollmentSubject;
use App\Models\Subject;
use Illuminate\Http\Request;
use Inertia\Inertia;

class BlockSectionsController extends Controller
{
    /**
     * Display a listing of block sections.
     */
    public function index()
    {
        $blockSections = BlockSection::with('subjects')
            ->orderBy('grade_level')
            ->orderBy('name')
            ->get();

        $schoolYears = BlockSection::distinct()->pluck('school_year')->sort()->values();

        return Inertia::render('Admin/BlockSections/Index', [
            'blockSections' => $blockSections,
            'schoolYears' => $schoolYears,
        ]);
    }

    /**
     * Show the form for creating a new block section.
     */
    public function create()
    {
        $subjects = Subject::active()->orderBy('code')->get();

        return Inertia::render('Admin/BlockSections/Create', [
            'subjects' => $subjects,
        ]);
    }

    /**
     * Store a newly created block section.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:block_sections,code',
            'grade_level' => 'required|string',
            'school_year' => 'required|string',
            'semester' => 'nullable|in:First Semester,Second Semester,Summer,Full Year',
            'adviser' => 'nullable|string|max:255',
            'room' => 'nullable|string|max:50',
            'capacity' => 'required|integer|min:1|max:100',
            'schedule' => 'nullable|string',
            'is_active' => 'boolean',
            'subjects' => 'nullable|array',
            'subjects.*.subject_id' => 'required|exists:subjects,id',
        ]);

        $blockSection = BlockSection::create([
            'name' => $validated['name'],
            'code' => $validated['code'],
            'grade_level' => $validated['grade_level'],
            'school_year' => $validated['school_year'],
            'semester' => $validated['semester'] ?? null,
            'adviser' => $validated['adviser'] ?? null,
            'room' => $validated['room'] ?? null,
            'capacity' => $validated['capacity'],
            'schedule' => $validated['schedule'] ?? null,
            'is_active' => $validated['is_active'] ?? true,
        ]);

        // Attach subjects if provided
        if (!empty($validated['subjects'])) {
            $subjectIds = array_column($validated['subjects'], 'subject_id');
            $blockSection->subjects()->attach($subjectIds);
        }

        return redirect()->route('block-sections.index')
            ->with('success', 'Block section created successfully.');
    }

    /**
     * Display the specified block section.
     */
    public function show(BlockSection $blockSection)
    {
        $blockSection->load('subjects');

        // Students currently assigned to this section
        $enrolledStudents = StudentEnrollment::where('block_section_id', $blockSection->id)
            ->with(['student.personalData'])
            ->get()
            ->map(fn ($e) => [
                'id'              => $e->id,
                'enrollment_date' => $e->enrollment_date,
                'status'          => $e->status,
                'student'         => [
                    'id'                => $e->student->id,
                    'student_id_number' => $e->student->student_id_number,
                    'personal_data'     => [
                        'first_name'  => $e->student->personalData?->first_name,
                        'last_name'   => $e->student->personalData?->last_name,
                        'middle_name' => $e->student->personalData?->middle_name,
                    ],
                ],
            ]);

        // Students not yet enrolled in any section for this school_year + semester
        $enrolledStudentIds = StudentEnrollment::where('school_year', $blockSection->school_year)
            ->when($blockSection->semester, fn ($q) => $q->where('semester', $blockSection->semester))
            ->pluck('student_id');

        $availableStudents = Student::whereNotIn('id', $enrolledStudentIds)
            ->whereNotNull('student_id_number')
            ->where('current_year_level', $blockSection->grade_level)
            ->when($blockSection->strand, function ($q) use ($blockSection) {
                $q->whereHas('application', fn ($q2) =>
                    $q2->where('strand', $blockSection->strand)
                );
            })
            ->with('personalData')
            ->get()
            ->map(fn ($s) => [
                'id'                => $s->id,
                'student_id_number' => $s->student_id_number,
                'personal_data'     => [
                    'first_name' => $s->personalData?->first_name,
                    'last_name'  => $s->personalData?->last_name,
                ],
            ]);

        return Inertia::render('Admin/BlockSections/Show', [
            'blockSection'     => $blockSection,
            'enrolledStudents' => $enrolledStudents,
            'availableStudents' => $availableStudents,
        ]);
    }

    /**
     * Add a student to this block section.
     */
    public function addStudent(Request $request, BlockSection $blockSection)
    {
        $validated = $request->validate([
            'student_id' => 'required|integer|exists:students,id',
        ]);

        if (! $blockSection->hasAvailableSlots()) {
            return back()->withErrors(['error' => 'This section has reached its maximum capacity.']);
        }

        $alreadyEnrolled = StudentEnrollment::where('student_id', $validated['student_id'])
            ->where('school_year', $blockSection->school_year)
            ->when($blockSection->semester, fn ($q) => $q->where('semester', $blockSection->semester))
            ->exists();

        if ($alreadyEnrolled) {
            return back()->withErrors(['error' => 'This student is already enrolled for this school year and semester.']);
        }

        $student = Student::with('application')->findOrFail($validated['student_id']);
        $blockSection->load(['subjects.faculty', 'subjects.schedules']);

        $totalUnits = $blockSection->subjects->sum('units');

        $enrollment = StudentEnrollment::create([
            'student_id'       => $student->id,
            'block_section_id' => $blockSection->id,
            'school_year'      => $blockSection->school_year,
            'semester'         => $blockSection->semester ?? 'First Semester',
            'year_level'       => $blockSection->grade_level,
            'student_category' => $student->application?->student_category ?? '',
            'enrollment_date'  => now()->toDateString(),
            'status'           => StudentEnrollment::STATUS_ENROLLED,
            'total_units'      => $totalUnits,
        ]);

        foreach ($blockSection->subjects as $subject) {
            $sched = $subject->scheduleFor($blockSection->id) ?? $subject->defaultSchedule;
            StudentEnrollmentSubject::create([
                'student_enrollment_id' => $enrollment->id,
                'subject_id'            => $subject->id,
                'units'                 => $subject->units,
                'schedule'              => $sched?->display,
                'room'                  => $sched?->room,
                'teacher'               => $subject->faculty?->name,
            ]);
        }

        $blockSection->incrementEnrollment();

        return back()->with('success', 'Student added to section successfully.');
    }

    /**
     * Remove a student from this block section.
     */
    public function removeStudent(BlockSection $blockSection, StudentEnrollment $studentEnrollment)
    {
        if ($studentEnrollment->block_section_id !== $blockSection->id) {
            abort(403, 'This enrollment does not belong to the specified section.');
        }

        $studentEnrollment->delete();
        $blockSection->decrementEnrollment();

        return back()->with('success', 'Student removed from section.');
    }

    /**
     * Show the form for editing the specified block section.
     */
    public function edit(BlockSection $blockSection)
    {
        $blockSection->load('subjects');
        $subjects = Subject::active()->orderBy('code')->get();

        return Inertia::render('Admin/BlockSections/Edit', [
            'blockSection' => $blockSection,
            'subjects' => $subjects,
        ]);
    }

    /**
     * Update the specified block section.
     */
    public function update(Request $request, BlockSection $blockSection)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:block_sections,code,' . $blockSection->id,
            'grade_level' => 'required|string',
            'school_year' => 'required|string',
            'semester' => 'nullable|in:First Semester,Second Semester,Summer,Full Year',
            'adviser' => 'nullable|string|max:255',
            'room' => 'nullable|string|max:50',
            'capacity' => 'required|integer|min:1|max:100',
            'schedule' => 'nullable|string',
            'is_active' => 'boolean',
            'subjects' => 'nullable|array',
            'subjects.*.subject_id' => 'required|exists:subjects,id',
        ]);

        $blockSection->update([
            'name' => $validated['name'],
            'code' => $validated['code'],
            'grade_level' => $validated['grade_level'],
            'school_year' => $validated['school_year'],
            'semester' => $validated['semester'] ?? null,
            'adviser' => $validated['adviser'] ?? null,
            'room' => $validated['room'] ?? null,
            'capacity' => $validated['capacity'],
            'schedule' => $validated['schedule'] ?? null,
            'is_active' => $validated['is_active'] ?? true,
        ]);

        // Sync subjects
        $subjectIds = !empty($validated['subjects'])
            ? array_column($validated['subjects'], 'subject_id')
            : [];
        $blockSection->subjects()->sync($subjectIds);

        return redirect()->route('block-sections.index')
            ->with('success', 'Block section updated successfully.');
    }

    /**
     * Remove the specified block section.
     */
    public function destroy(BlockSection $blockSection)
    {
        // Check if any students are enrolled
        if ($blockSection->current_enrollment > 0) {
            return back()->withErrors([
                'error' => 'Cannot delete block section. Students are currently enrolled.',
            ]);
        }

        $blockSection->subjects()->detach();
        $blockSection->delete();

        return redirect()->route('block-sections.index')
            ->with('success', 'Block section deleted successfully.');
    }

    /**
     * Toggle block section active status.
     */
    public function toggleStatus(BlockSection $blockSection)
    {
        $blockSection->update(['is_active' => !$blockSection->is_active]);

        return back()->with('success', 'Block section status updated successfully.');
    }
}
