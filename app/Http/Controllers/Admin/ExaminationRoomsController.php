<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ExaminationRoom;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ExaminationRoomsController extends Controller
{
    /**
     * Display a listing of examination rooms.
     */
    public function index(Request $request)
    {
        $query = ExaminationRoom::query();

        // Search filter
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('building', 'like', "%{$search}%");
            });
        }

        // Status filter
        if ($request->filled('status')) {
            $query->where('is_active', $request->status === 'active');
        }

        $rooms = $query->orderBy('building')->orderBy('name')->paginate(15)->withQueryString();

        return Inertia::render('Admin/ExaminationRooms/Index', [
            'rooms' => $rooms,
            'filters' => $request->only(['search', 'status']),
        ]);
    }

    /**
     * Show the form for creating a new room.
     */
    public function create()
    {
        return Inertia::render('Admin/ExaminationRooms/Create');
    }

    /**
     * Store a newly created room.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'building' => 'nullable|string|max:255',
            'capacity' => 'required|integer|min:1|max:500',
            'floor' => 'nullable|string|max:50',
            'is_active' => 'boolean',
        ]);

        ExaminationRoom::create($validated);

        return redirect()->route('examination-rooms.index')
            ->with('success', 'Examination room created successfully.');
    }

    /**
     * Display the specified room.
     */
    public function show(ExaminationRoom $examinationRoom)
    {
        $examinationRoom->load(['examSchedules' => function ($query) {
            $query->orderBy('exam_date', 'desc')->limit(10);
        }]);

        return Inertia::render('Admin/ExaminationRooms/Show', [
            'room' => $examinationRoom,
        ]);
    }

    /**
     * Show the form for editing the specified room.
     */
    public function edit(ExaminationRoom $examinationRoom)
    {
        return Inertia::render('Admin/ExaminationRooms/Edit', [
            'room' => $examinationRoom,
        ]);
    }

    /**
     * Update the specified room.
     */
    public function update(Request $request, ExaminationRoom $examinationRoom)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'building' => 'nullable|string|max:255',
            'capacity' => 'required|integer|min:1|max:500',
            'floor' => 'nullable|string|max:50',
            'is_active' => 'boolean',
        ]);

        $examinationRoom->update($validated);

        return redirect()->route('examination-rooms.index')
            ->with('success', 'Examination room updated successfully.');
    }

    /**
     * Remove the specified room.
     */
    public function destroy(ExaminationRoom $examinationRoom)
    {
        // Check if room has schedules
        if ($examinationRoom->examSchedules()->count() > 0) {
            return back()->withErrors([
                'error' => 'Cannot delete room. It has associated exam schedules.',
            ]);
        }

        $examinationRoom->delete();

        return redirect()->route('examination-rooms.index')
            ->with('success', 'Examination room deleted successfully.');
    }

    /**
     * Get active rooms for dropdown (API).
     */
    public function getActiveRooms()
    {
        $rooms = ExaminationRoom::active()
            ->orderBy('building')
            ->orderBy('name')
            ->get(['id', 'name', 'building', 'capacity', 'floor']);

        return response()->json($rooms);
    }
}
