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

    /**
     * List enrolled applicants pending student ID assignment.
     */
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

    /**
     * Assign a student ID number to a specific applicant.
     */
    public function assignStudentId(AssignStudentIdRequest $request)
    {
        $result = $this->studentIdService->assignStudentId($request->validated());

        if (! $result['success']) {
            return back()->withErrors(['error' => $result['message']]);
        }

        return back()->with('success', 'Student ID assigned successfully!');
    }

    /**
     * Auto-generate and assign student IDs for all enrolled applicants that don't have one yet.
     */
    public function bulkGenerate(): RedirectResponse
    {
        $generated = $this->studentIdService->bulkGenerate();

        return redirect()->back()->with('success', "Generated {$generated} student ID(s).");
    }

    /**
     * Send the assigned student ID to the applicant via email.
     */
    public function emailStudentID($id)
    {
        $result = $this->studentIdService->emailStudentId((int) $id);

        return response()->json(['message' => $result['message']], $result['status']);
    }
}
