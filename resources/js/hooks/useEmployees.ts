import { router } from '@inertiajs/react';
import { useState } from 'react';

export interface Employee {
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

export interface EmployeeFilters {
    search?: string;
    department?: string;
    status?: string;
}

export const EMPLOYMENT_TYPE_LABELS: Record<string, string> = {
    regular: 'Regular',
    part_time: 'Part-time',
    contractual: 'Contractual',
};

export function useEmployees(filters: EmployeeFilters) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [department, setDepartment] = useState(filters.department ?? '');
    const [status, setStatus] = useState(filters.status ?? '');
    const [deactivateDialog, setDeactivateDialog] = useState<{ open: boolean; employee: Employee | null }>({
        open: false, employee: null,
    });

    const hasFilters = !!(filters.search || filters.department || filters.status);

    const applyFilters = (overrides: Record<string, string> = {}) => {
        router.get(
            '/employees',
            { search, department, status, ...overrides },
            { preserveState: true, replace: true },
        );
    };

    const clearFilters = () => {
        setSearch('');
        setDepartment('');
        setStatus('');
        router.get('/employees', {}, { preserveState: false });
    };

    const handleDeactivate = (employee: Employee) => {
        setDeactivateDialog({ open: true, employee });
    };

    const confirmDeactivate = () => {
        if (!deactivateDialog.employee) return;
        router.delete(`/employees/${deactivateDialog.employee.id}`, {
            onSuccess: () => setDeactivateDialog({ open: false, employee: null }),
        });
    };

    return {
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
    };
}
