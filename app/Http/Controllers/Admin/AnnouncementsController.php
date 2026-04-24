<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Announcement;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class AnnouncementsController extends Controller
{
    public function index()
    {
        $announcements = Announcement::with('creator')
            ->orderByDesc('created_at')
            ->get()
            ->map(fn ($a) => array_merge($a->toArray(), ['status' => $a->status]));

        return Inertia::render('Admin/Announcements/Index', [
            'announcements' => $announcements,
        ]);
    }

    public function create()
    {
        return Inertia::render('Admin/Announcements/Create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title'         => ['required', 'string', 'max:255'],
            'content'       => ['required', 'string'],
            'attachment'    => ['nullable', 'file', 'max:10240'],
            'publish_start' => ['nullable', 'date'],
            'publish_end'   => ['nullable', 'date', 'after_or_equal:publish_start'],
        ]);

        if ($request->hasFile('attachment')) {
            $validated['attachment'] = $request->file('attachment')
                ->store('announcements', 'public');
        }

        $validated['created_by'] = auth()->id();
        $validated['updated_by'] = auth()->id();

        Announcement::create($validated);

        return redirect()->route('admin.announcements.index')
            ->with('success', 'Announcement created successfully.');
    }

    public function edit(Announcement $announcement)
    {
        return Inertia::render('Admin/Announcements/Edit', [
            'announcement' => array_merge(
                $announcement->toArray(),
                ['status' => $announcement->status]
            ),
        ]);
    }

    public function update(Request $request, Announcement $announcement)
    {
        $validated = $request->validate([
            'title'         => ['required', 'string', 'max:255'],
            'content'       => ['required', 'string'],
            'attachment'    => ['nullable', 'file', 'max:10240'],
            'publish_start' => ['nullable', 'date'],
            'publish_end'   => ['nullable', 'date', 'after_or_equal:publish_start'],
        ]);

        if ($request->hasFile('attachment')) {
            if ($announcement->attachment) {
                Storage::disk('public')->delete($announcement->attachment);
            }
            $validated['attachment'] = $request->file('attachment')
                ->store('announcements', 'public');
        } else {
            unset($validated['attachment']);
        }

        $validated['updated_by'] = auth()->id();

        $announcement->update($validated);

        return redirect()->route('admin.announcements.index')
            ->with('success', 'Announcement updated successfully.');
    }

    public function destroy(Announcement $announcement)
    {
        if ($announcement->attachment) {
            Storage::disk('public')->delete($announcement->attachment);
        }

        $announcement->delete();

        return redirect()->route('admin.announcements.index')
            ->with('success', 'Announcement deleted successfully.');
    }
}
