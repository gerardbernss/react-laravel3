import { ConfirmDialog } from '@/components/confirm-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import { Calendar, CalendarClock, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, CircleDot } from 'lucide-react';
import { useMemo, useState } from 'react';

interface EnrollmentPeriod {
    id: number;
    school_year: string;
    semester: string;
    is_open: boolean;
    status: 'open' | 'upcoming' | 'expired' | 'closed';
    start_date: string | null;
    close_date: string | null;
    opened_at: string | null;
    closed_at: string | null;
    notes: string | null;
}

interface Props {
    periods: EnrollmentPeriod[];
    semesters: string[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Enrollment Periods', href: '/enrollment-periods' },
];

function StatusBadge({ status }: { status: EnrollmentPeriod['status'] }) {
    if (status === 'open') {
        return (
            <Badge className="gap-1 bg-green-100 text-green-800 hover:bg-green-100">
                <CircleDot className="h-3 w-3" />
                Open
            </Badge>
        );
    }
    if (status === 'upcoming') {
        return (
            <Badge className="gap-1 bg-blue-100 text-blue-800 hover:bg-blue-100">
                <CircleDot className="h-3 w-3" />
                Upcoming
            </Badge>
        );
    }
    if (status === 'expired') {
        return (
            <Badge className="gap-1 bg-amber-100 text-amber-800 hover:bg-amber-100">
                <CircleDot className="h-3 w-3" />
                Expired
            </Badge>
        );
    }
    return (
        <Badge className="gap-1 bg-gray-100 text-gray-600 hover:bg-gray-100">
            <CircleDot className="h-3 w-3" />
            Closed
        </Badge>
    );
}

function formatDate(date: string | null) {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function Index({ periods, semesters }: Props) {
    // Start Enrollment dialog (header — creates + opens a new period)
    const [showStartDialog, setShowStartDialog] = useState(false);
    const startForm = useForm({ school_year: '', semester: '', start_date: '', close_date: '', notes: '' });

    // Re-open dialog (per-row — opens an existing closed/expired period)
    const [openDialog, setOpenDialog] = useState<EnrollmentPeriod | null>(null);
    const openForm = useForm({ start_date: '', close_date: '', notes: '' });

    // Edit (extend) dialog
    const [editDialog, setEditDialog] = useState<EnrollmentPeriod | null>(null);
    const editForm = useForm({ close_date: '', notes: '' });

    // Close confirm
    const [closeDialog, setCloseDialog] = useState<EnrollmentPeriod | null>(null);
    const { processing: closingPeriod, post: postClose } = useForm();

    // Delete confirm
    const [deleteDialog, setDeleteDialog] = useState<EnrollmentPeriod | null>(null);
    const { processing: deletingPeriod, delete: destroyPeriod } = useForm();

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const totalPages = Math.ceil(periods.length / pageSize);
    const paginatedPeriods = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return periods.slice(start, start + pageSize);
    }, [periods, currentPage, pageSize]);

    const handleStart = (e: React.FormEvent) => {
        e.preventDefault();
        startForm.post('/enrollment-periods', {
            onSuccess: () => {
                startForm.reset();
                setShowStartDialog(false);
            },
        });
    };

    const handleOpenEnrollment = (e: React.FormEvent) => {
        e.preventDefault();
        if (!openDialog) return;
        openForm.post(`/enrollment-periods/${openDialog.id}/open`, {
            onSuccess: () => {
                openForm.reset();
                setOpenDialog(null);
            },
        });
    };

    const handleEditOpen = (period: EnrollmentPeriod) => {
        editForm.setData({ close_date: period.close_date ?? '', notes: period.notes ?? '' });
        setEditDialog(period);
    };

