import { AppBadge } from '@/components/AppBadge';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { TablePagination } from '@/components/ui/table-pagination';
import { BODY_TEXT, CARD, PAGE_PADDING, PAGE_TITLE } from '@/constants/ui';
import { type AvailableApplicant, type Schedule, useExamScheduleShow } from '@/hooks/useExamScheduleShow';
import AppLayout from '@/layouts/app-layout';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Calendar, Clock, Edit, Loader2, MapPin, Search, Trash2, UserMinus, UserPlus, Users } from 'lucide-react';
import { type ReactNode } from 'react';

interface Props {
    schedule: Schedule;
    availableApplicants: AvailableApplicant[];
}

const STATUS_BADGE: Record<string, ReactNode> = {
    assigned: <Badge variant="outline">Assigned</Badge>,
    confirmed: <Badge className="bg-blue-100 text-blue-800">Confirmed</Badge>,
    attended: <Badge className="bg-green-100 text-green-800">Attended</Badge>,
    absent: <Badge variant="destructive">Absent</Badge>,
    cancelled: <Badge variant="secondary">Cancelled</Badge>,
};

function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

function formatTime(time: string) {
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours);
    return `${h % 12 || 12}:${minutes} ${h >= 12 ? 'PM' : 'AM'}`;
}

