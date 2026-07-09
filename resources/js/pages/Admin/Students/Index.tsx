import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TablePagination } from '@/components/ui/table-pagination';
import { CARD, PAGE_PADDING, PAGE_TITLE, TABLE_HEADER_CELL, TABLE_ROW_ACTION } from '@/constants/ui';
import { useStudentsIndex, type Student } from '@/hooks/useStudentsIndex';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Eye, Search } from 'lucide-react';

interface Props {
    students: Student[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Students', href: '/admin/students' },
];

const statusVariant: Record<string, string> = {
    Active:   'bg-green-100 text-green-700',
    Pending:  'bg-yellow-100 text-yellow-700',
    Inactive: 'bg-gray-100 text-gray-600',
};

/** Admin students list with search, sort, and delete actions. */
export default function StudentsIndex({ students }: Props) {
    const {
        search, setSearch,
        statusFilter, setStatusFilter,
        currentPage, setCurrentPage,
        pageSize, setPageSize,
        filtered,
        paginated,
    } = useStudentsIndex(students);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Students" />

            <div className={`space-y-6 ${PAGE_PADDING}`}>
                {/* Header */}
                <div className="flex items-center justify-between">
                    <h1 className={PAGE_TITLE}>Students</h1>
                </div>

                {/* Filters */}
                <div>
                    <div className="flex flex-wrap gap-3">
                        <div className="relative min-w-[200px] flex-1">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <Input
                                type="text"
                                placeholder="Search by name or student ID…"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-[160px]">
                                <SelectValue placeholder="All Statuses" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Statuses</SelectItem>
                                <SelectItem value="Active">Active</SelectItem>
                                <SelectItem value="Pending">Pending</SelectItem>
                                <SelectItem value="Inactive">Inactive</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Table */}
                <div className={`overflow-hidden ${CARD}`}>
                    <div className="max-h-[70vh] overflow-x-auto overflow-y-auto">
                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                            <thead className="sticky top-0 z-10 bg-gray-50">
                                <tr>
                                    <th className={TABLE_HEADER_CELL}>Student ID</th>
                                    <th className={TABLE_HEADER_CELL}>Name</th>
                                    <th className={TABLE_HEADER_CELL}>Year Level</th>
                                    <th className={TABLE_HEADER_CELL}>School Year</th>
                                    <th className={TABLE_HEADER_CELL}>Status</th>
                                    <th className={TABLE_HEADER_CELL}>Actions</th>
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
                                    paginated.map((student) => (
                                        <tr key={student.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 font-mono text-gray-700">
                                                {student.student_id_number ?? <span className="text-gray-400">—</span>}
                                            </td>
                                            <td className="px-4 py-3 text-gray-800">
                                                {student.personal_data ? (
                                                    `${student.personal_data.last_name}, ${student.personal_data.first_name}${student.personal_data.middle_name ? ` ${student.personal_data.middle_name[0]}.` : ''}`
                                                ) : (
                                                    <span className="text-gray-400">No data</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-gray-700">{student.current_year_level ?? '—'}</td>
                                            <td className="px-4 py-3 text-gray-700">{student.current_school_year ?? '—'}</td>
                                            <td className="px-4 py-3">
                                                <Badge
                                                    className={statusVariant[student.enrollment_status ?? ''] ?? 'bg-gray-100 text-gray-600'}
                                                >
                                                    {student.enrollment_status ?? 'Unknown'}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3">
                                                <Link href={`/admin/students/${student.id}`}>
                                                    <button className={TABLE_ROW_ACTION}>
                                                        <Eye className="h-3 w-3" /> View
                                                    </button>
                                                </Link>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    <TablePagination
                        total={filtered.length}
                        pageSize={pageSize}
                        currentPage={currentPage}
                        onPageChange={setCurrentPage}
                        onPageSizeChange={(s) => {
                            setPageSize(s);
                            setCurrentPage(1);
                        }}
                    />
                </div>
            </div>
        </AppLayout>
    );
}
