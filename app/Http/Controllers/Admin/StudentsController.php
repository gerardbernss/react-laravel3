<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreStudentRequest;
use App\Http\Requests\Admin\UpdateStudentRequest;
use App\Http\Requests\Admin\WithdrawStudentRequest;
use App\Models\Student;
use App\Services\Admin\StudentService;
use Inertia\Inertia;

class StudentsController extends Controller
{
    public function __construct(private StudentService $studentService)
    {
    }

    /**
     * List all students with their personal data and current enrollment status.
     */
    public function index()
    {
        return Inertia::render('Admin/Students/Index', $this->studentService->indexData());
    }

    /**
     * Show the create student form.
     */
    public function create()
    {
        return Inertia::render('Admin/Students/Create');
    }

    /**
     * Save a new student record and redirect to their profile.
     */
    public function store(StoreStudentRequest $request)
    {
        $student = $this->studentService->store($request->validated());

        return redirect()->route('admin.students.show', $student->id)
            ->with('success', 'Student record created successfully.');
    }

    /**
     * Show a student's full profile including enrollment history and assessment details.
     */
    public function show(Student $student)
    {
        return Inertia::render('Admin/Students/Show', $this->studentService->showData($student));
    }

    /**
     * Show the edit form for an existing student record.
     */
    public function edit(Student $student)
    {
        return Inertia::render('Admin/Students/Edit', $this->studentService->editData($student));
    }

    /**
     * Update a student's personal data and related records.
     */
    public function update(UpdateStudentRequest $request, Student $student)
    {
        $result = $this->studentService->update($student, $request->validated());

        if (! empty($result['error'])) {
            return back()->withErrors(['error' => $result['error']]);
        }

        return redirect()->route('admin.students.show', $student->id)
            ->with('success', 'Student record updated successfully.');
    }

    /**
     * Mark a student as withdrawn from the current enrollment period.
     */
    public function withdraw(WithdrawStudentRequest $request, Student $student)
    {
        $result = $this->studentService->withdraw($student, $request->validated());

        if (! empty($result['error'])) {
            return back()->withErrors(['error' => $result['error']]);
        }

        return back()->with('success', 'Student has been withdrawn.');
    }
}
