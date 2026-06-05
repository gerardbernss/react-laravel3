<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Employee;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class EmployeeController extends Controller
{
    public function index(Request $request)
    {
        $query = Employee::with('user')
            ->when($request->search, function ($q, $search) {
                $q->where(function ($q) use ($search) {
                    $q->where('first_name', 'like', "%{$search}%")
                      ->orWhere('last_name', 'like', "%{$search}%")
                      ->orWhere('employee_uid', 'like', "%{$search}%")
                      ->orWhere('department', 'like', "%{$search}%");
                });
            })
            ->when($request->department, fn ($q, $dept) => $q->where('department', $dept))
            ->when($request->status !== null, fn ($q) => $q->where('is_active', $request->status === 'active'))
            ->orderBy('last_name')
            ->orderBy('first_name')
            ->paginate(20)
            ->withQueryString();

        $departments = Employee::distinct()->orderBy('department')->pluck('department');

        return Inertia::render('Admin/Employees/Index', [
            'employees'   => $query,
            'departments' => $departments,
            'filters'     => $request->only('search', 'department', 'status'),
        ]);
    }

    public function create()
    {
        $users = User::whereDoesntHave('employee')->orderBy('name')->get(['id', 'name', 'email']);

        return Inertia::render('Admin/Employees/Create', [
            'users'           => $users,
            'employmentTypes' => ['regular', 'part_time', 'contractual'],
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'user_id'         => 'nullable|exists:users,id|unique:employees,user_id',
            'employee_uid'    => 'required|string|max:50|unique:employees,employee_uid',
            'first_name'      => 'required|string|max:100',
            'last_name'       => 'required|string|max:100',
            'middle_name'     => 'nullable|string|max:100',
            'email'           => 'required|email|unique:employees,email',
            'department'      => 'required|string|max:100',
            'position'        => 'required|string|max:100',
            'employment_type' => 'required|in:regular,part_time,contractual',
            'hire_date'       => 'required|date',
            'is_active'       => 'boolean',
        ]);

        Employee::create($data);

        return redirect()->route('employees.index')->with('success', 'Employee created successfully.');
    }

    public function show(Employee $employee)
    {
        return Inertia::render('Admin/Employees/Show', [
            'employee' => $employee->load('user'),
        ]);
    }

    public function edit(Employee $employee)
    {
        $users = User::whereDoesntHave('employee')
            ->orWhere('id', $employee->user_id)
            ->orderBy('name')
            ->get(['id', 'name', 'email']);

        return Inertia::render('Admin/Employees/Create', [
            'employee'        => $employee,
            'users'           => $users,
            'employmentTypes' => ['regular', 'part_time', 'contractual'],
        ]);
    }

    public function update(Request $request, Employee $employee)
    {
        $data = $request->validate([
            'user_id'         => 'nullable|exists:users,id|unique:employees,user_id,' . $employee->id,
            'employee_uid'    => 'required|string|max:50|unique:employees,employee_uid,' . $employee->id,
            'first_name'      => 'required|string|max:100',
            'last_name'       => 'required|string|max:100',
            'middle_name'     => 'nullable|string|max:100',
            'email'           => 'required|email|unique:employees,email,' . $employee->id,
            'department'      => 'required|string|max:100',
            'position'        => 'required|string|max:100',
            'employment_type' => 'required|in:regular,part_time,contractual',
            'hire_date'       => 'required|date',
            'is_active'       => 'boolean',
        ]);

        $employee->update($data);

        return redirect()->route('employees.index')->with('success', 'Employee updated successfully.');
    }

    public function destroy(Employee $employee)
    {
        // Soft-deactivate to preserve FK references in family background records
        $employee->update(['is_active' => false]);

        return redirect()->route('employees.index')->with('success', 'Employee deactivated.');
    }
}
