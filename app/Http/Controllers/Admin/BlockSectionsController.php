<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\BlockSection;
use App\Models\Schedule;
use App\Models\Student;
use App\Models\StudentEnrollment;
use App\Models\StudentEnrollmentSubject;
use App\Models\Subject;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
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
     * Clone every block section from one school year into a new school year,
     * carrying over grade level/strand/capacity/subjects/schedules so the
     * registrar doesn't have to rebuild ~90 sections by hand every year.
     * Source sections (and the enrollment history tied to them) are left
     * untouched — this only ever creates new rows.
     */
    public function copyToNewYear(Request $request)
    {
        $validated = $request->validate([
            'from_school_year' => 'required|string',
            'to_school_year'   => 'required|string|different:from_school_year',
        ]);

        $fromYear = $validated['from_school_year'];
        $toYear   = $validated['to_school_year'];

        $sourceSections = BlockSection::where('school_year', $fromYear)
            ->with(['subjects', 'schedules'])
            ->get();

        if ($sourceSections->isEmpty()) {
            return back()->withErrors(['error' => "No block sections found for {$fromYear}."]);
        }

        $oldSuffix = $this->yearCodeSuffix($fromYear);
        $newSuffix = $this->yearCodeSuffix($toYear);

        $copied  = 0;
        $skipped = 0;

        DB::transaction(function () use ($sourceSections, $toYear, $oldSuffix, $newSuffix, &$copied, &$skipped) {
            foreach ($sourceSections as $section) {
                $newCode = Str::endsWith($section->code, $oldSuffix)
                    ? Str::replaceLast($oldSuffix, $newSuffix, $section->code)
                    : "{$section->code}-{$newSuffix}";

                if (BlockSection::where('code', $newCode)->exists()) {
                    $skipped++;
                    continue;
                }

                $newSection = BlockSection::create([
                    'name'               => $section->name,
                    'code'               => $newCode,
                    'grade_level'        => $section->grade_level,
                    'strand'             => $section->strand,
                    'school_year'        => $toYear,
                    'semester'           => $section->semester,
                    'adviser'            => $section->adviser,
                    'room'               => $section->room,
                    'capacity'           => $section->capacity,
                    'current_enrollment' => 0,
                    'schedule'           => $section->schedule,
                    'is_active'          => $section->is_active,
                ]);

                $newSection->subjects()->attach($section->subjects->pluck('id'));

                foreach ($section->schedules as $sched) {
                    Schedule::create([
                        'subject_id'       => $sched->subject_id,
                        'block_section_id' => $newSection->id,
                        'days'             => $sched->days,
                        'time'             => $sched->time,
                        'room'             => $sched->room,
                        'code'             => $sched->code,
                    ]);
                }

                $copied++;
            }
        });

        $message = "Copied {$copied} section(s) to {$toYear}.";
        if ($skipped > 0) {
            $message .= " Skipped {$skipped} (a section with that code already exists).";
        }

        return back()->with('success', $message);
    }

    /**
     * "2025-2026" → "2526" — matches the existing section code convention
     * (e.g. "G1-A-2526"), so copied codes read the same way.
     */
    private function yearCodeSuffix(string $schoolYear): string
    {
        $parts = explode('-', $schoolYear);
        if (count($parts) !== 2) {
            return preg_replace('/\D/', '', $schoolYear);
        }

        return substr($parts[0], -2) . substr($parts[1], -2);
    }

    /**
     * Show the form for creating a new block section.
     */
    public function create()
    {
        $subjects = Subject::active()->orderBy('code')->get()
            ->map(fn ($s) => ['id' => $s->id, 'code' => $s->code, 'name' => $s->name, 'units' => $s->units, 'semester' => $s->semester]);

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

            // Validate semester compatibility
            $semester = $validated['semester'] ?? null;
            if ($semester) {
                $incompatible = Subject::whereIn('id', $subjectIds)
                    ->whereNotNull('semester')
                    ->where('semester', '!=', 'Full Year')
                    ->where('semester', '!=', $semester)
                    ->pluck('name');

                if ($incompatible->isNotEmpty()) {
                    return back()->withErrors([
                        'subjects' => 'These subjects are not offered in ' . $semester . ': ' . $incompatible->join(', '),
                    ]);
                }
            }

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
        $blockSection->load(['subjects.schedules']);

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

        // Enrich subjects with schedule/room from subject_schedules
        // (section-specific first, falling back to the subject's default schedule)
        $subjects = $blockSection->subjects->map(function ($s) use ($blockSection) {
            $sched = $s->scheduleFor($blockSection->id) ?? $s->defaultSchedule;
            return [
                'id'       => $s->id,
                'code'     => $s->code,
                'name'     => $s->name,
                'units'    => $s->units,
                'type'     => $s->type,
                'semester' => $s->semester,
                'pivot'    => [
                    'teacher'  => $s->pivot->teacher,
                    'schedule' => $sched?->display,
                    'room'     => $sched?->room,
                ],
            ];
        });

        return Inertia::render('Admin/BlockSections/Show', [
            'blockSection'      => array_merge($blockSection->toArray(), ['subjects' => $subjects]),
            'enrolledStudents'  => $enrolledStudents,
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
        if ((int) $studentEnrollment->block_section_id !== (int) $blockSection->id) {
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
        $subjects = Subject::active()->orderBy('code')->get()
            ->map(fn ($s) => ['id' => $s->id, 'code' => $s->code, 'name' => $s->name, 'units' => $s->units, 'semester' => $s->semester]);

        return Inertia::render('Admin/BlockSections/Edit', [
            'blockSection' => $blockSection,
            'subjects'     => $subjects,
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

        // Sync subjects with semester validation
        $subjectIds = !empty($validated['subjects'])
            ? array_column($validated['subjects'], 'subject_id')
            : [];

        $semester = $validated['semester'] ?? null;
        if ($semester && !empty($subjectIds)) {
            $incompatible = Subject::whereIn('id', $subjectIds)
                ->whereNotNull('semester')
                ->where('semester', '!=', 'Full Year')
                ->where('semester', '!=', $semester)
                ->pluck('name');

            if ($incompatible->isNotEmpty()) {
                return back()->withErrors([
                    'subjects' => 'These subjects are not offered in ' . $semester . ': ' . $incompatible->join(', '),
                ]);
            }
        }

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
