import { ConfirmDialog } from '@/components/confirm-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { Calendar, Plus, Search, Trash2, UserCheck, Users, X } from 'lucide-react';
import { useState } from 'react';

interface PersonalData {
    first_name: string;
    last_name: string;
    middle_name: string | null;
}

interface ApplicationInfo {
    id: number;
    application_number: string;
    personal_data: PersonalData;
}

interface Room {
    id: number;
    name: string;
    building: string | null;
}

interface Schedule {
    id: number;
    name: string;
    exam_date: string;
    examination_room_id: number;
    examination_room: Room;
}

interface Assignment {
    id: number;
    seat_number: string | null;
    status: string;
    assigned_at: string;
    application_info: ApplicationInfo;
    exam_schedule: Schedule;
}

interface PaginatedData {
    data: Assignment[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
}

interface Props {
    assignments: PaginatedData;
    schedules: Schedule[];
    filters: {
        search?: string;
        status?: string;
        schedule_id?: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Exam Assignments', href: '/exam-assignments' },
];

export default function Index({ assignments, schedules, filters }: Props) {
    const { delete: destroy, processing } = useForm();
    const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: number }>({ open: false, id: 0 });

    const handleSearch = (value: string) => {
        router.get('/exam-assignments', { ...filters, search: value || undefined }, { preserveState: true });
    };

    const handleFilter = (key: string, value: string) => {
        router.get('/exam-assignments', { ...filters, [key]: value === 'all' ? undefined : value }, { preserveState: true });
    };

    const handleDelete = (id: number) => {
        setDeleteDialog({ open: true, id });
    };

    const confirmDelete = () => {
        destroy(`/exam-assignments/${deleteDialog.id}`, {
            onSuccess: () => setDeleteDialog({ open: false, id: 0 }),
        });
    };

    const clearFilters = () => {
        router.get('/exam-assignments');
    };

    const hasFilters = filters.search || filters.status || filters.schedule_id;

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'assigned':
                return <Badge variant="outline">Assigned</Badge>;
            case 'confirmed':
                return <Badge className="bg-blue-100 text-blue-800">Confirmed</Badge>;
            case 'attended':
                return <Badge className="bg-green-100 text-green-800">Attended</Badge>;
            case 'absent':
                return <Badge variant="destructive">Absent</Badge>;
            case 'cancelled':
                return <Badge variant="secondary">Cancelled</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Exam Assignments" />

            <div className="p-6 md:p-10">
                {/* Header */}
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Exam Assignments</h1>
                        <p className="mt-1 text-gray-600">Manage applicant exam schedule assignments</p>
                    </div>
                    <Link href="/exam-assignments/create">
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Assign Applicants
                        </Button>
                    </Link>
                </div>

                {/* Filters */}
                <div className="mb-6 rounded-lg border bg-white p-4 shadow-sm">
                    <div className="grid gap-4 md:grid-cols-4">
                        {/* Search */}
                        <div className="relative md:col-span-2">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <Input
                                placeholder="Search by application # or name..."
                                defaultValue={filters.search}
                                onChange={(e) => handleSearch(e.target.value)}
                                className="pl-10"
                            />
                        </div>

                        {/* Schedule Filter */}
                        <Select value={filters.schedule_id || 'all'} onValueChange={(v) => handleFilter('schedule_id', v)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Schedule" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Schedules</SelectItem>
                                {schedules.map((schedule) => (
                                    <SelectItem key={schedule.id} value={schedule.id.toString()}>
                                        {schedule.name} - {formatDate(schedule.exam_date)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* Status Filter */}
                        <Select value={filters.status || 'all'} onValueChange={(v) => handleFilter('status', v)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="assigned">Assigned</SelectItem>
                                <SelectItem value="confirmed">Confirmed</SelectItem>
                                <SelectItem value="attended">Attended</SelectItem>
                                <SelectItem value="absent">Absent</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
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
                {assignments.data.length > 0 ? (
                    <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
                        <div className="max-h-[70vh] overflow-x-auto overflow-y-auto">
                            <table className="w-full text-sm">
                                <thead className="sticky top-0 z-10 bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Application #</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Applicant Name</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Exam Schedule</th>
                                        <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">Seat #</th>
                                        <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
                                        <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {assignments.data.map((assignment) => (
                                        <tr key={assignment.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 font-medium text-gray-900">
                                                {assignment.application_info?.application_number}
                                            </td>
                                            <td className="px-4 py-3">
                                                {assignment.application_info?.personal_data?.last_name},{' '}
                                                {assignment.application_info?.personal_data?.first_name}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div>
                                                    <p className="font-medium text-gray-900">{assignment.exam_schedule?.name}</p>
                                                    <p className="text-sm text-gray-500">
                                                        {formatDate(assignment.exam_schedule?.exam_date)} •{' '}
                                                        {assignment.exam_schedule?.examination_room?.name}
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-center">{assignment.seat_number || '—'}</td>
                                            <td className="px-4 py-3 text-center">{getStatusBadge(assignment.status)}</td>
                                            <td className="px-4 py-3">
                                                <div className="flex justify-center gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDelete(assignment.id)}
                                                        disabled={processing}
                                                        className="text-red-600 hover:text-red-700"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {assignments.last_page > 1 && (
                            <div className="flex items-center justify-between border-t px-4 py-3">
                                <p className="text-sm text-gray-600">
                                    Showing {(assignments.current_page - 1) * assignments.per_page + 1} to{' '}
                                    {Math.min(assignments.current_page * assignments.per_page, assignments.total)} of{' '}
                                    {assignments.total} results
                                </p>
                                <div className="flex gap-1">
                                    {assignments.links.map((link, index) => (
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
                        <UserCheck className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-4 text-lg font-semibold text-gray-900">No assignments found</h3>
                        <p className="mt-2 text-gray-600">
                            {hasFilters
                                ? 'No assignments match your filters. Try adjusting your search criteria.'
                                : 'Get started by assigning applicants to exam schedules.'}
                        </p>
                        {!hasFilters && (
                            <Link href="/exam-assignments/create">
                                <Button className="mt-4">
                                    <Plus className="mr-2 h-4 w-4" />
                                    Assign Applicants
                                </Button>
                            </Link>
                        )}
                    </div>
                )}
            </div>

            <ConfirmDialog
                open={deleteDialog.open}
                onClose={() => setDeleteDialog({ open: false, id: 0 })}
                onConfirm={confirmDelete}
                title="Remove Assignment"
                description="Are you sure you want to remove this exam assignment? This action cannot be undone."
                confirmLabel="Remove"
                processingLabel="Removing..."
                processing={processing}
            />
        </AppLayout>
    );
}
