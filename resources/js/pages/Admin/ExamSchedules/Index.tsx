import { AppBadge } from '@/components/AppBadge';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TablePagination } from '@/components/ui/table-pagination';
import {
    BODY_TEXT,
    CARD,
    LABEL_TEXT,
    PAGE_PADDING,
    PAGE_TITLE,
    TABLE_HEADER_CELL,
    TABLE_HEADER_CELL_CENTER,
    TABLE_ROW,
    TABLE_ROW_ACTION,
    TABLE_ROW_ACTION_DANGER,
} from '@/constants/ui';
import { useExamSchedules, type ExamRoom, type ExamSchedule, type ExamScheduleSortKey } from '@/hooks/useExamSchedules';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Building2, Calendar, ChevronDown, ChevronUp, Pencil, Plus, Search, Trash2, Users } from 'lucide-react';

interface Props {
    schedules: ExamSchedule[];
    rooms: ExamRoom[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/admin/dashboard' },
    { title: 'Exam Schedules', href: '/admin/exam-schedules' },
];

const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    return `${h % 12 || 12}:${minutes} ${ampm}`;
};

function SortIcon({ col, sortConfig }: { col: ExamScheduleSortKey; sortConfig: { key: ExamScheduleSortKey | null; direction: 'asc' | 'desc' } }) {
    if (sortConfig.key !== col) return <ChevronUp className="ml-1 inline h-3 w-3 opacity-30" />;
    return sortConfig.direction === 'asc' ? <ChevronUp className="ml-1 inline h-3 w-3" /> : <ChevronDown className="ml-1 inline h-3 w-3" />;
}

interface ScheduleRowProps {
    schedule: ExamSchedule;
    processing: boolean;
    onDelete: (id: number, name: string) => void;
}

function ScheduleRow({ schedule, processing, onDelete }: ScheduleRowProps) {
    const effectiveCapacity = schedule.capacity || schedule.examination_room?.capacity || 0;
    const isFull = schedule.assigned_count >= effectiveCapacity;

    return (
        <tr className={TABLE_ROW}>
            <td className="px-4 py-3">
                <p className="font-medium text-gray-900">{schedule.name}</p>
                <Badge variant="outline" className="mt-1">
                    {schedule.exam_type}
                </Badge>
            </td>
            <td className="px-4 py-3">
                <p className="font-medium text-gray-900">{formatDate(schedule.exam_date)}</p>
                <p className="text-sm text-gray-500">
                    {formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}
                </p>
            </td>
            <td className="px-4 py-3">
                <p className="text-gray-900">{schedule.examination_room?.name}</p>
                {schedule.examination_room?.building && <p className="text-sm text-gray-500">{schedule.examination_room.building}</p>}
            </td>
            <td className="px-4 py-3 text-center">
                <div className="flex items-center justify-center gap-1">
                    <Users className="h-4 w-4 text-gray-400" />
                    <span className={isFull ? 'font-medium text-red-600' : ''}>
                        {schedule.assigned_count}/{effectiveCapacity}
                    </span>
                </div>
                {isFull && (
                    <Badge variant="destructive" className="mt-1">
                        Full
                    </Badge>
                )}
            </td>
            <td className="px-4 py-3 text-center">
                <AppBadge status={schedule.is_active ? 'active' : 'inactive'}>{schedule.is_active ? 'Active' : 'Inactive'}</AppBadge>
            </td>
            <td className="px-4 py-3">
                <div className="flex justify-center gap-1">
                    <Link href={`/admin/exam-schedules/${schedule.id}`}>
                        <button className={TABLE_ROW_ACTION}>
                            <Users className="h-3 w-3" /> View Assigned
                        </button>
                    </Link>
                    <Link href={`/admin/exam-schedules/${schedule.id}/edit`}>
                        <button className={TABLE_ROW_ACTION}>
                            <Pencil className="h-3 w-3" /> Edit
                        </button>
                    </Link>
                    <button onClick={() => onDelete(schedule.id, schedule.name)} disabled={processing} className={TABLE_ROW_ACTION_DANGER}>
                        <Trash2 className="h-3 w-3" /> Delete
                    </button>
                </div>
            </td>
        </tr>
    );
}

