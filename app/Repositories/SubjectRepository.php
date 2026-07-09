<?php

namespace App\Repositories;

use App\Models\Subject;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Collection as SupportCollection;

class SubjectRepository
{
    /**
     * Returns all subjects sorted by code.
     */
    public function allOrdered(): Collection
    {
        return Subject::orderBy('code')->get();
    }

    /**
     * Finds a subject by ID, or returns null if the ID is null or the record doesn't exist.
     */
    public function find(?int $id): ?Subject
    {
        return $id ? Subject::find($id) : null;
    }

    /**
     * Returns all active subjects sorted by code — used to populate subject dropdowns.
     */
    public function activeOrdered(): Collection
    {
        return Subject::active()->orderBy('code')->get();
    }

    /**
     * Returns the names of subjects whose semester doesn't match the given semester (excluding Full Year subjects).
     * Used to warn when assigning semester-specific subjects to a section with a different semester.
     */
    public function incompatibleNames(array $subjectIds, string $semester): SupportCollection
    {
        return Subject::whereIn('id', $subjectIds)
            ->whereNotNull('semester')
            ->where('semester', '!=', 'Full Year')
            ->where('semester', '!=', $semester)
            ->pluck('name');
    }

    /**
     * Eager-loads the subject's block sections onto the model — used for the subject detail/show page.
     */
    public function loadBlockSections(Subject $subject): Subject
    {
        return $subject->load('blockSections');
    }

    /**
     * Returns true if the subject is assigned to at least one block section — used to prevent deletion of in-use subjects.
     */
    public function hasBlockSections(Subject $subject): bool
    {
        return $subject->blockSections()->count() > 0;
    }

    /**
     * Creates and returns a new subject record.
     */
    public function create(array $data): Subject
    {
        return Subject::create($data);
    }

    /**
     * Updates the given subject with the supplied data.
     */
    public function update(Subject $subject, array $data): void
    {
        $subject->update($data);
    }

    /**
     * Deletes the given subject record.
     */
    public function delete(Subject $subject): void
    {
        $subject->delete();
    }

    /**
     * Finds a subject by ID or throws a ModelNotFoundException if not found.
     */
    public function findOrFail(int $id): Subject
    {
        return Subject::findOrFail($id);
    }

    /**
     * Returns subjects the given faculty user is the default teacher for — either as the subject's own owner
     * (subjects.user_id) or as the teacher on the subject's default schedule — with block sections eager-loaded.
     * Used for the gradebook and grade validation faculty views.
     */
    public function facultySubjectsWithSections(int $userId, array $defaultTaughtSubjectIds = []): Collection
    {
        return Subject::where('user_id', $userId)
            ->orWhereIn('id', $defaultTaughtSubjectIds)
            ->with('blockSections')
            ->get();
    }

    /**
     * Returns active subjects ordered by code with their block sections eager-loaded (id, code, name only) — used to populate the schedule-assignment picker.
     */
    public function activeOrderedWithBlockSections(): Collection
    {
        return Subject::active()->with('blockSections:id,name,code')->orderBy('code')->get();
    }

    /**
     * Returns a single subject with its block sections eager-loaded (id, code, name only) — used to scope the block section picker when editing a schedule.
     */
    public function withBlockSections(int $subjectId): Subject
    {
        return Subject::with('blockSections:id,name,code')->findOrFail($subjectId);
    }
}
