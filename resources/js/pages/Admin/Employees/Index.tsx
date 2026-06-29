import { AppBadge } from '@/components/AppBadge';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FILTER_CARD, PAGE_PADDING, PAGE_TITLE, TABLE_HEADER_CELL, TABLE_ROW_ACTION, TABLE_ROW_ACTION_DANGER } from '@/constants/ui';
import { EMPLOYMENT_TYPE_LABELS, useEmployees, type Employee, type EmployeeFilters } from '@/hooks/useEmployees';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { Building2, Pencil, Plus, PowerOff, Search, X } from 'lucide-react';

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
    filters: EmployeeFilters;
    flash?: { success?: string };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Employees', href: '/employees' },
];

interface EmployeeRowProps {
    employee: Employee;
    onDeactivate: (employee: Employee) => void;
}

function EmployeeRow({ employee: emp, onDeactivate }: EmployeeRowProps) {
    return (
        <tr className="hover:bg-muted/30">
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
                <Badge variant="outline" className="text-xs">
                    {EMPLOYMENT_TYPE_LABELS[emp.employment_type] ?? emp.employment_type}
                </Badge>
            </td>
            <td className="px-4 py-3">
                <AppBadge status={emp.is_active ? 'active' : 'inactive'}>
                    {emp.is_active ? 'Active' : 'Inactive'}
                </AppBadge>
            </td>
            <td className="px-4 py-3">
                <div className="flex justify-end gap-2">
                    <Link href={`/employees/${emp.id}/edit`}>
                        <button className={TABLE_ROW_ACTION}>
                            <Pencil className="h-3 w-3" /> Edit
                        </button>
                    </Link>
                    {emp.is_active && (
                        <button
                            onClick={() => onDeactivate(emp)}
                            className={TABLE_ROW_ACTION_DANGER}
                        >
                            <PowerOff className="h-3 w-3" /> Deactivate
                        </button>
                    )}
                </div>
            </td>
        </tr>
    );
}

export default function EmployeesIndex() {
    const { employees, departments, filters, flash } = usePage().props as unknown as PageProps;
    const {
        search,
        setSearch,
        department,
        setDepartment,
        status,
        setStatus,
        deactivateDialog,
        setDeactivateDialog,
        hasFilters,
        applyFilters,
        clearFilters,
        handleDeactivate,
        confirmDeactivate,
    } = useEmployees(filters);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Employees" />

            <div className={`flex flex-col gap-6 ${PAGE_PADDING}`}>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className={`flex items-center gap-2 ${PAGE_TITLE}`}>
                            <Building2 className="h-7 w-7 text-primary" />
                            Employees
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {employees.total} employee{employees.total !== 1 ? 's' : ''} on record
                        </p>
                    </div>
                    <Link href="/employees/create">
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Employee
                        </Button>
                    </Link>
                </div>

                {flash?.success && (
                    <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400">
                        {flash.success}
                    </div>
                )}

                <div className={FILTER_CARD}>
                    <div className="flex flex-wrap gap-3">
                        <div className="relative min-w-[200px] flex-1">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                type="text"
                                placeholder="Search name, UID, department…"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && applyFilters({ search })}
                                className="pl-9"
                            />
                        </div>
                        <Select value={department || 'all'} onValueChange={(v) => { setDepartment(v === 'all' ? '' : v); applyFilters({ department: v === 'all' ? '' : v }); }}>
                            <SelectTrigger className="w-48"><SelectValue placeholder="All Departments" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Departments</SelectItem>
                                {departments.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <Select value={status || 'all'} onValueChange={(v) => { setStatus(v === 'all' ? '' : v); applyFilters({ status: v === 'all' ? '' : v }); }}>
                            <SelectTrigger className="w-36"><SelectValue placeholder="All Status" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="inactive">Inactive</SelectItem>
                            </SelectContent>
                        </Select>
                        {hasFilters && (
                            <Button variant="outline" onClick={clearFilters}>
                                <X className="mr-1 h-4 w-4" /> Clear
                            </Button>
                        )}
                        <Button onClick={() => applyFilters()}>
                            <Search className="mr-2 h-4 w-4" /> Search
                        </Button>
                    </div>
                </div>

                <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50">
                                <tr>
                                    <th className={TABLE_HEADER_CELL}>Employee</th>
                                    <th className={TABLE_HEADER_CELL}>UID</th>
                                    <th className={TABLE_HEADER_CELL}>Department</th>
                                    <th className={TABLE_HEADER_CELL}>Position</th>
                                    <th className={TABLE_HEADER_CELL}>Type</th>
                                    <th className={TABLE_HEADER_CELL}>Status</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {employees.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="py-10 text-center text-muted-foreground">
                                            No employees found.
                                        </td>
                                    </tr>
                                ) : employees.data.map((emp) => (
                                    <EmployeeRow
                                        key={emp.id}
                                        employee={emp}
                                        onDeactivate={handleDeactivate}
                                    />
                                ))}
                            </tbody>
                        </table>
                    </div>

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

            <ConfirmDialog
                open={deactivateDialog.open}
                onClose={() => setDeactivateDialog({ open: false, employee: null })}
                onConfirm={confirmDeactivate}
                title="Deactivate Employee"
                description={
                    deactivateDialog.employee
                        ? `Deactivate ${deactivateDialog.employee.first_name} ${deactivateDialog.employee.last_name}?`
                        : ''
                }
                confirmLabel="Deactivate"
                processingLabel="Deactivating..."
                processing={false}
            />
        </AppLayout>
    );
}
