<?php

namespace App\Repositories;

use App\Models\Employee;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

class EmployeeRepository
{
    /**
     * Returns a paginated list of employees (20 per page) filtered by optional name/UID/department search, department, and active status, sorted alphabetically by last then first name.
     */
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

    /**
     * Returns the distinct department names across all employees, sorted alphabetically.
     */
    public function distinctDepartments(): Collection
    {
        return Employee::distinct()->orderBy('department')->pluck('department');
    }

    /**
     * Returns user accounts that are not yet linked to any employee record — used to populate the "link user" dropdown when creating a new employee.
     */
    public function usersWithoutEmployee(): Collection
    {
        return User::whereDoesntHave('employee')->orderBy('name')->get(['id', 'name', 'email']);
    }

    /**
     * Returns user accounts that are unlinked or are currently linked to this employee — used to populate the "link user" dropdown when editing an existing employee.
     */
    public function usersAvailableForEmployee(Employee $employee): Collection
    {
        return User::whereDoesntHave('employee')
            ->orWhere('id', $employee->user_id)
            ->orderBy('name')
            ->get(['id', 'name', 'email']);
    }

    /**
     * Returns true if any of the given employee IDs belong to an active employee — used to block bulk-delete when active employees are selected.
     */
    public function hasActiveAmong(array $ids): bool
    {
        return Employee::whereIn('id', $ids)->where('is_active', true)->exists();
    }

    /**
     * Loads the linked user account onto the employee model and returns it.
     */
    public function withUser(Employee $employee): Employee
    {
        return $employee->load('user');
    }

    /**
     * Creates and returns a new employee record.
     */
    public function create(array $data): Employee
    {
        return Employee::create($data);
    }

    /**
     * Updates the given employee record with the supplied data.
     */
    public function update(Employee $employee, array $data): void
    {
        $employee->update($data);
    }
}
