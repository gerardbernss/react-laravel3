import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Building2, Pencil, Plus, PowerOff, Search, X } from 'lucide-react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Employees', href: '/employees' },
];

interface Employee {
    id: number;
    employee_uid: string;
    first_name: string;
    last_name: string;
    middle_name: string | null;
    email: string;
    department: string;
    position: string;
    employment_type: string;
    hire_date: string;
    is_active: boolean;
    user: { id: number; name: string; email: string } | null;
}

interface PaginatedEmployees {
    data: Employee[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
}

interface PageProps {
    employees: PaginatedEmployees;
    departments: string[];
    filters: { search?: string; department?: string; status?: string };
    flash?: { success?: string };
}

const employmentTypeLabel: Record<string, string> = {
    regular: 'Regular',
    part_time: 'Part-time',
    contractual: 'Contractual',
};

export default function EmployeesIndex() {
    const { employees, departments, filters, flash } = usePage().props as unknown as PageProps;

    const [search, setSearch] = useState(filters.search ?? '');
    const [department, setDepartment] = useState(filters.department ?? '');
    const [status, setStatus] = useState(filters.status ?? '');

    function applyFilters(overrides: Record<string, string> = {}) {
        router.get(
            '/employees',
            { search, department, status, ...overrides },
            { preserveState: true, replace: true },
        );
    }

    function clearFilters() {
        setSearch('');
        setDepartment('');
        setStatus('');
        router.get('/employees', {}, { preserveState: false });
    }

    function deactivate(employee: Employee) {
        if (!confirm(`Deactivate ${employee.first_name} ${employee.last_name}?`)) return;
        router.delete(`/employees/${employee.id}`);
    }

    const hasFilters = !!(filters.search || filters.department || filters.status);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Employees" />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground">
                            <Building2 className="h-6 w-6 text-primary" />
                            Employees
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {employees.total} employee{employees.total !== 1 ? 's' : ''} on record
                        </p>
                    </div>
                    <Link
                        href="/employees/create"
                        className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                    >
                        <Plus className="h-4 w-4" />
                        Add Employee
                    </Link>
                </div>

                {/* Flash */}
                {flash?.success && (
                    <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400">
                        {flash.success}
                    </div>
                )}

                {/* Filters */}
                <div className="flex flex-wrap gap-3">
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search name, UID, department…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && applyFilters({ search })}
                            className="w-full rounded-lg border bg-background py-2 pl-9 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>
                    <select
                        value={department}
                        onChange={(e) => { setDepartment(e.target.value); applyFilters({ department: e.target.value }); }}
                        className="rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                    >
                        <option value="">All Departments</option>
                        {departments.map((d) => (
                            <option key={d} value={d}>{d}</option>
                        ))}
                    </select>
                    <select
                        value={status}
                        onChange={(e) => { setStatus(e.target.value); applyFilters({ status: e.target.value }); }}
                        className="rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                    >
                        <option value="">All Status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </select>
                    {hasFilters && (
                        <button
                            onClick={clearFilters}
                            className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-sm text-muted-foreground hover:bg-muted"
                        >
                            <X className="h-4 w-4" /> Clear
                        </button>
                    )}
                    <button
                        onClick={() => applyFilters()}
                        className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                    >
                        Search
                    </button>
                </div>

                {/* Table */}
                <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50">
                                <tr>
                                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Employee</th>
                                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">UID</th>
                                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Department</th>
                                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Position</th>
                                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Type</th>
                                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {employees.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="py-10 text-center text-muted-foreground">
                                            No employees found.
                                        </td>
                                    </tr>
                                ) : (
                                    employees.data.map((emp) => (
                                        <tr key={emp.id} className="hover:bg-muted/30">
                                            <td className="px-4 py-3">
                                                <p className="font-medium text-foreground">
                                                    {emp.last_name}, {emp.first_name}
                                                    {emp.middle_name ? ` ${emp.middle_name[0]}.` : ''}
                                                </p>
                                                <p className="text-xs text-muted-foreground">{emp.email}</p>
                                            </td>
                                            <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{emp.employee_uid}</td>
                                            <td className="px-4 py-3">{emp.department}</td>
                                            <td className="px-4 py-3">{emp.position}</td>
                                            <td className="px-4 py-3">
                                                <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
                                                    {employmentTypeLabel[emp.employment_type] ?? emp.employment_type}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span
                                                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                                        emp.is_active
                                                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                    }`}
                                                >
                                                    {emp.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex justify-end gap-2">
                                                    <Link
                                                        href={`/employees/${emp.id}/edit`}
                                                        className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs hover:bg-muted"
                                                    >
                                                        <Pencil className="h-3 w-3" /> Edit
                                                    </Link>
                                                    {emp.is_active && (
                                                        <button
                                                            onClick={() => deactivate(emp)}
                                                            className="inline-flex items-center gap-1 rounded-md border border-red-200 px-2 py-1 text-xs text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
                                                        >
                                                            <PowerOff className="h-3 w-3" /> Deactivate
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {employees.last_page > 1 && (
                        <div className="flex items-center justify-between border-t px-4 py-3 text-sm text-muted-foreground">
                            <span>
                                Page {employees.current_page} of {employees.last_page} — {employees.total} total
                            </span>
                            <div className="flex gap-1">
                                {employees.links.map((link, i) => (
                                    <Link
                                        key={i}
                                        href={link.url ?? '#'}
                                        className={`rounded px-2 py-1 text-xs ${
                                            link.active
                                                ? 'bg-primary text-primary-foreground'
                                                : link.url
                                                  ? 'hover:bg-muted'
                                                  : 'cursor-default opacity-40'
                                        }`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
