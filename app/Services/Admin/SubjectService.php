<?php

namespace App\Services\Admin;

use App\Models\Subject;
use App\Repositories\SubjectRepository;

class SubjectService
{
    public function __construct(
        private SubjectRepository $subjectRepository,
    ) {
    }

    /**
     * Returns the subject detail page data: the subject and its assigned block sections.
     */
    public function showData(Subject $subject): array
    {
        return ['subject' => $this->subjectRepository->loadBlockSections($subject)];
    }

    /**
     * Creates a new subject.
     */
    public function create(array $data): Subject
    {
        return $this->subjectRepository->create($data);
    }

    /**
     * Updates a subject's details.
     */
    public function update(Subject $subject, array $data): void
    {
        $this->subjectRepository->update($subject, $data);
    }

    /**
     * Deletes a subject, but blocks deletion if it is already assigned to any block sections.
     * Returns false if blocked, true on success.
     */
    public function delete(Subject $subject): bool
    {
        if ($this->subjectRepository->hasBlockSections($subject)) {
            return false;
        }

        $this->subjectRepository->delete($subject);

        return true;
    }

    /**
     * Flips a subject between active and inactive.
     */
    public function toggleStatus(Subject $subject): void
    {
        $this->subjectRepository->update($subject, ['is_active' => ! $subject->is_active]);
    }
}
