import { ConfirmDialog } from '@/components/confirm-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TablePagination } from '@/components/ui/table-pagination';
import { BODY_TEXT, CARD, FILTER_CARD, LABEL_TEXT, PAGE_PADDING, PAGE_TITLE, TABLE_HEADER_CELL, TABLE_HEADER_CELL_CENTER, TABLE_ROW } from '@/constants/ui';
import { formatDate, useExamAssignments, type Assignment, type AssignmentSortKey, type Schedule } from '@/hooks/useExamAssignments';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { ChevronDown, ChevronUp, Plus, Search, ThumbsDown, ThumbsUp, Trash2, UserCheck } from 'lucide-react';

interface Props {
    assignments: Assignment[];
    schedules: Schedule[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Exam Assignments', href: '/admin/exam-assignments' },
];

function SortIcon({ col, sortConfig }: { col: AssignmentSortKey; sortConfig: { key: AssignmentSortKey | null; direction: 'asc' | 'desc' } }) {
    if (sortConfig.key !== col) return <ChevronUp className="ml-1 inline h-3 w-3 opacity-30" />;
    return sortConfig.direction === 'asc'
        ? <ChevronUp className="ml-1 inline h-3 w-3" />
        : <ChevronDown className="ml-1 inline h-3 w-3" />;
}

function getStatusBadge(status: string) {
    switch (status) {
        case 'assigned':  return <Badge variant="outline">Assigned</Badge>;
        case 'confirmed': return <Badge className="bg-blue-100 text-blue-800">Confirmed</Badge>;
        case 'attended':  return <Badge className="bg-yellow-100 text-yellow-800">Attended</Badge>;
        case 'passed':    return <Badge className="bg-green-100 text-green-800">Passed</Badge>;
        case 'failed':    return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
        case 'absent':    return <Badge variant="destructive">Absent</Badge>;
        case 'cancelled': return <Badge variant="secondary">Cancelled</Badge>;
        default:          return <Badge variant="outline">{status}</Badge>;
    }
}

interface AssignmentRowProps {
    assignment: Assignment;
    processing: boolean;
    onMarkResult: (id: number, result: 'passed' | 'failed') => void;
    onDelete: (id: number) => void;
}

function AssignmentRow({ assignment, processing, onMarkResult, onDelete }: AssignmentRowProps) {
    return (
        <tr className={TABLE_ROW}>
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
                    {assignment.status === 'attended' && (
                        <>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onMarkResult(assignment.id, 'passed')}
                                className="border-green-500 text-green-700 hover:bg-green-50"
                                title="Mark as Passed"
                            >
                                <ThumbsUp className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onMarkResult(assignment.id, 'failed')}
                                className="border-red-400 text-red-600 hover:bg-red-50"
                                title="Mark as Failed"
                            >
                                <ThumbsDown className="h-4 w-4" />
                            </Button>
                        </>
                    )}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(assignment.id)}
                        disabled={processing}
                        className="text-red-600 hover:text-red-700"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            </td>
        </tr>
    );
}

export default function Index({ assignments, schedules }: Props) {
    const {
        processing,
        deleteDialog,
        setDeleteDialog,
        searchQuery,
        setSearchQuery,
        selectedScheduleId,
        setSelectedScheduleId,
        selectedStatus,
        setSelectedStatus,
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
        markResult,
        confirmDelete,
    } = useExamAssignments(assignments);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Exam Assignments" />

            <div className={PAGE_PADDING}>
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className={PAGE_TITLE}>Exam Assignments</h1>
                        <p className={`mt-1 ${BODY_TEXT}`}>Manage applicant exam schedule assignments</p>
                    </div>
                    <Link href="/admin/exam-assignments/create">
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Assign Applicants
                        </Button>
                    </Link>
                </div>

                <div className={`mb-6 ${FILTER_CARD}`}>
                    <div className="mb-3">
                        <label className={`mb-1 block ${LABEL_TEXT}`}>Search</label>
                        <div className="relative w-full md:w-[400px]">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <Input
                                placeholder="Search by application # or name..."
                                value={searchQuery}
                                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                                className="pl-10"
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
                                <SelectItem value="passed">Passed</SelectItem>
                                <SelectItem value="failed">Failed</SelectItem>
                                <SelectItem value="absent">Absent</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                        </Select>
                        {hasFilters && <Button variant="ghost" onClick={clearFilters}>Clear</Button>}
                    </div>
                </div>

                <div className={`overflow-hidden ${CARD}`}>
                    <div className="max-h-[70vh] overflow-x-auto overflow-y-auto">
                        <table className="w-full text-sm">
                            <thead className="sticky top-0 z-10 bg-gray-50">
                                <tr>
                                    <th className={`${TABLE_HEADER_CELL} cursor-pointer hover:bg-gray-100`} onClick={() => toggleSort('application_number')}>
                                        Application # <SortIcon col="application_number" sortConfig={sortConfig} />
                                    </th>
                                    <th className={`${TABLE_HEADER_CELL} cursor-pointer hover:bg-gray-100`} onClick={() => toggleSort('name')}>
                                        Applicant Name <SortIcon col="name" sortConfig={sortConfig} />
                                    </th>
                                    <th className={`${TABLE_HEADER_CELL} cursor-pointer hover:bg-gray-100`} onClick={() => toggleSort('schedule')}>
                                        Exam Schedule <SortIcon col="schedule" sortConfig={sortConfig} />
                                    </th>
                                    <th className={`${TABLE_HEADER_CELL_CENTER} cursor-pointer hover:bg-gray-100`} onClick={() => toggleSort('status')}>
                                        Status <SortIcon col="status" sortConfig={sortConfig} />
                                    </th>
                                    <th className={TABLE_HEADER_CELL_CENTER}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedItems.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-12 text-center">
                                            <UserCheck className="mx-auto h-10 w-10 text-gray-300" />
                                            <p className={`mt-2 ${BODY_TEXT}`}>
                                                {hasFilters ? 'No assignments match your filters.' : 'No exam assignments found.'}
                                            </p>
                                        </td>
                                    </tr>
                                ) : paginatedItems.map((assignment) => (
                                    <AssignmentRow
                                        key={assignment.id}
                                        assignment={assignment}
                                        processing={processing}
                                        onMarkResult={markResult}
                                        onDelete={(id) => setDeleteDialog({ open: true, id })}
                                    />
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <TablePagination
                        total={sortedItems.length}
                        pageSize={pageSize}
                        currentPage={currentPage}
                        onPageChange={setCurrentPage}
                        onPageSizeChange={(s) => { setPageSize(s); setCurrentPage(1); }}
                    />
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
