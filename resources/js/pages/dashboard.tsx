import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { BookOpen, CalendarCheck, ClipboardList, Clock, GraduationCap, LayoutGrid, Megaphone, Users } from 'lucide-react';

interface Stats {
    total_applicants: number;
    pending: number;
    for_exam: number;
    exam_taken: number;
    enrolled: number;
    portal_credentials: number;
    students: number;
}

interface StatusBreakdown {
    status: string;
    count: number;
}

interface CategoryBreakdown {
    category: string;
    count: number;
}

interface AnnouncementItem {
    id: number;
    title: string;
    content: string;
    publish_start: string | null;
}

interface BlockSectionData {
    name: string;
    capacity: number;
    enrolled: number;
    available: number;
    percentage: number;
    grade_level: string;
    strand: string | null;
}

interface EnrollmentByGrade {
    label: string;
    grade: string;
    program: string | null;
    enrolled: number;
    capacity: number;
    sections: number;
    percentage: number;
}

interface MyClass {
    subject_id: number;
    subject_code: string;
    subject_name: string;
    subject_schedule: string | null;
    block_section_id: number;
    section_code: string;
    section_name: string;
    grade_level: string | null;
    enrolled_count: number;
    graded_count: number;
    today_taken: boolean;
    today_present_count: number;
}

interface Props {
    isFaculty?: boolean;
    myClasses?: MyClass[];
    today?: string;
    stats: Stats;
    statusBreakdown: StatusBreakdown[];
    categoryBreakdown: CategoryBreakdown[];
    blockSections: BlockSectionData[];
    enrollmentByGrade?: EnrollmentByGrade[];
    currentSchoolYear: string;
    announcements?: AnnouncementItem[];
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
];

// Returns the Tailwind bg colour for the progress-bar fill of each student category.
const getCategoryColor = (category: string) => {
    switch (category?.toUpperCase()) {
        case 'LES':
            return 'bg-orange-500';
        case 'JHS':
            return 'bg-blue-500';
        case 'SHS':
            return 'bg-purple-500';
        default:
            return 'bg-gray-500';
    }
};

// Returns bg + text colour classes for the inline category label chip.
const getCategoryChip = (category: string) => {
    switch (category?.toUpperCase()) {
        case 'LES':
            return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
        case 'JHS':
            return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
        case 'SHS':
            return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
        default:
            return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
    }
};

