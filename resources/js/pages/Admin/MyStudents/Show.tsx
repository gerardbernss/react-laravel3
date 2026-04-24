import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { CalendarCheck, ChevronLeft, ClipboardList, GraduationCap, Users } from 'lucide-react';

interface Student {
    enrollment_id: number;
    student_id_number: string | null;
    last_name: string | null;
    first_name: string | null;
    middle_name: string | null;
    grade: string | number | null;
    grade_status: string | null;
    present_count: number;
    absent_count: number;
    late_count: number;
    excused_count: number;
    total_sessions: number;
    attendance_rate: number | null;
}

interface BlockSection {
    id: number;
    code: string;
    name: string;
    grade_level: string | null;
    strand: string | null;
}

interface Subject {
    id: number;
    code: string;
    name: string;
}

interface Statistics {
    total_students: number;
    graded_count: number;
    passed_count: number;
    avg_attendance: number | null;
}

interface Props {
    blockSection: BlockSection;
    subject: Subject | null;
    students: Student[];
    isFaculty: boolean;
    statistics: Statistics;
}

function gradeStatusBadge(status: string | null) {
    if (!status) return <span className="text-gray-400">—</span>;
    const variants: Record<string, string> = {
        Passed: 'bg-green-100 text-green-800',
        Failed: 'bg-red-100 text-red-800',
        INC: 'bg-yellow-100 text-yellow-800',
        DRP: 'bg-gray-100 text-gray-600',
        W: 'bg-gray-100 text-gray-600',
    };
    return (
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${variants[status] ?? 'bg-gray-100 text-gray-600'}`}>
            {status}
        </span>
    );
}

function attendanceColor(rate: number | null): string {
    if (rate === null) return 'text-gray-400';
    if (rate >= 75) return 'text-green-700 font-medium';
    if (rate >= 50) return 'text-yellow-700 font-medium';
    return 'text-red-700 font-medium';
}

export default function Show({ blockSection, subject, students, isFaculty, statistics }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Grades', href: '/grades' },
        { title: 'Class Roster', href: '#' },
    ];

    const sectionLabel = [blockSection.code, blockSection.grade_level, blockSection.strand]
        .filter(Boolean)
        .join(' · ');

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Class Roster" />

            <div className="p-6 md:p-10">
                {/* Back + Header */}
                <div className="mb-6">
                    <Link href="/grades" className="mb-3 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
                        <ChevronLeft className="h-4 w-4" />
                        Back to Grades
                    </Link>
                    <h1 className="text-2xl font-bold text-gray-900">
                        {subject ? `${subject.name} (${subject.code})` : 'Class Roster'}
                    </h1>
                    <p className="mt-1 text-gray-500">{sectionLabel}</p>
                </div>

                {/* Stats Cards */}
                <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <div className="rounded-lg border bg-white p-4 shadow-sm">
                        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-gray-500">
                            <Users className="h-3.5 w-3.5" />
                            Total Students
                        </div>
                        <p className="mt-1 text-2xl font-bold text-gray-900">{statistics.total_students}</p>
                        <p className="text-xs text-gray-400">enrolled in section</p>
                    </div>

                    <div className="rounded-lg border bg-white p-4 shadow-sm">
                        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-gray-500">
                            <ClipboardList className="h-3.5 w-3.5" />
                            Graded
                        </div>
                        <p className={`mt-1 text-2xl font-bold ${statistics.graded_count === statistics.total_students && statistics.total_students > 0 ? 'text-green-600' : statistics.graded_count > 0 ? 'text-blue-600' : 'text-gray-900'}`}>
                            {statistics.graded_count}/{statistics.total_students}
                        </p>
                        <p className="text-xs text-gray-400">grades entered</p>
                    </div>

                    <div className="rounded-lg border bg-white p-4 shadow-sm">
                        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-gray-500">
                            <GraduationCap className="h-3.5 w-3.5" />
                            Passed
                        </div>
                        <p className={`mt-1 text-2xl font-bold ${statistics.passed_count > 0 ? 'text-green-600' : 'text-gray-900'}`}>
                            {statistics.passed_count}
                        </p>
                        <p className="text-xs text-gray-400">
                            {statistics.graded_count > 0
                                ? `${Math.round((statistics.passed_count / statistics.graded_count) * 100)}% pass rate`
                                : 'no grades yet'}
                        </p>
                    </div>

                    <div className="rounded-lg border bg-white p-4 shadow-sm">
                        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-gray-500">
                            <CalendarCheck className="h-3.5 w-3.5" />
                            Avg Attendance
                        </div>
                        <p className={`mt-1 text-2xl font-bold ${statistics.avg_attendance !== null && statistics.avg_attendance >= 75 ? 'text-green-600' : statistics.avg_attendance !== null ? 'text-yellow-600' : 'text-gray-400'}`}>
                            {statistics.avg_attendance !== null ? `${statistics.avg_attendance}%` : '—'}
                        </p>
                        <p className="text-xs text-gray-400">across all students</p>
                    </div>
                </div>

                {/* Roster Table */}
                {students.length > 0 ? (
                    <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">#</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Student ID</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Name</th>
                                        {subject && (
                                            <>
                                                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">Grade</th>
                                                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
                                                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 border-l">P</th>
                                                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">A</th>
                                                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">L</th>
                                                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">E</th>
                                                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">Rate</th>
                                            </>
                                        )}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {students.map((student, index) => {
                                        const fullName = [student.last_name, student.first_name, student.middle_name ? `${student.middle_name[0]}.` : null]
                                            .filter(Boolean)
                                            .join(', ');
                                        return (
                                            <tr key={student.enrollment_id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-4 py-3 text-gray-400 text-xs">{index + 1}</td>
                                                <td className="px-4 py-3 font-mono text-xs text-gray-600">
                                                    {student.student_id_number || '—'}
                                                </td>
                                                <td className="px-4 py-3 font-medium text-gray-900">{fullName || '—'}</td>
                                                {subject && (
                                                    <>
                                                        <td className="px-4 py-3 text-center text-gray-900">
                                                            {student.grade !== null
                                                                ? Number(student.grade).toFixed(2)
                                                                : <span className="text-gray-400">—</span>}
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            {gradeStatusBadge(student.grade_status)}
                                                        </td>
                                                        <td className="px-4 py-3 text-center text-green-700 font-medium border-l">{student.present_count}</td>
                                                        <td className="px-4 py-3 text-center text-red-700 font-medium">{student.absent_count}</td>
                                                        <td className="px-4 py-3 text-center text-yellow-700 font-medium">{student.late_count}</td>
                                                        <td className="px-4 py-3 text-center text-blue-700 font-medium">{student.excused_count}</td>
                                                        <td className={`px-4 py-3 text-center ${attendanceColor(student.attendance_rate)}`}>
                                                            {student.attendance_rate !== null ? `${student.attendance_rate}%` : '—'}
                                                        </td>
                                                    </>
                                                )}
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Legend + Actions */}
                        <div className="flex flex-col gap-3 border-t bg-gray-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-xs text-gray-500">
                                P = Present &nbsp;·&nbsp; A = Absent &nbsp;·&nbsp; L = Late &nbsp;·&nbsp; E = Excused
                                {' '}— Rate counts Present + Late as attended
                            </p>
                            {subject && (
                                <div className="flex gap-2">
                                    <Link href={`/grades/${blockSection.id}${isFaculty ? `?subject_id=${subject.id}` : ''}`}>
                                        <Button variant="outline" size="sm">
                                            <ClipboardList className="mr-1 h-4 w-4" />
                                            Enter Grades
                                        </Button>
                                    </Link>
                                    <Link href={`/attendance/${blockSection.id}?subject_id=${subject.id}`}>
                                        <Button variant="outline" size="sm">
                                            <CalendarCheck className="mr-1 h-4 w-4" />
                                            Take Attendance
                                        </Button>
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="rounded-lg border bg-white p-12 text-center shadow-sm">
                        <Users className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-4 text-lg font-semibold text-gray-900">No students enrolled</h3>
                        <p className="mt-2 text-gray-600">No students have been enrolled in this section yet.</p>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
