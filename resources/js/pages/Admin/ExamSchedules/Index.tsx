import { ConfirmDialog } from '@/components/confirm-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { Building2, Calendar, Edit, Eye, Plus, Search, Trash2, Users, X } from 'lucide-react';
import { useState } from 'react';

interface Room {
    id: number;
    name: string;
    building: string | null;
}

interface Schedule {
    id: number;
    name: string;
    exam_type: string;
    exam_date: string;
    start_time: string;
    end_time: string;
    examination_room_id: number;
    capacity: number | null;
    description: string | null;
    is_active: boolean;
    created_at: string;
    examination_room: Room;
    assigned_count: number;
}

interface PaginatedData {
    data: Schedule[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
}

interface Props {
    schedules: PaginatedData;
    rooms: Room[];
    filters: {
        search?: string;
        date_from?: string;
        date_to?: string;
        status?: string;
        room_id?: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Exam Schedules', href: '/exam-schedules' },
];

export default function Index({ schedules, rooms, filters }: Props) {
    const { delete: destroy, processing } = useForm();
    const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: number; name: string }>({ open: false, id: 0, name: '' });

    const handleSearch = (value: string) => {
        router.get('/exam-schedules', { ...filters, search: value || undefined }, { preserveState: true });
    };

    const handleFilter = (key: string, value: string) => {
        router.get('/exam-schedules', { ...filters, [key]: value === 'all' ? undefined : value }, { preserveState: true });
    };

    const handleDelete = (id: number, name: string) => {
        setDeleteDialog({ open: true, id, name });
    };

    const confirmDelete = () => {
        destroy(`/exam-schedules/${deleteDialog.id}`, {
            onSuccess: () => setDeleteDialog({ open: false, id: 0, name: '' }),
        });
    };

    const clearFilters = () => {
        router.get('/exam-schedules');
    };

    const hasFilters = filters.search || filters.date_from || filters.date_to || filters.status || filters.room_id;

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const formatTime = (time: string) => {
        const [hours, minutes] = time.split(':');
        const h = parseInt(hours);
        const ampm = h >= 12 ? 'PM' : 'AM';
        const hour = h % 12 || 12;
        return `${hour}:${minutes} ${ampm}`;
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Exam Schedules" />

            <div className="p-6 md:p-10">
                {/* Header */}
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Exam Schedules</h1>
                        <p className="mt-1 text-gray-600">Manage examination schedules and room assignments</p>
                    </div>
                    <div className="flex gap-2">
                        <Link href="/examination-rooms">
                            <Button variant="outline">
                                <Building2 className="mr-2 h-4 w-4" />
                                Manage Rooms
                            </Button>
                        </Link>
                        <Link href="/exam-schedules/create">
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Add Schedule
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Filters */}
                <div className="mb-6 rounded-lg border bg-white p-4 shadow-sm">
                    <div className="grid gap-4 md:grid-cols-5">
                        {/* Search */}
                        <div className="relative md:col-span-2">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <Input
                                placeholder="Search by name or type..."
                                defaultValue={filters.search}
                                onChange={(e) => handleSearch(e.target.value)}
                                className="pl-10"
                            />
                        </div>

