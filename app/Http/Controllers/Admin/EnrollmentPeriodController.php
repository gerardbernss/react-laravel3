<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\EnrollmentPeriod;
use Illuminate\Http\Request;
use Inertia\Inertia;

class EnrollmentPeriodController extends Controller
{
    /**
     * List all enrollment periods.
     */
    public function index()
    {
        $periods = EnrollmentPeriod::orderByDesc('school_year')
            ->orderBy('semester')
            ->get()
            ->map(fn ($p) => [
                'id'          => $p->id,
                'school_year' => $p->school_year,
                'semester'    => $p->semester,
                'is_open'     => $p->is_open,
                'status'      => $p->status,
                'start_date'  => $p->start_date?->toDateString(),
                'close_date'  => $p->close_date?->toDateString(),
                'opened_at'   => $p->opened_at?->toDateTimeString(),
                'closed_at'   => $p->closed_at?->toDateTimeString(),
                'notes'       => $p->notes,
            ]);

        return Inertia::render('Admin/EnrollmentPeriods/Index', [
            'periods'   => $periods,
            'semesters' => ['First Semester', 'Second Semester', 'Summer', 'Full Year'],
        ]);
    }

    /**
     * Create a new enrollment period and immediately open it.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'school_year' => 'required|string|max:20',
            'semester'    => 'required|in:First Semester,Second Semester,Summer,Full Year',
            'start_date'  => 'required|date',
            'close_date'  => 'required|date|after_or_equal:start_date',
            'notes'       => 'nullable|string|max:500',
        ]);

        // Prevent duplicate
        $exists = EnrollmentPeriod::where('school_year', $validated['school_year'])
            ->where('semester', $validated['semester'])
            ->exists();

        if ($exists) {
            return back()->withErrors(['error' => 'An enrollment period for this school year and semester already exists.']);
        }

        EnrollmentPeriod::create([
            'school_year' => $validated['school_year'],
            'semester'    => $validated['semester'],
            'is_open'     => true,
            'start_date'  => $validated['start_date'],
            'close_date'  => $validated['close_date'],
            'opened_at'   => now(),
            'notes'       => $validated['notes'] ?? null,
        ]);

        return back()->with('success', 'Enrollment period started.');
    }

    /**
     * Open an enrollment period with a required close date.
     */
    public function open(Request $request, EnrollmentPeriod $period)
    {
        $validated = $request->validate([
            'start_date' => 'required|date',
            'close_date' => 'required|date|after_or_equal:start_date',
            'notes'      => 'nullable|string|max:500',
        ]);

        $period->update([
            'is_open'    => true,
            'start_date' => $validated['start_date'],
            'close_date' => $validated['close_date'],
            'opened_at'  => $period->opened_at ?? now(),  // keep original if re-opening
            'closed_at'  => null,
            'notes'      => $validated['notes'] ?? $period->notes,
        ]);

        return back()->with('success', 'Enrollment is now open.');
    }

    /**
     * Edit close date and/or notes (used for extensions).
     */
    public function update(Request $request, EnrollmentPeriod $period)
    {
        $validated = $request->validate([
            'close_date' => 'required|date',
            'notes'      => 'nullable|string|max:500',
        ]);

        $period->update([
            'close_date' => $validated['close_date'],
            'notes'      => $validated['notes'],
        ]);

        return back()->with('success', 'Enrollment period updated.');
    }

    /**
     * Manually close an enrollment period early.
     */
    public function close(EnrollmentPeriod $period)
    {
        $period->update([
            'is_open'   => false,
            'closed_at' => now(),
        ]);

        return back()->with('success', 'Enrollment has been closed.');
    }

    /**
     * Delete a closed enrollment period.
     */
    public function destroy(EnrollmentPeriod $period)
    {
        if ($period->is_open) {
            return back()->withErrors(['error' => 'Cannot delete an open enrollment period. Close it first.']);
        }

        $period->delete();

        return back()->with('success', 'Enrollment period deleted.');
    }
}
