import StudentLayout from '@/layouts/student-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { ClipboardList, Pencil, Check, X } from 'lucide-react';
import { useState } from 'react';

interface AttendanceRecord {
    id: number;
    subject_code: string | null;
    subject_name: string | null;
    date: string;
    status: 'Absent' | 'Late';
    remarks: string | null; // instructor/teacher note (read-only)
    reason: string | null;  // student-supplied explanation (editable)
}

interface Enrollment {
    school_year: string;
    semester: string;
    year_level: string;
}

interface Props {
    student: { id: number; username: string };
    enrollment: Enrollment | null;
    attendance: AttendanceRecord[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Attendance', href: '/student/attendance' },
];

const statusBadge: Record<string, string> = {
    Absent: 'bg-red-100 text-red-700',
    Late:   'bg-yellow-100 text-yellow-800',
};

function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-PH', {
        year: 'numeric', month: 'short', day: 'numeric',
    });
}

export default function Attendance({ enrollment, attendance }: Props) {
    // Track which row is being edited and the current draft value
    const [editingId, setEditingId]   = useState<number | null>(null);
    const [editValue, setEditValue]   = useState('');
    const [saving, setSaving]         = useState(false);

    const startEdit = (record: AttendanceRecord) => {
        setEditingId(record.id);
        setEditValue(record.reason ?? '');
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditValue('');
    };

    const saveReason = (id: number) => {
        setSaving(true);
        router.patch(
            route('student.attendance.reason', { attendance: id }),
            { reason: editValue.trim() || null },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setEditingId(null);
                    setEditValue('');
                },
                onFinish: () => setSaving(false),
            },
        );
    };

    return (
        <StudentLayout breadcrumbs={breadcrumbs}>
            <Head title="Attendance" />

            <div className="space-y-6 p-4 md:p-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Attendance</h1>
                    {enrollment && (
                        <p className="mt-1 text-sm text-gray-500">
                            {enrollment.school_year} &mdash; {enrollment.semester} &mdash; {enrollment.year_level}
                        </p>
                    )}
                </div>

                {!enrollment ? (
                    /* ── No enrollment ── */
                    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 py-16 text-center">
                        <ClipboardList className="mb-3 h-10 w-10 text-gray-400" />
                        <p className="text-sm font-medium text-gray-600">No enrollment record found.</p>
                        <p className="mt-1 text-xs text-gray-400">Your attendance records will appear here once you are enrolled.</p>
                    </div>
                ) : attendance.length === 0 ? (
                    /* ── No absences / lates ── */
                    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-green-200 bg-green-50 py-16 text-center">
                        <ClipboardList className="mb-3 h-10 w-10 text-green-400" />
                        <p className="text-sm font-semibold text-green-700">Great! No absences/tardiness were found.</p>
                        <p className="mt-1 text-xs text-green-500">Keep it up — your attendance is perfect so far.</p>
                    </div>
                ) : (
                    /* ── Absences / lates table ── */
                    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 text-sm">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-5 py-3 text-left font-semibold text-gray-600">#</th>
                                        <th className="px-5 py-3 text-left font-semibold text-gray-600">Subject</th>
                                        <th className="px-5 py-3 text-left font-semibold text-gray-600">Date</th>
                                        <th className="px-5 py-3 text-left font-semibold text-gray-600">Status</th>
                                        <th className="px-5 py-3 text-left font-semibold text-gray-600">Instructor Remarks</th>
                                        <th className="px-5 py-3 text-left font-semibold text-gray-600">Your Reason</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 bg-white">
                                    {attendance.map((record, index) => (
                                        <tr key={record.id} className="hover:bg-gray-50">

                                            {/* # */}
                                            <td className="px-5 py-3 text-gray-400">{index + 1}</td>

                                            {/* Subject */}
                                            <td className="px-5 py-3">
                                                <span className="font-mono text-xs font-semibold text-gray-700">
                                                    {record.subject_code ?? '—'}
                                                </span>
                                                {record.subject_name && (
                                                    <span className="ml-1.5 text-gray-500">{record.subject_name}</span>
                                                )}
                                            </td>

                                            {/* Date */}
                                            <td className="px-5 py-3 text-gray-700">{formatDate(record.date)}</td>

                                            {/* Status */}
                                            <td className="px-5 py-3">
                                                <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusBadge[record.status] ?? 'bg-gray-100 text-gray-600'}`}>
                                                    {record.status}
                                                </span>
                                            </td>

                                            {/* Instructor Remarks — read-only */}
                                            <td className="px-5 py-3 text-gray-500">
                                                {record.remarks ?? <span className="italic text-gray-300">—</span>}
                                            </td>

                                            {/* Your Reason — inline editable */}
                                            <td className="px-5 py-3">
                                                {editingId === record.id ? (
                                                    <div className="flex flex-col gap-1.5">
                                                        <textarea
                                                            className="w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-sm text-gray-800 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
                                                            rows={2}
                                                            maxLength={500}
                                                            value={editValue}
                                                            onChange={(e) => setEditValue(e.target.value)}
                                                            placeholder="Enter your reason…"
                                                            autoFocus
                                                        />
                                                        <div className="flex gap-1.5">
                                                            <button
                                                                type="button"
                                                                disabled={saving}
                                                                onClick={() => saveReason(record.id)}
                                                                className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-60"
                                                            >
                                                                <Check className="h-3 w-3" />
                                                                {saving ? 'Saving…' : 'Save'}
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={cancelEdit}
                                                                className="inline-flex items-center gap-1 rounded-md border border-gray-300 bg-white px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50"
                                                            >
                                                                <X className="h-3 w-3" />
                                                                Cancel
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2">
                                                        <span className={record.reason ? 'text-gray-700' : 'italic text-gray-400'}>
                                                            {record.reason ?? 'No reason provided'}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            title="Edit reason"
                                                            onClick={() => startEdit(record)}
                                                            className="shrink-0 rounded p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                                                        >
                                                            <Pencil className="h-3.5 w-3.5" />
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="border-t border-gray-100 bg-gray-50 px-5 py-2.5 text-xs text-gray-500">
                            {attendance.length} record{attendance.length !== 1 ? 's' : ''} &mdash; click the <Pencil className="inline h-3 w-3" /> icon to add or edit your reason for an absence or late.
                        </div>
                    </div>
                )}
            </div>
        </StudentLayout>
    );
}
