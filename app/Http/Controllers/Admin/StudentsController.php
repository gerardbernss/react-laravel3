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

    public function index()
    {
        return Inertia::render('Admin/Students/Index', $this->studentService->indexData());
    }

    public function create()
    {
        return Inertia::render('Admin/Students/Create');
    }

    public function store(StoreStudentRequest $request)
    {
        $student = $this->studentService->store($request->validated());

        return redirect()->route('admin.students.show', $student->id)
            ->with('success', 'Student record created successfully.');
    }

    public function show(Student $student)
    {
        return Inertia::render('Admin/Students/Show', $this->studentService->showData($student));
    }

    public function edit(Student $student)
    {
        return Inertia::render('Admin/Students/Edit', $this->studentService->editData($student));
    }

    public function update(UpdateStudentRequest $request, Student $student)
    {
        $result = $this->studentService->update($student, $request->validated());

        if (! empty($result['error'])) {
            return back()->withErrors(['error' => $result['error']]);
        }

        return redirect()->route('admin.students.show', $student->id)
            ->with('success', 'Student record updated successfully.');
    }

    public function withdraw(WithdrawStudentRequest $request, Student $student)
    {
        $result = $this->studentService->withdraw($student, $request->validated());

        if (! empty($result['error'])) {
            return back()->withErrors(['error' => $result['error']]);
        }

        return back()->with('success', 'Student has been withdrawn.');
    }
}