export default function Show({ schedule, availableApplicants }: Props) {
    const {
        breadcrumbs,
        deleting,
        showDeleteDialog, setShowDeleteDialog,
        removeDialog, setRemoveDialog,
        search, setSearch,
        statusFilter, setStatusFilter,
        currentPage, setCurrentPage,
        pageSize, setPageSize,
        assignOpen, setAssignOpen,
        modalSearch, setModalSearch,
        selected,
        submitting,
        assignError,
        effectiveCapacity,
        assignedCount,
        availableSlots,
        capacityPct,
        filteredAssignments,
        paginatedAssignments,
        filteredAvailable,
        allSelected,
        confirmDelete,
        confirmRemove,
        toggleAll,
        toggle,
        handleAssign,
        openAssign,
    } = useExamScheduleShow({ schedule, availableApplicants });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={schedule.name} />

            <div className={PAGE_PADDING}>
                <Link href="/admin/exam-schedules" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900">
                    <ArrowLeft className="mr-1 h-4 w-4" />
                    Back to Schedules
                </Link>

                <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-center gap-3">
                        <h1 className={PAGE_TITLE}>{schedule.name}</h1>
                        <AppBadge status={schedule.is_active ? 'active' : 'inactive'}>
                            {schedule.is_active ? 'Active' : 'Inactive'}
                        </AppBadge>
                        <Badge variant="outline">{schedule.exam_type}</Badge>
                    </div>
                    <div className="flex shrink-0 gap-2">
                        <Button onClick={openAssign} disabled={availableApplicants.length === 0}>
                            <UserPlus className="mr-2 h-4 w-4" />
                            Assign Applicants
                            {availableApplicants.length > 0 && (
                                <span className="ml-1.5 rounded-full bg-white/20 px-1.5 text-xs">{availableApplicants.length}</span>
                            )}
                        </Button>
                        <Link href={`/admin/exam-schedules/${schedule.id}/edit`}>
                            <Button variant="outline">
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                            </Button>
                        </Link>
                        <Button variant="destructive" onClick={() => setShowDeleteDialog(true)} disabled={deleting}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                        </Button>
                    </div>
                </div>

                <div className={`mt-4 ${CARD} px-4 py-3`}>
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                        <div className="flex items-center gap-1.5 text-gray-600">
                            <Calendar className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                            {formatDate(schedule.exam_date)}
                        </div>
                        <div className="flex items-center gap-1.5 text-gray-600">
                            <Clock className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                            {formatTime(schedule.start_time)} – {formatTime(schedule.end_time)}
                        </div>
                        <div className="flex items-center gap-1.5 text-gray-600">
                            <MapPin className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                            {schedule.examination_room?.name}
                            {schedule.examination_room?.building && (
                                <span className="text-gray-400"> · {schedule.examination_room.building}</span>
                            )}
                        </div>
                        <div className="flex items-center gap-1.5 text-gray-600">
                            <Users className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                            {assignedCount}/{effectiveCapacity} assigned
                            <span className="text-gray-400">({availableSlots} open)</span>
                        </div>
                        <div className="flex min-w-[100px] flex-1 items-center gap-2">
                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
                                <div
                                    className={`h-full rounded-full ${capacityPct >= 100 ? 'bg-red-500' : capacityPct >= 75 ? 'bg-amber-400' : 'bg-green-500'}`}
                                    style={{ width: `${capacityPct}%` }}
                                />
                            </div>
                            <span className="shrink-0 text-xs text-gray-400">{capacityPct}%</span>
                        </div>
                    </div>
                </div>

                <div className={`mt-6 overflow-hidden ${CARD}`}>
                    <div className="flex flex-col gap-3 border-b px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                        <h2 className="flex items-center gap-2 font-semibold text-gray-900">
                            <Users className="h-4 w-4" />
                            Assigned Applicants
                            <span className="text-sm font-normal text-gray-500">({assignedCount})</span>
                        </h2>
                        <div className="flex flex-wrap gap-2">
                            <input
                                type="text"
                                placeholder="Search by name or app #…"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="h-9 rounded-lg border border-gray-300 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="h-9 rounded-lg border border-gray-300 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                            >
                                <option value="">All Statuses</option>
                                <option value="assigned">Assigned</option>
                                <option value="confirmed">Confirmed</option>
                                <option value="attended">Attended</option>
                                <option value="absent">Absent</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                            {(search || statusFilter) && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        setSearch('');
                                        setStatusFilter('');
                                    }}
                                >
                                    Clear
                                </Button>
                            )}
                        </div>
                    </div>

                    <div className="max-h-[70vh] overflow-x-auto overflow-y-auto">
                        <table className="w-full text-sm">
                            <thead className="sticky top-0 z-10 bg-gray-50">
                                <tr>
                                    <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">#</th>
                                    <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Application #</th>
                                    <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Name</th>
                                    <th className="px-5 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
                                    <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Assigned At</th>
                                    <th className="px-5 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredAssignments.length > 0 ? (
                                    paginatedAssignments.map((assignment, idx) => (
                                        <tr key={assignment.id} className="hover:bg-gray-50">
                                            <td className="px-5 py-3 text-gray-400">{idx + 1}</td>
                                            <td className="px-5 py-3 font-medium text-gray-900">{assignment.application_info?.application_number}</td>
                                            <td className="px-5 py-3 text-gray-900">
                                                {assignment.application_info?.personal_data?.last_name},{' '}
                                                {assignment.application_info?.personal_data?.first_name}
                                                {assignment.application_info?.personal_data?.middle_name &&
                                                    ` ${assignment.application_info.personal_data.middle_name.charAt(0)}.`}
                                            </td>
                                            <td className="px-5 py-3 text-center">
                                                {STATUS_BADGE[assignment.status] ?? <Badge variant="outline">{assignment.status}</Badge>}
                                            </td>
                                            <td className="px-5 py-3 text-gray-500">
                                                {new Date(assignment.assigned_at).toLocaleDateString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    year: 'numeric',
                                                })}
                                            </td>
                                            <td className="px-5 py-3 text-center">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-red-600 hover:bg-red-50 hover:text-red-700"
                                                    onClick={() =>
                                                        setRemoveDialog({
                                                            open: true,
                                                            id: assignment.id,
                                                            name: `${assignment.application_info?.personal_data?.last_name}, ${assignment.application_info?.personal_data?.first_name}`,
                                                        })
                                                    }
                                                >
                                                    <UserMinus className="h-4 w-4" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="px-5 py-14 text-center">
                                            <Users className="mx-auto h-10 w-10 text-gray-300" />
                                            <p className={`mt-2 ${BODY_TEXT}`}>
                                                {search || statusFilter ? 'No applicants match your filters.' : 'No applicants assigned to this schedule yet.'}
                                            </p>
                                            {!search && !statusFilter && (
                                                <Button size="sm" className="mt-4" onClick={openAssign} disabled={availableApplicants.length === 0}>
                                                    <UserPlus className="mr-2 h-4 w-4" />
                                                    Assign Applicants
                                                </Button>
                                            )}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <TablePagination
                        total={filteredAssignments.length}
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

            <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
                <DialogContent className="flex h-[90vh] w-[95vw] max-w-[95vw] flex-col gap-0 p-0">
                    <DialogHeader className="border-b px-6 py-4">
                        <DialogTitle className="flex items-center gap-2">
                            <UserPlus className="h-5 w-5" />
                            Assign Applicants
                            <span className="text-sm font-normal text-gray-500">— {schedule.name}</span>
                        </DialogTitle>
                    </DialogHeader>

                    <div className="border-b px-6 py-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by name or application #…"
                                value={modalSearch}
                                onChange={(e) => setModalSearch(e.target.value)}
                                className="h-9 w-full rounded-lg border border-gray-300 pl-9 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                                autoFocus
                            />
                        </div>
                        <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                            <span>
                                {filteredAvailable.length} applicant{filteredAvailable.length !== 1 ? 's' : ''} available
                            </span>
                            {selected.length > 0 && <span className="font-medium text-primary">{selected.length} selected</span>}
                        </div>
                    </div>

                    <div className="min-h-0 flex-1 overflow-y-auto">
                        <table className="w-full text-sm">
                            <thead className="sticky top-0 bg-gray-50">
                                <tr>
                                    <th className="w-10 px-4 py-2.5">
                                        <input
                                            type="checkbox"
                                            checked={allSelected}
                                            onChange={toggleAll}
                                            disabled={filteredAvailable.length === 0}
                                            className="h-4 w-4 rounded border-gray-300 accent-primary"
                                        />
                                    </th>
                                    <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Application #</th>
                                    <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Name</th>
                                    <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredAvailable.length > 0 ? (
                                    filteredAvailable.map((applicant) => {
                                        const checked = selected.includes(applicant.id);
                                        const conflict = applicant.assigned_to_schedule;
                                        const hasError = !!assignError && checked && !!conflict;
                                        return (
                                            <tr
                                                key={applicant.id}
                                                onClick={() => toggle(applicant.id)}
                                                className={`cursor-pointer transition-colors ${hasError ? 'bg-red-50' : checked ? 'bg-primary/5' : 'hover:bg-gray-50'}`}
                                            >
                                                <td className="px-4 py-2.5" onClick={(e) => e.stopPropagation()}>
                                                    <input
                                                        type="checkbox"
                                                        checked={checked}
                                                        onChange={() => toggle(applicant.id)}
                                                        className="h-4 w-4 rounded border-gray-300 accent-primary"
                                                    />
                                                </td>
                                                <td className="px-4 py-2.5 font-medium text-gray-900">{applicant.application_number}</td>
                                                <td className="px-4 py-2.5 text-gray-900">
                                                    <span>
                                                        {applicant.last_name}, {applicant.first_name}
                                                        {applicant.middle_name && ` ${applicant.middle_name.charAt(0)}.`}
                                                    </span>
                                                    {conflict && (
                                                        <span className="ml-2 inline-flex items-center gap-1 rounded-md bg-amber-50 px-1.5 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-amber-200">
                                                            ⚠ {conflict}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-2.5">
                                                    <Badge variant="outline" className="text-xs">
                                                        {applicant.application_status}
                                                    </Badge>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={4} className="px-4 py-10 text-center text-gray-500">
                                            {modalSearch ? 'No applicants match your search.' : 'No applicants available for assignment.'}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {assignError && (
                        <div className="border-t border-red-100 bg-red-50 px-6 py-3">
                            <p className="text-sm font-medium text-red-700">Cannot assign — schedule conflict</p>
                            <ul className="mt-1 space-y-0.5">
                                {assignError
                                    .split('\n')
                                    .filter((l) => l.includes('→'))
                                    .map((line, i) => (
                                        <li key={i} className="text-xs text-red-600">
                                            • {line}
                                        </li>
                                    ))}
                            </ul>
                            <p className="mt-1.5 text-xs text-red-500">Uncheck the highlighted applicants to proceed.</p>
                        </div>
                    )}

                    <DialogFooter className="border-t px-6 py-4">
                        <Button variant="outline" onClick={() => setAssignOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleAssign} disabled={selected.length === 0 || submitting}>
                            {submitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Assigning…
                                </>
                            ) : (
                                <>
                                    <UserPlus className="mr-2 h-4 w-4" />
                                    Assign {selected.length > 0 ? `${selected.length} Applicant${selected.length !== 1 ? 's' : ''}` : 'Applicants'}
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={showDeleteDialog}
                onClose={() => setShowDeleteDialog(false)}
                onConfirm={confirmDelete}
                title="Delete Exam Schedule"
                description={`Are you sure you want to delete "${schedule.name}"? This action cannot be undone.`}
                confirmLabel="Delete"
                processingLabel="Deleting..."
                processing={deleting}
            />

            <ConfirmDialog
                open={removeDialog.open}
                onClose={() => setRemoveDialog({ open: false, id: 0, name: '' })}
                onConfirm={confirmRemove}
                title="Remove Applicant"
                description={`Remove "${removeDialog.name}" from this exam schedule? This action cannot be undone.`}
                confirmLabel="Remove"
                processingLabel="Removing..."
                processing={deleting}
            />
        </AppLayout>
    );
}