/** Admin exam schedules list with search, filter, and delete actions. */
export default function Index({ schedules, rooms }: Props) {
    const {
        processing,
        deleteDialog,
        setDeleteDialog,
        searchQuery,
        setSearchQuery,
        selectedRoomId,
        setSelectedRoomId,
        selectedStatus,
        setSelectedStatus,
        dateFrom,
        setDateFrom,
        currentPage,
        setCurrentPage,
        pageSize,
        setPageSize,
        sortConfig,
        hasFilters,
        sortedItems,
        paginatedItems,
        toggleSort,
        clearFilters,
        confirmDelete,
    } = useExamSchedules(schedules);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Exam Schedules" />

            <div className={PAGE_PADDING}>
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <h1 className={PAGE_TITLE}>Exam Schedules</h1>
                    <div className="flex gap-2">
                        <Link href="/admin/examination-rooms">
                            <Button variant="outline">
                                <Building2 className="mr-2 h-4 w-4" />
                                Manage Rooms
                            </Button>
                        </Link>
                        <Link href="/admin/exam-schedules/create">
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Add Schedule
                            </Button>
                        </Link>
                    </div>
                </div>

                <div className="mb-6 flex flex-wrap items-end gap-3">
                    <div>
                        <label className={`mb-1 block ${LABEL_TEXT}`}>Search</label>
                        <div className="relative w-full sm:w-[400px]">
                            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <Input
                                placeholder="Search by name or type..."
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="pl-10"
                            />
                        </div>
                    </div>
                    <Select
                        value={selectedRoomId || 'all'}
                        onValueChange={(v) => {
                            setSelectedRoomId(v === 'all' ? '' : v);
                            setCurrentPage(1);
                        }}
                    >
                        <SelectTrigger className="w-48">
                            <SelectValue placeholder="Room" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Rooms</SelectItem>
                            {rooms.map((room) => (
                                <SelectItem key={room.id} value={String(room.id)}>
                                    {room.name}
                                    {room.building ? ` (${room.building})` : ''}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select
                        value={selectedStatus || 'all'}
                        onValueChange={(v) => {
                            setSelectedStatus(v === 'all' ? '' : v);
                            setCurrentPage(1);
                        }}
                    >
                        <SelectTrigger className="w-36">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                    </Select>
                    <div>
                        <label className={`mb-1 block ${LABEL_TEXT}`}>From Date</label>
                        <Input
                            type="date"
                            value={dateFrom}
                            onChange={(e) => {
                                setDateFrom(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="h-10 w-40"
                        />
                    </div>
                    {hasFilters && (
                        <Button variant="ghost" onClick={clearFilters}>
                            Clear
                        </Button>
                    )}
                </div>

                <div className={`overflow-hidden ${CARD}`}>
                    <div className="max-h-[70vh] overflow-x-auto overflow-y-auto">
                        <table className="w-full text-sm">
                            <thead className="sticky top-0 z-10 bg-gray-50">
                                <tr>
                                    <th className={`${TABLE_HEADER_CELL} cursor-pointer hover:bg-gray-100`} onClick={() => toggleSort('name')}>
                                        Schedule <SortIcon col="name" sortConfig={sortConfig} />
                                    </th>
                                    <th className={`${TABLE_HEADER_CELL} cursor-pointer hover:bg-gray-100`} onClick={() => toggleSort('exam_date')}>
                                        Date &amp; Time <SortIcon col="exam_date" sortConfig={sortConfig} />
                                    </th>
                                    <th className={`${TABLE_HEADER_CELL} cursor-pointer hover:bg-gray-100`} onClick={() => toggleSort('room')}>
                                        Room <SortIcon col="room" sortConfig={sortConfig} />
                                    </th>
                                    <th
                                        className={`${TABLE_HEADER_CELL_CENTER} cursor-pointer hover:bg-gray-100`}
                                        onClick={() => toggleSort('assigned_count')}
                                    >
                                        Assigned <SortIcon col="assigned_count" sortConfig={sortConfig} />
                                    </th>
                                    <th
                                        className={`${TABLE_HEADER_CELL_CENTER} cursor-pointer hover:bg-gray-100`}
                                        onClick={() => toggleSort('status')}
                                    >
                                        Status <SortIcon col="status" sortConfig={sortConfig} />
                                    </th>
                                    <th className={TABLE_HEADER_CELL_CENTER}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedItems.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-12 text-center">
                                            <Calendar className="mx-auto h-10 w-10 text-gray-300" />
                                            <p className={`mt-2 ${BODY_TEXT}`}>
                                                {hasFilters ? 'No schedules match your filters.' : 'No exam schedules found.'}
                                            </p>
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedItems.map((schedule) => (
                                        <ScheduleRow
                                            key={schedule.id}
                                            schedule={schedule}
                                            processing={processing}
                                            onDelete={(id, name) => setDeleteDialog({ open: true, id, name })}
                                        />
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    <TablePagination
                        total={sortedItems.length}
                        pageSize={pageSize}
                        currentPage={currentPage}
                        onPageChange={setCurrentPage}
                        onPageSizeChange={(s) => {
                            setPageSize(s);
                            setCurrentPage(1);
                        }}
                    />
                </div>
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
