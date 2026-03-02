import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { CalendarCheck, ClipboardCheck, Search, Users, X } from 'lucide-react';

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

interface Props {
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

export default function Index({ groupedSections, filters, schoolYears, semesters }: Props) {
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

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Attendance" />

            <div className="p-6 md:p-10">
                {/* Header */}
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Attendance</h1>
                        <p className="mt-1 text-gray-600">Select a block section to take attendance</p>
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

                {/* Grouped Sections */}
                {totalSections > 0 ? (
                    <div className="space-y-6">
                        {groupedSections.map((group) => (
                            <div key={group.label} className="overflow-hidden rounded-lg border bg-white shadow-sm">
                                {/* Group Header */}
                                <div className="border-b bg-gray-50 px-5 py-3">
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-base font-semibold text-gray-800">{group.label}</h2>
                                        <Badge variant="secondary">
                                            {group.sections.length} {group.sections.length === 1 ? 'section' : 'sections'}
                                        </Badge>
                                    </div>
                                </div>

                                {/* Sections Table */}
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50/50">
                                        <tr>
                                            <th className="px-5 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Code</th>
                                            <th className="px-5 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Section Name</th>
                                            <th className="px-5 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Adviser</th>
                                            <th className="px-5 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-gray-500">School Year</th>
                                            <th className="px-5 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Semester</th>
                                            <th className="px-5 py-2.5 text-center text-xs font-medium uppercase tracking-wider text-gray-500">Subjects</th>
                                            <th className="px-5 py-2.5 text-center text-xs font-medium uppercase tracking-wider text-gray-500">Enrolled</th>
                                            <th className="px-5 py-2.5 text-center text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {group.sections.map((section) => (
                                            <tr key={section.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-5 py-3 font-medium text-gray-900">{section.code}</td>
                                                <td className="px-5 py-3 text-gray-900">{section.name}</td>
                                                <td className="px-5 py-3 text-gray-600">{section.adviser || '—'}</td>
                                                <td className="px-5 py-3 text-gray-600">{section.school_year || '—'}</td>
                                                <td className="px-5 py-3 text-gray-600">{section.semester || '—'}</td>
                                                <td className="px-5 py-3 text-center">{section.subjects_count}</td>
                                                <td className="px-5 py-3 text-center">
                                                    <Badge variant="outline" className="gap-1">
                                                        <Users className="h-3 w-3" />
                                                        {section.enrolled_count}
                                                    </Badge>
                                                </td>
                                                <td className="px-5 py-3">
                                                    <div className="flex justify-center">
                                                        <Link href={`/attendance/${section.id}`}>
                                                            <Button variant="outline" size="sm">
                                                                <ClipboardCheck className="mr-1 h-4 w-4" />
                                                                Take Attendance
                                                            </Button>
                                                        </Link>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ))}
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
