import { type Permission } from '@/types';
import { useForm } from '@inertiajs/react';
import { type ChangeEvent, useMemo, useState } from 'react';

export type PermissionColumnKey = keyof Permission | 'actions';

export const PERMISSION_COLUMNS: { key: keyof Permission; label: string }[] = [
    { key: 'id',          label: 'ID' },
    { key: 'name',        label: 'Name' },
    { key: 'slug',        label: 'Slug' },
    { key: 'description', label: 'Description' },
    { key: 'roles_count', label: 'Roles Count' },
    { key: 'created_at',  label: 'Created At' },
];

const DEFAULT_VISIBLE: PermissionColumnKey[] = [
    'id', 'name', 'slug', 'description', 'roles_count', 'created_at', 'actions',
];

export function usePermissionTable(permissions: Permission[]) {
    const { processing, delete: destroy } = useForm();

    const [hideAlert, setHideAlert] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: keyof Permission | null; direction: 'asc' | 'desc' }>({
        key: null,
        direction: 'asc',
    });
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [selectedRows, setSelectedRows] = useState<number[]>([]);
    const [visibleColumns, setVisibleColumns] = useState<PermissionColumnKey[]>(DEFAULT_VISIBLE);
    const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: number; name: string }>({
        open: false, id: 0, name: '',
    });
    const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);

    const filteredPermissions = useMemo(() => {
        const q = searchQuery.toLowerCase();
        return permissions.filter(
            (p) =>
                !q ||
                p.id.toString().includes(q) ||
                p.name?.toLowerCase().includes(q) ||
                p.slug?.toLowerCase().includes(q) ||
                p.description?.toLowerCase().includes(q),
        );
    }, [permissions, searchQuery]);

    const sortedPermissions = useMemo(() => {
        if (!sortConfig.key) return filteredPermissions;
        return [...filteredPermissions].sort((a, b) => {
            const aVal = a[sortConfig.key!];
            const bVal = b[sortConfig.key!];
            if (aVal == null && bVal == null) return 0;
            if (aVal == null) return 1;
            if (bVal == null) return -1;
            if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [filteredPermissions, sortConfig]);

    const paginatedPermissions = useMemo(
        () => sortedPermissions.slice((currentPage - 1) * pageSize, currentPage * pageSize),
        [sortedPermissions, currentPage, pageSize],
    );

    const handleSort = (key: keyof Permission) => {
        setSortConfig((prev) => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
        }));
    };

    const handleSelectAll = (e: ChangeEvent<HTMLInputElement>) => {
        setSelectedRows(e.target.checked ? paginatedPermissions.map((p) => p.id) : []);
    };

    const handleSelectRow = (id: number) => {
        setSelectedRows((prev) => (prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]));
    };

    const handleDelete = (id: number, name: string) => {
        setDeleteDialog({ open: true, id, name });
    };

    const confirmDelete = () => {
        setHideAlert(false);
        destroy(`/admin/permissions/${deleteDialog.id}`, {
            onSuccess: () => setDeleteDialog({ open: false, id: 0, name: '' }),
        });
    };

    const handleBulkDelete = () => setShowBulkDeleteDialog(true);

    const confirmBulkDelete = () => {
        setSelectedRows([]);
        setShowBulkDeleteDialog(false);
    };

    const toggleColumnVisibility = (key: PermissionColumnKey) => {
        setVisibleColumns((prev) => (prev.includes(key) ? prev.filter((c) => c !== key) : [...prev, key]));
    };

    const handleExport = () => {
        const exportCols = PERMISSION_COLUMNS.filter((col) => visibleColumns.includes(col.key));
        const rows = sortedPermissions.map((row) =>
            exportCols
                .map((col) => {
                    const value = row[col.key];
                    if (col.key === 'created_at' && value) return new Date(value as string).toDateString();
                    if (col.key === 'roles_count') return value || 0;
                    return value || '';
                })
                .join(','),
        );

        const csv = [exportCols.map((c) => c.label).join(','), ...rows].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `permissions-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    return {
        hideAlert,
        setHideAlert,
        processing,
        searchQuery,
        setSearchQuery,
        sortConfig,
        currentPage,
        setCurrentPage,
        pageSize,
        setPageSize,
        selectedRows,
        visibleColumns,
        deleteDialog,
        setDeleteDialog,
        showBulkDeleteDialog,
        setShowBulkDeleteDialog,
        sortedPermissions,
        paginatedPermissions,
        handleSort,
        handleSelectAll,
        handleSelectRow,
        handleDelete,
        confirmDelete,
        handleBulkDelete,
        confirmBulkDelete,
        toggleColumnVisibility,
        handleExport,
    };
}
