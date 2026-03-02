import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, CheckCircle, Clock, Loader2, Save, UserX, Users } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';

interface StudentRow {
    enrollment_id: number;
    student_id: number;
    student_id_number: string;
    last_name: string;
    first_name: string;
    middle_name: string | null;
    status: string | null;
    remarks: string;
    attendance_id: number | null;
}

interface SubjectOption {
    id: number;
    code: string;
    name: string;
}

interface BlockSection {
    id: number;
    code: string;
    name: string;
    grade_level: string | null;
    strand: string | null;
    school_year: string | null;
    semester: string | null;
    adviser: string | null;
}

interface Statistics {
    total_students: number;
    marked_count: number;
    present_count: number;
    absent_count: number;
    late_count: number;
    excused_count: number;
    attendance_rate: number | null;
}

interface Props {
    blockSection: BlockSection;
    students: StudentRow[];
    statistics: Statistics;
    selectedDate: string;
    selectedSubjectId: number;
    subjects: SubjectOption[];
}

type AttendanceChange = {
    student_enrollment_id: number;
    status: string;
    remarks: string;
};

const STATUS_OPTIONS = ['Present', 'Absent', 'Late', 'Excused'] as const;

function getStatusColor(status: string | null): string {
    switch (status) {
        case 'Present': return 'bg-green-50';
        case 'Absent': return 'bg-red-50';
        case 'Late': return 'bg-yellow-50';
        case 'Excused': return 'bg-blue-50';
        default: return '';
    }
}

