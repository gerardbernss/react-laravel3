import { ConfirmDialog } from '@/components/confirm-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TablePagination } from '@/components/ui/table-pagination';
import { BODY_TEXT, CARD, LABEL_TEXT, PAGE_PADDING, PAGE_TITLE, TABLE_HEADER_CELL, TABLE_ROW_ACTION, TABLE_ROW_ACTION_DANGER } from '@/constants/ui';
import { useEnrollmentPeriods, type EnrollmentPeriod } from '@/hooks/useEnrollmentPeriods';
import { getSchoolYearOptions } from '@/lib/school-year';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { Calendar, CalendarClock, CircleDot, Pencil, Trash2 } from 'lucide-react';

interface Props {
    periods: EnrollmentPeriod[];
    semesters: string[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Enrollment Periods', href: '/admin/enrollment-periods' },
];

function StatusBadge({ status }: { status: EnrollmentPeriod['status'] }) {
    const configs: Record<EnrollmentPeriod['status'], { color: string; label: string }> = {
        open:     { color: 'bg-green-100 text-green-800 hover:bg-green-100', label: 'Open' },
        upcoming: { color: 'bg-blue-100 text-blue-800 hover:bg-blue-100',   label: 'Upcoming' },
        expired:  { color: 'bg-amber-100 text-amber-800 hover:bg-amber-100', label: 'Expired' },
        closed:   { color: 'bg-gray-100 text-gray-600 hover:bg-gray-100',   label: 'Closed' },
    };
    const { color, label } = configs[status];
    return (
        <Badge className={`gap-1 ${color}`}>
            <CircleDot className="h-3 w-3" />
            {label}
        </Badge>
    );
}

function formatDate(date: string | null) {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });
}

interface StartDialogProps {
    show: boolean;
    onClose: () => void;
    form: ReturnType<typeof useEnrollmentPeriods>['startForm'];
    semesters: string[];
    onSubmit: (e: React.FormEvent) => void;
}

