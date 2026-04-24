import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { AlertTriangle, CalendarCheck, ClipboardCheck, Search, Users, X } from 'lucide-react';

interface BlockSection {
    id: number;
    code: string;
    name: string;
    grade_level: string | null;
    strand: string | null;
    school_year: string | null;
    semester: string | null;
    adviser: string | null;
    current_enrollment: number;
    is_active: boolean;
    subjects_count: number;
    enrolled_count: number;
}

interface SectionGroup {
    label: string;
    sections: BlockSection[];
}

interface MySubjectSection {
    subject_id: number;
    subject_code: string;
    subject_name: string;
    subject_schedule: string | null;
    block_section_id: number;
    section_code: string;
    section_name: string;
    grade_level: string | null;
    enrolled_count: number;
    today_taken: boolean;
    today_present_count: number;
    missed_days_count: number;
}

interface Props {
    isFaculty: boolean;
    mySubjectSections: MySubjectSection[];
    groupedSections: SectionGroup[];
    filters: {
        search?: string;
        school_year?: string;
        semester?: string;
    };
    schoolYears: string[];
    semesters: string[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Attendance', href: '/attendance' },
];

export default function Index({ isFaculty, mySubjectSections, groupedSections, filters, schoolYears, semesters }: Props) {
    const handleSearch = (value: string) => {
        router.get('/attendance', { ...filters, search: value || undefined }, { preserveState: true });
    };

    const handleFilter = (key: string, value: string) => {
        router.get('/attendance', { ...filters, [key]: value === 'all' ? undefined : value }, { preserveState: true });
    };

    const clearFilters = () => {
        router.get('/attendance');
    };

    const hasFilters = filters.search || filters.school_year || filters.semester;
    const totalSections = groupedSections.reduce((sum, group) => sum + group.sections.length, 0);

    // Faculty-specific subject-centric view
    if (isFaculty) {
        const totalStudents = mySubjectSections.reduce((sum, r) => sum + r.enrolled_count, 0);
        const takenToday = mySubjectSections.filter((r) => r.today_taken).length;
        const presentToday = mySubjectSections.reduce((sum, r) => sum + r.today_present_count, 0);
        const attendanceRate = totalStudents > 0 && takenToday > 0
            ? Math.round((presentToday / mySubjectSections.filter((r) => r.today_taken).reduce((s, r) => s + r.enrolled_count, 0)) * 100)
            : null;

        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="My Attendance" />
                <div className="p-6 md:p-10">
                    <div className="mb-6">
                        <div className="flex items-center gap-3">
                            <CalendarCheck className="h-7 w-7 text-primary" />
                            <h1 className="text-3xl font-bold text-gray-900">My Attendance</h1>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
                        <div className="rounded-lg border bg-white p-4 shadow-sm">
                            <p className="text-xs font-medium uppercase tracking-wider text-gray-500">My Classes</p>
                            <p className="mt-1 text-2xl font-bold text-gray-900">{mySubjectSections.length}</p>
                            <p className="text-xs text-gray-400">subject–section pairs</p>
                        </div>
                        <div className="rounded-lg border bg-white p-4 shadow-sm">
                            <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Total Students</p>
                            <p className="mt-1 text-2xl font-bold text-gray-900">{totalStudents}</p>
                            <p className="text-xs text-gray-400">across all classes</p>
                        </div>
                        <div className="rounded-lg border bg-white p-4 shadow-sm">
                            <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Taken Today</p>
                            <p className={`mt-1 text-2xl font-bold ${takenToday === mySubjectSections.length && mySubjectSections.length > 0 ? 'text-green-600' : takenToday > 0 ? 'text-yellow-600' : 'text-gray-900'}`}>
                                {takenToday}/{mySubjectSections.length}
                            </p>
                            <p className="text-xs text-gray-400">classes with attendance</p>
                        </div>
                        <div className="rounded-lg border bg-white p-4 shadow-sm">
                            <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Present Today</p>
                            <p className="mt-1 text-2xl font-bold text-blue-600">{presentToday}</p>
                            <p className="text-xs text-gray-400">
                                {attendanceRate !== null ? `${attendanceRate}% attendance rate` : 'no attendance taken'}
                            </p>
                        </div>
                    </div>

                    {mySubjectSections.length > 0 ? (
                        <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
                            <div className="max-h-[70vh] overflow-x-auto overflow-y-auto">
                                <table className="w-full text-sm">
                                    <thead className="sticky top-0 z-10 bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Subject</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Section</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Schedule</th>
                                            <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">Enrolled</th>
                                            <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">Today</th>
                                            <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">Missed</th>
                                            <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {mySubjectSections.map((row) => (
                                            <tr key={`${row.subject_id}-${row.block_section_id}`} className="hover:bg-gray-50">
                                                <td className="px-4 py-3">
                                                    <p className="font-medium text-gray-900">{row.subject_name}</p>
                                                    <p className="text-xs text-gray-500">{row.subject_code}</p>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <p className="font-medium text-gray-900">{row.section_code}</p>
                                                    <p className="text-xs text-gray-500">{row.grade_level || ''}</p>
                                                </td>
                                                <td className="px-4 py-3 text-gray-600">{row.subject_schedule || '—'}</td>
                                                <td className="px-4 py-3 text-center">
                                                    <Badge variant="outline" className="gap-1">
                                                        <Users className="h-3 w-3" />
                                                        {row.enrolled_count}
                                                    </Badge>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    {row.today_taken ? (
                                                        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                                                            ✓ Taken ({row.today_present_count}/{row.enrolled_count})
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs text-gray-400">— Not taken</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    {row.missed_days_count > 0 ? (
                                                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                                                            <AlertTriangle className="h-3 w-3" />
                                                            {row.missed_days_count}
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs text-gray-400">—</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex justify-center">
                                                        <Link href={`/attendance/${row.block_section_id}?subject_id=${row.subject_id}`}>
                                                            <Button variant="outline" size="sm">
                                                                <ClipboardCheck className="mr-1 h-4 w-4" />
                                                                {row.today_taken ? 'View' : 'Take Attendance'}
                                                            </Button>
                                                        </Link>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <div className="rounded-lg border bg-white p-12 text-center shadow-sm">
                            <CalendarCheck className="mx-auto h-12 w-12 text-gray-400" />
                            <h3 className="mt-4 text-lg font-semibold text-gray-900">No subjects assigned</h3>
                            <p className="mt-2 text-gray-600">You have not been assigned to any subjects yet.</p>
                        </div>
                    )}
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Attendance" />

            <div className="p-6 md:p-10">
                {/* Header */}
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="flex items-center gap-3">
                            <CalendarCheck className="h-7 w-7 text-primary" />
                            <h1 className="text-3xl font-bold text-gray-900">Attendance</h1>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="mb-6 rounded-lg border bg-white p-4 shadow-sm">
                    <div className="grid gap-4 md:grid-cols-4">
                        <div className="relative md:col-span-2">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <Input
                                placeholder="Search by code, name, or adviser..."
                                defaultValue={filters.search}
                                onChange={(e) => handleSearch(e.target.value)}
                                className="pl-10"
                            />
                        </div>

                        <Select
                            value={filters.school_year || 'all'}
                            onValueChange={(v) => handleFilter('school_year', v)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="School Year" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All School Years</SelectItem>
                                {schoolYears.map((sy) => (
                                    <SelectItem key={sy} value={sy}>{sy}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select
                            value={filters.semester || 'all'}
                            onValueChange={(v) => handleFilter('semester', v)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Semester" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Semesters</SelectItem>
                                {semesters.map((sem) => (
                                    <SelectItem key={sem} value={sem}>{sem}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {hasFilters && (
                        <div className="mt-3 flex items-center gap-2">
                            <span className="text-sm text-gray-500">Active filters:</span>
                            <Button variant="ghost" size="sm" onClick={clearFilters}>
                                <X className="mr-1 h-3 w-3" />
                                Clear all
                            </Button>
                        </div>
                    )}
                </div>

                {/* Grade Level Table */}
                {totalSections > 0 ? (
                    <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
                        <table className="w-full text-sm">
                            <thead className="sticky top-0 z-10 bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Grade Level</th>
                                    <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">Sections</th>
                                    <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">Enrolled</th>
                                    <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {groupedSections.map((group) => {
                                    const totalEnrolled = group.sections.reduce((sum, s) => sum + s.enrolled_count, 0);
                                    return (
                                        <tr key={group.label} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 font-semibold text-gray-900">{group.label}</td>
                                            <td className="px-4 py-3 text-center">
                                                <Badge variant="secondary">
                                                    {group.sections.length} {group.sections.length === 1 ? 'section' : 'sections'}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <Badge variant="outline" className="gap-1">
                                                    <Users className="h-3 w-3" />
                                                    {totalEnrolled}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <Link href={`/attendance/grade/${encodeURIComponent(group.label)}`}>
                                                    <Button variant="outline" size="sm">
                                                        <ClipboardCheck className="mr-1 h-4 w-4" />
                                                        View Sections
                                                    </Button>
                                                </Link>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="rounded-lg border bg-white p-12 text-center shadow-sm">
                        <CalendarCheck className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-4 text-lg font-semibold text-gray-900">No block sections found</h3>
                        <p className="mt-2 text-gray-600">
                            {hasFilters
                                ? 'No sections match your filters. Try adjusting your search criteria.'
                                : 'No block sections have been created yet.'}
                        </p>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