export default function Dashboard({
    isFaculty = false,
    myClasses = [],
    today = '',
    stats = { total_applicants: 0, pending: 0, for_exam: 0, exam_taken: 0, enrolled: 0, portal_credentials: 0, students: 0 },
    statusBreakdown: _statusBreakdown = [],
    categoryBreakdown = [],
    blockSections: _blockSections = [],
    enrollmentByGrade = [],
    currentSchoolYear = '2025-2026',
    announcements = [],
}: Props) {
    // Faculty dashboard
    if (isFaculty) {
        const totalStudents = myClasses.reduce((sum, c) => sum + c.enrolled_count, 0);
        const fullyGraded = myClasses.filter((c) => c.enrolled_count > 0 && c.graded_count === c.enrolled_count).length;
        const takenToday = myClasses.filter((c) => c.today_taken).length;

        // Sort: untaken first, then taken
        const sortedAttendance = [...myClasses].sort((a, b) => Number(a.today_taken) - Number(b.today_taken));

        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Dashboard" />
                <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-4 md:p-6">
                    {/* Header */}
                    <div>
                        <div className="flex items-center gap-3">
                            <LayoutGrid className="h-7 w-7 text-primary" />
                            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                        </div>
                        <p className="mt-1 text-gray-600">Welcome back — here's your teaching overview</p>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <div className="rounded-xl border bg-card p-6 shadow-sm">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">My Classes</p>
                                    <p className="text-3xl font-bold text-foreground">{myClasses.length}</p>
                                    <p className="mt-1 text-xs text-muted-foreground">subject–section pairs</p>
                                </div>
                                <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-900/30">
                                    <BookOpen className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                </div>
                            </div>
                        </div>

                        <div className="rounded-xl border bg-card p-6 shadow-sm">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Total Students</p>
                                    <p className="text-3xl font-bold text-foreground">{totalStudents}</p>
                                    <p className="mt-1 text-xs text-muted-foreground">across all classes</p>
                                </div>
                                <div className="rounded-full bg-purple-100 p-3 dark:bg-purple-900/30">
                                    <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                                </div>
                            </div>
                        </div>

                        <div className="rounded-xl border bg-card p-6 shadow-sm">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Grades Done</p>
                                    <p
                                        className={`text-3xl font-bold ${fullyGraded === myClasses.length && myClasses.length > 0 ? 'text-green-600' : fullyGraded > 0 ? 'text-yellow-600' : 'text-foreground'}`}
                                    >
                                        {fullyGraded}/{myClasses.length}
                                    </p>
                                    <p className="mt-1 text-xs text-muted-foreground">classes fully graded</p>
                                </div>
                                <div className="rounded-full bg-green-100 p-3 dark:bg-green-900/30">
                                    <GraduationCap className="h-6 w-6 text-green-600 dark:text-green-400" />
                                </div>
                            </div>
                        </div>

                        <div className="rounded-xl border bg-card p-6 shadow-sm">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Attendance Today</p>
                                    <p
                                        className={`text-3xl font-bold ${takenToday === myClasses.length && myClasses.length > 0 ? 'text-green-600' : takenToday > 0 ? 'text-yellow-600' : 'text-foreground'}`}
                                    >
                                        {takenToday}/{myClasses.length}
                                    </p>
                                    <p className="mt-1 text-xs text-muted-foreground">classes taken today</p>
                                </div>
                                <div className="rounded-full bg-yellow-100 p-3 dark:bg-yellow-900/30">
                                    <CalendarCheck className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Two-column panels */}
                    <div className="grid gap-6 lg:grid-cols-2">
                        {/* Today's Attendance */}
                        <div className="rounded-xl border bg-card p-6 shadow-sm">
                            <div className="mb-4 flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-foreground">Today's Attendance</h3>
                                <span className="text-xs text-muted-foreground">{today}</span>
                            </div>
                            {myClasses.length > 0 ? (
                                <div className="overflow-hidden rounded-lg border">
                                    <table className="w-full text-sm">
                                        <thead className="bg-muted/50">
                                            <tr>
                                                <th className="px-3 py-2 text-left text-xs font-medium tracking-wider text-muted-foreground uppercase">
                                                    Subject
                                                </th>
                                                <th className="px-3 py-2 text-left text-xs font-medium tracking-wider text-muted-foreground uppercase">
                                                    Section
                                                </th>
                                                <th className="px-3 py-2 text-center text-xs font-medium tracking-wider text-muted-foreground uppercase">
                                                    Status
                                                </th>
                                                <th className="px-3 py-2 text-center text-xs font-medium tracking-wider text-muted-foreground uppercase">
                                                    Action
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {sortedAttendance.map((c) => (
                                                <tr key={`att-${c.subject_id}-${c.block_section_id}`} className="hover:bg-muted/30">
                                                    <td className="px-3 py-2">
                                                        <p className="font-medium text-foreground">{c.subject_name}</p>
                                                        {c.subject_schedule && <p className="text-xs text-muted-foreground">{c.subject_schedule}</p>}
                                                    </td>
                                                    <td className="px-3 py-2 text-sm text-muted-foreground">{c.section_code}</td>
                                                    <td className="px-3 py-2 text-center">
                                                        {c.today_taken ? (
                                                            <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                                                ✓ {c.today_present_count}/{c.enrolled_count}
                                                            </span>
                                                        ) : (
                                                            <span className="text-xs text-muted-foreground">— Not taken</span>
                                                        )}
                                                    </td>
                                                    <td className="px-3 py-2 text-center">
                                                        <Link
                                                            href={`/attendance/${c.block_section_id}?subject_id=${c.subject_id}`}
                                                            className="text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
                                                        >
                                                            {c.today_taken ? 'View' : 'Take'}
                                                        </Link>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="flex h-24 items-center justify-center text-sm text-muted-foreground">No classes assigned</div>
                            )}
                        </div>

                        {/* Grades Overview */}
                        <div className="rounded-xl border bg-card p-6 shadow-sm">
                            <div className="mb-4 flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-foreground">Grades Overview</h3>
                                <Link href="/grades" className="text-xs font-medium text-blue-600 hover:underline dark:text-blue-400">
                                    View all
                                </Link>
                            </div>
                            {myClasses.length > 0 ? (
                                <div className="space-y-3">
                                    {myClasses.map((c) => {
                                        const pct = c.enrolled_count > 0 ? Math.round((c.graded_count / c.enrolled_count) * 100) : 0;
                                        const isComplete = c.enrolled_count > 0 && c.graded_count === c.enrolled_count;
                                        return (
                                            <div key={`grd-${c.subject_id}-${c.block_section_id}`} className="flex items-center gap-3">
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center justify-between">
                                                        <p className="truncate text-sm font-medium text-foreground">
                                                            {c.subject_name}
                                                            <span className="ml-1.5 text-xs font-normal text-muted-foreground">{c.section_code}</span>
                                                        </p>
                                                        <span
                                                            className={`ml-2 shrink-0 text-xs font-medium ${isComplete ? 'text-green-600' : 'text-muted-foreground'}`}
                                                        >
                                                            {c.graded_count}/{c.enrolled_count}
                                                        </span>
                                                    </div>
                                                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                                                        <div
                                                            className={`h-full rounded-full transition-all ${isComplete ? 'bg-green-500' : 'bg-blue-500'}`}
                                                            style={{ width: `${pct}%` }}
                                                        />
                                                    </div>
                                                </div>
                                                <Link
                                                    href={`/grades/${c.block_section_id}`}
                                                    className="shrink-0 text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
                                                >
                                                    <ClipboardList className="h-4 w-4" />
                                                </Link>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="flex h-24 items-center justify-center text-sm text-muted-foreground">No classes assigned</div>
                            )}
                        </div>
                    </div>
                </div>
            </AppLayout>
        );
    }

    // SharedData is the typed interface for shared Inertia props (see types/index.d.ts).
    // Passing it as a generic gives TypeScript the shape of currentSemester so
    // accessing .name and .school_year is type-safe rather than `unknown`.
    const { currentSemester } = usePage<SharedData>().props;

    const totalCategory = categoryBreakdown.reduce((sum, item) => sum + item.count, 0);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-4 md:p-6">
                {/* Header */}
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">Dashboard</h1>
                        <p className="mt-1 text-sm text-muted-foreground">School Year {currentSchoolYear}</p>
                    </div>
                    {currentSemester?.name && (
                        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
                            <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
                            {currentSemester.name} · {currentSemester.school_year}
                        </div>
                    )}
                </div>

                {/* Two-column layout: left = stat cards + category chart, right = announcements */}
                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Left column */}
                    <div className="flex flex-col gap-4">
                        {/* Stat cards — 2×2 grid */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="flex items-center justify-between rounded-xl border border-l-4 border-l-blue-500 bg-card p-3 shadow-sm">
                                <div>
                                    <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Total Applicants</p>
                                    <p className="text-xl font-bold text-foreground">{stats.total_applicants}</p>
                                    <p className="text-[10px] text-muted-foreground">this school year</p>
                                </div>
                                <div className="rounded-lg bg-blue-100 p-1.5 dark:bg-blue-900/30">
                                    <Users className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                                </div>
                            </div>

                            <div
                                className={`flex items-center justify-between rounded-xl border border-l-4 bg-card p-3 shadow-sm ${stats.pending > 0 ? 'border-l-yellow-500' : 'border-l-border'}`}
                            >
                                <div>
                                    <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Pending Review</p>
                                    <p
                                        className={`text-xl font-bold ${stats.pending > 0 ? 'text-yellow-600 dark:text-yellow-400' : 'text-foreground'}`}
                                    >
                                        {stats.pending}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground">{stats.pending > 0 ? 'requires attention' : 'all clear'}</p>
                                </div>
                                <div className={`rounded-lg p-1.5 ${stats.pending > 0 ? 'bg-yellow-100 dark:bg-yellow-900/30' : 'bg-muted'}`}>
                                    <Clock
                                        className={`h-3.5 w-3.5 ${stats.pending > 0 ? 'text-yellow-600 dark:text-yellow-400' : 'text-muted-foreground'}`}
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-between rounded-xl border border-l-4 border-l-green-500 bg-card p-3 shadow-sm">
                                <div>
                                    <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Enrolled</p>
                                    <p className="text-xl font-bold text-foreground">{stats.enrolled}</p>
                                    <p className="text-[10px] text-muted-foreground">
                                        <span className="font-semibold text-indigo-600 dark:text-indigo-400">{stats.portal_credentials}</span> with
                                        portal access
                                    </p>
                                </div>
                                <div className="rounded-lg bg-green-100 p-1.5 dark:bg-green-900/30">
                                    <GraduationCap className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                                </div>
                            </div>

                            <div className="flex items-center justify-between rounded-xl border border-l-4 border-l-purple-500 bg-card p-3 shadow-sm">
                                <div>
                                    <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Students</p>
                                    <p className="text-xl font-bold text-foreground">{stats.students}</p>
                                    <p className="text-[10px] text-muted-foreground">in the system</p>
                                </div>
                                <div className="rounded-lg bg-purple-100 p-1.5 dark:bg-purple-900/30">
                                    <BookOpen className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                                </div>
                            </div>
                        </div>

                        {/* By Student Category — horizontal bar chart */}
                        <div className="rounded-xl border bg-card p-5 shadow-sm">
                            <h3 className="mb-4 text-base font-semibold text-foreground">By Student Category</h3>
                            {categoryBreakdown.length > 0 ? (
                                <div className="space-y-3">
                                    {categoryBreakdown.map((item) => {
                                        const pct = totalCategory > 0 ? (item.count / totalCategory) * 100 : 0;
                                        return (
                                            <div key={item.category} className="flex items-center gap-3">
                                                <span
                                                    className={`w-10 shrink-0 rounded px-1.5 py-0.5 text-center text-xs font-semibold ${getCategoryChip(item.category)}`}
                                                >
                                                    {item.category}
                                                </span>
                                                <div className="h-4 flex-1 overflow-hidden rounded-full bg-muted">
                                                    <div
                                                        className={`h-full rounded-full transition-all ${getCategoryColor(item.category)}`}
                                                        style={{ width: `${pct}%`, minWidth: item.count > 0 ? '4px' : '0' }}
                                                    />
                                                </div>
                                                <span className="w-8 shrink-0 text-right text-sm font-semibold text-foreground">{item.count}</span>
                                            </div>
                                        );
                                    })}
                                    <p className="pt-1 text-xs text-muted-foreground">{totalCategory} total applicants</p>
                                </div>
                            ) : (
                                <div className="flex h-20 items-center justify-center text-sm text-muted-foreground">No data available</div>
                            )}
                        </div>
                    </div>

                    {/* Right column — Announcements */}
                    <div className="rounded-xl border bg-card p-6 shadow-sm">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="flex items-center gap-2 text-base font-semibold text-foreground">
                                <Megaphone className="h-4 w-4 text-primary" />
                                Announcements
                            </h3>
                            <Link href="/admin/announcements" className="text-xs font-medium text-blue-600 hover:underline dark:text-blue-400">
                                View all
                            </Link>
                        </div>
                        {announcements.length > 0 ? (
                            <div className="space-y-3">
                                {announcements.map((a) => (
                                    <div key={a.id} className="rounded-lg border bg-background p-3">
                                        <p className="text-sm font-medium text-foreground">{a.title}</p>
                                        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{a.content}</p>
                                        {a.publish_start && <p className="mt-1.5 text-[11px] text-muted-foreground">{a.publish_start}</p>}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex h-24 items-center justify-center text-sm text-muted-foreground">No active announcements</div>
                        )}
                    </div>
                </div>

                {/* Enrollment by Grade Level & Program */}
                {enrollmentByGrade.length > 0 && (
                    <div className="rounded-xl border bg-card p-6 shadow-sm">
                        <h3 className="mb-5 text-base font-semibold text-foreground">Enrollment by Grade Level &amp; Program</h3>
                        <div className="space-y-3">
                            {enrollmentByGrade.map((row) => (
                                <div key={row.label} className="flex items-center gap-3">
                                    <div className="w-44 shrink-0">
                                        <p className="truncate text-sm font-medium text-foreground">{row.label}</p>
                                        <p className="text-[10px] text-muted-foreground">
                                            {row.sections} section{row.sections !== 1 ? 's' : ''}
                                        </p>
                                    </div>
                                    <div className="h-5 flex-1 overflow-hidden rounded-full bg-muted">
                                        <div
                                            className={`h-full rounded-full transition-all ${
                                                row.percentage >= 90 ? 'bg-red-500' : row.percentage >= 70 ? 'bg-yellow-500' : 'bg-green-500'
                                            }`}
                                            style={{ width: `${row.percentage}%`, minWidth: row.enrolled > 0 ? '4px' : '0' }}
                                        />
                                    </div>
                                    <div className="w-20 shrink-0 text-right">
                                        <span className="text-sm font-semibold text-foreground">{row.enrolled}</span>
                                        <span className="text-xs text-muted-foreground">/{row.capacity}</span>
                                    </div>
                                    <span
                                        className={`w-10 shrink-0 text-right text-xs font-semibold ${
                                            row.percentage >= 90
                                                ? 'text-red-600 dark:text-red-400'
                                                : row.percentage >= 70
                                                  ? 'text-yellow-600 dark:text-yellow-400'
                                                  : 'text-green-600 dark:text-green-400'
                                        }`}
                                    >
                                        {row.percentage}%
                                    </span>
                                </div>
                            ))}
                        </div>
                        <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                                <span className="inline-block h-2 w-2 rounded-full bg-green-500" /> Below 70%
                            </span>
                            <span className="flex items-center gap-1">
                                <span className="inline-block h-2 w-2 rounded-full bg-yellow-500" /> 70–89%
                            </span>
                            <span className="flex items-center gap-1">
                                <span className="inline-block h-2 w-2 rounded-full bg-red-500" /> 90%+
                            </span>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
