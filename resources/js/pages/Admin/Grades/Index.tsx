import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ClipboardList, Eye, Search, Users, X } from 'lucide-react';
import { useMemo, useState } from 'react';

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

interface MySubjectRow {
    subject_id: number;
    subject_code: string;
    subject_name: string;
    block_section_id: number;
    section_code: string;
    section_name: string;
    grade_level: string | null;
    enrolled_count: number;
    graded_count: number;
}

interface Props {
    isFaculty: boolean;
    mySubjects: MySubjectRow[];
    blockSections: BlockSection[];
    filters: Record<string, string>;
    schoolYears: string[];
    semesters: string[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Grades', href: '/grades' },
];

const gradeLevels = [
    'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6',
    'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12',
];

export default function Index({ isFaculty, mySubjects, blockSections, schoolYears, semesters }: Props) {
    // Faculty-specific subject-centric view
    if (isFaculty) {
        const totalStudents = mySubjects.reduce((sum, r) => sum + r.enrolled_count, 0);
        const totalGraded = mySubjects.reduce((sum, r) => sum + r.graded_count, 0);
        const completionPct = totalStudents > 0 ? Math.round((totalGraded / totalStudents) * 100) : 0;
        const fullyGraded = mySubjects.filter((r) => r.enrolled_count > 0 && r.graded_count === r.enrolled_count).length;

        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="My Grade Sheets" />
                <div className="p-6 md:p-10">
                    <div className="mb-6">
                        <div className="flex items-center gap-3">
                            <ClipboardList className="h-7 w-7 text-primary" />
                            <h1 className="text-3xl font-bold text-gray-900">My Grade Sheets</h1>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
                        <div className="rounded-lg border bg-white p-4 shadow-sm">
                            <p className="text-xs font-medium uppercase tracking-wider text-gray-500">My Classes</p>
                            <p className="mt-1 text-2xl font-bold text-gray-900">{mySubjects.length}</p>
                            <p className="text-xs text-gray-400">subject–section pairs</p>
                        </div>
                        <div className="rounded-lg border bg-white p-4 shadow-sm">
                            <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Total Students</p>
                            <p className="mt-1 text-2xl font-bold text-gray-900">{totalStudents}</p>
                            <p className="text-xs text-gray-400">across all classes</p>
                        </div>
                        <div className="rounded-lg border bg-white p-4 shadow-sm">
                            <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Graded</p>
                            <p className="mt-1 text-2xl font-bold text-blue-600">{totalGraded}</p>
                            <p className="text-xs text-gray-400">of {totalStudents} entries</p>
                        </div>
                        <div className="rounded-lg border bg-white p-4 shadow-sm">
                            <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Completion</p>
                            <p className={`mt-1 text-2xl font-bold ${completionPct === 100 ? 'text-green-600' : completionPct >= 50 ? 'text-yellow-600' : 'text-gray-900'}`}>
                                {completionPct}%
                            </p>
                            <p className="text-xs text-gray-400">{fullyGraded}/{mySubjects.length} classes done</p>
                        </div>
                    </div>

                    {mySubjects.length > 0 ? (
                        <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
                            <div className="max-h-[70vh] overflow-x-auto overflow-y-auto">
                                <table className="w-full text-sm">
                                    <thead className="sticky top-0 z-10 bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Subject</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Code</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Section</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Grade Level</th>
                                            <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">Enrolled</th>
                                            <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">Graded</th>
                                            <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {mySubjects.map((row) => (
                                            <tr key={`${row.subject_id}-${row.block_section_id}`} className="hover:bg-gray-50">
                                                <td className="px-4 py-3 font-medium text-gray-900">{row.subject_name}</td>
                                                <td className="px-4 py-3 text-gray-600">{row.subject_code}</td>
                                                <td className="px-4 py-3">
                                                    <p className="font-medium text-gray-900">{row.section_code}</p>
                                                    <p className="text-xs text-gray-500">{row.section_name}</p>
                                                </td>
                                                <td className="px-4 py-3 text-gray-600">{row.grade_level || '—'}</td>
                                                <td className="px-4 py-3 text-center">
                                                    <Badge variant="outline">{row.enrolled_count}</Badge>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <span className={row.graded_count === row.enrolled_count && row.enrolled_count > 0 ? 'font-semibold text-green-700' : 'text-gray-600'}>
                                                        {row.graded_count}/{row.enrolled_count}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex justify-center gap-2">
                                                        <Link href={`/my-students/${row.block_section_id}?subject_id=${row.subject_id}`}>
                                                            <Button variant="ghost" size="sm">
                                                                <Users className="mr-1 h-4 w-4" />
                                                                View Roster
                                                            </Button>
                                                        </Link>
                                                        <Link href={`/grades/${row.block_section_id}`}>
                                                            <Button variant="outline" size="sm">
                                                                <Eye className="mr-1 h-4 w-4" />
                                                                Enter Grades
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
                            <ClipboardList className="mx-auto h-12 w-12 text-gray-400" />
                            <h3 className="mt-4 text-lg font-semibold text-gray-900">No subjects assigned</h3>
                            <p className="mt-2 text-gray-600">You have not been assigned to any subjects yet.</p>
                        </div>
                    )}
                </div>
            </AppLayout>
        );
    }

    // Admin view — client-side filtering + pagination
    return <AdminView blockSections={blockSections} schoolYears={schoolYears} semesters={semesters} />;
}

function AdminView({ blockSections, schoolYears, semesters }: { blockSections: BlockSection[]; schoolYears: string[]; semesters: string[] }) {
    const [search, setSearch] = useState('');
    const [schoolYear, setSchoolYear] = useState('all');
    const [semester, setSemester] = useState('all');
    const [gradeLevel, setGradeLevel] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const filtered = useMemo(() => {
        return blockSections.filter((s) => {
            const matchesSearch =
                !search ||
                s.code.toLowerCase().includes(search.toLowerCase()) ||
                s.name.toLowerCase().includes(search.toLowerCase()) ||
                (s.adviser ?? '').toLowerCase().includes(search.toLowerCase());
            const matchesYear = schoolYear === 'all' || s.school_year === schoolYear;
            const matchesSem = semester === 'all' || s.semester === semester;
            const matchesGrade = gradeLevel === 'all' || s.grade_level === gradeLevel;
            return matchesSearch && matchesYear && matchesSem && matchesGrade;
        });
    }, [blockSections, search, schoolYear, semester, gradeLevel]);

    const totalPages = Math.ceil(filtered.length / pageSize);

    const paginated = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filtered.slice(start, start + pageSize);
    }, [filtered, currentPage, pageSize]);

    const hasFilters = search || schoolYear !== 'all' || semester !== 'all' || gradeLevel !== 'all';

    const clearFilters = () => {
        setSearch('');
        setSchoolYear('all');
        setSemester('all');
        setGradeLevel('all');
        setCurrentPage(1);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Grades Management" />

            <div className="p-6 md:p-10">
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="flex items-center gap-3">
                            <ClipboardList className="h-7 w-7 text-primary" />
                            <h1 className="text-3xl font-bold text-gray-900">Grades Management</h1>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="mb-6 rounded-lg border bg-white p-4 shadow-sm">
                    <div className="grid gap-4 md:grid-cols-5">
                        <div className="relative md:col-span-2">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <Input
                                placeholder="Search by code, name, or adviser..."
                                value={search}
                                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                                className="pl-10"
                            />
                        </div>

                        <Select value={schoolYear} onValueChange={(v) => { setSchoolYear(v); setCurrentPage(1); }}>
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

                        <Select value={semester} onValueChange={(v) => { setSemester(v); setCurrentPage(1); }}>
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

                        <Select value={gradeLevel} onValueChange={(v) => { setGradeLevel(v); setCurrentPage(1); }}>
                            <SelectTrigger>
                                <SelectValue placeholder="Grade Level" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Grade Levels</SelectItem>
                                {gradeLevels.map((level) => (
                                    <SelectItem key={level} value={level}>{level}</SelectItem>
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

                {/* Table */}
                {filtered.length > 0 ? (
                    <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
                        <div className="max-h-[70vh] overflow-x-auto overflow-y-auto">
                            <table className="w-full text-sm">
                                <thead className="sticky top-0 z-10 bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Code</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Section Name</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Grade Level</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Strand</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">School Year</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Semester</th>
                                        <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">Subjects</th>
                                        <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">Enrolled</th>
                                        <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {paginated.map((section) => (
                                        <tr key={section.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 font-medium text-gray-900">{section.code}</td>
                                            <td className="px-4 py-3">
                                                <div>
                                                    <p className="font-medium text-gray-900">{section.name}</p>
                                                    {section.adviser && (
                                                        <p className="text-xs text-gray-500">Adviser: {section.adviser}</p>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-gray-600">{section.grade_level || '—'}</td>
                                            <td className="px-4 py-3 text-gray-600">{section.strand || '—'}</td>
                                            <td className="px-4 py-3 text-gray-600">{section.school_year || '—'}</td>
                                            <td className="px-4 py-3 text-gray-600">{section.semester || '—'}</td>
                                            <td className="px-4 py-3 text-center">{section.subjects_count}</td>
                                            <td className="px-4 py-3 text-center">
                                                <Badge variant="outline">{section.enrolled_count}</Badge>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex justify-center">
                                                    <Link href={`/grades/${section.id}`}>
                                                        <Button variant="outline" size="sm">
                                                            <Eye className="mr-1 h-4 w-4" />
                                                            Grade Sheet
                                                        </Button>
                                                    </Link>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="flex items-center justify-between border-t bg-white px-4 py-3">
                            <div className="flex items-center gap-3">
                                <span className="text-sm text-gray-700">Rows per page:</span>
                                <select
                                    value={pageSize}
                                    onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                                    className="rounded-md border border-gray-300 px-3 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                >
                                    <option value={5}>5</option>
                                    <option value={10}>10</option>
                                    <option value={25}>25</option>
                                    <option value={50}>50</option>
                                </select>
                                <span className="text-sm text-gray-600">
                                    {filtered.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}–
                                    {Math.min(currentPage * pageSize, filtered.length)} of {filtered.length}
                                </span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Button variant="outline" size="sm" onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>
                                    <ChevronsLeft className="h-4 w-4" />
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <span className="px-3 py-1 text-sm">Page {currentPage} of {totalPages || 1}</span>
                                <Button variant="outline" size="sm" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages === 0}>
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages || totalPages === 0}>
                                    <ChevronsRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="rounded-lg border bg-white p-12 text-center shadow-sm">
                        <ClipboardList className="mx-auto h-12 w-12 text-gray-400" />
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
