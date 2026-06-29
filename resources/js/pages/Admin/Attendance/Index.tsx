import { AppTable } from '@/components/AppTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BODY_TEXT, CARD, FILTER_CARD, PAGE_PADDING, PAGE_TITLE, SECTION_HEADING, TABLE_ROW_ACTION } from '@/constants/ui';
import {
    useAttendanceFilter,
    type AttendanceFilters,
    type MySubjectSection,
    type SectionGroup,
} from '@/hooks/useAttendanceFilter';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
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

interface Props {
    isFaculty: boolean;
    mySubjectSections: MySubjectSection[];
    groupedSections: (Omit<SectionGroup, 'sections'> & { sections: BlockSection[] })[];
    filters: AttendanceFilters;
    schoolYears: string[];
    semesters: string[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Attendance', href: '/attendance' },
];

export default function Index({ isFaculty, mySubjectSections, groupedSections, filters, schoolYears, semesters }: Props) {
    const {
        handleSearch,
        handleFilter,
        clearFilters,
        hasFilters,
        totalSections,
        totalStudents,
        takenToday,
        presentToday,
        attendanceRate,
    } = useAttendanceFilter(filters, groupedSections, mySubjectSections);

    if (isFaculty) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="My Attendance" />
                <div className={PAGE_PADDING}>
                    <div className="mb-6 flex items-center gap-3">
                        <CalendarCheck className="h-7 w-7 text-primary" />
                        <h1 className={PAGE_TITLE}>My Attendance</h1>
                    </div>

                    <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
                        <div className={`${CARD} p-4`}>
                            <p className="text-xs font-medium uppercase tracking-wider text-gray-500">My Classes</p>
                            <p className="mt-1 text-2xl font-bold text-gray-900">{mySubjectSections.length}</p>
                            <p className="text-xs text-gray-400">subject–section pairs</p>
                        </div>
                        <div className={`${CARD} p-4`}>
                            <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Total Students</p>
                            <p className="mt-1 text-2xl font-bold text-gray-900">{totalStudents}</p>
                            <p className="text-xs text-gray-400">across all classes</p>
                        </div>
                        <div className={`${CARD} p-4`}>
                            <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Taken Today</p>
                            <p className={`mt-1 text-2xl font-bold ${takenToday === mySubjectSections.length && mySubjectSections.length > 0 ? 'text-green-600' : takenToday > 0 ? 'text-yellow-600' : 'text-gray-900'}`}>
                                {takenToday}/{mySubjectSections.length}
                            </p>
                            <p className="text-xs text-gray-400">classes with attendance</p>
                        </div>
                        <div className={`${CARD} p-4`}>
                            <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Present Today</p>
                            <p className="mt-1 text-2xl font-bold text-blue-600">{presentToday}</p>
                            <p className="text-xs text-gray-400">
                                {attendanceRate !== null ? `${attendanceRate}% attendance rate` : 'no attendance taken'}
                            </p>
                        </div>
                    </div>

                    {mySubjectSections.length > 0 ? (
                        <AppTable>
                            <AppTable.Head>
                                <AppTable.Th>Subject</AppTable.Th>
                                <AppTable.Th>Section</AppTable.Th>
                                <AppTable.Th>Schedule</AppTable.Th>
                                <AppTable.Th center>Enrolled</AppTable.Th>
                                <AppTable.Th center>Today</AppTable.Th>
                                <AppTable.Th center>Missed</AppTable.Th>
                                <AppTable.Th center>Actions</AppTable.Th>
                            </AppTable.Head>
                            <AppTable.Body>
                                {mySubjectSections.map((row) => (
                                    <AppTable.Row key={`${row.subject_id}-${row.block_section_id}`}>
                                        <AppTable.Td>
                                            <p className="font-medium text-gray-900">{row.subject_name}</p>
                                            <p className="text-xs text-gray-500">{row.subject_code}</p>
                                        </AppTable.Td>
                                        <AppTable.Td>
                                            <p className="font-medium text-gray-900">{row.section_code}</p>
                                            <p className="text-xs text-gray-500">{row.grade_level || ''}</p>
                                        </AppTable.Td>
                                        <AppTable.Td className="text-gray-600">{row.subject_schedule || '—'}</AppTable.Td>
                                        <AppTable.Td className="text-center">
                                            <Badge variant="outline" className="gap-1">
                                                <Users className="h-3 w-3" />
                                                {row.enrolled_count}
                                            </Badge>
                                        </AppTable.Td>
                                        <AppTable.Td className="text-center">
                                            {row.today_taken ? (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                                                    ✓ Taken ({row.today_present_count}/{row.enrolled_count})
                                                </span>
                                            ) : (
                                                <span className="text-xs text-gray-400">— Not taken</span>
                                            )}
                                        </AppTable.Td>
                                        <AppTable.Td className="text-center">
                                            {row.missed_days_count > 0 ? (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                                                    <AlertTriangle className="h-3 w-3" />
                                                    {row.missed_days_count}
                                                </span>
                                            ) : (
                                                <span className="text-xs text-gray-400">—</span>
                                            )}
                                        </AppTable.Td>
                                        <AppTable.Td className="text-center">
                                            <Link href={`/attendance/${row.block_section_id}?subject_id=${row.subject_id}`}>
                                                <button className={TABLE_ROW_ACTION}>
                                                    <ClipboardCheck className="h-3 w-3" />
                                                    {row.today_taken ? 'View' : 'Take Attendance'}
                                                </button>
                                            </Link>
                                        </AppTable.Td>
                                    </AppTable.Row>
                                ))}
                            </AppTable.Body>
                        </AppTable>
                    ) : (
                        <div className={`${CARD} p-12 text-center`}>
                            <CalendarCheck className="mx-auto h-12 w-12 text-gray-400" />
                            <h3 className={`mt-4 ${SECTION_HEADING}`}>No subjects assigned</h3>
                            <p className={`mt-2 ${BODY_TEXT}`}>You have not been assigned to any subjects yet.</p>
                        </div>
                    )}
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Attendance" />

            <div className={PAGE_PADDING}>
                <div className="mb-6 flex items-center gap-3">
                    <CalendarCheck className="h-7 w-7 text-primary" />
                    <h1 className={PAGE_TITLE}>Attendance</h1>
                </div>

                <div className={`mb-6 ${FILTER_CARD}`}>
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

                        <Select value={filters.school_year || 'all'} onValueChange={(v) => handleFilter('school_year', v)}>
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

                        <Select value={filters.semester || 'all'} onValueChange={(v) => handleFilter('semester', v)}>
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

                {totalSections > 0 ? (
                    <AppTable scrollable={false}>
                        <AppTable.Head>
                            <AppTable.Th>Grade Level</AppTable.Th>
                            <AppTable.Th center>Sections</AppTable.Th>
                            <AppTable.Th center>Enrolled</AppTable.Th>
                            <AppTable.Th center>Actions</AppTable.Th>
                        </AppTable.Head>
                        <AppTable.Body>
                            {groupedSections.map((group) => {
                                const totalEnrolled = group.sections.reduce((sum, s) => sum + Number(s.enrolled_count), 0);
                                return (
                                    <AppTable.Row key={group.label}>
                                        <AppTable.Td className="font-semibold text-gray-900">{group.label}</AppTable.Td>
                                        <AppTable.Td className="text-center">
                                            <Badge variant="secondary">
                                                {group.sections.length} {group.sections.length === 1 ? 'section' : 'sections'}
                                            </Badge>
                                        </AppTable.Td>
                                        <AppTable.Td className="text-center">
                                            <Badge variant="outline" className="gap-1">
                                                <Users className="h-3 w-3" />
                                                {totalEnrolled}
                                            </Badge>
                                        </AppTable.Td>
                                        <AppTable.Td className="text-center">
                                            <Link
                                                href={`/attendance/grade/${encodeURIComponent(group.label)}?${new URLSearchParams(
                                                    Object.fromEntries(
                                                        Object.entries({
                                                            school_year: filters.school_year,
                                                            semester: filters.semester,
                                                        }).filter(([, v]) => v) as [string, string][],
                                                    ),
                                                ).toString()}`}
                                            >
                                                <button className={TABLE_ROW_ACTION}>
                                                    <ClipboardCheck className="h-3 w-3" /> View Sections
                                                </button>
                                            </Link>
                                        </AppTable.Td>
                                    </AppTable.Row>
                                );
                            })}
                        </AppTable.Body>
                    </AppTable>
                ) : (
                    <div className={`${CARD} p-12 text-center`}>
                        <CalendarCheck className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className={`mt-4 ${SECTION_HEADING}`}>No block sections found</h3>
                        <p className={`mt-2 ${BODY_TEXT}`}>
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
