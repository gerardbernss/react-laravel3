<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\BlockSection;
use App\Services\Admin\MyStudentsService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class MyStudentsController extends Controller
{
    public function __construct(private MyStudentsService $myStudentsService)
    {
    }

    /**
     * Show the student roster for a section, optionally filtered by subject — faculty see only their assigned subjects.
     */
    public function show(BlockSection $blockSection, Request $request)
    {
        $subjectId = $request->input('subject_id');
        $user = auth()->user();

        $data = $this->myStudentsService->rosterData(
            $blockSection,
            $subjectId ? (int) $subjectId : null,
            $user && $user->hasRole('faculty')
        );

        return Inertia::render('Admin/MyStudents/Show', $data);
    }
}
