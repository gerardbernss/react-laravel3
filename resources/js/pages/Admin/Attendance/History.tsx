import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, CalendarDays, ClipboardCheck } from 'lucide-react';
import { useState } from 'react';

interface BlockSection {
    id: number;
    code: string;
    name: string;
    grade_level: string | null;
    strand: string | null;
    school_year: string | null;
    semester: string | null;
}

interface Subject {
    id: number;
    code: string;
    name: string;
}

interface AttendanceRecord {
    date: string;
    total_marked: number;
    present: number;
    absent: number;
    late: number;
    excused: number;
    attendance_rate: number | null;
}

interface Props {
    blockSection: BlockSection;
    subjects: Subject[];
    selectedSubjectId: number;
    dateFrom: string | null;
    dateTo: string | null;
    records: AttendanceRecord[];
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function formatDate(dateStr: string) {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });
}

function getDayName(dateStr: string) {
    const d = new Date(dateStr + 'T00:00:00');
    return DAY_NAMES[d.getDay()];
}

function rateColor(rate: number | null) {
    if (rate === null) return 'text-gray-400';
    if (rate >= 80) return 'text-green-600';
    if (rate >= 60) return 'text-yellow-600';
    return 'text-red-600';
}

export default function History({
    blockSection,
    subjects,
    selectedSubjectId,
    dateFrom,
    dateTo,
    records,
}: Props) {
    const [fromVal, setFromVal]   = useState(dateFrom ?? '');
    const [toVal, setToVal]       = useState(dateTo ?? '');
    const [subjectVal, setSubjectVal] = useState(String(selectedSubjectId));

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Attendance', href: '/attendance' },
        ...(blockSection.grade_level
            ? [{ title: blockSection.grade_level, href: `/attendance/grade/${encodeURIComponent(blockSection.grade_level)}` }]
            : []),
        { title: blockSection.code, href: `/attendance/${blockSection.id}` },
        { title: 'History', href: `/attendance/${blockSection.id}/history` },
    ];

    const applyFilters = () => {
        router.get(
            `/attendance/${blockSection.id}/history`,
            {
                subject_id: subjectVal,
                date_from: fromVal || undefined,
                date_to:   toVal   || undefined,
            },
            { preserveState: true, replace: true },
        );
    };

    const clearFilters = () => {
        setFromVal('');
        setToVal('');
        router.get(
            `/attendance/${blockSection.id}/history`,
            { subject_id: subjectVal },
            { preserveState: false, replace: true },
        );
    };

    const hasDateFilter = fromVal || toVal;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`History — ${blockSection.code}`} />

            <div className="p-6 md:p-10">

                {/* ── Header ── */}
                <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">
                            {blockSection.code}
                            <span className="ml-2 text-xl font-normal text-gray-500">{blockSection.name}</span>
                        </h1>
                        <p className="mt-1 text-sm text-gray-500">
                            {[blockSection.grade_level, blockSection.strand, blockSection.school_year, blockSection.semester]
                                .filter(Boolean)
                                .join(' · ')}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Link href={`/attendance/${blockSection.id}?subject_id=${subjectVal}`}>
                            <Button variant="outline">
                                <ClipboardCheck className="mr-2 h-4 w-4" />
                                Take / View Today
                            </Button>
                        </Link>
                        <Link href={blockSection.grade_level ? `/attendance/grade/${encodeURIComponent(blockSection.grade_level)}` : '/attendance'}>
                            <Button variant="outline">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* ── Filters ── */}
                <div className="mb-6 rounded-lg border bg-white p-4 shadow-sm">
                    <div className="flex flex-wrap items-end gap-4">

                        {/* Subject selector */}
                        {subjects.length > 1 && (
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-medium text-gray-500">Subject</label>
                                <select
                                    value={subjectVal}
                                    onChange={(e) => setSubjectVal(e.target.value)}
                                    className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
                                >
                                    {subjects.map((s) => (
                                        <option key={s.id} value={String(s.id)}>
                                            {s.code} — {s.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Date From */}
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-medium text-gray-500">From</label>
                            <input
                                type="date"
                                value={fromVal}
                                onChange={(e) => setFromVal(e.target.value)}
                                className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
                            />
                        </div>

                        {/* Date To */}
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-medium text-gray-500">To</label>
                            <input
                                type="date"
                                value={toVal}
                                onChange={(e) => setToVal(e.target.value)}
                                className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
                            />
                        </div>

                        <Button onClick={applyFilters} size="sm">Apply</Button>

                        {hasDateFilter && (
                            <Button onClick={clearFilters} variant="ghost" size="sm" className="text-gray-500">
                                Clear dates
                            </Button>
                        )}
                    </div>
                </div>

                {/* ── Table ── */}
                {records.length === 0 ? (
                    <div className="rounded-lg border bg-white p-12 text-center shadow-sm">
                        <CalendarDays className="mx-auto mb-3 h-10 w-10 text-gray-300" />
                        <p className="text-sm font-medium text-gray-500">No attendance records found.</p>
                        {hasDateFilter && (
                            <p className="mt-1 text-xs text-gray-400">Try widening the date range or clearing the filters.</p>
                        )}
                    </div>
                ) : (
                    <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Date</th>
                                        <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">Marked</th>
                                        <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-green-600">Present</th>
                                        <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-red-600">Absent</th>
                                        <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-yellow-600">Late</th>
                                        <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-blue-600">Excused</th>
                                        <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">Rate</th>
                                        <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {records.map((record) => (
                                        <tr key={record.date} className="transition-colors hover:bg-gray-50">

                                            {/* Date */}
                                            <td className="px-4 py-3">
                                                <p className="font-medium text-gray-900">{formatDate(record.date)}</p>
                                                <p className="text-xs text-gray-400">{getDayName(record.date)}</p>
                                            </td>

                                            {/* Marked */}
                                            <td className="px-4 py-3 text-center">
                                                <Badge variant="outline">{record.total_marked}</Badge>
                                            </td>

                                            {/* Present */}
                                            <td className="px-4 py-3 text-center">
                                                {record.present > 0
                                                    ? <Badge className="bg-green-100 text-green-700 hover:bg-green-100">{record.present}</Badge>
                                                    : <span className="text-gray-300">—</span>}
                                            </td>

                                            {/* Absent */}
                                            <td className="px-4 py-3 text-center">
                                                {record.absent > 0
                                                    ? <Badge className="bg-red-100 text-red-700 hover:bg-red-100">{record.absent}</Badge>
                                                    : <span className="text-gray-300">—</span>}
                                            </td>

                                            {/* Late */}
                                            <td className="px-4 py-3 text-center">
                                                {record.late > 0
                                                    ? <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">{record.late}</Badge>
                                                    : <span className="text-gray-300">—</span>}
                                            </td>

                                            {/* Excused */}
                                            <td className="px-4 py-3 text-center">
                                                {record.excused > 0
                                                    ? <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">{record.excused}</Badge>
                                                    : <span className="text-gray-300">—</span>}
                                            </td>

                                            {/* Rate */}
                                            <td className={`px-4 py-3 text-center font-semibold ${rateColor(record.attendance_rate)}`}>
                                                {record.attendance_rate !== null ? `${record.attendance_rate}%` : '—'}
                                            </td>

                                            {/* Actions */}
                                            <td className="px-4 py-3 text-center">
                                                <Link
                                                    href={`/attendance/${blockSection.id}?date=${record.date}&subject_id=${subjectVal}`}
                                                >
                                                    <Button variant="outline" size="sm">
                                                        <ClipboardCheck className="mr-1 h-3.5 w-3.5" />
                                                        View / Edit
                                                    </Button>
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="border-t bg-gray-50 px-4 py-2.5 text-xs text-gray-500">
                            {records.length} date{records.length !== 1 ? 's' : ''} with recorded attendance
                            {hasDateFilter && ` · filtered`}
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
