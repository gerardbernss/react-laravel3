import { router } from '@inertiajs/react';
import { type ChangeEventHandler } from 'react';
import { type DateRange } from 'react-day-picker';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

export interface Applicant {
    id: number;
    application_number: string;
    first_name: string;
    last_name: string;
    email: string;
    gender?: string;
    application_date?: string;
    application_status?: string;
    strand?: string;
}

export const APPLICANT_COLUMNS: { key: keyof Applicant; label: string }[] = [
    { key: 'application_number', label: 'Application Number' },
    { key: 'first_name',         label: 'First Name' },
    { key: 'last_name',          label: 'Last Name' },
    { key: 'email',              label: 'Email' },
    { key: 'gender',             label: 'Gender' },
    { key: 'strand',             label: 'Program/Strand' },
    { key: 'application_date',   label: 'Application Date' },
    { key: 'application_status', label: 'Application Status' },
];

export function getStatusBadgeProps(status: string | undefined): { variant: 'outline' | 'default' | 'success' | 'secondary'; label: string } {
    const s = status?.toLowerCase() ?? '';
    if (s === 'pending')                       return { variant: 'outline',  label: 'Pending' };
    if (s === 'exam taken' || s === 'inactive') return { variant: 'default',  label: 'Exam Taken' };
    if (s === 'enrolled'   || s === 'active')   return { variant: 'success',  label: 'Enrolled' };
    return { variant: 'outline', label: status || 'Pending' };
}

export function handleCalendarChange(value: string | number, onChange: ChangeEventHandler<HTMLSelectElement>) {
    const event = { target: { value: String(value) } } as React.ChangeEvent<HTMLSelectElement>;
    onChange(event);
}

export function useAdmissionsIndex(applications: Applicant[]) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedGender, setSelectedGender] = useState('all');
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [selectedStrand, setSelectedStrand] = useState('all');
    const [dateRange, setDateRange] = useState<DateRange | undefined>();
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedApplicantId, setSelectedApplicantId] = useState<number | null>(null);
    const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
    const [sortConfig, setSortConfig] = useState<{ key: keyof Applicant | null; direction: 'asc' | 'desc' }>({
        key: null, direction: 'asc',
    });
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [selectedRows, setSelectedRows] = useState<number[]>([]);
    const [visibleColumns, setVisibleColumns] = useState<(keyof Applicant)[]>(
        APPLICANT_COLUMNS.map((c) => c.key),
    );

    const filteredApplicants = useMemo(() => {
        return applications.filter((a) => {
            const q = searchQuery.toLowerCase();
            const matchesSearch =
                !q ||
                a.id.toString().includes(q) ||
                a.application_number.toLowerCase().includes(q) ||
                a.first_name?.toLowerCase().includes(q) ||
                a.last_name?.toLowerCase().includes(q) ||
                a.email?.toLowerCase().includes(q);

            const matchesGender = selectedGender === 'all' || a.gender?.toLowerCase() === selectedGender;
            const matchesStatus = selectedStatus === 'all' || a.application_status?.toLowerCase() === selectedStatus;
            const matchesStrand = selectedStrand === 'all' || a.strand?.toLowerCase() === selectedStrand.toLowerCase();

            let matchesDate = true;
            if (dateRange?.from && a.application_date) {
                const appDate = new Date(a.application_date.split(' ')[0]);
                const from = new Date(dateRange.from);
                appDate.setHours(0, 0, 0, 0);
                from.setHours(0, 0, 0, 0);
                if (dateRange.to) {
                    const to = new Date(dateRange.to);
                    to.setHours(0, 0, 0, 0);
                    matchesDate = appDate >= from && appDate <= to;
                } else {
                    matchesDate = appDate >= from;
                }
            } else if (dateRange?.from && !a.application_date) {
                matchesDate = false;
            }

            return matchesSearch && matchesGender && matchesStatus && matchesDate && matchesStrand;
        });
    }, [applications, searchQuery, selectedGender, selectedStatus, dateRange, selectedStrand]);

    const sortedApplicants = useMemo(() => {
        if (!sortConfig.key) return filteredApplicants;
        return [...filteredApplicants].sort((a, b) => {
            const aVal = a[sortConfig.key!];
            const bVal = b[sortConfig.key!];
            if (aVal == null && bVal == null) return 0;
            if (aVal == null) return 1;
            if (bVal == null) return -1;
            if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [filteredApplicants, sortConfig]);

    const paginatedApplicants = useMemo(
        () => sortedApplicants.slice((currentPage - 1) * pageSize, currentPage * pageSize),
        [sortedApplicants, currentPage, pageSize],
    );

    const handleSort = (key: keyof Applicant) => {
        setSortConfig((prev) => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
        }));
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSelectedRows(e.target.checked ? paginatedApplicants.map((r) => r.id) : []);
    };

    const handleSelectRow = (id: number) => {
        setSelectedRows((prev) => (prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]));
    };

    const handleDeleteClick = (id: number) => {
        setSelectedApplicantId(id);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = () => {
        if (selectedApplicantId === null) return;
        router.delete(`/admissions/applicants/${selectedApplicantId}`, {
            preserveScroll: true,
            onSuccess: () => { setDeleteDialogOpen(false); setSelectedApplicantId(null); },
            onError: () => { toast.error('Failed to delete applicant. Please try again.'); setDeleteDialogOpen(false); },
        });
    };

    const handleDeleteCancel = () => {
        setDeleteDialogOpen(false);
        setSelectedApplicantId(null);
    };

    const handleBulkDelete = () => setShowBulkDeleteDialog(true);

    const confirmBulkDelete = () => {
        toast.success(`${selectedRows.length} applicants deleted successfully!`);
        setSelectedRows([]);
        setShowBulkDeleteDialog(false);
    };

    const toggleColumnVisibility = (key: keyof Applicant) => {
        setVisibleColumns((prev) => (prev.includes(key) ? prev.filter((c) => c !== key) : [...prev, key]));
    };

    const clearFilters = () => {
        setSearchQuery('');
        setSelectedGender('all');
        setSelectedStatus('all');
        setDateRange(undefined);
        setSelectedStrand('all');
        setCurrentPage(1);
    };

    const handleExport = () => {
        const exportCols = APPLICANT_COLUMNS.filter((col) => visibleColumns.includes(col.key));
        const rows = sortedApplicants.map((row) =>
            exportCols.map((col) => {
                const value = row[col.key];
                if (col.key === 'application_date' && value)
                    return new Date(value as string).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' });
                return value || '';
            }).join(','),
        );
        const csv = [exportCols.map((c) => c.label).join(','), ...rows].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `applicants-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        toast.success('Data exported successfully!');
    };

    return {
        searchQuery, setSearchQuery,
        selectedGender, setSelectedGender,
        selectedStatus, setSelectedStatus,
        selectedStrand, setSelectedStrand,
        dateRange, setDateRange,
        deleteDialogOpen, setDeleteDialogOpen,
        showBulkDeleteDialog, setShowBulkDeleteDialog,
        sortConfig,
        currentPage, setCurrentPage,
        pageSize, setPageSize,
        selectedRows,
        visibleColumns,
        sortedApplicants,
        paginatedApplicants,
        handleSort,
        handleSelectAll,
        handleSelectRow,
        handleDeleteClick,
        handleDeleteConfirm,
        handleDeleteCancel,
        handleBulkDelete,
        confirmBulkDelete,
        toggleColumnVisibility,
        clearFilters,
        handleExport,
    };
}
