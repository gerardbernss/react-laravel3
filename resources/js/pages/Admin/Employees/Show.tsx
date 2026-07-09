import { AppBadge } from '@/components/AppBadge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PAGE_PADDING, PAGE_TITLE } from '@/constants/ui';
import { EMPLOYMENT_TYPE_LABELS, type Employee } from '@/hooks/useEmployees';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Building2, Pencil } from 'lucide-react';

interface Props {
    employee: Employee;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Employees', href: '/admin/employees' },
    { title: 'Employee Details', href: '#' },
];

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="flex flex-col gap-1 py-3 sm:flex-row sm:gap-4">
            <dt className="w-40 shrink-0 text-sm font-medium text-muted-foreground">{label}</dt>
            <dd className="text-sm text-foreground">{value ?? <span className="text-muted-foreground">—</span>}</dd>
        </div>
    );
}

export default function EmployeeShow({ employee }: Props) {
    const fullName = [employee.last_name, employee.first_name, employee.middle_name ? `${employee.middle_name[0]}.` : null]
        .filter(Boolean)
        .join(', ');

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Employee — ${fullName}`} />

            <div className={`flex flex-col gap-6 ${PAGE_PADDING}`}>
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className={`flex items-center gap-2 ${PAGE_TITLE}`}>
                            <Building2 className="h-7 w-7 text-primary" />
                            {fullName}
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">{employee.position} · {employee.department}</p>
                    </div>
                    <Link href={`/admin/employees/${employee.id}/edit`}>
                        <Button variant="outline" size="sm">
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                        </Button>
                    </Link>
                </div>

                <div className="rounded-xl border bg-card shadow-sm">
                    <div className="border-b px-6 py-4">
                        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Employee Information</h2>
                    </div>
                    <dl className="divide-y px-6">
                        <DetailRow label="Employee UID" value={<span className="font-mono text-xs">{employee.employee_uid}</span>} />
                        <DetailRow label="First Name" value={employee.first_name} />
                        <DetailRow label="Middle Name" value={employee.middle_name} />
                        <DetailRow label="Last Name" value={employee.last_name} />
                        <DetailRow label="Email" value={employee.email} />
                        <DetailRow label="Department" value={employee.department} />
                        <DetailRow label="Position" value={employee.position} />
                        <DetailRow
                            label="Employment Type"
                            value={
                                <Badge variant="outline" className="text-xs">
                                    {EMPLOYMENT_TYPE_LABELS[employee.employment_type] ?? employee.employment_type}
                                </Badge>
                            }
                        />
                        <DetailRow label="Hire Date" value={employee.hire_date} />
                        <DetailRow
                            label="Status"
                            value={
                                <AppBadge status={employee.is_active ? 'active' : 'inactive'}>
                                    {employee.is_active ? 'Active' : 'Inactive'}
                                </AppBadge>
                            }
                        />
                    </dl>
                </div>

                {employee.user && (
                    <div className="rounded-xl border bg-card shadow-sm">
                        <div className="border-b px-6 py-4">
                            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Linked System Account</h2>
                        </div>
                        <dl className="divide-y px-6">
                            <DetailRow label="Name" value={employee.user.name} />
                            <DetailRow label="Email" value={employee.user.email} />
                        </dl>
                    </div>
                )}

                <div>
                    <Link href="/admin/employees">
                        <Button variant="outline" size="sm">Back to Employees</Button>
                    </Link>
                </div>
            </div>
        </AppLayout>
    );
}