    const handleUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editDialog) return;
        editForm.put(`/enrollment-periods/${editDialog.id}`, {
            onSuccess: () => {
                editForm.reset();
                setEditDialog(null);
            },
        });
    };

    const handleClose = () => {
        if (!closeDialog) return;
        postClose(`/enrollment-periods/${closeDialog.id}/close`, {
            onSuccess: () => setCloseDialog(null),
        });
    };

    const handleDelete = () => {
        if (!deleteDialog) return;
        destroyPeriod(`/enrollment-periods/${deleteDialog.id}`, {
            onSuccess: () => setDeleteDialog(null),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Enrollment Periods" />

            <div className="p-6 md:p-10">
                {/* Header */}
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-3">
                            <CalendarClock className="h-7 w-7 text-primary" />
                            <h1 className="text-3xl font-bold text-gray-900">Enrollment Periods</h1>
                        </div>
                    </div>
                    <Button onClick={() => setShowStartDialog(true)} className="gap-2 bg-green-600 hover:bg-green-700">
                        <Calendar className="h-4 w-4" />
                        Start Enrollment
                    </Button>
                </div>

                {/* Table */}
                <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-gray-50">
                                <TableHead className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-500">School Year</TableHead>
                                <TableHead className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-500">Semester</TableHead>
                                <TableHead className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-500">Status</TableHead>
                                <TableHead className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-500">Start Date</TableHead>
                                <TableHead className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-500">End Date</TableHead>
                                <TableHead className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-500">Notes</TableHead>
                                <TableHead className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {periods.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={7} className="py-12 text-center text-gray-500">
                                        <CalendarClock className="mx-auto mb-3 h-10 w-10 text-gray-300" />
                                        <p>No enrollment periods yet.</p>
                                        <p className="text-sm">Click "Start Enrollment" to begin.</p>
                                    </TableCell>
                                </TableRow>
                            )}
                            {paginatedPeriods.map((period) => (
                                <TableRow key={period.id}>
                                    <TableCell className="font-medium">{period.school_year}</TableCell>
                                    <TableCell>{period.semester}</TableCell>
                                    <TableCell>
                                        <StatusBadge status={period.status} />
                                    </TableCell>
                                    <TableCell>{formatDate(period.start_date)}</TableCell>
                                    <TableCell>{formatDate(period.close_date)}</TableCell>
                                    <TableCell className="max-w-[200px] truncate text-sm text-gray-500">
                                        {period.notes ?? '—'}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex justify-end gap-2">
                                            {/* Edit (extend close date) — always available */}
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleEditOpen(period)}
                                            >
                                                Edit
                                            </Button>

                                            {/* Start Enrollment / Close toggle */}
                                            {period.status !== 'open' && period.status !== 'upcoming' ? (
                                                <Button
                                                    size="sm"
                                                    className="bg-green-600 hover:bg-green-700"
                                                    onClick={() => {
                                                        openForm.setData({
                                                            start_date: '',
                                                            close_date: '',
                                                            notes: period.notes ?? '',
                                                        });
                                                        setOpenDialog(period);
                                                    }}
                                                >
                                                    Start Enrollment
                                                </Button>
                                            ) : (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="border-amber-300 text-amber-700 hover:bg-amber-50"
                                                    onClick={() => setCloseDialog(period)}
                                                >
                                                    Close
                                                </Button>
                                            )}

                                            {/* Delete — only when closed */}
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-40"
                                                disabled={period.is_open}
                                                onClick={() => !period.is_open && setDeleteDialog(period)}
                                            >
                                                Delete
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    {periods.length > 0 && (
                        <div className="flex items-center justify-between border-t bg-white px-4 py-3">
                            <div className="flex items-center gap-3">
                                <span className="text-sm text-gray-700">Rows per page:</span>
                                <select
                                    value={pageSize}
                                    onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                                    className="rounded-md border border-gray-300 px-3 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                >
                                    <option value={5}>5</option>
                                    <option value={10}>10</option>
                                    <option value={25}>25</option>
                                    <option value={50}>50</option>
                                </select>
                                <span className="text-sm text-gray-600">
                                    {periods.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}–
                                    {Math.min(currentPage * pageSize, periods.length)} of {periods.length}
                                </span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Button variant="outline" size="sm" onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>
                                    <ChevronsLeft className="h-4 w-4" />
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <span className="px-3 py-1 text-sm">Page {currentPage} of {totalPages || 1}</span>
                                <Button variant="outline" size="sm" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages === 0}>
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages || totalPages === 0}>
                                    <ChevronsRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Start Enrollment Dialog (header — new period) */}
            {showStartDialog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
                        <div className="mb-4 flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-green-600" />
                            <h2 className="text-lg font-semibold">Start Enrollment</h2>
                        </div>
                        <p className="mb-4 text-sm text-gray-500">
                            Set the school year, semester, and enrollment window. Students can enroll between the start and end dates.
                        </p>
                        <form onSubmit={handleStart} className="space-y-4">
                            <div>
                                <Label htmlFor="start_school_year" className="mb-1 block">
                                    School Year <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="start_school_year"
                                    placeholder="e.g. 2025-2026"
                                    value={startForm.data.school_year}
                                    onChange={(e) => startForm.setData('school_year', e.target.value)}
                                />
                                {startForm.errors.school_year && (
                                    <p className="mt-1 text-xs text-red-600">{startForm.errors.school_year}</p>
                                )}
                            </div>
                            <div>
                                <Label htmlFor="start_semester" className="mb-1 block">
                                    Semester <span className="text-red-500">*</span>
                                </Label>
                                <Select
                                    value={startForm.data.semester}
                                    onValueChange={(v) => startForm.setData('semester', v)}
                                >
                                    <SelectTrigger id="start_semester">
                                        <SelectValue placeholder="Select semester" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {semesters.map((s) => (
                                            <SelectItem key={s} value={s}>
                                                {s}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {startForm.errors.semester && (
                                    <p className="mt-1 text-xs text-red-600">{startForm.errors.semester}</p>
                                )}
                            </div>
                            <div>
                                <Label htmlFor="start_start_date" className="mb-1 block">
                                    Enrollment Start Date <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="start_start_date"
                                    type="date"
                                    value={startForm.data.start_date}
                                    onChange={(e) => startForm.setData('start_date', e.target.value)}
                                />
                                {startForm.errors.start_date && (
                                    <p className="mt-1 text-xs text-red-600">{startForm.errors.start_date}</p>
                                )}
                            </div>
                            <div>
                                <Label htmlFor="start_close_date" className="mb-1 block">
                                    Enrollment End Date <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="start_close_date"
                                    type="date"
                                    min={startForm.data.start_date || undefined}
                                    value={startForm.data.close_date}
                                    onChange={(e) => startForm.setData('close_date', e.target.value)}
                                />
                                {startForm.errors.close_date && (
                                    <p className="mt-1 text-xs text-red-600">{startForm.errors.close_date}</p>
                                )}
                            </div>
                            <div>
                                <Label htmlFor="start_notes" className="mb-1 block">
                                    Notes (optional)
                                </Label>
                                <textarea
                                    id="start_notes"
                                    rows={2}
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    value={startForm.data.notes}
                                    onChange={(e) => startForm.setData('notes', e.target.value)}
                                />
                            </div>
                            {(startForm.errors as Record<string, string>).error && (
                                <p className="text-sm text-red-600">{(startForm.errors as Record<string, string>).error}</p>
                            )}
                            <div className="flex justify-end gap-2 pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => { setShowStartDialog(false); startForm.reset(); }}
                                    disabled={startForm.processing}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    className="bg-green-600 hover:bg-green-700"
                                    disabled={startForm.processing}
                                >
                                    {startForm.processing ? 'Starting...' : 'Start Enrollment'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Re-open Enrollment Dialog (per-row — existing period) */}
            {openDialog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
                        <div className="mb-4 flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-green-600" />
                            <h2 className="text-lg font-semibold">Start Enrollment</h2>
                        </div>
                        <p className="mb-4 text-sm text-gray-500">
                            Set the enrollment window for{' '}
                            <span className="font-medium text-gray-900">
                                {openDialog.school_year} — {openDialog.semester}
                            </span>
                            . Students can enroll between the start and end dates.
                        </p>
                        <form onSubmit={handleOpenEnrollment} className="space-y-4">
                            <div>
                                <Label htmlFor="open_start_date" className="mb-1 block">
                                    Enrollment Start Date <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="open_start_date"
                                    type="date"
                                    value={openForm.data.start_date}
                                    onChange={(e) => openForm.setData('start_date', e.target.value)}
                                />
                                {openForm.errors.start_date && (
                                    <p className="mt-1 text-xs text-red-600">{openForm.errors.start_date}</p>
                                )}
                            </div>
                            <div>
                                <Label htmlFor="open_close_date" className="mb-1 block">
                                    Enrollment End Date <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="open_close_date"
                                    type="date"
                                    min={openForm.data.start_date || undefined}
                                    value={openForm.data.close_date}
                                    onChange={(e) => openForm.setData('close_date', e.target.value)}
                                />
                                {openForm.errors.close_date && (
                                    <p className="mt-1 text-xs text-red-600">{openForm.errors.close_date}</p>
                                )}
                            </div>
                            <div>
                                <Label htmlFor="open_notes" className="mb-1 block">
                                    Notes (optional)
                                </Label>
                                <textarea
                                    id="open_notes"
                                    rows={2}
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    value={openForm.data.notes}
                                    onChange={(e) => openForm.setData('notes', e.target.value)}
                                />
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setOpenDialog(null)}
                                    disabled={openForm.processing}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    className="bg-green-600 hover:bg-green-700"
                                    disabled={openForm.processing}
                                >
                                    {openForm.processing ? 'Starting...' : 'Start Enrollment'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit (Extend) Dialog */}
            {editDialog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
                        <div className="mb-4 flex items-center gap-2">
                            <CalendarClock className="h-5 w-5 text-blue-600" />
                            <h2 className="text-lg font-semibold">Edit Enrollment Period</h2>
                        </div>
                        <p className="mb-4 text-sm text-gray-500">
                            Editing{' '}
                            <span className="font-medium text-gray-900">
                                {editDialog.school_year} — {editDialog.semester}
                            </span>
                            . Extend the end date to allow more time for enrollment.
                        </p>
                        <form onSubmit={handleUpdate} className="space-y-4">
                            <div>
                                <Label htmlFor="edit_close_date" className="mb-1 block">
                                    End Date <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="edit_close_date"
                                    type="date"
                                    value={editForm.data.close_date}
                                    onChange={(e) => editForm.setData('close_date', e.target.value)}
                                />
                                {editForm.errors.close_date && (
                                    <p className="mt-1 text-xs text-red-600">{editForm.errors.close_date}</p>
                                )}
                            </div>
                            <div>
                                <Label htmlFor="edit_notes" className="mb-1 block">
                                    Notes (optional)
                                </Label>
                                <textarea
                                    id="edit_notes"
                                    rows={2}
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    value={editForm.data.notes}
                                    onChange={(e) => editForm.setData('notes', e.target.value)}
                                />
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setEditDialog(null)}
                                    disabled={editForm.processing}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={editForm.processing}>
                                    {editForm.processing ? 'Saving...' : 'Save Changes'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Close Confirm */}
            <ConfirmDialog
                open={!!closeDialog}
                onClose={() => setCloseDialog(null)}
                onConfirm={handleClose}
                title="Close Enrollment?"
                description={`This will immediately close enrollment for ${closeDialog?.school_year} — ${closeDialog?.semester}. Students will no longer be able to enroll.`}
                confirmLabel="Close Enrollment"
                processingLabel="Closing..."
                processing={closingPeriod}
                variant="warning"
            />

            {/* Delete Confirm */}
            <ConfirmDialog
                open={!!deleteDialog}
                onClose={() => setDeleteDialog(null)}
                onConfirm={handleDelete}
                title="Delete Enrollment Period?"
                description={`This will permanently delete the enrollment period for ${deleteDialog?.school_year} — ${deleteDialog?.semester}. This action cannot be undone.`}
                confirmLabel="Delete"
                processingLabel="Deleting..."
                processing={deletingPeriod}
                variant="destructive"
            />
        </AppLayout>
    );
}
