import { useForm } from '@inertiajs/react';
import { useMemo, useState } from 'react';

export interface ExaminationRoom {
    id: number;
    name: string;
    building: string | null;
    capacity: number;
    floor: string | null;
    description: string | null;
    facilities: string | null;
    is_active: boolean;
    created_at: string;
}

export type RoomSortKey = 'name' | 'building' | 'floor' | 'capacity' | 'status';

export function useExaminationRooms(rooms: ExaminationRoom[]) {
    const { delete: destroy, processing } = useForm();

    const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: number; name: string }>({
        open: false, id: 0, name: '',
    });
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [sortConfig, setSortConfig] = useState<{ key: RoomSortKey | null; direction: 'asc' | 'desc' }>({
        key: null,
        direction: 'asc',
    });

    const hasFilters = !!(searchQuery || selectedStatus);

    const filteredItems = useMemo(() => {
        const q = searchQuery.toLowerCase();
        return rooms.filter((r) => {
            const matchesSearch = !q || r.name.toLowerCase().includes(q) || (r.building ?? '').toLowerCase().includes(q);
            const matchesStatus = !selectedStatus || (selectedStatus === 'active' ? r.is_active : !r.is_active);
            return matchesSearch && matchesStatus;
        });
    }, [rooms, searchQuery, selectedStatus]);

    const sortedItems = useMemo(() => {
        if (!sortConfig.key) return filteredItems;
        return [...filteredItems].sort((a, b) => {
            const vals: Record<RoomSortKey, [string, string]> = {
                name:     [a.name, b.name],
                building: [a.building ?? '', b.building ?? ''],
                floor:    [a.floor ?? '', b.floor ?? ''],
                capacity: [String(a.capacity), String(b.capacity)],
                status:   [a.is_active ? 'active' : 'inactive', b.is_active ? 'active' : 'inactive'],
            };
            const [aVal, bVal] = vals[sortConfig.key!];
            return aVal.localeCompare(bVal) * (sortConfig.direction === 'asc' ? 1 : -1);
        });
    }, [filteredItems, sortConfig]);

    const paginatedItems = useMemo(
        () => sortedItems.slice((currentPage - 1) * pageSize, currentPage * pageSize),
        [sortedItems, currentPage, pageSize],
    );

    const toggleSort = (key: RoomSortKey) => {
        setSortConfig((prev) =>
            prev.key === key
                ? { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
                : { key, direction: 'asc' },
        );
    };

    const clearFilters = () => {
        setSearchQuery('');
        setSelectedStatus('');
        setCurrentPage(1);
    };

    const confirmDelete = () => {
        destroy(`/admin/examination-rooms/${deleteDialog.id}`, {
            onSuccess: () => setDeleteDialog({ open: false, id: 0, name: '' }),
        });
    };

    return {
        processing,
        deleteDialog,
        setDeleteDialog,
        searchQuery,
        setSearchQuery,
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
        confirmDelete,
    };
}