function StartEnrollmentDialog({ show, onClose, form, semesters, onSubmit }: StartDialogProps) {
    if (!show) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
                <div className="mb-4 flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-green-600" />
                    <h2 className="text-lg font-semibold">Start Enrollment</h2>
                </div>
                <p className={`mb-4 ${BODY_TEXT}`}>
                    Set the school year, semester, and enrollment window. Students can enroll between the start and end dates.
                </p>
                <form onSubmit={onSubmit} className="space-y-4">
                    <div>
                        <Label htmlFor="start_school_year" className={`mb-1 block ${LABEL_TEXT}`}>School Year <span className="text-red-500">*</span></Label>
                        <Select value={form.data.school_year} onValueChange={(v) => form.setData('school_year', v)}>
                            <SelectTrigger id="start_school_year"><SelectValue placeholder="Select school year" /></SelectTrigger>
                            <SelectContent>
                                {getSchoolYearOptions().map((y) => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        {form.errors.school_year && <p className="mt-1 text-xs text-red-600">{form.errors.school_year}</p>}
                    </div>
                    <div>
                        <Label htmlFor="start_semester" className={`mb-1 block ${LABEL_TEXT}`}>Semester <span className="text-red-500">*</span></Label>
                        <Select value={form.data.semester} onValueChange={(v) => form.setData('semester', v)}>
                            <SelectTrigger id="start_semester"><SelectValue placeholder="Select semester" /></SelectTrigger>
                            <SelectContent>
                                {semesters.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        {form.errors.semester && <p className="mt-1 text-xs text-red-600">{form.errors.semester}</p>}
                    </div>
                    <div>
                        <Label htmlFor="start_type" className={`mb-1 block ${LABEL_TEXT}`}>Period Type <span className="text-red-500">*</span></Label>
                        <Select value={form.data.type} onValueChange={(v) => form.setData('type', v as 'student' | 'applicant' | 'application')}>
                            <SelectTrigger id="start_type"><SelectValue placeholder="Select type" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="application">Application Period (accepting new applicants)</SelectItem>
                                <SelectItem value="applicant">Applicant Enrollment (for passed applicants)</SelectItem>
                                <SelectItem value="student">Student Enrollment (returning students)</SelectItem>
                            </SelectContent>
                        </Select>
                        {form.errors.type && <p className="mt-1 text-xs text-red-600">{form.errors.type}</p>}
                    </div>
                    <div>
                        <Label htmlFor="start_start_date" className={`mb-1 block ${LABEL_TEXT}`}>Enrollment Start Date <span className="text-red-500">*</span></Label>
                        <Input id="start_start_date" type="date" value={form.data.start_date} onChange={(e) => form.setData('start_date', e.target.value)} />
                        {form.errors.start_date && <p className="mt-1 text-xs text-red-600">{form.errors.start_date}</p>}
                    </div>
                    <div>
                        <Label htmlFor="start_close_date" className={`mb-1 block ${LABEL_TEXT}`}>Enrollment End Date <span className="text-red-500">*</span></Label>
                        <Input id="start_close_date" type="date" min={form.data.start_date || undefined} value={form.data.close_date} onChange={(e) => form.setData('close_date', e.target.value)} />
                        {form.errors.close_date && <p className="mt-1 text-xs text-red-600">{form.errors.close_date}</p>}
                    </div>
                    <div>
                        <Label htmlFor="start_notes" className={`mb-1 block ${LABEL_TEXT}`}>Notes (optional)</Label>
                        <textarea id="start_notes" rows={2} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" value={form.data.notes} onChange={(e) => form.setData('notes', e.target.value)} />
                    </div>
                    {(form.errors as Record<string, string>).error && (
                        <p className="text-sm text-red-600">{(form.errors as Record<string, string>).error}</p>
                    )}
                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="outline" onClick={onClose} disabled={form.processing}>Cancel</Button>
                        <Button type="submit" className="bg-green-600 hover:bg-green-700" disabled={form.processing}>
                            {form.processing ? 'Starting...' : 'Start Enrollment'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

interface ReopenDialogProps {
    period: EnrollmentPeriod | null;
    onClose: () => void;
    form: ReturnType<typeof useEnrollmentPeriods>['openForm'];
    onSubmit: (e: React.FormEvent) => void;
}

function ReopenEnrollmentDialog({ period, onClose, form, onSubmit }: ReopenDialogProps) {
    if (!period) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
                <div className="mb-4 flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-green-600" />
                    <h2 className="text-lg font-semibold">Re-open Enrollment Period</h2>
                </div>
                <p className={`mb-4 ${BODY_TEXT}`}>
                    Re-open the enrollment period for{' '}
                    <span className="font-medium text-gray-900">{period.school_year} — {period.semester}</span>.
                    Set new start and end dates to reactivate this period.
                </p>
                <form onSubmit={onSubmit} className="space-y-4">
                    <div>
                        <Label htmlFor="open_start_date" className={`mb-1 block ${LABEL_TEXT}`}>Enrollment Start Date <span className="text-red-500">*</span></Label>
                        <Input id="open_start_date" type="date" value={form.data.start_date} onChange={(e) => form.setData('start_date', e.target.value)} />
                        {form.errors.start_date && <p className="mt-1 text-xs text-red-600">{form.errors.start_date}</p>}
                    </div>
                    <div>
                        <Label htmlFor="open_close_date" className={`mb-1 block ${LABEL_TEXT}`}>Enrollment End Date <span className="text-red-500">*</span></Label>
                        <Input id="open_close_date" type="date" min={form.data.start_date || undefined} value={form.data.close_date} onChange={(e) => form.setData('close_date', e.target.value)} />
                        {form.errors.close_date && <p className="mt-1 text-xs text-red-600">{form.errors.close_date}</p>}
                    </div>
                    <div>
                        <Label htmlFor="open_notes" className={`mb-1 block ${LABEL_TEXT}`}>Notes (optional)</Label>
                        <textarea id="open_notes" rows={2} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" value={form.data.notes} onChange={(e) => form.setData('notes', e.target.value)} />
                    </div>
                    {(form.errors as Record<string, string>).error && (
                        <p className="text-sm text-red-600">{(form.errors as Record<string, string>).error}</p>
                    )}
                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="outline" onClick={onClose} disabled={form.processing}>Cancel</Button>
                        <Button type="submit" className="bg-green-600 hover:bg-green-700" disabled={form.processing}>
                            {form.processing ? 'Re-opening...' : 'Re-open'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

interface EditDialogProps {
    period: EnrollmentPeriod | null;
    onClose: () => void;
    form: ReturnType<typeof useEnrollmentPeriods>['editForm'];
    onSubmit: (e: React.FormEvent) => void;
}

function EditEnrollmentDialog({ period, onClose, form, onSubmit }: EditDialogProps) {
    if (!period) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
                <div className="mb-4 flex items-center gap-2">
                    <CalendarClock className="h-5 w-5 text-blue-600" />
                    <h2 className="text-lg font-semibold">Edit Enrollment Period</h2>
                </div>
                <p className={`mb-4 ${BODY_TEXT}`}>
                    Editing{' '}
                    <span className="font-medium text-gray-900">{period.school_year} — {period.semester}</span>.
                    Extend the end date to allow more time for enrollment.
                </p>
                <form onSubmit={onSubmit} className="space-y-4">
                    <div>
                        <Label htmlFor="edit_close_date" className={`mb-1 block ${LABEL_TEXT}`}>End Date <span className="text-red-500">*</span></Label>
                        <Input id="edit_close_date" type="date" value={form.data.close_date} onChange={(e) => form.setData('close_date', e.target.value)} />
                        {form.errors.close_date && <p className="mt-1 text-xs text-red-600">{form.errors.close_date}</p>}
                    </div>
                    <div>
                        <Label htmlFor="edit_notes" className={`mb-1 block ${LABEL_TEXT}`}>Notes (optional)</Label>
                        <textarea id="edit_notes" rows={2} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" value={form.data.notes} onChange={(e) => form.setData('notes', e.target.value)} />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="outline" onClick={onClose} disabled={form.processing}>Cancel</Button>
                        <Button type="submit" disabled={form.processing}>
                            {form.processing ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function Index({ periods, semesters }: Props) {
    const {
        showStartDialog, setShowStartDialog,
        startForm,
        openDialog, setOpenDialog,
        openForm,
        editDialog, setEditDialog,
        editForm,
        closeDialog, setCloseDialog,
        closingPeriod,
        deleteDialog, setDeleteDialog,
        deletingPeriod,
        paginatedPeriods,
        currentPage, setCurrentPage,
        pageSize, setPageSize,
        handleStart,
        handleOpenEnrollment,
        handleReopenClick,
        handleEditOpen,
        handleUpdate,
        handleClose,
        handleDelete,
    } = useEnrollmentPeriods(periods);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Enrollment Periods" />

            <div className={PAGE_PADDING}>
                <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <CalendarClock className="h-7 w-7 text-primary" />
                        <h1 className={PAGE_TITLE}>Enrollment Periods</h1>
                    </div>
                    <Button onClick={() => setShowStartDialog(true)} className="gap-2 bg-green-600 hover:bg-green-700">
                        <Calendar className="h-4 w-4" />
                        Start Enrollment
                    </Button>
                </div>

                <div className={`overflow-hidden ${CARD}`}>
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-gray-50">
                                <TableHead className={TABLE_HEADER_CELL}>School Year</TableHead>
                                <TableHead className={TABLE_HEADER_CELL}>Semester</TableHead>
                                <TableHead className={TABLE_HEADER_CELL}>Type</TableHead>
                                <TableHead className={TABLE_HEADER_CELL}>Status</TableHead>
                                <TableHead className={TABLE_HEADER_CELL}>Start Date</TableHead>
                                <TableHead className={TABLE_HEADER_CELL}>End Date</TableHead>
                                <TableHead className={TABLE_HEADER_CELL}>Notes</TableHead>
                                <TableHead className={`${TABLE_HEADER_CELL} text-right`}>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {periods.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={8} className="py-12 text-center text-gray-500">
                                        <CalendarClock className="mx-auto mb-3 h-10 w-10 text-gray-300" />
                                        <p className={BODY_TEXT}>No enrollment periods yet.</p>
                                        <p className={BODY_TEXT}>Click "Start Enrollment" to begin.</p>
                                    </TableCell>
                                </TableRow>
                            )}
                            {paginatedPeriods.map((period) => (
                                <TableRow key={period.id}>
                                    <TableCell className="font-medium">{period.school_year}</TableCell>
                                    <TableCell>{period.semester}</TableCell>
                                    <TableCell>
                                        {period.type === 'student' ? (
                                            <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Student</Badge>
                                        ) : period.type === 'applicant' ? (
                                            <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">Applicant Enrollment</Badge>
                                        ) : (
                                            <Badge className="bg-teal-100 text-teal-800 hover:bg-teal-100">Application</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell><StatusBadge status={period.status} /></TableCell>
                                    <TableCell>{formatDate(period.start_date)}</TableCell>
                                    <TableCell>{formatDate(period.close_date)}</TableCell>
                                    <TableCell className="max-w-[200px] truncate text-sm text-gray-500">{period.notes ?? '—'}</TableCell>
                                    <TableCell>
                                        <div className="flex justify-end gap-2">
                                            {period.status !== 'expired' && (
                                                <>
                                                    <button onClick={() => handleEditOpen(period)} className={TABLE_ROW_ACTION}>
                                                        <Pencil className="h-3 w-3" /> Edit
                                                    </button>
                                                    {period.status !== 'open' ? (
                                                        <button
                                                            onClick={() => handleReopenClick(period)}
                                                            className="inline-flex items-center gap-1 rounded-md border border-green-300 px-2 py-1 text-xs text-green-700 hover:bg-green-50"
                                                        >
                                                            Re-open
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => setCloseDialog(period)}
                                                            className="inline-flex items-center gap-1 rounded-md border border-amber-300 px-2 py-1 text-xs text-amber-700 hover:bg-amber-50"
                                                        >
                                                            Close
                                                        </button>
                                                    )}
                                                </>
                                            )}
                                            <button
                                                disabled={period.status === 'open' || period.status === 'upcoming'}
                                                onClick={() => setDeleteDialog(period)}
                                                className={TABLE_ROW_ACTION_DANGER}
                                            >
                                                <Trash2 className="h-3 w-3" /> Delete
                                            </button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    {periods.length > 0 && (
                        <TablePagination
                            total={periods.length}
                            pageSize={pageSize}
                            currentPage={currentPage}
                            onPageChange={setCurrentPage}
                            onPageSizeChange={(s) => { setPageSize(s); setCurrentPage(1); }}
                        />
                    )}
                </div>
            </div>

            <StartEnrollmentDialog
                show={showStartDialog}
                onClose={() => { setShowStartDialog(false); startForm.reset(); }}
                form={startForm}
                semesters={semesters}
                onSubmit={handleStart}
            />
            <ReopenEnrollmentDialog
                period={openDialog}
                onClose={() => setOpenDialog(null)}
                form={openForm}
                onSubmit={handleOpenEnrollment}
            />
            <EditEnrollmentDialog
                period={editDialog}
                onClose={() => setEditDialog(null)}
                form={editForm}
                onSubmit={handleUpdate}
            />

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
