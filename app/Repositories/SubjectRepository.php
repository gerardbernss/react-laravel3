<?php

namespace App\Repositories;

use App\Models\Subject;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Collection as SupportCollection;

class SubjectRepository
{
    public function allWithDefaultSchedule(): Collection
    {
        return Subject::with('defaultSchedule')->orderBy('code')->get();
    }

    public function find(?int $id): ?Subject
    {
        return $id ? Subject::find($id) : null;
    }

    public function activeOrdered(): Collection
    {
        return Subject::active()->orderBy('code')->get();
    }

    public function incompatibleNames(array $subjectIds, string $semester): SupportCollection
    {
        return Subject::whereIn('id', $subjectIds)
            ->whereNotNull('semester')
            ->where('semester', '!=', 'Full Year')
            ->where('semester', '!=', $semester)
            ->pluck('name');
    }

    public function loadBlockSectionsAndSchedule(Subject $subject): Subject
    {
        return $subject->load(['blockSections', 'defaultSchedule']);
    }

    public function loadDefaultSchedule(Subject $subject): Subject
    {
        return $subject->load('defaultSchedule');
    }

    public function hasBlockSections(Subject $subject): bool
    {
        return $subject->blockSections()->count() > 0;
    }

    public function create(array $data): Subject
    {
        return Subject::create($data);
    }

    public function update(Subject $subject, array $data): void
    {
        $subject->update($data);
    }

    public function delete(Subject $subject): void
    {
        $subject->delete();
    }

    public function findOrFail(int $id): Subject
    {
        return Subject::findOrFail($id);
    }

    public function facultySubjectsWithSections(int $userId): Collection
    {
        return Subject::where('user_id', $userId)->with('blockSections')->get();
    }
}
