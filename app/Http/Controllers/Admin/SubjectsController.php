<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreSubjectRequest;
use App\Http\Requests\Admin\UpdateSubjectRequest;
use App\Models\Subject;
use App\Repositories\SubjectRepository;
use App\Repositories\UserRepository;
use App\Services\Admin\SubjectService;
use Inertia\Inertia;

class SubjectsController extends Controller
{
    public function __construct(
        private SubjectRepository $subjectRepository,
        private UserRepository $userRepository,
        private SubjectService $subjectService,
    ) {
    }

    public function index()
    {
        return Inertia::render('Admin/Subjects/Index', [
            'subjects' => $this->subjectRepository->allWithDefaultSchedule(),
        ]);
    }

    public function create()
    {
        return Inertia::render('Admin/Subjects/Create', [
            'facultyUsers' => $this->userRepository->getFacultyUsers(),
        ]);
    }

    public function store(StoreSubjectRequest $request)
    {
        $this->subjectService->create($request->validated());

        return redirect()->route('subjects.index')
            ->with('success', 'Subject created successfully.');
    }

    public function show(Subject $subject)
    {
        return Inertia::render('Admin/Subjects/Show', [
            'subject' => $this->subjectRepository->loadBlockSectionsAndSchedule($subject),
        ]);
    }

    public function edit(Subject $subject)
    {
        return Inertia::render('Admin/Subjects/Edit', [
            'subject' => $this->subjectRepository->loadDefaultSchedule($subject),
            'facultyUsers' => $this->userRepository->getFacultyUsers(),
        ]);
    }

    public function update(UpdateSubjectRequest $request, Subject $subject)
    {
        $this->subjectService->update($subject, $request->validated());

        return redirect()->route('subjects.index')
            ->with('success', 'Subject updated successfully.');
    }

    public function destroy(Subject $subject)
    {
        if (! $this->subjectService->delete($subject)) {
            return back()->withErrors([
                'error' => 'Cannot delete subject. It is assigned to one or more block sections.',
            ]);
        }

        return redirect()->route('subjects.index')
            ->with('success', 'Subject deleted successfully.');
    }

    public function toggleStatus(Subject $subject)
    {
        $this->subjectService->toggleStatus($subject);

        return back()->with('success', 'Subject status updated successfully.');
    }
}
