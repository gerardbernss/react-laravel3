import { ConfirmDialog } from '@/components/confirm-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { ArrowLeft, Calendar, Clock, Edit, Loader2, MapPin, Search, Trash2, UserMinus, UserPlus, Users } from 'lucide-react';
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

interface Assignment {
    id: number;
    status: string;
    assigned_at: string;
    application_info: ApplicationInfo;
}

interface AvailableApplicant {
    id: number;
    application_number: string;
    application_status: string;
    first_name: string;
    last_name: string;
    middle_name: string | null;
    assigned_to_schedule: string | null;
}

interface Room {
    id: number;
    name: string;
    building: string | null;
    capacity: number;
    floor: string | null;
}

interface Schedule {
    id: number;
    name: string;
    exam_type: string;
    exam_date: string;
    start_time: string;
    end_time: string;
    examination_room_id: number;
    is_active: boolean;
    created_at: string;
    examination_room: Room;
    applicant_assignments: Assignment[];
}

interface Props {
    schedule: Schedule;
    availableApplicants: AvailableApplicant[];
}

const STATUS_BADGE: Record<string, React.ReactNode> = {
    assigned:  <Badge variant="outline">Assigned</Badge>,
    confirmed: <Badge className="bg-blue-100 text-blue-800">Confirmed</Badge>,
    attended:  <Badge className="bg-green-100 text-green-800">Attended</Badge>,
    absent:    <Badge variant="destructive">Absent</Badge>,
    cancelled: <Badge variant="secondary">Cancelled</Badge>,
};

function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-US', {
        weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
    });
}

function formatTime(time: string) {
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours);
    return `${h % 12 || 12}:${minutes} ${h >= 12 ? 'PM' : 'AM'}`;
}

