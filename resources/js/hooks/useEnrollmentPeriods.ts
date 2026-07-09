import { getSchoolYearOptions } from '@/lib/school-year';
import { useForm } from '@inertiajs/react';
import { type FormEvent, useMemo, useState } from 'react';
import { toast } from 'sonner';

export interface EnrollmentPeriod {
    id: number;
    school_year: string;
    semester: string;
    type: 'student' | 'applicant' | 'application';
    is_open: boolean;
    status: 'open' | 'upcoming' | 'expired' | 'closed';
    start_date: string | null;
    close_date: string | null;
    opened_at: string | null;
    closed_at: string | null;
    notes: string | null;
}

function todayString(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function useEnrollmentPeriods(periods: EnrollmentPeriod[]) {
    const today = todayString();

    const [showStartDialog, setShowStartDialog] = useState(false);
    const startForm = useForm({
        school_year: getSchoolYearOptions()[0],
        semester: '',
        type: '' as 'student' | 'applicant' | 'application' | '',
        start_date: today,
        close_date: '',
        notes: '',
    });

    const [openDialog, setOpenDialog] = useState<EnrollmentPeriod | null>(null);
    const openForm = useForm({ start_date: today, close_date: '', notes: '' });

    const [editDialog, setEditDialog] = useState<EnrollmentPeriod | null>(null);
    const editForm = useForm({ close_date: '', notes: '' });

    const [closeDialog, setCloseDialog] = useState<EnrollmentPeriod | null>(null);
    const { processing: closingPeriod, post: postClose } = useForm();

    const [deleteDialog, setDeleteDialog] = useState<EnrollmentPeriod | null>(null);
    const { processing: deletingPeriod, delete: destroyPeriod } = useForm();

    const isStudentEnrollmentOpen   = periods.some((p) => p.type === 'student'     && p.status === 'open');
    const isApplicantEnrollmentOpen = periods.some((p) => p.type === 'applicant'   && p.status === 'open');
    const isApplicationPeriodOpen   = periods.some((p) => p.type === 'application' && p.status === 'open');

    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const paginatedPeriods = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return periods.slice(start, start + pageSize);
    }, [periods, currentPage, pageSize]);

    const handleStart = (e: FormEvent) => {
        e.preventDefault();
        startForm.post('/admin/enrollment-periods', {
            onSuccess: () => { startForm.reset(); setShowStartDialog(false); },
        });
    };

    const handleOpenEnrollment = (e: FormEvent) => {
        e.preventDefault();
        if (!openDialog) return;
        openForm.post(`/admin/enrollment-periods/${openDialog.id}/open`, {
            onSuccess: () => { openForm.reset(); setOpenDialog(null); },
        });
    };

    const handleReopenClick = (period: EnrollmentPeriod) => {
        const sameTypeOpen =
            period.type === 'student'     ? isStudentEnrollmentOpen :
            period.type === 'applicant'   ? isApplicantEnrollmentOpen :
                                            isApplicationPeriodOpen;
        if (sameTypeOpen) {
            toast.error(`There is still an ongoing ${period.type} enrollment period. Please close it before starting a new one.`);
            return;
        }
        openForm.setData({ start_date: today, close_date: '', notes: period.notes ?? '' });
        setOpenDialog(period);
    };

    const handleEditOpen = (period: EnrollmentPeriod) => {
        editForm.setData({ close_date: period.close_date ?? '', notes: period.notes ?? '' });
        setEditDialog(period);
    };

    const handleUpdate = (e: FormEvent) => {
        e.preventDefault();
        if (!editDialog) return;
        editForm.put(`/admin/enrollment-periods/${editDialog.id}`, {
            onSuccess: () => { editForm.reset(); setEditDialog(null); },
        });
    };

    const handleClose = () => {
        if (!closeDialog) return;
        postClose(`/admin/enrollment-periods/${closeDialog.id}/close`, {
            onSuccess: () => setCloseDialog(null),
        });
    };

    const handleDelete = () => {
        if (!deleteDialog) return;
        destroyPeriod(`/admin/enrollment-periods/${deleteDialog.id}`, {
            onSuccess: () => setDeleteDialog(null),
        });
    };

    return {
        today,
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
    };
}
