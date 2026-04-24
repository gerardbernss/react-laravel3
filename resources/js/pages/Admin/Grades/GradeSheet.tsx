import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, CheckCircle, ClipboardList, Users, XCircle } from 'lucide-react';

interface SubjectGrade {
    id: number;
    subject_id: number;
    subject_code: string;
    subject_name: string;
    units: number;
    grade: number | string | null;
    grade_status: string | null;
}

interface StudentRow {
    enrollment_id: number;
    student_id: number;
    student_id_number: string;
    last_name: string;
    first_name: string;
    middle_name: string | null;
    gwa: number | string | null;
    status: string;
    subjects: SubjectGrade[];
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
    subjects: { id: number; code: string; name: string; units: number }[];
}

interface Statistics {
    total_students: number;
    graded_count: number;
    total_subject_entries: number;
    passed_count: number;
    failed_count: number;
    incomplete_count: number;
    average_gwa: number | null;
    pass_rate: number | null;
}

interface Props {
    blockSection: BlockSection;
    students: StudentRow[];
    statistics: Statistics;
}

export default function GradeSheet({ blockSection, students, statistics }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Grades', href: '/grades' },
        { title: blockSection.code, href: `/grades/${blockSection.id}` },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Grade Sheet - ${blockSection.code}`} />

            <div className="p-6 md:p-10">
                {/* Header */}
                <div className="mb-6">
                    <Link href="/grades" className="mb-4 inline-flex items-center text-sm text-gray-500 hover:text-gray-700">
                        <ArrowLeft className="mr-1 h-4 w-4" />
                        Back to Grades
                    </Link>
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

                {/* Statistics Cards */}
                <div className="mb-6 grid gap-4 md:grid-cols-4">
                    <div className="rounded-lg border bg-white p-4 shadow-sm">
                        <div className="flex items-center gap-3">
                            <Users className="h-8 w-8 text-blue-500" />
                            <div>
                                <p className="text-sm text-gray-500">Total Students</p>
                                <p className="text-2xl font-bold">{statistics.total_students}</p>
                            </div>
                        </div>
                    </div>
                    <div className="rounded-lg border bg-white p-4 shadow-sm">
                        <div className="flex items-center gap-3">
                            <CheckCircle className="h-8 w-8 text-green-500" />
                            <div>
                                <p className="text-sm text-gray-500">Passed</p>
                                <p className="text-2xl font-bold">{statistics.passed_count}</p>
                            </div>
                        </div>
                    </div>
                    <div className="rounded-lg border bg-white p-4 shadow-sm">
                        <div className="flex items-center gap-3">
                            <XCircle className="h-8 w-8 text-red-500" />
                            <div>
                                <p className="text-sm text-gray-500">Failed</p>
                                <p className="text-2xl font-bold">{statistics.failed_count}</p>
                            </div>
                        </div>
                    </div>
                    <div className="rounded-lg border bg-white p-4 shadow-sm">
                        <div>
                            <p className="text-sm text-gray-500">Pass Rate</p>
                            <p className="text-2xl font-bold">
                                {statistics.pass_rate !== null ? `${statistics.pass_rate}%` : '—'}
                            </p>
                            {statistics.average_gwa !== null && (
                                <p className="text-xs text-gray-400">Avg GWA: {statistics.average_gwa}</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Student Roster Table */}
                {students.length > 0 ? (
                    <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">#</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Student ID</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Name</th>
                                        <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">GWA</th>
                                        <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">Graded</th>
                                        <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {students.map((student, index) => {
                                        const gradedCount = student.subjects.filter((s) => s.grade !== null).length;
                                        const totalCount = student.subjects.length;
                                        const fullyGraded = gradedCount === totalCount && totalCount > 0;

                                        return (
                                            <tr key={student.enrollment_id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-4 py-3 text-gray-400 text-xs">{index + 1}</td>
                                                <td className="px-4 py-3 font-mono text-xs text-gray-600 whitespace-nowrap">
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
                                                <td className="px-4 py-3 text-center font-semibold">
                                                    {student.gwa !== null
                                                        ? <span className="text-gray-900">{Number(student.gwa).toFixed(2)}</span>
                                                        : <span className="text-gray-400">—</span>}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <span className={`text-sm font-medium ${fullyGraded ? 'text-green-700' : gradedCount > 0 ? 'text-blue-600' : 'text-gray-400'}`}>
                                                        {gradedCount}/{totalCount}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <Link href={`/grades/${blockSection.id}/student/${student.enrollment_id}`}>
                                                        <Button variant="outline" size="sm">
                                                            <ClipboardList className="mr-1 h-4 w-4" />
                                                            Edit Grades
                                                        </Button>
                                                    </Link>
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
                        <p className="mt-2 text-gray-600">No students are enrolled in this section yet.</p>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
