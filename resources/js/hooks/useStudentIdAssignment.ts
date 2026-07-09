import { router } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { type DateRange } from 'react-day-picker';
import { toast } from 'sonner';

export interface Applicant {
    id: number;
    student_id_number: string;
    application_number: string;
    personal_data_id: number;
    first_name: string;
    last_name: string;
    email: string;
    gender?: string;
    application_date?: string;
    application_status?: string;
    strand?: string;
}

export type ColumnKey = keyof Applicant | 'actions';

export const STUDENT_ID_COLUMNS: { key: ColumnKey; label: string }[] = [
    { key: 'student_id_number',  label: 'Student ID Number' },
    { key: 'application_number', label: 'Application Number' },
    { key: 'first_name',         label: 'First Name' },
    { key: 'last_name',          label: 'Last Name' },
    { key: 'email',              label: 'Email' },
    { key: 'gender',             label: 'Gender' },
    { key: 'strand',             label: 'Program/Strand' },
    { key: 'application_date',   label: 'Application Date' },
    { key: 'application_status', label: 'Application Status' },
    { key: 'actions',            label: 'Actions' },
];

/**
 * Filter, sort, and paginate the student ID assignment list; handles assigning a new
 * student ID number (with re-assign confirmation) and bulk auto-generation.
 */
export function useStudentIdAssignment(applications: Applicant[]) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedGender, setSelectedGender] = useState('all');
    const [selectedStatus] = useState('all');
    const [selectedStrand, setSelectedStrand] = useState('all');
    const [dateRange, setDateRange] = useState<DateRange | undefined>();
    const [sortConfig, setSortConfig] = useState<{ key: keyof Applicant | null; direction: 'asc' | 'desc' }>({
        key: null, direction: 'asc',
    });
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [selectedRowId, setSelectedRowId] = useState<number | null>(null);
    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
    const [assignIdValue, setAssignIdValue] = useState('');
    const [visibleColumns, setVisibleColumns] = useState<ColumnKey[]>(
        STUDENT_ID_COLUMNS.map((c) => c.key),
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

    const selectedApplicant = useMemo(
        () => applications.find((a) => a.id === selectedRowId),
        [applications, selectedRowId],
    );

    const handleSort = (key: keyof Applicant) =>
        setSortConfig((prev) => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
        }));

    const handleSelectRow = (id: number) => {
        if (selectedRowId === id) {
            setSelectedRowId(null);
            setAssignIdValue('');
        } else {
            setSelectedRowId(id);
            setAssignIdValue('');
        }
    };

    const executeAssignment = () => {
        if (!selectedRowId) return;
        router.post(
            '/admin/student-id-assignment',
            { applicant_id: selectedRowId, student_number: assignIdValue },
            {
                onSuccess: () => { setAssignIdValue(''); setSelectedRowId(null); setConfirmDialogOpen(false); },
                onError: () => { toast.error('Failed to assign Student ID.'); setConfirmDialogOpen(false); },
            },
        );
    };

    const handleAssignStudentId = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedRowId || !selectedApplicant) return;
        if (!assignIdValue.trim()) { toast.error('Please enter a Student ID number.'); return; }
        if (selectedApplicant.student_id_number) {
            setConfirmDialogOpen(true);
        } else {
            executeAssignment();
        }
    };

    const handleBulkGenerate = () => {
        router.post('/admin/student-id-assignment/bulk-generate');
    };

    const toggleColumnVisibility = (key: ColumnKey) =>
        setVisibleColumns((prev) => (prev.includes(key) ? prev.filter((c) => c !== key) : [...prev, key]));

    const clearFilters = () => {
        setSearchQuery('');
        setSelectedGender('all');
        setSelectedStrand('all');
        setDateRange(undefined);
        setCurrentPage(1);
    };

    return {
        searchQuery, setSearchQuery,
        selectedGender, setSelectedGender,
        selectedStrand, setSelectedStrand,
        dateRange, setDateRange,
        sortConfig,
        currentPage, setCurrentPage,
        pageSize, setPageSize,
        selectedRowId, setSelectedRowId,
        confirmDialogOpen, setConfirmDialogOpen,
        assignIdValue, setAssignIdValue,
        visibleColumns,
        sortedApplicants,
        paginatedApplicants,
        selectedApplicant,
        handleSort,
        handleSelectRow,
        executeAssignment,
        handleAssignStudentId,
        handleBulkGenerate,
        toggleColumnVisibility,
        clearFilters,
    };
}
