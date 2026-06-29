<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreEmployeeRequest;
use App\Http\Requests\Admin\UpdateEmployeeRequest;
use App\Models\Employee;
use App\Repositories\EmployeeRepository;
use App\Services\Admin\EmployeeService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class EmployeeController extends Controller
{
    public function __construct(
        private EmployeeRepository $employeeRepository,
        private EmployeeService $employeeService,
    ) {
    }

    public function index(Request $request)
    {
        return Inertia::render('Admin/Employees/Index', [
            'employees' => $this->employeeRepository->filtered($request->search, $request->department, $request->status),
            'departments' => $this->employeeRepository->distinctDepartments(),
            'filters' => $request->only('search', 'department', 'status'),
        ]);
    }

    public function create()
    {
        return Inertia::render('Admin/Employees/Create', [
            'users' => $this->employeeRepository->usersWithoutEmployee(),
            'employmentTypes' => ['regular', 'part_time', 'contractual'],
        ]);
    }

    public function store(StoreEmployeeRequest $request)
    {
        $this->employeeService->create($request->validated());

        return redirect()->route('employees.index')->with('success', 'Employee created successfully.');
    }

    public function show(Employee $employee)
    {
        return Inertia::render('Admin/Employees/Show', [
            'employee' => $this->employeeRepository->withUser($employee),
        ]);
    }

    public function edit(Employee $employee)
    {
        return Inertia::render('Admin/Employees/Create', [
            'employee' => $employee,
            'users' => $this->employeeRepository->usersAvailableForEmployee($employee),
            'employmentTypes' => ['regular', 'part_time', 'contractual'],
        ]);
    }

    public function update(UpdateEmployeeRequest $request, Employee $employee)
    {
        $this->employeeService->update($employee, $request->validated());

        return redirect()->route('employees.index')->with('success', 'Employee updated successfully.');
    }

    public function destroy(Employee $employee)
    {
        $this->employeeService->deactivate($employee);

        return redirect()->route('employees.index')->with('success', 'Employee deactivated.');
    }
}
