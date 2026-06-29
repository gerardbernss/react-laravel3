<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Http\Requests\Student\AssignStudentIdRequest;
use App\Services\Student\StudentIdService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;

class StudentIDController extends Controller
{
    public function __construct(private readonly StudentIdService $studentIdService)
    {
    }

    public function index()
    {
        return Inertia::render('StudentIdAssignment/Index', [
            'applications' => $this->studentIdService->indexData(),
        ]);
    }

    public function show($id)
    {
    }

    public function create()
    {
        return Inertia::render('Admissions/AddApplicant');
    }

    public function store(Request $request)
    {
    }

    public function edit($id)
    {
    }

    public function update(Request $request, $id)
    {
    }

    public function assignStudentId(AssignStudentIdRequest $request)
    {
        $result = $this->studentIdService->assignStudentId($request->validated());

        if (! $result['success']) {
            return back()->withErrors(['error' => $result['message']]);
        }

        return back()->with('success', 'Student ID assigned successfully!');
    }

    public function bulkGenerate(): RedirectResponse
    {
        $generated = $this->studentIdService->bulkGenerate();

        return redirect()->back()->with('success', "Generated {$generated} student ID(s).");
    }

    public function emailStudentID($id)
    {
        $result = $this->studentIdService->emailStudentId((int) $id);

        return response()->json(['message' => $result['message']], $result['status']);
    }
}
