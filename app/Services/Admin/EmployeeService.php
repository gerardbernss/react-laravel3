<?php

namespace App\Services\Admin;

use App\Models\Employee;
use App\Repositories\EmployeeRepository;

class EmployeeService
{
    public function __construct(private EmployeeRepository $employeeRepository)
    {
    }

    /**
     * Creates a new employee record.
     */
    public function create(array $data): Employee
    {
        return $this->employeeRepository->create($data);
    }

    /**
     * Updates an employee record with the given data.
     */
    public function update(Employee $employee, array $data): void
    {
        $this->employeeRepository->update($employee, $data);
    }

    /**
     * Soft-deactivate to preserve FK references in family background records.
     */
    public function deactivate(Employee $employee): void
    {
        $this->employeeRepository->update($employee, ['is_active' => false]);
    }
}
