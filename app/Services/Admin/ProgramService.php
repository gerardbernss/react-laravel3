<?php

namespace App\Services\Admin;

use App\Models\Program;
use App\Repositories\ProgramRepository;

class ProgramService
{
    public function __construct(private ProgramRepository $programRepository)
    {
    }

    /**
     * Creates a new program record.
     */
    public function create(array $data): Program
    {
        return $this->programRepository->create($data);
    }

    /**
     * Updates a program record with the given data.
     */
    public function update(Program $program, array $data): void
    {
        $this->programRepository->update($program, $data);
    }

    /**
     * Flips a program between active and inactive.
     */
    public function toggleStatus(Program $program): void
    {
        $this->programRepository->update($program, ['is_active' => ! $program->is_active]);
    }
}
