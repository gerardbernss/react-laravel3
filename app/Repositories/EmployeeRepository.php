<?php

namespace App\Repositories;

use App\Models\Employee;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

class EmployeeRepository
{
    public function filtered(?string $search, ?string $department, ?string $status): LengthAwarePaginator
    {
        return Employee::with('user')
            ->when($search, function ($q, $search) {
                $q->where(function ($q) use ($search) {
                    $q->where('first_name', 'like', "%{$search}%")
                        ->orWhere('last_name', 'like', "%{$search}%")
                        ->orWhere('employee_uid', 'like', "%{$search}%")
                        ->orWhere('department', 'like', "%{$search}%");
                });
            })
            ->when($department, fn ($q, $dept) => $q->where('department', $dept))
            ->when($status !== null, fn ($q) => $q->where('is_active', $status === 'active'))
            ->orderBy('last_name')
            ->orderBy('first_name')
            ->paginate(20)
            ->withQueryString();
    }

    public function distinctDepartments(): Collection
    {
        return Employee::distinct()->orderBy('department')->pluck('department');
    }

    public function usersWithoutEmployee(): Collection
    {
        return User::whereDoesntHave('employee')->orderBy('name')->get(['id', 'name', 'email']);
    }

    public function usersAvailableForEmployee(Employee $employee): Collection
    {
        return User::whereDoesntHave('employee')
            ->orWhere('id', $employee->user_id)
            ->orderBy('name')
            ->get(['id', 'name', 'email']);
    }

    public function hasActiveAmong(array $ids): bool
    {
        return Employee::whereIn('id', $ids)->where('is_active', true)->exists();
    }

    public function withUser(Employee $employee): Employee
    {
        return $employee->load('user');
    }

    public function create(array $data): Employee
    {
        return Employee::create($data);
    }

    public function update(Employee $employee, array $data): void
    {
        $employee->update($data);
    }
}
