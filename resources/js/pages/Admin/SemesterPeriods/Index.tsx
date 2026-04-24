import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm, usePage } from '@inertiajs/react';
import { CalendarDays, Check, Pencil, X } from 'lucide-react';
import { useState } from 'react';

interface SemesterPeriod {
    id: number;
    name: string;
    start_month: number;
    end_month: number;
    is_active: boolean;
}

interface Props {
    periods: SemesterPeriod[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Semester Periods', href: '/admin/semester-periods' },
];

const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];

function monthName(n: number) {
    return MONTHS[n - 1] ?? '—';
}

function EditRow({ period, onCancel }: { period: SemesterPeriod; onCancel: () => void }) {
    const { data, setData, put, processing, errors } = useForm({
        start_month: period.start_month,
        end_month: period.end_month,
        is_active: period.is_active,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/admin/semester-periods/${period.id}`, { onSuccess: onCancel });
    };

    return (
        <tr className="bg-blue-50">
            <td className="px-4 py-3 font-medium text-gray-900">{period.name}</td>
            <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                    <div>
                        <Label className="mb-1 block text-xs">Start Month</Label>
                        <select
                            value={data.start_month}
                            onChange={(e) => setData('start_month', Number(e.target.value))}
                            className="rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
                        >
                            {MONTHS.map((m, i) => (
                                <option key={i + 1} value={i + 1}>{m}</option>
                            ))}
                        </select>
                        {errors.start_month && <p className="mt-1 text-xs text-red-600">{errors.start_month}</p>}
                    </div>
                    <span className="mt-4 text-gray-400">→</span>
                    <div>
                        <Label className="mb-1 block text-xs">End Month</Label>
                        <select
                            value={data.end_month}
                            onChange={(e) => setData('end_month', Number(e.target.value))}
                            className="rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
                        >
                            {MONTHS.map((m, i) => (
                                <option key={i + 1} value={i + 1}>{m}</option>
                            ))}
                        </select>
                        {errors.end_month && <p className="mt-1 text-xs text-red-600">{errors.end_month}</p>}
                    </div>
                </div>
            </td>
            <td className="px-4 py-3">
                <label className="flex cursor-pointer items-center gap-2">
                    <input
                        type="checkbox"
                        checked={data.is_active}
                        onChange={(e) => setData('is_active', e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300"
                    />
                    <span className="text-sm">Active</span>
                </label>
            </td>
            <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                    <Button size="sm" disabled={processing} onClick={submit}>
                        <Check className="mr-1 h-4 w-4" />
                        Save
                    </Button>
                    <Button size="sm" variant="outline" onClick={onCancel}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </td>
        </tr>
    );
}

export default function Index({ periods }: Props) {
    const { currentSemester } = usePage().props as any;
    const [editingId, setEditingId] = useState<number | null>(null);

    const currentMonth = new Date().getMonth() + 1;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Semester Periods" />

            <div className="p-6 md:p-10">
                {/* Header */}
                <div className="mb-6 flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                        <CalendarDays className="h-7 w-7 text-primary" />
                        <h1 className="text-3xl font-bold text-gray-900">Semester Periods</h1>
                    </div>
                    <p className="text-gray-600">
                        Configure which months belong to each semester. The system uses these ranges to auto-detect the current semester.
                    </p>
                    {currentSemester?.name && (
                        <div className="mt-1 inline-flex items-center gap-2 rounded-full bg-green-100 px-4 py-1.5 text-sm font-medium text-green-800">
                            <span className="h-2 w-2 rounded-full bg-green-500" />
                            Currently: {currentSemester.name} · {currentSemester.school_year}
                        </div>
                    )}
                </div>

                {/* Table */}
                <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Semester</th>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Month Range</th>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {periods.map((period) => {
                                const isCurrent =
                                    period.is_active &&
                                    period.start_month <= currentMonth &&
                                    period.end_month >= currentMonth;

                                if (editingId === period.id) {
                                    return (
                                        <EditRow
                                            key={period.id}
                                            period={period}
                                            onCancel={() => setEditingId(null)}
                                        />
                                    );
                                }

                                return (
                                    <tr key={period.id} className={isCurrent ? 'bg-green-50' : 'hover:bg-gray-50'}>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-gray-900">{period.name}</span>
                                                {isCurrent && (
                                                    <Badge className="bg-green-100 text-green-800">Current</Badge>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-gray-600">
                                            {monthName(period.start_month)} – {monthName(period.end_month)}
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge className={period.is_active ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'}>
                                                {period.is_active ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setEditingId(period.id)}
                                            >
                                                <Pencil className="mr-1 h-4 w-4" />
                                                Edit
                                            </Button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                <p className="mt-4 text-xs text-gray-500">
                    Note: If today falls outside all active ranges, no semester is detected and forms will use the default value.
                </p>
            </div>
        </AppLayout>
    );
}