export default function Show({ schedule, availableApplicants }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Exam Schedules', href: '/exam-schedules' },
        { title: schedule.name, href: `/exam-schedules/${schedule.id}` },
    ];

    const { delete: destroy, processing: deleting } = useForm();
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [removeDialog, setRemoveDialog] = useState<{ open: boolean; id: number; name: string }>({ open: false, id: 0, name: '' });

    // Assigned applicants table filters
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    // Assign dialog state
    const [assignOpen, setAssignOpen] = useState(false);
    const [modalSearch, setModalSearch] = useState('');
    const [selected, setSelected] = useState<number[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [assignError, setAssignError] = useState<string | null>(null);

    const confirmDelete = () => {
        destroy(`/exam-schedules/${schedule.id}`, {
            onSuccess: () => setShowDeleteDialog(false),
        });
    };

    const confirmRemove = () => {
        destroy(`/exam-assignments/${removeDialog.id}`, {
            onSuccess: () => setRemoveDialog({ open: false, id: 0, name: '' }),
        });
    };

    const effectiveCapacity = schedule.examination_room?.capacity || 0;
    const assignedCount = (schedule.applicant_assignments ?? []).filter((a) => a.status !== 'cancelled').length;
    const availableSlots = Math.max(0, effectiveCapacity - assignedCount);
    const capacityPct = effectiveCapacity > 0 ? Math.min(100, Math.round((assignedCount / effectiveCapacity) * 100)) : 0;

    // ── Assigned applicants table ──
    const filteredAssignments = useMemo(() => {
        return (schedule.applicant_assignments ?? []).filter((a) => {
            const q = search.toLowerCase();
            const num = (a.application_info?.application_number ?? '').toLowerCase();
            const name = `${a.application_info?.personal_data?.last_name ?? ''} ${a.application_info?.personal_data?.first_name ?? ''}`.toLowerCase();
            return (!q || num.includes(q) || name.includes(q)) &&
                   (!statusFilter || a.status === statusFilter);
        });
    }, [schedule.applicant_assignments, search, statusFilter]);

    // ── Assign dialog ──
    const filteredAvailable = useMemo(() => {
        const q = modalSearch.toLowerCase();
        if (!q) return availableApplicants;
        return availableApplicants.filter((a) =>
            a.application_number.toLowerCase().includes(q) ||
            `${a.last_name} ${a.first_name}`.toLowerCase().includes(q),
        );
    }, [availableApplicants, modalSearch]);

    const allSelected = filteredAvailable.length > 0 && filteredAvailable.every((a) => selected.includes(a.id));

    const toggleAll = () => {
        setAssignError(null);
        if (allSelected) {
            const filteredIds = new Set(filteredAvailable.map((a) => a.id));
            setSelected((prev) => prev.filter((id) => !filteredIds.has(id)));
        } else {
            setSelected((prev) => Array.from(new Set([...prev, ...filteredAvailable.map((a) => a.id)])));
        }
    };

    const toggle = (id: number) => {
        setAssignError(null);
        setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
    };

    const handleAssign = () => {
        if (selected.length === 0) return;

        const conflicts = availableApplicants.filter(
            (a) => selected.includes(a.id) && a.assigned_to_schedule,
        );

        if (conflicts.length > 0) {
            const names = conflicts
                .map((a) => `${a.last_name}, ${a.first_name} → ${a.assigned_to_schedule}`)
                .join('\n');
            setAssignError(
                `The following applicant${conflicts.length > 1 ? 's are' : ' is'} already assigned to another schedule:\n\n${names}\n\nRemove them from your selection before proceeding.`,
            );
            return;
        }

        setAssignError(null);
        setSubmitting(true);
        router.post(
            '/exam-assignments/bulk',
            { applicant_ids: selected, exam_schedule_id: schedule.id },
            {
                onSuccess: () => {
                    setAssignOpen(false);
                    setSelected([]);
                    setModalSearch('');
                    setAssignError(null);
                },
                onFinish: () => setSubmitting(false),
            },
        );
    };

    const openAssign = () => {
        setSelected([]);
        setModalSearch('');
        setAssignError(null);
        setAssignOpen(true);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={schedule.name} />

            <div className="p-6 md:p-10">
                {/* Back link */}
                <Link href="/exam-schedules" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900">
                    <ArrowLeft className="mr-1 h-4 w-4" />
                    Back to Schedules
                </Link>

                {/* Page header */}
                <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-bold text-gray-900">{schedule.name}</h1>
                        <Badge className={schedule.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}>
                            {schedule.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                        <Badge variant="outline">{schedule.exam_type}</Badge>
                    </div>
                    <div className="flex shrink-0 gap-2">
                        <Button onClick={openAssign} disabled={availableApplicants.length === 0}>
                            <UserPlus className="mr-2 h-4 w-4" />
                            Assign Applicants
                            {availableApplicants.length > 0 && (
                                <span className="ml-1.5 rounded-full bg-white/20 px-1.5 text-xs">
                                    {availableApplicants.length}
                                </span>
                            )}
                        </Button>
                        <Link href={`/exam-schedules/${schedule.id}/edit`}>
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

                {/* ── Schedule detail strip ── */}
                <div className="mt-4 rounded-lg border bg-white px-4 py-3 shadow-sm">
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
                                    className={`h-full rounded-full ${
                                        capacityPct >= 100 ? 'bg-red-500' : capacityPct >= 75 ? 'bg-amber-400' : 'bg-green-500'
                                    }`}
                                    style={{ width: `${capacityPct}%` }}
                                />
                            </div>
                            <span className="shrink-0 text-xs text-gray-400">{capacityPct}%</span>
                        </div>
                    </div>
                </div>

                {/* ── Assigned Applicants table ── */}
                <div className="mt-6 overflow-hidden rounded-lg border bg-white shadow-sm">
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
                                <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setStatusFilter(''); }}>
                                    Clear
                                </Button>
                            )}
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50">
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
                                    filteredAssignments.map((assignment, idx) => (
                                        <tr key={assignment.id} className="hover:bg-gray-50">
                                            <td className="px-5 py-3 text-gray-400">{idx + 1}</td>
                                            <td className="px-5 py-3 font-medium text-gray-900">
                                                {assignment.application_info?.application_number}
                                            </td>
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
                                                    month: 'short', day: 'numeric', year: 'numeric',
                                                })}
                                            </td>
                                            <td className="px-5 py-3 text-center">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-red-600 hover:bg-red-50 hover:text-red-700"
                                                    onClick={() => setRemoveDialog({
                                                        open: true,
                                                        id: assignment.id,
                                                        name: `${assignment.application_info?.personal_data?.last_name}, ${assignment.application_info?.personal_data?.first_name}`,
                                                    })}
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
                                            <p className="mt-2 text-gray-500">
                                                {search || statusFilter
                                                    ? 'No applicants match your filters.'
                                                    : 'No applicants assigned to this schedule yet.'}
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

                    {filteredAssignments.length > 0 && (
                        <div className="border-t px-5 py-3 text-sm text-gray-500">
                            Showing {filteredAssignments.length} of {schedule.applicant_assignments?.length ?? 0} assignment{schedule.applicant_assignments?.length !== 1 ? 's' : ''}
                        </div>
                    )}
                </div>
            </div>

            {/* ── Assign Applicants Dialog ── */}
            <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
                <DialogContent className="flex h-[90vh] w-[95vw] max-w-[95vw] flex-col gap-0 p-0">
                    <DialogHeader className="border-b px-6 py-4">
                        <DialogTitle className="flex items-center gap-2">
                            <UserPlus className="h-5 w-5" />
                            Assign Applicants
                            <span className="text-sm font-normal text-gray-500">— {schedule.name}</span>
                        </DialogTitle>
                    </DialogHeader>

                    {/* Search */}
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
                            {selected.length > 0 && (
                                <span className="font-medium text-primary">{selected.length} selected</span>
                            )}
                        </div>
                    </div>

                    {/* Table */}
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
                                    <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                        Application #
                                    </th>
                                    <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                        Name
                                    </th>
                                    <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                        Status
                                    </th>
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
                                                className={`cursor-pointer transition-colors ${
                                                    hasError
                                                        ? 'bg-red-50'
                                                        : checked
                                                          ? 'bg-primary/5'
                                                          : 'hover:bg-gray-50'
                                                }`}
                                            >
                                                <td className="px-4 py-2.5" onClick={(e) => e.stopPropagation()}>
                                                    <input
                                                        type="checkbox"
                                                        checked={checked}
                                                        onChange={() => toggle(applicant.id)}
                                                        className="h-4 w-4 rounded border-gray-300 accent-primary"
                                                    />
                                                </td>
                                                <td className="px-4 py-2.5 font-medium text-gray-900">
                                                    {applicant.application_number}
                                                </td>
                                                <td className="px-4 py-2.5 text-gray-900">
                                                    <span>{applicant.last_name}, {applicant.first_name}{applicant.middle_name && ` ${applicant.middle_name.charAt(0)}.`}</span>
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
                                        <li key={i} className="text-xs text-red-600">• {line}</li>
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
