import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { BookOpen, Clock, GraduationCap, Users } from 'lucide-react';

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

interface MonthlyData {
    month: string;
    count: number;
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

interface Props {
    stats: Stats;
    statusBreakdown: StatusBreakdown[];
    categoryBreakdown: CategoryBreakdown[];
    monthlyApplications: MonthlyData[];
    monthlyEnrollments: MonthlyData[];
    blockSections: BlockSectionData[];
    currentSchoolYear: string;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
];

// Status color mapping
const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
        case 'pending':
            return 'bg-yellow-500';
        case 'for exam':
            return 'bg-blue-500';
        case 'exam taken':
            return 'bg-purple-500';
        case 'enrolled':
            return 'bg-green-500';
        default:
            return 'bg-gray-500';
    }
};

// Category color mapping
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

export default function Dashboard({
    stats = { total_applicants: 0, pending: 0, for_exam: 0, exam_taken: 0, enrolled: 0, portal_credentials: 0, students: 0 },
    statusBreakdown = [],
    categoryBreakdown = [],
    monthlyApplications = [],
    monthlyEnrollments = [],
    blockSections = [],
    currentSchoolYear = '2025-2026',
}: Props) {
    // Calculate max value for bar chart scaling
    const maxMonthlyCount = Math.max(
        ...monthlyApplications.map((m) => m.count),
        ...monthlyEnrollments.map((m) => m.count),
        1,
    );

    // Calculate totals for charts
    const totalStatus = statusBreakdown.reduce((sum, item) => sum + item.count, 0);
    const totalCategory = categoryBreakdown.reduce((sum, item) => sum + item.count, 0);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-4 md:p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
                        <p className="text-sm text-muted-foreground">
                            School Year {currentSchoolYear} Overview
                        </p>
                    </div>
                </div>

                {/* Statistics Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {/* Total Applicants */}
                    <div className="rounded-xl border bg-card p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Total Applicants</p>
                                <p className="text-3xl font-bold text-foreground">{stats.total_applicants}</p>
                            </div>
                            <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-900/30">
                                <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                            </div>
                        </div>
                    </div>

                    {/* Pending */}
                    <div className="rounded-xl border bg-card p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Pending Review</p>
                                <p className="text-3xl font-bold text-foreground">{stats.pending}</p>
                            </div>
                            <div className="rounded-full bg-yellow-100 p-3 dark:bg-yellow-900/30">
                                <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                            </div>
                        </div>
                    </div>

                    {/* For Exam / Exam Taken */}
                    <div className="rounded-xl border bg-card p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Examination</p>
                                <p className="text-3xl font-bold text-foreground">
                                    {stats.for_exam + stats.exam_taken}
                                </p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    {stats.for_exam} scheduled • {stats.exam_taken} completed
                                </p>
                            </div>
                            <div className="rounded-full bg-purple-100 p-3 dark:bg-purple-900/30">
                                <BookOpen className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                            </div>
                        </div>
                    </div>

                    {/* Enrolled */}
                    <div className="rounded-xl border bg-card p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Enrolled Students</p>
                                <p className="text-3xl font-bold text-foreground">{stats.enrolled}</p>
                            </div>
                            <div className="rounded-full bg-green-100 p-3 dark:bg-green-900/30">
                                <GraduationCap className="h-6 w-6 text-green-600 dark:text-green-400" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Charts Section */}
                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Application Status Breakdown */}
                    <div className="rounded-xl border bg-card p-6 shadow-sm">
                        <h3 className="mb-4 text-lg font-semibold text-foreground">Application Status</h3>
                        {statusBreakdown.length > 0 ? (
                            <div className="space-y-4">
                                {/* Visual Bar */}
                                <div className="flex h-4 overflow-hidden rounded-full bg-muted">
                                    {statusBreakdown.map((item) => (
                                        <div
                                            key={item.status}
                                            className={`${getStatusColor(item.status)} transition-all`}
                                            style={{
                                                width: `${totalStatus > 0 ? (item.count / totalStatus) * 100 : 0}%`,
                                            }}
                                        />
                                    ))}
                                </div>
                                {/* Legend */}
                                <div className="grid grid-cols-2 gap-3">
                                    {statusBreakdown.map((item) => (
                                        <div key={item.status} className="flex items-center gap-2">
                                            <div className={`h-3 w-3 rounded-full ${getStatusColor(item.status)}`} />
                                            <span className="text-sm text-muted-foreground">{item.status}</span>
                                            <span className="ml-auto text-sm font-medium">{item.count}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="flex h-32 items-center justify-center text-muted-foreground">
                                No data available
                            </div>
                        )}
                    </div>

                    {/* Category Breakdown */}
                    <div className="rounded-xl border bg-card p-6 shadow-sm">
                        <h3 className="mb-4 text-lg font-semibold text-foreground">By Student Category</h3>
                        {categoryBreakdown.length > 0 ? (
                            <div className="space-y-4">
                                {/* Visual Bar */}
                                <div className="flex h-4 overflow-hidden rounded-full bg-muted">
                                    {categoryBreakdown.map((item) => (
                                        <div
                                            key={item.category}
                                            className={`${getCategoryColor(item.category)} transition-all`}
                                            style={{
                                                width: `${totalCategory > 0 ? (item.count / totalCategory) * 100 : 0}%`,
                                            }}
                                        />
                                    ))}
                                </div>
                                {/* Legend */}
                                <div className="grid grid-cols-3 gap-3">
                                    {categoryBreakdown.map((item) => (
                                        <div key={item.category} className="flex items-center gap-2">
                                            <div className={`h-3 w-3 rounded-full ${getCategoryColor(item.category)}`} />
                                            <span className="text-sm text-muted-foreground">{item.category}</span>
                                            <span className="ml-auto text-sm font-medium">{item.count}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="flex h-32 items-center justify-center text-muted-foreground">
                                No data available
                            </div>
                        )}
                    </div>
                </div>

                {/* Monthly Trends */}
                <div className="rounded-xl border bg-card p-6 shadow-sm">
                    <h3 className="mb-4 text-lg font-semibold text-foreground">Monthly Trends (Last 6 Months)</h3>
                    <div className="flex gap-8">
                        {/* Applications Chart */}
                        <div className="flex-1">
                            <p className="mb-3 text-sm font-medium text-muted-foreground">Applications</p>
                            <div className="flex items-end gap-2" style={{ height: '120px' }}>
                                {monthlyApplications.map((item) => (
                                    <div key={item.month} className="flex flex-1 flex-col items-center gap-1">
                                        <span className="text-xs font-medium">{item.count}</span>
                                        <div
                                            className="w-full rounded-t bg-blue-500 transition-all hover:bg-blue-600"
                                            style={{
                                                height: `${maxMonthlyCount > 0 ? (item.count / maxMonthlyCount) * 100 : 0}px`,
                                                minHeight: item.count > 0 ? '4px' : '0',
                                            }}
                                        />
                                        <span className="mt-1 text-xs text-muted-foreground">
                                            {item.month.split(' ')[0]}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Enrollments Chart */}
                        <div className="flex-1">
                            <p className="mb-3 text-sm font-medium text-muted-foreground">Enrollments</p>
                            <div className="flex items-end gap-2" style={{ height: '120px' }}>
                                {monthlyEnrollments.map((item) => (
                                    <div key={item.month} className="flex flex-1 flex-col items-center gap-1">
                                        <span className="text-xs font-medium">{item.count}</span>
                                        <div
                                            className="w-full rounded-t bg-green-500 transition-all hover:bg-green-600"
                                            style={{
                                                height: `${maxMonthlyCount > 0 ? (item.count / maxMonthlyCount) * 100 : 0}px`,
                                                minHeight: item.count > 0 ? '4px' : '0',
                                            }}
                                        />
                                        <span className="mt-1 text-xs text-muted-foreground">
                                            {item.month.split(' ')[0]}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Block Section Capacity */}
                {blockSections.length > 0 && (
                    <div className="rounded-xl border bg-card p-6 shadow-sm">
                        <h3 className="mb-4 text-lg font-semibold text-foreground">Block Section Capacity</h3>
                        <div className="space-y-3">
                            {blockSections.map((section) => (
                                <div key={section.name} className="flex items-center gap-4">
                                    <div className="w-32 shrink-0">
                                        <p className="text-sm font-medium text-foreground">{section.name}</p>
                                        <p className="text-xs text-muted-foreground">{section.grade_level}</p>
                                    </div>
                                    <div className="flex-1">
                                        <div className="h-2 overflow-hidden rounded-full bg-muted">
                                            <div
                                                className={`h-full transition-all ${
                                                    section.percentage >= 90
                                                        ? 'bg-red-500'
                                                        : section.percentage >= 70
                                                          ? 'bg-yellow-500'
                                                          : 'bg-green-500'
                                                }`}
                                                style={{ width: `${section.percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                    <div className="w-24 text-right">
                                        <span className="text-sm font-medium">
                                            {section.enrolled}/{section.capacity}
                                        </span>
                                        <span className="ml-2 text-xs text-muted-foreground">
                                            ({section.percentage}%)
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
