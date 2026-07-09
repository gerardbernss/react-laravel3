import { PAGE_PADDING, PAGE_TITLE } from '@/constants/ui';
import { type Employee, useEmployeeForm } from '@/hooks/useEmployeeForm';
import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import { Building2 } from 'lucide-react';
import { type ReactNode } from 'react';

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

const inputCls = 'rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary disabled:opacity-50';

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
    return (
        <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-foreground">{label}</label>
            {children}
            {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
    );
}

/** Admin employee form for creating or updating an employee record with employment type and linked user account. */
export default function EmployeeForm({ employee, users, employmentTypes }: Props) {
    const { isEdit, breadcrumbs, data, setData, processing, errors, submit } = useEmployeeForm({ employee });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={isEdit ? 'Edit Employee' : 'Add Employee'} />
            <div className={`flex flex-1 flex-col gap-6 ${PAGE_PADDING}`}>
                <div>
                    <h1 className={`flex items-center gap-2 ${PAGE_TITLE}`}>
                        <Building2 className="h-6 w-6 text-primary" />
                        {isEdit ? 'Edit Employee' : 'Add Employee'}
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {isEdit ? 'Update employee information.' : 'Register a new SLU employee.'}
                    </p>
                </div>

                <form onSubmit={submit} className="max-w-2xl space-y-5">
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

                    <Field label="Employee UID" error={errors.employee_uid}>
                        <input
                            type="text"
                            value={data.employee_uid}
                            onChange={(e) => setData('employee_uid', e.target.value)}
                            placeholder="e.g. EMP-2024-001"
                            className={inputCls}
                        />
                    </Field>

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

                    <Field label="Email" error={errors.email}>
                        <input type="email" value={data.email} onChange={(e) => setData('email', e.target.value)} className={inputCls} />
                    </Field>

                    <div className="grid grid-cols-2 gap-4">
                        <Field label="Department" error={errors.department}>
                            <input type="text" value={data.department} onChange={(e) => setData('department', e.target.value)} placeholder="e.g. Science" className={inputCls} />
                        </Field>
                        <Field label="Position" error={errors.position}>
                            <input type="text" value={data.position} onChange={(e) => setData('position', e.target.value)} placeholder="e.g. Teacher" className={inputCls} />
                        </Field>
                    </div>

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

                    {isEdit && (
                        <Field label="Status" error={errors.is_active as string | undefined}>
                            <label className="flex cursor-pointer items-center gap-2">
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

                    <div className="flex gap-3 pt-2">
                        <button
                            type="submit"
                            disabled={processing}
                            className="rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                        >
                            {processing ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Employee'}
                        </button>
                        <a href="/admin/employees" className="rounded-lg border px-5 py-2 text-sm font-medium hover:bg-muted">
                            Cancel
                        </a>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
