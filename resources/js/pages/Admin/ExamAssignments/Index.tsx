import { ConfirmDialog } from '@/components/confirm-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import {
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    ChevronUp,
    ChevronsLeft,
    ChevronsRight,
    Plus,
    Search,
    Trash2,
    UserCheck,
} from 'lucide-react';
import { useMemo, useState } from 'react';

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
    status: string;
    assigned_at: string;
    application_info: ApplicationInfo;
    exam_schedule: Schedule;
}

interface Props {
    assignments: Assignment[];
    schedules: Schedule[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Exam Assignments', href: '/exam-assignments' },
];

type SortKey = 'application_number' | 'name' | 'schedule' | 'status';

const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

export default function Index({ assignments, schedules }: Props) {
    const { delete: destroy, processing } = useForm();
    const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: number }>({ open: false, id: 0 });
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedScheduleId, setSelectedScheduleId] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [sortConfig, setSortConfig] = useState<{ key: SortKey | null; direction: 'asc' | 'desc' }>({ key: null, direction: 'asc' });

    const filteredItems = useMemo(() => {
        return assignments.filter((a) => {
            const q = searchQuery.toLowerCase();
            const appNum = (a.application_info?.application_number ?? '').toLowerCase();
            const name = `${a.application_info?.personal_data?.last_name ?? ''} ${a.application_info?.personal_data?.first_name ?? ''}`.toLowerCase();
            const matchesSearch = !q || appNum.includes(q) || name.includes(q);
            const matchesSchedule = !selectedScheduleId || String(a.exam_schedule?.id) === selectedScheduleId;
            const matchesStatus = !selectedStatus || a.status === selectedStatus;
            return matchesSearch && matchesSchedule && matchesStatus;
        });
    }, [assignments, searchQuery, selectedScheduleId, selectedStatus]);

    const sortedItems = useMemo(() => {
        if (!sortConfig.key) return filteredItems;
        return [...filteredItems].sort((a, b) => {
            let aVal = '';
            let bVal = '';
            if (sortConfig.key === 'application_number') { aVal = a.application_info?.application_number ?? ''; bVal = b.application_info?.application_number ?? ''; }
            else if (sortConfig.key === 'name') {
                aVal = `${a.application_info?.personal_data?.last_name ?? ''} ${a.application_info?.personal_data?.first_name ?? ''}`;
                bVal = `${b.application_info?.personal_data?.last_name ?? ''} ${b.application_info?.personal_data?.first_name ?? ''}`;
            } else if (sortConfig.key === 'schedule') { aVal = a.exam_schedule?.name ?? ''; bVal = b.exam_schedule?.name ?? ''; }
            else if (sortConfig.key === 'status') { aVal = a.status; bVal = b.status; }
            return aVal.localeCompare(bVal) * (sortConfig.direction === 'asc' ? 1 : -1);
        });
    }, [filteredItems, sortConfig]);

    const totalPages = Math.ceil(sortedItems.length / pageSize);
    const paginatedItems = useMemo(
        () => sortedItems.slice((currentPage - 1) * pageSize, currentPage * pageSize),
        [sortedItems, currentPage, pageSize],
    );

    const toggleSort = (key: SortKey) =>
        setSortConfig((prev) =>
            prev.key === key ? { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' } : { key, direction: 'asc' },
        );

    const SortIcon = ({ col }: { col: SortKey }) =>
        sortConfig.key !== col ? (
            <ChevronUp className="ml-1 inline h-3 w-3 opacity-30" />
        ) : sortConfig.direction === 'asc' ? (
            <ChevronUp className="ml-1 inline h-3 w-3" />
        ) : (
            <ChevronDown className="ml-1 inline h-3 w-3" />
        );

    const clearFilters = () => {
        setSearchQuery('');
        setSelectedScheduleId('');
        setSelectedStatus('');
        setCurrentPage(1);
    };

    const hasFilters = searchQuery || selectedScheduleId || selectedStatus;

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'assigned': return <Badge variant="outline">Assigned</Badge>;
            case 'confirmed': return <Badge className="bg-blue-100 text-blue-800">Confirmed</Badge>;
            case 'attended': return <Badge className="bg-green-100 text-green-800">Attended</Badge>;
            case 'absent': return <Badge variant="destructive">Absent</Badge>;
            case 'cancelled': return <Badge variant="secondary">Cancelled</Badge>;
            default: return <Badge variant="outline">{status}</Badge>;
        }
    };

    const confirmDelete = () => {
        destroy(`/exam-assignments/${deleteDialog.id}`, {
            onSuccess: () => setDeleteDialog({ open: false, id: 0 }),
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
                <div className="mb-6 rounded-lg border bg-white p-6 shadow-sm">
                    <div>
                        <label className="mb-1 block text-xs font-medium text-gray-600">Search</label>
                        <div className="mb-3 flex h-10 w-full items-center rounded-lg border border-gray-300 bg-white md:w-[400px]">
                            <span className="pl-3 pr-2 text-gray-500"><Search className="h-4 w-4" /></span>
                            <input
                                className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400"
                                placeholder="Search by application # or name..."
                                value={searchQuery}
                                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                            />
                        </div>
                    </div>
                    <div className="flex flex-wrap items-end gap-3">
                        <Select value={selectedScheduleId || 'all'} onValueChange={(v) => { setSelectedScheduleId(v === 'all' ? '' : v); setCurrentPage(1); }}>
                            <SelectTrigger className="w-56"><SelectValue placeholder="Schedule" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Schedules</SelectItem>
                                {schedules.map((s) => (
                                    <SelectItem key={s.id} value={String(s.id)}>
                                        {s.name} - {formatDate(s.exam_date)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select value={selectedStatus || 'all'} onValueChange={(v) => { setSelectedStatus(v === 'all' ? '' : v); setCurrentPage(1); }}>
                            <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="assigned">Assigned</SelectItem>
                                <SelectItem value="confirmed">Confirmed</SelectItem>
                                <SelectItem value="attended">Attended</SelectItem>
                                <SelectItem value="absent">Absent</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                        </Select>
                        {hasFilters && <Button variant="ghost" onClick={clearFilters}>Clear</Button>}
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
                    <div className="max-h-[70vh] overflow-x-auto overflow-y-auto">
                        <table className="w-full text-sm">
                            <thead className="sticky top-0 z-10 bg-gray-50">
                                <tr>
                                    <th className="cursor-pointer px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500" onClick={() => toggleSort('application_number')}>
                                        Application # <SortIcon col="application_number" />
                                    </th>
                                    <th className="cursor-pointer px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500" onClick={() => toggleSort('name')}>
                                        Applicant Name <SortIcon col="name" />
                                    </th>
                                    <th className="cursor-pointer px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500" onClick={() => toggleSort('schedule')}>
                                        Exam Schedule <SortIcon col="schedule" />
                                    </th>
                                    <th className="cursor-pointer px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500" onClick={() => toggleSort('status')}>
                                        Status <SortIcon col="status" />
                                    </th>
                                    <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedItems.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-12 text-center">
                                            <UserCheck className="mx-auto h-10 w-10 text-gray-300" />
                                            <p className="mt-2 text-gray-500">
                                                {hasFilters ? 'No assignments match your filters.' : 'No exam assignments found.'}
                                            </p>
                                        </td>
                                    </tr>
                                ) : paginatedItems.map((assignment) => (
                                    <tr key={assignment.id} className="border-b border-gray-200 transition-all hover:bg-slate-50">
                                        <td className="px-4 py-3 font-medium text-gray-900">
                                            {assignment.application_info?.application_number}
                                        </td>
                                        <td className="px-4 py-3">
                                            {assignment.application_info?.personal_data?.last_name},{' '}
                                            {assignment.application_info?.personal_data?.first_name}
                                        </td>
                                        <td className="px-4 py-3">
                                            <p className="font-medium text-gray-900">{assignment.exam_schedule?.name}</p>
                                            <p className="text-sm text-gray-500">
                                                {formatDate(assignment.exam_schedule?.exam_date)} •{' '}
                                                {assignment.exam_schedule?.examination_room?.name}
                                            </p>
                                        </td>
                                        <td className="px-4 py-3 text-center">{getStatusBadge(assignment.status)}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex justify-center gap-1">
                                                <Button
                                                    variant="ghost" size="sm"
                                                    onClick={() => setDeleteDialog({ open: true, id: assignment.id })}
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

                    {/* Pagination Bar */}
                    <div className="flex items-center justify-between border-t bg-white px-4 py-3">
                        <div className="flex items-center gap-3">
                            <span className="text-sm text-gray-700">Rows per page:</span>
                            <select
                                value={pageSize}
                                onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                                className="rounded-lg border border-gray-300 px-3 py-1 text-sm focus:outline-none"
                            >
                                <option value={5}>5</option>
                                <option value={10}>10</option>
                                <option value={25}>25</option>
                                <option value={50}>50</option>
                            </select>
                            <span className="text-sm text-gray-700">
                                {sortedItems.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}–{Math.min(currentPage * pageSize, sortedItems.length)} of {sortedItems.length}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40">
                                <ChevronsLeft className="h-4 w-4" />
                            </button>
                            <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40">
                                <ChevronLeft className="h-4 w-4" />
                            </button>
                            <span className="px-4 py-2 text-sm font-medium">Page {currentPage} of {totalPages || 1}</span>
                            <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages === 0} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40">
                                <ChevronRight className="h-4 w-4" />
                            </button>
                            <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages || totalPages === 0} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40">
                                <ChevronsRight className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                </div>
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
