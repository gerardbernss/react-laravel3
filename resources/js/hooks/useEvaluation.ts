import { router } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import type { DateRange } from 'react-day-picker';
import { toast } from 'sonner';

export interface Applicant {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    gender?: string;
    application_date?: string;
    application_status?: string;
    strand?: string;
}

export type ApplicantColumnKey = keyof Applicant;

export const EVALUATION_COLUMNS: { key: ApplicantColumnKey; label: string }[] = [
    { key: 'id',                 label: 'ID' },
    { key: 'first_name',         label: 'First Name' },
    { key: 'last_name',          label: 'Last Name' },
    { key: 'email',              label: 'Email' },
    { key: 'gender',             label: 'Gender' },
    { key: 'strand',             label: 'Program/Strand' },
    { key: 'application_date',   label: 'Application Date' },
    { key: 'application_status', label: 'Application Status' },
];

export function useEvaluation(applications: Applicant[]) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedGender, setSelectedGender] = useState('all');
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [selectedStrand, setSelectedStrand] = useState('all');
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedApplicantId, setSelectedApplicantId] = useState<number | null>(null);
    const [dateRange, setDateRange] = useState<DateRange | undefined>();
    const [sortConfig, setSortConfig] = useState<{ key: ApplicantColumnKey | null; direction: 'asc' | 'desc' }>({
        key: null, direction: 'asc',
    });
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [selectedRows, setSelectedRows] = useState<number[]>([]);
    const [visibleColumns, setVisibleColumns] = useState<ApplicantColumnKey[]>([
        'id', 'first_name', 'last_name', 'email', 'gender', 'strand', 'application_date', 'application_status',
    ]);
    const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);

    const handleDeleteClick = (id: number) => {
        setSelectedApplicantId(id);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = () => {
        if (selectedApplicantId === null) return;
        router.delete(`/admissions/applicants/${selectedApplicantId}`, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Applicant deleted successfully!');
                setDeleteDialogOpen(false);
                setSelectedApplicantId(null);
            },
            onError: () => {
                toast.error('Failed to delete applicant. Please try again.');
                setDeleteDialogOpen(false);
            },
        });
    };

    const handleDeleteCancel = () => {
        setDeleteDialogOpen(false);
        setSelectedApplicantId(null);
    };

    const handleSort = (key: ApplicantColumnKey) =>
        setSortConfig((prev) =>
            prev.key === key
                ? { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
                : { key, direction: 'asc' },
        );

    const filteredApplicants = useMemo(() => {
        return applications.filter((a) => {
            const q = searchQuery.toLowerCase();
            const matchesSearch =
                a.id.toString().includes(q) ||
                a.first_name?.toLowerCase().includes(q) ||
                a.last_name?.toLowerCase().includes(q) ||
                a.email?.toLowerCase().includes(q);
            const matchesGender = selectedGender === 'all' || a.gender?.toLowerCase() === selectedGender.toLowerCase();
            const matchesStatus = selectedStatus === 'all' || a.application_status?.toLowerCase() === selectedStatus.toLowerCase();
            const matchesStrand = selectedStrand === 'all' || a.strand?.toLowerCase() === selectedStrand.toLowerCase();

            let matchesDate = true;
            if (dateRange?.from) {
                if (!a.application_date) {
                    matchesDate = false;
                } else {
                    const appDate = new Date(a.application_date.split(' ')[0]);
                    const fromDate = new Date(dateRange.from);
                    appDate.setHours(0, 0, 0, 0);
                    fromDate.setHours(0, 0, 0, 0);
                    if (dateRange.to) {
                        const toDate = new Date(dateRange.to);
                        toDate.setHours(0, 0, 0, 0);
                        matchesDate = appDate.getTime() >= fromDate.getTime() && appDate.getTime() <= toDate.getTime();
                    } else {
                        matchesDate = appDate.getTime() >= fromDate.getTime();
                    }
                }
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

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) =>
        setSelectedRows(e.target.checked ? paginatedApplicants.map((r) => r.id) : []);

    const handleSelectRow = (id: number) =>
        setSelectedRows((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

    const handleBulkDelete = () => setShowBulkDeleteDialog(true);

    const confirmBulkDelete = () => {
        toast.success(`${selectedRows.length} applicants deleted successfully!`);
        setSelectedRows([]);
        setShowBulkDeleteDialog(false);
    };

    const toggleColumnVisibility = (key: ApplicantColumnKey) =>
        setVisibleColumns((prev) => (prev.includes(key) ? prev.filter((c) => c !== key) : [...prev, key]));

    const handleExport = () => {
        const visibleCols = EVALUATION_COLUMNS.filter((col) => visibleColumns.includes(col.key));
        const headers = visibleCols.map((col) => col.label);
        const csvContent = [
            headers.join(','),
            ...sortedApplicants.map((row) =>
                visibleCols.map((col) => {
                    const value = row[col.key];
                    if (col.key === 'application_date' && value) {
                        return new Date(value).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' });
                    }
                    return value || '';
                }).join(','),
            ),
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `applicants-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        toast.success('Data exported successfully!');
    };

    const clearFilters = () => {
        setSearchQuery('');
        setSelectedGender('all');
        setSelectedStatus('all');
        setDateRange(undefined);
        setSelectedStrand('all');
        setCurrentPage(1);
    };

    return {
        searchQuery, setSearchQuery,
        selectedGender, setSelectedGender,
        selectedStatus, setSelectedStatus,
        selectedStrand, setSelectedStrand,
        deleteDialogOpen, setDeleteDialogOpen,
        dateRange, setDateRange,
        sortConfig,
        currentPage, setCurrentPage,
        pageSize, setPageSize,
        selectedRows,
        visibleColumns,
        showBulkDeleteDialog, setShowBulkDeleteDialog,
        sortedApplicants,
        paginatedApplicants,
        handleDeleteClick,
        handleDeleteConfirm,
        handleDeleteCancel,
        handleSort,
        handleSelectAll,
        handleSelectRow,
        handleBulkDelete,
        confirmBulkDelete,
        toggleColumnVisibility,
        handleExport,
        clearFilters,
    };
}