                        {/* Room Filter */}
                        <Select value={filters.room_id || 'all'} onValueChange={(v) => handleFilter('room_id', v)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Room" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Rooms</SelectItem>
                                {rooms.map((room) => (
                                    <SelectItem key={room.id} value={room.id.toString()}>
                                        {room.name} {room.building && `(${room.building})`}
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
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="inactive">Inactive</SelectItem>
                            </SelectContent>
                        </Select>

                        {/* Date Filter */}
                        <Input
                            type="date"
                            placeholder="From date"
                            value={filters.date_from || ''}
                            onChange={(e) => handleFilter('date_from', e.target.value)}
                        />
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
                {schedules.data.length > 0 ? (
                    <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left font-semibold text-gray-900">Schedule</th>
                                        <th className="px-4 py-3 text-left font-semibold text-gray-900">Date & Time</th>
                                        <th className="px-4 py-3 text-left font-semibold text-gray-900">Room</th>
                                        <th className="px-4 py-3 text-center font-semibold text-gray-900">Assigned</th>
                                        <th className="px-4 py-3 text-center font-semibold text-gray-900">Status</th>
                                        <th className="px-4 py-3 text-center font-semibold text-gray-900">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {schedules.data.map((schedule) => {
                                        const effectiveCapacity = schedule.capacity || schedule.examination_room?.capacity || 0;
                                        const isFull = schedule.assigned_count >= effectiveCapacity;

                                        return (
                                            <tr key={schedule.id} className="hover:bg-gray-50">
                                                <td className="px-4 py-3">
                                                    <div>
                                                        <p className="font-medium text-gray-900">{schedule.name}</p>
                                                        <Badge variant="outline" className="mt-1">
                                                            {schedule.exam_type}
                                                        </Badge>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div>
                                                        <p className="font-medium text-gray-900">{formatDate(schedule.exam_date)}</p>
                                                        <p className="text-sm text-gray-500">
                                                            {formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}
                                                        </p>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div>
                                                        <p className="text-gray-900">{schedule.examination_room?.name}</p>
                                                        {schedule.examination_room?.building && (
                                                            <p className="text-sm text-gray-500">{schedule.examination_room.building}</p>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <Users className="h-4 w-4 text-gray-400" />
                                                        <span className={isFull ? 'font-medium text-red-600' : ''}>
                                                            {schedule.assigned_count}/{effectiveCapacity}
                                                        </span>
                                                    </div>
                                                    {isFull && <Badge variant="destructive" className="mt-1">Full</Badge>}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <Badge className={schedule.is_active ? 'bg-green-100 text-green-800' : ''}>
                                                        {schedule.is_active ? 'Active' : 'Inactive'}
                                                    </Badge>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex justify-center gap-1">
                                                        <Link href={`/exam-schedules/${schedule.id}`}>
                                                            <Button variant="outline" size="sm">
                                                                <Eye className="h-4 w-4" />
                                                            </Button>
                                                        </Link>
                                                        <Link href={`/exam-schedules/${schedule.id}/edit`}>
                                                            <Button variant="outline" size="sm">
                                                                <Edit className="h-4 w-4" />
                                                            </Button>
                                                        </Link>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleDelete(schedule.id, schedule.name)}
                                                            disabled={processing}
                                                            className="text-red-600 hover:text-red-700"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {schedules.last_page > 1 && (
                            <div className="flex items-center justify-between border-t px-4 py-3">
                                <p className="text-sm text-gray-600">
                                    Showing {(schedules.current_page - 1) * schedules.per_page + 1} to{' '}
                                    {Math.min(schedules.current_page * schedules.per_page, schedules.total)} of {schedules.total} results
                                </p>
                                <div className="flex gap-1">
                                    {schedules.links.map((link, index) => (
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
                        <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-4 text-lg font-semibold text-gray-900">No schedules found</h3>
                        <p className="mt-2 text-gray-600">
                            {hasFilters
                                ? 'No schedules match your filters. Try adjusting your search criteria.'
                                : 'Get started by creating your first exam schedule.'}
                        </p>
                        {!hasFilters && (
                            <Link href="/exam-schedules/create">
                                <Button className="mt-4">
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add Schedule
                                </Button>
                            </Link>
                        )}
                    </div>
                )}
            </div>

            <ConfirmDialog
                open={deleteDialog.open}
                onClose={() => setDeleteDialog({ open: false, id: 0, name: '' })}
                onConfirm={confirmDelete}
                title="Delete Exam Schedule"
                description={`Are you sure you want to delete "${deleteDialog.name}"? This action cannot be undone.`}
                confirmLabel="Delete"
                processingLabel="Deleting..."
                processing={processing}
            />
        </AppLayout>
    );
}
