import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TablePagination } from '@/components/ui/table-pagination';
import { CARD, HELPER_TEXT, PAGE_PADDING, PAGE_TITLE, TABLE_HEADER_CELL, TABLE_ROW_ACTION } from '@/constants/ui';
import { useSemesterPeriodEdit } from '@/hooks/useSemesterPeriodEdit';
import { MONTHS, monthName, useSemesterPeriods, type SemesterPeriod } from '@/hooks/useSemesterPeriods';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { Check, Pencil, X } from 'lucide-react';

interface Props {
    periods: SemesterPeriod[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Semester Periods', href: '/admin/semester-periods' },
];

function EditRow({ period, onCancel }: { period: SemesterPeriod; onCancel: () => void }) {
    const { data, setData, processing, errors, submit } = useSemesterPeriodEdit({ period, onCancel });

    return (
        <tr className="bg-blue-50">
            <td className="px-4 py-3 font-medium text-gray-900">{period.name}</td>
            <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                    <div>
                        <Label className="mb-1 block text-xs">Start Month</Label>
                        <Select
                            value={String(data.start_month)}
                            onValueChange={(v) => setData('start_month', Number(v))}
                        >
                            <SelectTrigger className="h-8 w-36 text-sm">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {MONTHS.map((m, i) => (
                                    <SelectItem key={i + 1} value={String(i + 1)}>{m}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.start_month && <p className="mt-1 text-xs text-red-600">{errors.start_month}</p>}
                    </div>
                    <span className="mt-4 text-gray-400">→</span>
                    <div>
                        <Label className="mb-1 block text-xs">End Month</Label>
                        <Select
                            value={String(data.end_month)}
                            onValueChange={(v) => setData('end_month', Number(v))}
                        >
                            <SelectTrigger className="h-8 w-36 text-sm">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {MONTHS.map((m, i) => (
                                    <SelectItem key={i + 1} value={String(i + 1)}>{m}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
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

/** Admin semester periods list — create, inline-edit, and delete semester date windows. */
export default function Index({ periods }: Props) {
    const {
        currentSemester,
        editingId,
        setEditingId,
        currentPage,
        setCurrentPage,
        pageSize,
        setPageSize,
        currentMonth,
        paginated,
    } = useSemesterPeriods(periods);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Semester Periods" />

            <div className={PAGE_PADDING}>
                <div className="mb-6 flex flex-col gap-2">
                    <h1 className={PAGE_TITLE}>Semester Periods</h1>
                    {currentSemester?.name && (
                        <div className="mt-1 inline-flex items-center gap-2 rounded-full bg-green-100 px-4 py-1.5 text-sm font-medium text-green-800">
                            <span className="h-2 w-2 rounded-full bg-green-500" />
                            Currently: {currentSemester.name} · {currentSemester.school_year}
                        </div>
                    )}
                </div>

                <div className={`overflow-hidden ${CARD}`}>
                    <div className="max-h-[70vh] overflow-x-auto overflow-y-auto">
                        <table className="w-full text-sm">
                            <thead className="sticky top-0 z-10 bg-gray-50">
                                <tr>
                                    <th className={TABLE_HEADER_CELL}>Semester</th>
                                    <th className={TABLE_HEADER_CELL}>Month Range</th>
                                    <th className={TABLE_HEADER_CELL}>Status</th>
                                    <th className={TABLE_HEADER_CELL}>Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {paginated.map((period) => {
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
                                                <button
                                                    onClick={() => setEditingId(period.id)}
                                                    className={TABLE_ROW_ACTION}
                                                >
                                                    <Pencil className="h-3 w-3" /> Edit
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    <TablePagination
                        total={periods.length}
                        pageSize={pageSize}
                        currentPage={currentPage}
                        onPageChange={setCurrentPage}
                        onPageSizeChange={(s) => { setPageSize(s); setCurrentPage(1); }}
                    />
                </div>

                <p className={`mt-4 ${HELPER_TEXT}`}>
                    Note: If today falls outside all active ranges, no semester is detected and forms will use the default value.
                </p>
            </div>
        </AppLayout>
    );
}
