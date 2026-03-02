import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { ClipboardList, Eye, Search, X } from 'lucide-react';

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

interface PaginatedData {
    data: BlockSection[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
}

interface Props {
    blockSections: PaginatedData;
    filters: {
        search?: string;
        school_year?: string;
        semester?: string;
        grade_level?: string;
    };
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

export default function Index({ blockSections, filters, schoolYears, semesters }: Props) {
    const handleSearch = (value: string) => {
        router.get('/grades', { ...filters, search: value || undefined }, { preserveState: true });
    };

    const handleFilter = (key: string, value: string) => {
        router.get('/grades', { ...filters, [key]: value === 'all' ? undefined : value }, { preserveState: true });
    };

    const clearFilters = () => {
        router.get('/grades');
    };

    const hasFilters = filters.search || filters.school_year || filters.semester || filters.grade_level;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Grades Management" />

            <div className="p-6 md:p-10">
                {/* Header */}
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Grades Management</h1>
                        <p className="mt-1 text-gray-600">Select a block section to manage student grades</p>
                    </div>
                </div>

                {/* Filters */}
                <div className="mb-6 rounded-lg border bg-white p-4 shadow-sm">
                    <div className="grid gap-4 md:grid-cols-5">
                        {/* Search */}
                        <div className="relative md:col-span-2">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <Input
                                placeholder="Search by code, name, or adviser..."
                                defaultValue={filters.search}
                                onChange={(e) => handleSearch(e.target.value)}
                                className="pl-10"
                            />
                        </div>

                        {/* School Year Filter */}
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
                                    <SelectItem key={sy} value={sy}>
                                        {sy}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* Semester Filter */}
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
                                    <SelectItem key={sem} value={sem}>
                                        {sem}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* Grade Level Filter */}
                        <Select
                            value={filters.grade_level || 'all'}
                            onValueChange={(v) => handleFilter('grade_level', v)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Grade Level" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Grade Levels</SelectItem>
                                {gradeLevels.map((level) => (
                                    <SelectItem key={level} value={level}>
                                        {level}
                                    </SelectItem>
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
                {blockSections.data.length > 0 ? (
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
                                    {blockSections.data.map((section) => (
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

                        {/* Pagination */}
                        {blockSections.last_page > 1 && (
                            <div className="flex items-center justify-between border-t px-4 py-3">
                                <p className="text-sm text-gray-600">
                                    Showing {(blockSections.current_page - 1) * blockSections.per_page + 1} to{' '}
                                    {Math.min(blockSections.current_page * blockSections.per_page, blockSections.total)} of{' '}
                                    {blockSections.total} results
                                </p>
                                <div className="flex gap-1">
                                    {blockSections.links.map((link, index) => (
                                        <Button
                                            key={index}
                                            variant={link.active ? 'default' : 'outline'}
                                            size="sm"
                                            disabled={!link.url}
                                            onClick={() => link.url && router.get(link.url)}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
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
