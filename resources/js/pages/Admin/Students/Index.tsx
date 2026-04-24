import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Eye, Search, Users } from 'lucide-react';
import { useMemo, useState } from 'react';

interface StudentPersonalData {
    first_name: string;
    last_name: string;
    middle_name: string | null;
    suffix: string | null;
    email: string;
    gender: string | null;
}

interface Student {
    id: number;
    student_id_number: string | null;
    enrollment_status: string | null;
    current_year_level: string | null;
    current_school_year: string | null;
    current_semester: string | null;
    personal_data: StudentPersonalData | null;
}

interface Props {
    students: Student[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Students', href: '/students' },
];

const statusColors: Record<string, string> = {
    Active:   'bg-green-100 text-green-700',
    Pending:  'bg-yellow-100 text-yellow-700',
    Inactive: 'bg-gray-100 text-gray-600',
};

export default function StudentsIndex({ students }: Props) {
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    const filtered = useMemo(() => {
        return students.filter((s) => {
            const name = s.personal_data
                ? `${s.personal_data.first_name} ${s.personal_data.last_name}`.toLowerCase()
                : '';
            const idNum = (s.student_id_number ?? '').toLowerCase();
            const q = search.toLowerCase();
            const matchSearch = !q || name.includes(q) || idNum.includes(q);
            const matchStatus = statusFilter === 'all' || s.enrollment_status === statusFilter;
            return matchSearch && matchStatus;
        });
    }, [students, search, statusFilter]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Students" />

            <div className="space-y-6 p-4 md:p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Users className="h-6 w-6 text-primary" />
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Students</h1>
                            <p className="text-sm text-gray-500">{students.length} total students</p>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-3">
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by name or student ID…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                    >
                        <option value="all">All Statuses</option>
                        <option value="Active">Active</option>
                        <option value="Pending">Pending</option>
                        <option value="Inactive">Inactive</option>
                    </select>
                </div>

                {/* Table */}
                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Student ID</th>
                                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Name</th>
                                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Year Level</th>
                                    <th className="px-4 py-3 text-left font-semibold text-gray-600">School Year</th>
                                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Status</th>
                                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                                {filtered.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="py-12 text-center text-gray-400">
                                            No students found.
                                        </td>
                                    </tr>
                                ) : (
                                    filtered.map((student) => (
                                        <tr key={student.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 font-mono text-gray-700">
                                                {student.student_id_number ?? <span className="text-gray-400">—</span>}
                                            </td>
                                            <td className="px-4 py-3 text-gray-800">
                                                {student.personal_data
                                                    ? `${student.personal_data.last_name}, ${student.personal_data.first_name}${student.personal_data.middle_name ? ` ${student.personal_data.middle_name[0]}.` : ''}`
                                                    : <span className="text-gray-400">No data</span>}
                                            </td>
                                            <td className="px-4 py-3 text-gray-700">{student.current_year_level ?? '—'}</td>
                                            <td className="px-4 py-3 text-gray-700">{student.current_school_year ?? '—'}</td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[student.enrollment_status ?? ''] ?? 'bg-gray-100 text-gray-600'}`}>
                                                    {student.enrollment_status ?? 'Unknown'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <Link href={`/students/${student.id}`}>
                                                    <Button variant="ghost" size="sm">
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                </Link>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
