<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SemesterPeriod;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SemesterPeriodController extends Controller
{
    public function index()
    {
        return Inertia::render('Admin/SemesterPeriods/Index', [
            'periods' => SemesterPeriod::orderBy('start_month')->get(),
        ]);
    }

    public function update(Request $request, SemesterPeriod $semesterPeriod)
    {
        $validated = $request->validate([
            'start_month' => ['required', 'integer', 'min:1', 'max:12'],
            'end_month'   => ['required', 'integer', 'min:1', 'max:12'],
            'is_active'   => ['required', 'boolean'],
        ]);

        $semesterPeriod->update($validated);

        return back()->with('success', 'Semester period updated.');
    }
}
