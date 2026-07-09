<?php

namespace App\Repositories;

use App\Models\Program;
use Illuminate\Database\Eloquent\Collection;

class ProgramRepository
{
    /**
     * Returns all programs sorted by their code.
     */
    public function allOrderedByCode(): Collection
    {
        return Program::orderBy('code')->get();
    }

    /**
     * Returns the max_load (credit units) for the active program with the given code, or 0 if not found.
     * Used to compute per-unit fee totals on assessments.
     */
    public function activeMaxLoadForCode(string $code): int
    {
        return (int) (Program::where('is_active', true)->where('code', $code)->value('max_load') ?? 0);
    }

    /**
     * Finds an active program by code (e.g. "SHS", "ABM"), or returns null if not found or inactive.
     */
    public function findActiveByCode(string $code): ?Program
    {
        return Program::where('is_active', true)->where('code', $code)->first();
    }

    /**
     * Creates and returns a new program record.
     */
    public function create(array $data): Program
    {
        return Program::create($data);
    }

    /**
     * Updates the given program with the supplied data.
     */
    public function update(Program $program, array $data): void
    {
        $program->update($data);
    }

    /**
     * Deletes the given program record.
     */
    public function delete(Program $program): void
    {
        $program->delete();
    }
}
