<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreExaminationRoomRequest;
use App\Http\Requests\Admin\UpdateExaminationRoomRequest;
use App\Models\ExaminationRoom;
use App\Repositories\ExaminationRoomRepository;
use App\Services\Admin\ExaminationRoomService;
use Illuminate\Http\JsonResponse;
use Inertia\Inertia;

class ExaminationRoomsController extends Controller
{
    public function __construct(
        private ExaminationRoomRepository $examinationRoomRepository,
        private ExaminationRoomService $examinationRoomService,
    ) {
    }

    public function index()
    {
        return Inertia::render('Admin/ExaminationRooms/Index', [
            'rooms' => $this->examinationRoomRepository->allOrdered(),
        ]);
    }

    public function create()
    {
        return Inertia::render('Admin/ExaminationRooms/Create');
    }

    public function store(StoreExaminationRoomRequest $request)
    {
        $this->examinationRoomService->create($request->validated());

        return redirect()->route('examination-rooms.index')
            ->with('success', 'Examination room created successfully.');
    }

    public function show(ExaminationRoom $examinationRoom)
    {
        return Inertia::render('Admin/ExaminationRooms/Show', [
            'room' => $this->examinationRoomRepository->loadRecentExamSchedules($examinationRoom),
        ]);
    }

    public function edit(ExaminationRoom $examinationRoom)
    {
        return Inertia::render('Admin/ExaminationRooms/Edit', [
            'room' => $examinationRoom,
        ]);
    }

    public function update(UpdateExaminationRoomRequest $request, ExaminationRoom $examinationRoom)
    {
        $this->examinationRoomService->update($examinationRoom, $request->validated());

        return redirect()->route('examination-rooms.index')
            ->with('success', 'Examination room updated successfully.');
    }

    public function destroy(ExaminationRoom $examinationRoom)
    {
        if (! $this->examinationRoomService->delete($examinationRoom)) {
            return back()->withErrors([
                'error' => 'Cannot delete room. It has associated exam schedules.',
            ]);
        }

        return redirect()->route('examination-rooms.index')
            ->with('success', 'Examination room deleted successfully.');
    }

    /**
     * Get active rooms for dropdown (API).
     */
    public function getActiveRooms(): JsonResponse
    {
        return response()->json($this->examinationRoomRepository->activeForDropdown());
    }
}
