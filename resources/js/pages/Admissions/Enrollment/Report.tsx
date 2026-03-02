import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, BarChart3, CheckCircle, Clock, Users } from 'lucide-react';
import { useState } from 'react';

interface Statistics {
    total_students: number;
    pending_count: number;
    enrolled_count: number;
    by_category: {
        category: string;
        count: number;
    }[];
    by_year_level: {
        year_level: string;
        count: number;
    }[];
}

interface Props {
    statistics: Statistics;
    filters: {
        status?: string;
        category?: string;
        school_year?: string;
    };
    schoolYears: string[];
    semesters: string[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Enrollment Management', href: '/enrollment/dashboard' },
    { title: 'Reports', href: '/enrollment/report' },
];

export default function EnrollmentReport({ statistics, filters = {}, schoolYears = [], semesters = [] }: Props) {
    const [statusFilter, setStatusFilter] = useState(filters.status || 'all');
    const [categoryFilter, setCategoryFilter] = useState(filters.category || 'all');
    const [schoolYear, setSchoolYear] = useState(filters.school_year || 'all');

    const handleFilter = () => {
        router.get(
            '/enrollment/report',
            {
                status: statusFilter !== 'all' ? statusFilter : undefined,
                category: categoryFilter !== 'all' ? categoryFilter : undefined,
                school_year: schoolYear !== 'all' ? schoolYear : undefined,
            },
            { preserveState: true },
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Enrollment Reports" />

            <div className="space-y-6 p-6 md:p-10">
                {/* Header */}
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Enrollment Reports</h1>
                        <p className="mt-1 text-gray-600">View enrollment statistics and generate reports</p>
                    </div>
                    <Link href="/enrollment/dashboard">
                        <Button variant="outline">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Dashboard
                        </Button>
                    </Link>
                </div>

                {/* Filters */}
                <div className="rounded-lg border bg-white p-6 shadow-sm">
                    <h2 className="mb-4 text-lg font-semibold">Filter Reports</h2>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">Status</label>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All Statuses" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Statuses</SelectItem>
                                    <SelectItem value="Pending">Pending</SelectItem>
                                    <SelectItem value="Enrolled">Enrolled</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">Category</label>
                            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All Categories" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Categories</SelectItem>
                                    <SelectItem value="LES">LES</SelectItem>
                                    <SelectItem value="JHS">JHS</SelectItem>
                                    <SelectItem value="SHS">SHS</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">School Year</label>
                            <Select value={schoolYear} onValueChange={setSchoolYear}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All School Years" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All School Years</SelectItem>
                                    {schoolYears.map((year) => (
                                        <SelectItem key={year} value={year}>
                                            {year}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-end">
                            <Button onClick={handleFilter} className="w-full">
                                <BarChart3 className="mr-2 h-4 w-4" />
                                Apply Filters
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    <div className="rounded-lg border bg-white p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Total Applicants</p>
                                <p className="text-3xl font-bold text-gray-900">{statistics?.total_students || 0}</p>
                            </div>
                            <Users className="h-8 w-8 text-blue-600" />
                        </div>
                    </div>

                    <div className="rounded-lg border bg-white p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Pending</p>
                                <p className="text-3xl font-bold text-yellow-600">{statistics?.pending_count || 0}</p>
                            </div>
                            <Clock className="h-8 w-8 text-yellow-600" />
                        </div>
                        <div className="mt-2">
                            <Badge className="bg-yellow-100 text-yellow-800">
                                {statistics?.total_students
                                    ? ((statistics.pending_count / statistics.total_students) * 100).toFixed(1)
                                    : 0}
                                %
                            </Badge>
                        </div>
                    </div>

                    <div className="rounded-lg border bg-white p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Enrolled</p>
                                <p className="text-3xl font-bold text-green-600">{statistics?.enrolled_count || 0}</p>
                            </div>
                            <CheckCircle className="h-8 w-8 text-green-600" />
                        </div>
                        <div className="mt-2">
                            <Badge className="bg-green-100 text-green-800">
                                {statistics?.total_students
                                    ? ((statistics.enrolled_count / statistics.total_students) * 100).toFixed(1)
                                    : 0}
                                %
                            </Badge>
                        </div>
                    </div>
                </div>

                {/* Breakdown Tables */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {/* By Category */}
                    <div className="rounded-lg border bg-white shadow-sm">
                        <div className="border-b bg-gray-50 px-6 py-4">
                            <h2 className="font-semibold">Applicants by Category</h2>
                        </div>
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Category</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium uppercase text-gray-500">Count</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium uppercase text-gray-500">Percentage</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {statistics?.by_category && statistics.by_category.length > 0 ? (
                                    statistics.by_category.map((item, index) => (
                                        <tr key={index} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.category}</td>
                                            <td className="px-6 py-4 text-right text-sm text-gray-600">{item.count}</td>
                                            <td className="px-6 py-4 text-right text-sm text-gray-600">
                                                {statistics.total_students
                                                    ? ((item.count / statistics.total_students) * 100).toFixed(1)
                                                    : 0}
                                                %
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={3} className="px-6 py-4 text-center text-gray-500">
                                            No data available
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* By Year Level */}
                    <div className="rounded-lg border bg-white shadow-sm">
                        <div className="border-b bg-gray-50 px-6 py-4">
                            <h2 className="font-semibold">Applicants by Year Level</h2>
                        </div>
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Year Level</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium uppercase text-gray-500">Count</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium uppercase text-gray-500">Percentage</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {statistics?.by_year_level && statistics.by_year_level.length > 0 ? (
                                    statistics.by_year_level.map((item, index) => (
                                        <tr key={index} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                                {item.year_level || 'Not Assigned'}
                                            </td>
                                            <td className="px-6 py-4 text-right text-sm text-gray-600">{item.count}</td>
                                            <td className="px-6 py-4 text-right text-sm text-gray-600">
                                                {statistics.total_students
                                                    ? ((item.count / statistics.total_students) * 100).toFixed(1)
                                                    : 0}
                                                %
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={3} className="px-6 py-4 text-center text-gray-500">
                                            No data available
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
