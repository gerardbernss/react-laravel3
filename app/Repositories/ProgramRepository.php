<?php

namespace App\Repositories;

use App\Models\Program;
use Illuminate\Database\Eloquent\Collection;

class ProgramRepository
{
    public function allOrderedByCode(): Collection
    {
        return Program::orderBy('code')->get();
    }

    public function activeMaxLoadForCode(string $code): int
    {
        return (int) (Program::where('is_active', true)->where('code', $code)->value('max_load') ?? 0);
    }

    public function findActiveByCode(string $code): ?Program
    {
        return Program::where('is_active', true)->where('code', $code)->first();
    }

    public function create(array $data): Program
    {
        return Program::create($data);
    }

    public function update(Program $program, array $data): void
    {
        $program->update($data);
    }

    public function delete(Program $program): void
    {
        $program->delete();
    }
}
