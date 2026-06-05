import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { CheckCircle, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Clock, Eye, Search, Users } from 'lucide-react';
import { useState } from 'react';

interface PersonalData {
    first_name: string;
    last_name: string;
    middle_name: string | null;
    email: string;
}

interface Applicant {
    id: number;
    application_number: string;
    application_status: string;
    student_id_number: string | null;
    year_level: string;
    student_category: string;
    school_year: string;
    semester: string;
    personal_data: PersonalData | null;
}

interface PaginatedApplicants {
    data: Applicant[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
}

interface Props {
    applicants: PaginatedApplicants;
    filters: {
        search?: string;
        status?: string;
        category?: string;
    };
    statistics: {
        pending: number;
        enrolled: number;
        total: number;
    };
    currentPeriod: {
        school_year: string;
        semester: string;
        is_open: boolean;
    } | null;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Enrollment Management', href: '/enrollment/dashboard' },
];

export default function EnrollmentDashboard({ applicants, filters = {}, statistics, currentPeriod }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || 'all');
    const [categoryFilter, setCategoryFilter] = useState(filters.category || 'all');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            '/enrollment/dashboard',
            {
                search: search || undefined,
                status: statusFilter !== 'all' ? statusFilter : undefined,
                category: categoryFilter !== 'all' ? categoryFilter : undefined,
            },
            { preserveState: true },
        );
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'Enrolled':
                return <Badge className="bg-green-100 text-green-800">Enrolled</Badge>;
            case 'Pending':
                return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Enrollment Management" />

            <div className="space-y-6 p-6 md:p-10">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold text-gray-900">Enrollment Management</h1>
                    {currentPeriod && (
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ${
                            currentPeriod.is_open
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-600'
                        }`}>
                            <span className={`h-2 w-2 rounded-full ${currentPeriod.is_open ? 'bg-green-500' : 'bg-gray-400'}`} />
                            {currentPeriod.semester} {currentPeriod.school_year}
                        </span>
                    )}
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    <div className="rounded-lg border bg-white p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Pending</p>
                                <p className="text-3xl font-bold text-yellow-600">{statistics?.pending || 0}</p>
                            </div>
                            <Clock className="h-8 w-8 text-yellow-600" />
                        </div>
                    </div>

                    <div className="rounded-lg border bg-white p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Enrolled</p>
                                <p className="text-3xl font-bold text-green-600">{statistics?.enrolled || 0}</p>
                            </div>
                            <CheckCircle className="h-8 w-8 text-green-600" />
                        </div>
                    </div>

                    <div className="rounded-lg border bg-white p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Total</p>
                                <p className="text-3xl font-bold text-gray-900">{statistics?.total || 0}</p>
                            </div>
                            <Users className="h-8 w-8 text-blue-600" />
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="rounded-lg border bg-white p-6 shadow-sm">
                    <form onSubmit={handleSearch} className="grid grid-cols-1 gap-4 md:grid-cols-5">
                        <div className="md:col-span-2">
                            <label className="mb-1 block text-sm font-medium text-gray-700">Search Applicant</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                <Input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Name or email..."
                                    className="pl-10"
                                />
                            </div>
                        </div>

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

                        <div className="flex items-end">
                            <Button type="submit" className="w-full">
                                <Search className="mr-2 h-4 w-4" />
                                Search
                            </Button>
                        </div>
                    </form>
                </div>

                {/* Table */}
                <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
                    <div className="max-h-[70vh] overflow-x-auto overflow-y-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="sticky top-0 z-10 bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                    Application #
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                    Applicant Name
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                    Category
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                    Year Level
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                    Student ID
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                            {applicants.data && applicants.data.length > 0 ? (
                                applicants.data.map((applicant) => (
                                    <tr key={applicant.id} className="hover:bg-gray-50">
                                        <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                                            {applicant.application_number}
                                        </td>
                                        <td className="whitespace-nowrap px-6 py-4">
                                            <div className="text-sm font-medium text-gray-900">
                                                {applicant.personal_data?.last_name}, {applicant.personal_data?.first_name}
                                                {applicant.personal_data?.middle_name && ` ${applicant.personal_data.middle_name.charAt(0)}.`}
                                            </div>
                                            <div className="text-sm text-gray-500">{applicant.personal_data?.email}</div>
                                        </td>
                                        <td className="whitespace-nowrap px-6 py-4">
                                            <Badge variant="outline">{applicant.student_category}</Badge>
                                        </td>
                                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">{applicant.year_level}</td>
                                        <td className="whitespace-nowrap px-6 py-4">{getStatusBadge(applicant.application_status)}</td>
                                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                                            {applicant.student_id_number || <span className="text-gray-400">Not assigned</span>}
                                        </td>
                                        <td className="whitespace-nowrap px-6 py-4 text-sm">
                                            <Link href={`/enrollment/${applicant.id}`}>
                                                <button className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs hover:bg-muted">
                                                    <Eye className="h-3 w-3" /> View
                                                </button>
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                        <Users className="mx-auto h-12 w-12 text-gray-400" />
                                        <p className="mt-2">No applicants found.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                    </div>

                {/* Pagination */}
                <div className="flex items-center justify-between border-t bg-white px-4 py-3">
                    <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-700">Rows per page:</span>
                        <select
                            value={applicants.per_page}
                            onChange={(e) => router.get('/enrollment/dashboard', { ...filters, per_page: e.target.value, page: 1 }, { preserveState: true })}
                            className="rounded-lg border border-gray-300 px-3 py-1 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            {[5, 10, 25, 50].map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <span className="text-sm text-gray-700">
                            {applicants.total > 0 ? (applicants.current_page - 1) * applicants.per_page + 1 : 0} - {Math.min(applicants.current_page * applicants.per_page, applicants.total)} of {applicants.total}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => router.get('/enrollment/dashboard', { ...filters, page: 1 }, { preserveState: true })} disabled={applicants.current_page === 1} className="rounded-lg p-2 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50">
                            <ChevronsLeft className="h-5 w-5" />
                        </button>
                        <button onClick={() => router.get('/enrollment/dashboard', { ...filters, page: applicants.current_page - 1 }, { preserveState: true })} disabled={applicants.current_page === 1} className="rounded-lg p-2 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50">
                            <ChevronLeft className="h-5 w-5" />
                        </button>
                        <span className="px-4 py-2 text-sm font-medium">Page {applicants.current_page} of {applicants.last_page}</span>
                        <button onClick={() => router.get('/enrollment/dashboard', { ...filters, page: applicants.current_page + 1 }, { preserveState: true })} disabled={applicants.current_page === applicants.last_page} className="rounded-lg p-2 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50">
                            <ChevronRight className="h-5 w-5" />
                        </button>
                        <button onClick={() => router.get('/enrollment/dashboard', { ...filters, page: applicants.last_page }, { preserveState: true })} disabled={applicants.current_page === applicants.last_page} className="rounded-lg p-2 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50">
                            <ChevronsRight className="h-5 w-5" />
                        </button>
                    </div>
                </div>
                </div>
            </div>
        </AppLayout>
    );
}
