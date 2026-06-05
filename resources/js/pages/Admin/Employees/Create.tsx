import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import { Building2 } from 'lucide-react';

interface Employee {
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

interface User {
    id: number;
    name: string;
    email: string;
}

interface Props {
    employee?: Employee;
    users: User[];
    employmentTypes: string[];
}

export default function EmployeeForm({ employee, users, employmentTypes }: Props) {
    const isEdit = !!employee;

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Employees', href: '/employees' },
        { title: isEdit ? 'Edit Employee' : 'Add Employee', href: '#' },
    ];

    const { data, setData, post, put, processing, errors } = useForm({
        user_id:         employee?.user_id ?? '',
        employee_uid:    employee?.employee_uid ?? '',
        first_name:      employee?.first_name ?? '',
        last_name:       employee?.last_name ?? '',
        middle_name:     employee?.middle_name ?? '',
        email:           employee?.email ?? '',
        department:      employee?.department ?? '',
        position:        employee?.position ?? '',
        employment_type: employee?.employment_type ?? 'regular',
        hire_date:       employee?.hire_date ?? '',
        is_active:       employee?.is_active ?? true,
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        if (isEdit) {
            put(`/employees/${employee!.id}`);
        } else {
            post('/employees');
        }
    }

    function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
        return (
            <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-foreground">{label}</label>
                {children}
                {error && <p className="text-xs text-red-600">{error}</p>}
            </div>
        );
    }

    const inputCls = 'rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary disabled:opacity-50';

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={isEdit ? 'Edit Employee' : 'Add Employee'} />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <div>
                    <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground">
                        <Building2 className="h-6 w-6 text-primary" />
                        {isEdit ? 'Edit Employee' : 'Add Employee'}
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {isEdit ? 'Update employee information.' : 'Register a new SLU employee.'}
                    </p>
                </div>

                <form onSubmit={submit} className="max-w-2xl space-y-5">
                    {/* System Account Link */}
                    <Field label="Link to System User (optional)" error={errors.user_id}>
                        <select
                            value={data.user_id}
                            onChange={(e) => setData('user_id', e.target.value)}
                            className={inputCls}
                        >
                            <option value="">— No system account —</option>
                            {users.map((u) => (
                                <option key={u.id} value={u.id}>
                                    {u.name} ({u.email})
                                </option>
                            ))}
                        </select>
                    </Field>

                    {/* Employee UID */}
                    <Field label="Employee UID" error={errors.employee_uid}>
                        <input
                            type="text"
                            value={data.employee_uid}
                            onChange={(e) => setData('employee_uid', e.target.value)}
                            placeholder="e.g. EMP-2024-001"
                            className={inputCls}
                        />
                    </Field>

                    {/* Name row */}
                    <div className="grid grid-cols-3 gap-4">
                        <Field label="First Name" error={errors.first_name}>
                            <input type="text" value={data.first_name} onChange={(e) => setData('first_name', e.target.value)} className={inputCls} />
                        </Field>
                        <Field label="Middle Name" error={errors.middle_name}>
                            <input type="text" value={data.middle_name} onChange={(e) => setData('middle_name', e.target.value)} className={inputCls} />
                        </Field>
                        <Field label="Last Name" error={errors.last_name}>
                            <input type="text" value={data.last_name} onChange={(e) => setData('last_name', e.target.value)} className={inputCls} />
                        </Field>
                    </div>

                    {/* Email */}
                    <Field label="Email" error={errors.email}>
                        <input type="email" value={data.email} onChange={(e) => setData('email', e.target.value)} className={inputCls} />
                    </Field>

                    {/* Department + Position */}
                    <div className="grid grid-cols-2 gap-4">
                        <Field label="Department" error={errors.department}>
                            <input type="text" value={data.department} onChange={(e) => setData('department', e.target.value)} placeholder="e.g. Science" className={inputCls} />
                        </Field>
                        <Field label="Position" error={errors.position}>
                            <input type="text" value={data.position} onChange={(e) => setData('position', e.target.value)} placeholder="e.g. Teacher" className={inputCls} />
                        </Field>
                    </div>

                    {/* Employment Type + Hire Date */}
                    <div className="grid grid-cols-2 gap-4">
                        <Field label="Employment Type" error={errors.employment_type}>
                            <select value={data.employment_type} onChange={(e) => setData('employment_type', e.target.value)} className={inputCls}>
                                {employmentTypes.map((t) => (
                                    <option key={t} value={t}>
                                        {t.charAt(0).toUpperCase() + t.slice(1).replace('_', '-')}
                                    </option>
                                ))}
                            </select>
                        </Field>
                        <Field label="Hire Date" error={errors.hire_date}>
                            <input type="date" value={data.hire_date} onChange={(e) => setData('hire_date', e.target.value)} className={inputCls} />
                        </Field>
                    </div>

                    {/* Active toggle (edit only) */}
                    {isEdit && (
                        <Field label="Status" error={errors.is_active as string | undefined}>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={data.is_active as boolean}
                                    onChange={(e) => setData('is_active', e.target.checked)}
                                    className="h-4 w-4 rounded"
                                />
                                <span className="text-sm text-muted-foreground">Active</span>
                            </label>
                        </Field>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="submit"
                            disabled={processing}
                            className="rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                        >
                            {processing ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Employee'}
                        </button>
                        <a
                            href="/employees"
                            className="rounded-lg border px-5 py-2 text-sm font-medium hover:bg-muted"
                        >
                            Cancel
                        </a>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
