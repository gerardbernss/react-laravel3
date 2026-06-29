import { router, useForm } from '@inertiajs/react';
import { useMemo, useState } from 'react';

export interface PersonalData {
    first_name: string;
    last_name: string;
    middle_name: string | null;
}

export interface ApplicationInfo {
    id: number;
    application_number: string;
    personal_data: PersonalData;
}

export interface Room {
    id: number;
    name: string;
    building: string | null;
}

export interface Schedule {
    id: number;
    name: string;
    exam_date: string;
    examination_room_id: number;
    examination_room: Room;
}

export interface Assignment {
    id: number;
    status: string;
    assigned_at: string;
    application_info: ApplicationInfo;
    exam_schedule: Schedule;
}

export type AssignmentSortKey = 'application_number' | 'name' | 'schedule' | 'status';

export const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

export function useExamAssignments(assignments: Assignment[]) {
    const { delete: destroy, processing } = useForm();

    const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: number }>({ open: false, id: 0 });
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedScheduleId, setSelectedScheduleId] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [sortConfig, setSortConfig] = useState<{ key: AssignmentSortKey | null; direction: 'asc' | 'desc' }>({
        key: null, direction: 'asc',
    });

    const hasFilters = !!(searchQuery || selectedScheduleId || selectedStatus);

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
            if (sortConfig.key === 'application_number') {
                aVal = a.application_info?.application_number ?? '';
                bVal = b.application_info?.application_number ?? '';
            } else if (sortConfig.key === 'name') {
                aVal = `${a.application_info?.personal_data?.last_name ?? ''} ${a.application_info?.personal_data?.first_name ?? ''}`;
                bVal = `${b.application_info?.personal_data?.last_name ?? ''} ${b.application_info?.personal_data?.first_name ?? ''}`;
            } else if (sortConfig.key === 'schedule') {
                aVal = a.exam_schedule?.name ?? '';
                bVal = b.exam_schedule?.name ?? '';
            } else if (sortConfig.key === 'status') {
                aVal = a.status;
                bVal = b.status;
            }
            return aVal.localeCompare(bVal) * (sortConfig.direction === 'asc' ? 1 : -1);
        });
    }, [filteredItems, sortConfig]);

    const paginatedItems = useMemo(
        () => sortedItems.slice((currentPage - 1) * pageSize, currentPage * pageSize),
        [sortedItems, currentPage, pageSize],
    );

    const toggleSort = (key: AssignmentSortKey) =>
        setSortConfig((prev) =>
            prev.key === key
                ? { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
                : { key, direction: 'asc' },
        );

    const clearFilters = () => {
        setSearchQuery('');
        setSelectedScheduleId('');
        setSelectedStatus('');
        setCurrentPage(1);
    };

    const markResult = (id: number, result: 'passed' | 'failed') => {
        router.post(`/exam-assignments/${id}/mark-result`, { result }, { preserveScroll: true });
    };

    const confirmDelete = () => {
        destroy(`/exam-assignments/${deleteDialog.id}`, {
            onSuccess: () => setDeleteDialog({ open: false, id: 0 }),
        });
    };

    return {
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
    };
}
