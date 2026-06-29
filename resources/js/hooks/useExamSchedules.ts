import { useForm } from '@inertiajs/react';
import { useMemo, useState } from 'react';

export interface ExamRoom {
    id: number;
    name: string;
    building: string | null;
    capacity?: number;
}

export interface ExamSchedule {
    id: number;
    name: string;
    exam_type: string;
    exam_date: string;
    start_time: string;
    end_time: string;
    examination_room_id: number;
    capacity: number | null;
    description: string | null;
    is_active: boolean;
    created_at: string;
    examination_room: ExamRoom;
    assigned_count: number;
}

export type ExamScheduleSortKey = 'name' | 'exam_date' | 'room' | 'assigned_count' | 'status';

export function useExamSchedules(schedules: ExamSchedule[]) {
    const { delete: destroy, processing } = useForm();

    const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: number; name: string }>({
        open: false, id: 0, name: '',
    });
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedRoomId, setSelectedRoomId] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [sortConfig, setSortConfig] = useState<{ key: ExamScheduleSortKey | null; direction: 'asc' | 'desc' }>({
        key: null,
        direction: 'asc',
    });

    const hasFilters = !!(searchQuery || selectedRoomId || selectedStatus || dateFrom);

    const filteredItems = useMemo(() => {
        const q = searchQuery.toLowerCase();
        return schedules.filter((s) => {
            const matchesSearch = !q || s.name.toLowerCase().includes(q) || s.exam_type.toLowerCase().includes(q);
            const matchesRoom = !selectedRoomId || String(s.examination_room_id) === selectedRoomId;
            const matchesStatus = !selectedStatus || (selectedStatus === 'active' ? s.is_active : !s.is_active);
            const matchesDate = !dateFrom || s.exam_date >= dateFrom;
            return matchesSearch && matchesRoom && matchesStatus && matchesDate;
        });
    }, [schedules, searchQuery, selectedRoomId, selectedStatus, dateFrom]);

    const sortedItems = useMemo(() => {
        if (!sortConfig.key) return filteredItems;
        return [...filteredItems].sort((a, b) => {
            const vals: Record<ExamScheduleSortKey, [string, string]> = {
                name:           [a.name, b.name],
                exam_date:      [a.exam_date, b.exam_date],
                room:           [a.examination_room?.name ?? '', b.examination_room?.name ?? ''],
                assigned_count: [String(a.assigned_count), String(b.assigned_count)],
                status:         [a.is_active ? 'active' : 'inactive', b.is_active ? 'active' : 'inactive'],
            };
            const [aVal, bVal] = vals[sortConfig.key!];
            return aVal.localeCompare(bVal) * (sortConfig.direction === 'asc' ? 1 : -1);
        });
    }, [filteredItems, sortConfig]);

    const paginatedItems = useMemo(
        () => sortedItems.slice((currentPage - 1) * pageSize, currentPage * pageSize),
        [sortedItems, currentPage, pageSize],
    );

    const toggleSort = (key: ExamScheduleSortKey) => {
        setSortConfig((prev) =>
            prev.key === key
                ? { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
                : { key, direction: 'asc' },
        );
    };

    const clearFilters = () => {
        setSearchQuery('');
        setSelectedRoomId('');
        setSelectedStatus('');
        setDateFrom('');
        setCurrentPage(1);
    };

    const confirmDelete = () => {
        destroy(`/exam-schedules/${deleteDialog.id}`, {
            onSuccess: () => setDeleteDialog({ open: false, id: 0, name: '' }),
        });
    };

    return {
        processing,
        deleteDialog,
        setDeleteDialog,
        searchQuery,
        setSearchQuery,
        selectedRoomId,
        setSelectedRoomId,
        selectedStatus,
        setSelectedStatus,
        dateFrom,
        setDateFrom,
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
        confirmDelete,
    };
}
