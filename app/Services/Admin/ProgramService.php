<?php

namespace App\Services\Admin;

use App\Models\Program;
use App\Repositories\ProgramRepository;

class ProgramService
{
    public function __construct(private ProgramRepository $programRepository)
    {
    }

    public function create(array $data): Program
    {
        return $this->programRepository->create($data);
    }

    public function update(Program $program, array $data): void
    {
        $this->programRepository->update($program, $data);
    }

    public function toggleStatus(Program $program): void
    {
        $this->programRepository->update($program, ['is_active' => ! $program->is_active]);
    }
}
