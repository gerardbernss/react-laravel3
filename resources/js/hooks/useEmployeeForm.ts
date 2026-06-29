import { useForm } from '@inertiajs/react';
import { type FormEvent } from 'react';

export interface Employee {
    id: number;
    user_id: number | null;
    employee_uid: string;
    first_name: string;
    last_name: string;
    middle_name: string;
    email: string;
    department: string;
    position: string;
    employment_type: string;
    hire_date: string;
    is_active: boolean;
}

interface Params {
    employee?: Employee;
}

export function useEmployeeForm({ employee }: Params) {
    const isEdit = !!employee;

    const breadcrumbs = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Employees', href: '/employees' },
        { title: isEdit ? 'Edit Employee' : 'Add Employee', href: '#' },
    ];

    const { data, setData, post, put, processing, errors } = useForm({
        user_id: employee?.user_id ?? '',
        employee_uid: employee?.employee_uid ?? '',
        first_name: employee?.first_name ?? '',
        last_name: employee?.last_name ?? '',
        middle_name: employee?.middle_name ?? '',
        email: employee?.email ?? '',
        department: employee?.department ?? '',
        position: employee?.position ?? '',
        employment_type: employee?.employment_type ?? 'regular',
        hire_date: employee?.hire_date ?? '',
        is_active: employee?.is_active ?? true,
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        if (isEdit) {
            put(`/employees/${employee!.id}`);
        } else {
            post('/employees');
        }
    };

    return { isEdit, breadcrumbs, data, setData, processing, errors, submit };
}
