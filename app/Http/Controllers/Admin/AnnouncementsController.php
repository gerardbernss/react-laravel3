<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreAnnouncementRequest;
use App\Http\Requests\Admin\UpdateAnnouncementRequest;
use App\Models\Announcement;
use App\Services\Admin\AnnouncementService;
use Inertia\Inertia;

class AnnouncementsController extends Controller
{
    public function __construct(private AnnouncementService $announcementService)
    {
    }

    public function index()
    {
        return Inertia::render('Admin/Announcements/Index', [
            'announcements' => $this->announcementService->list(),
        ]);
    }

    public function create()
    {
        return Inertia::render('Admin/Announcements/Create');
    }

    public function store(StoreAnnouncementRequest $request)
    {
        $this->announcementService->create($request->validated(), $request->file('attachment'), auth()->id());

        return redirect()->route('admin.announcements.index')
            ->with('success', 'Announcement created successfully.');
    }

    public function edit(Announcement $announcement)
    {
        return Inertia::render('Admin/Announcements/Edit', [
            'announcement' => $this->announcementService->withStatus($announcement),
        ]);
    }

    public function update(UpdateAnnouncementRequest $request, Announcement $announcement)
    {
        $this->announcementService->update($announcement, $request->validated(), $request->file('attachment'), auth()->id());

        return redirect()->route('admin.announcements.index')
            ->with('success', 'Announcement updated successfully.');
    }

    public function destroy(Announcement $announcement)
    {
        $this->announcementService->delete($announcement);

        return redirect()->route('admin.announcements.index')
            ->with('success', 'Announcement deleted successfully.');
    }
}