function getStatusBadgeClass(status: string): string {
    switch (status) {
        case 'Present': return 'bg-green-100 text-green-800 border-green-200';
        case 'Absent': return 'bg-red-100 text-red-800 border-red-200';
        case 'Late': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        case 'Excused': return 'bg-blue-100 text-blue-800 border-blue-200';
        default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
}

export default function Sheet({ blockSection, students, statistics, selectedDate, selectedSubjectId, subjects }: Props) {
    const [changes, setChanges] = useState<Map<number, AttendanceChange>>(new Map());
    const [saving, setSaving] = useState(false);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Attendance', href: '/attendance' },
        { title: blockSection.code, href: `/attendance/${blockSection.id}` },
    ];

    // Initialize changes from existing data
    const getCurrentValue = useCallback(
        (student: StudentRow): { status: string | null; remarks: string } => {
            const change = changes.get(student.enrollment_id);
            if (change) return { status: change.status, remarks: change.remarks };
            return { status: student.status, remarks: student.remarks };
        },
        [changes],
    );

    const handleStatusChange = useCallback((enrollmentId: number, student: StudentRow, status: string) => {
        setChanges((prev) => {
            const next = new Map(prev);
            const existing = next.get(enrollmentId);
            next.set(enrollmentId, {
                student_enrollment_id: enrollmentId,
                status,
                remarks: existing?.remarks ?? student.remarks ?? '',
            });
            return next;
        });
    }, []);

    const handleRemarksChange = useCallback((enrollmentId: number, student: StudentRow, remarks: string) => {
        setChanges((prev) => {
            const next = new Map(prev);
            const existing = next.get(enrollmentId);
            next.set(enrollmentId, {
                student_enrollment_id: enrollmentId,
                status: existing?.status ?? student.status ?? 'Present',
                remarks,
            });
            return next;
        });
    }, []);

    const markAllAs = useCallback((status: string) => {
        setChanges((prev) => {
            const next = new Map(prev);
            for (const student of students) {
                const existing = next.get(student.enrollment_id);
                next.set(student.enrollment_id, {
                    student_enrollment_id: student.enrollment_id,
                    status,
                    remarks: existing?.remarks ?? student.remarks ?? '',
                });
            }
            return next;
        });
    }, [students]);

    // Live statistics based on current changes
    const liveStats = useMemo(() => {
        let present = 0, absent = 0, late = 0, excused = 0, marked = 0;
        for (const student of students) {
            const { status } = getCurrentValue(student);
            if (status) {
                marked++;
                if (status === 'Present') present++;
                else if (status === 'Absent') absent++;
                else if (status === 'Late') late++;
                else if (status === 'Excused') excused++;
            }
        }
        return {
            total_students: students.length,
            marked_count: marked,
            present_count: present,
            absent_count: absent,
            late_count: late,
            excused_count: excused,
            attendance_rate: marked > 0 ? Math.round(((present + late) / marked) * 1000) / 10 : null,
        };
    }, [students, getCurrentValue]);

    const hasChanges = changes.size > 0;

    const handleSubjectChange = (subjectId: string) => {
        router.get(`/attendance/${blockSection.id}`, {
            date: selectedDate,
            subject_id: subjectId,
        }, { preserveState: false });
    };

    const handleDateChange = (date: string) => {
        router.get(`/attendance/${blockSection.id}`, {
            date,
            subject_id: selectedSubjectId,
        }, { preserveState: false });
    };

    const handleSave = () => {
        if (!hasChanges) return;
        setSaving(true);

        const attendance = Array.from(changes.values());

        router.post(
            `/attendance/${blockSection.id}`,
            {
                date: selectedDate,
                subject_id: selectedSubjectId,
                attendance,
            },
            {
                preserveScroll: true,
                onFinish: () => {
                    setSaving(false);
                    setChanges(new Map());
                },
            },
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Attendance - ${blockSection.code}`} />

            <div className="p-6 md:p-10">
                {/* Header */}
                <div className="mb-6">
                    <Link href="/attendance" className="mb-4 inline-flex items-center text-sm text-gray-500 hover:text-gray-700">
                        <ArrowLeft className="mr-1 h-4 w-4" />
                        Back to Attendance
                    </Link>
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">
                                {blockSection.code} — {blockSection.name}
                            </h1>
                            <p className="mt-1 text-gray-600">
                                {blockSection.grade_level}
                                {blockSection.strand && ` • ${blockSection.strand}`}
                                {blockSection.school_year && ` • ${blockSection.school_year}`}
                                {blockSection.semester && ` • ${blockSection.semester}`}
                            </p>
                        </div>
                        <Button onClick={handleSave} disabled={!hasChanges || saving}>
                            {saving ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Save className="mr-2 h-4 w-4" />
                            )}
                            {saving ? 'Saving...' : 'Save Attendance'}
                        </Button>
                    </div>
                </div>

                {/* Statistics Cards */}
                <div className="mb-6 grid gap-4 md:grid-cols-5">
                    <div className="rounded-lg border bg-white p-4 shadow-sm">
                        <div className="flex items-center gap-3">
                            <Users className="h-8 w-8 text-blue-500" />
                            <div>
                                <p className="text-sm text-gray-500">Total</p>
                                <p className="text-2xl font-bold">{liveStats.total_students}</p>
                            </div>
                        </div>
                    </div>
                    <div className="rounded-lg border bg-white p-4 shadow-sm">
                        <div className="flex items-center gap-3">
                            <CheckCircle className="h-8 w-8 text-green-500" />
                            <div>
                                <p className="text-sm text-gray-500">Present</p>
                                <p className="text-2xl font-bold">{liveStats.present_count}</p>
                            </div>
                        </div>
                    </div>
                    <div className="rounded-lg border bg-white p-4 shadow-sm">
                        <div className="flex items-center gap-3">
                            <UserX className="h-8 w-8 text-red-500" />
                            <div>
                                <p className="text-sm text-gray-500">Absent</p>
                                <p className="text-2xl font-bold">{liveStats.absent_count}</p>
                            </div>
                        </div>
                    </div>
                    <div className="rounded-lg border bg-white p-4 shadow-sm">
                        <div className="flex items-center gap-3">
                            <Clock className="h-8 w-8 text-yellow-500" />
                            <div>
                                <p className="text-sm text-gray-500">Late</p>
                                <p className="text-2xl font-bold">{liveStats.late_count}</p>
                            </div>
                        </div>
                    </div>
                    <div className="rounded-lg border bg-white p-4 shadow-sm">
                        <div>
                            <p className="text-sm text-gray-500">Attendance Rate</p>
                            <p className="text-2xl font-bold">
                                {liveStats.attendance_rate !== null ? `${liveStats.attendance_rate}%` : '—'}
                            </p>
                            {liveStats.excused_count > 0 && (
                                <p className="text-xs text-gray-400">{liveStats.excused_count} excused</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Controls: Subject + Date */}
                <div className="mb-6 flex flex-wrap items-end gap-4 rounded-lg border bg-white p-4 shadow-sm">
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">Subject</label>
                        <Select value={String(selectedSubjectId)} onValueChange={handleSubjectChange}>
                            <SelectTrigger className="w-64">
                                <SelectValue placeholder="Select Subject" />
                            </SelectTrigger>
                            <SelectContent>
                                {subjects.map((subj) => (
                                    <SelectItem key={subj.id} value={String(subj.id)}>
                                        {subj.code} — {subj.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">Date</label>
                        <Input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => handleDateChange(e.target.value)}
                            className="w-48"
                        />
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => markAllAs('Present')}>
                            <CheckCircle className="mr-1 h-3 w-3 text-green-600" />
                            Mark All Present
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => markAllAs('Absent')}>
                            <UserX className="mr-1 h-3 w-3 text-red-600" />
                            Mark All Absent
                        </Button>
                    </div>
                    {hasChanges && (
                        <span className="text-sm font-medium text-amber-600">
                            {changes.size} unsaved change{changes.size !== 1 ? 's' : ''}
                        </span>
                    )}
                </div>

                {/* Attendance Table */}
                {students.length > 0 ? (
                    <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="sticky top-0 z-10 bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 whitespace-nowrap">
                                            #
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 whitespace-nowrap">
                                            Student ID
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 whitespace-nowrap">
                                            Student Name
                                        </th>
                                        <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 whitespace-nowrap">
                                            Status
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 whitespace-nowrap">
                                            Remarks
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {students.map((student, index) => {
                                        const current = getCurrentValue(student);
                                        const isChanged = changes.has(student.enrollment_id);

                                        return (
                                            <tr
                                                key={student.enrollment_id}
                                                className={`${getStatusColor(current.status)} ${isChanged ? 'ring-1 ring-inset ring-amber-300' : ''}`}
                                            >
                                                <td className="px-4 py-3 text-gray-400">{index + 1}</td>
                                                <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">
                                                    {student.student_id_number || '—'}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    <span className="font-medium text-gray-900">
                                                        {student.last_name}, {student.first_name}
                                                    </span>
                                                    {student.middle_name && (
                                                        <span className="text-gray-500"> {student.middle_name.charAt(0)}.</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex justify-center gap-1">
                                                        {STATUS_OPTIONS.map((statusOption) => (
                                                            <button
                                                                key={statusOption}
                                                                type="button"
                                                                onClick={() => handleStatusChange(student.enrollment_id, student, statusOption)}
                                                                className={`rounded-md border px-3 py-1 text-xs font-medium transition-colors ${
                                                                    current.status === statusOption
                                                                        ? getStatusBadgeClass(statusOption)
                                                                        : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50'
                                                                }`}
                                                            >
                                                                {statusOption}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <Input
                                                        type="text"
                                                        placeholder="Optional remarks..."
                                                        defaultValue={current.remarks}
                                                        onBlur={(e) => handleRemarksChange(student.enrollment_id, student, e.target.value)}
                                                        className="h-8 text-xs"
                                                    />
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <div className="rounded-lg border bg-white p-12 text-center shadow-sm">
                        <Users className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-4 text-lg font-semibold text-gray-900">No students enrolled</h3>
                        <p className="mt-2 text-gray-600">
                            No students are enrolled in this section yet.
                        </p>
                    </div>
                )}

                {/* Bottom Save Bar */}
                {hasChanges && (
                    <div className="mt-4 flex items-center justify-end gap-4 rounded-lg border bg-amber-50 p-4 shadow-sm">
                        <span className="text-sm text-amber-700">
                            You have {changes.size} unsaved change{changes.size !== 1 ? 's' : ''}
                        </span>
                        <Button
                            variant="outline"
                            onClick={() => setChanges(new Map())}
                            disabled={saving}
                        >
                            Discard
                        </Button>
                        <Button onClick={handleSave} disabled={saving}>
                            {saving ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Save className="mr-2 h-4 w-4" />
                            )}
                            {saving ? 'Saving...' : 'Save Attendance'}
                        </Button>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
