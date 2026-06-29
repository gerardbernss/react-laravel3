import { useForm } from '@inertiajs/react';
import { useMemo, useState } from 'react';

export interface DiscountType {
    id: number;
    name: string;
    code: string;
    discount_type: string;
    value: string;
    applies_to: string;
    requires_verification: boolean;
    is_stackable: boolean;
    description: string | null;
    is_active: boolean;
    created_at: string;
}

export type DiscountSortKey = 'code' | 'name' | 'discount_type' | 'value' | 'status';

export function formatDiscountValue(discount: DiscountType): string {
    if (discount.discount_type === 'percentage') return `${discount.value}%`;
    return `₱${parseFloat(discount.value).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
}

export function useDiscountTypes(discountTypes: DiscountType[]) {
    const { delete: destroy, processing } = useForm();

    const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: number; name: string }>({
        open: false, id: 0, name: '',
    });
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedType, setSelectedType] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [sortConfig, setSortConfig] = useState<{ key: DiscountSortKey | null; direction: 'asc' | 'desc' }>({
        key: null,
        direction: 'asc',
    });

    const hasFilters = !!(searchQuery || selectedType || selectedStatus);

    const filteredItems = useMemo(() => {
        const q = searchQuery.toLowerCase();
        return discountTypes.filter((d) => {
            const matchesSearch = !q || d.name.toLowerCase().includes(q) || d.code.toLowerCase().includes(q);
            const matchesType = !selectedType || d.discount_type === selectedType;
            const matchesStatus = !selectedStatus || (selectedStatus === 'active' ? d.is_active : !d.is_active);
            return matchesSearch && matchesType && matchesStatus;
        });
    }, [discountTypes, searchQuery, selectedType, selectedStatus]);

    const sortedItems = useMemo(() => {
        if (!sortConfig.key) return filteredItems;
        return [...filteredItems].sort((a, b) => {
            const vals: Record<DiscountSortKey, [string, string]> = {
                code:          [a.code, b.code],
                name:          [a.name, b.name],
                discount_type: [a.discount_type, b.discount_type],
                value:         [String(parseFloat(a.value)), String(parseFloat(b.value))],
                status:        [a.is_active ? 'active' : 'inactive', b.is_active ? 'active' : 'inactive'],
            };
            const [aVal, bVal] = vals[sortConfig.key!];
            return aVal.localeCompare(bVal) * (sortConfig.direction === 'asc' ? 1 : -1);
        });
    }, [filteredItems, sortConfig]);

    const paginatedItems = useMemo(
        () => sortedItems.slice((currentPage - 1) * pageSize, currentPage * pageSize),
        [sortedItems, currentPage, pageSize],
    );

    const toggleSort = (key: DiscountSortKey) => {
        setSortConfig((prev) =>
            prev.key === key
                ? { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
                : { key, direction: 'asc' },
        );
    };

    const clearFilters = () => {
        setSearchQuery('');
        setSelectedType('');
        setSelectedStatus('');
        setCurrentPage(1);
    };

    const confirmDelete = () => {
        destroy(`/admin/discount-types/${deleteDialog.id}`, {
            onSuccess: () => setDeleteDialog({ open: false, id: 0, name: '' }),
        });
    };

    return {
        processing,
        deleteDialog,
        setDeleteDialog,
        searchQuery,
        setSearchQuery,
        selectedType,
        setSelectedType,
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
