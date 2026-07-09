import { type Permission, type Role } from '@/types';
import { useForm } from '@inertiajs/react';
import { type ChangeEvent, useMemo, useState } from 'react';

export type ColumnKey = keyof Role | 'actions';

export const ROLE_COLUMNS: { key: keyof Role; label: string }[] = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Name' },
    { key: 'description', label: 'Description' },
    { key: 'is_active', label: 'Status' },
    { key: 'permissions', label: 'Permissions' },
    { key: 'users', label: 'Users' },
    { key: 'created_at', label: 'Created At' },
];

const DEFAULT_VISIBLE: ColumnKey[] = [
    'id', 'name', 'description', 'is_active', 'permissions', 'users', 'created_at', 'actions',
];

/**
 * Manage the roles index table with search, sort, pagination, column visibility,
 * row selection, bulk delete, and CSV export.
 */
export function useRoleTable(roles: Role[]) {
    const { processing, delete: destroy } = useForm();

    const [hideAlert, setHideAlert] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: keyof Role | null; direction: 'asc' | 'desc' }>({
        key: null,
        direction: 'asc',
    });
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [selectedRows, setSelectedRows] = useState<number[]>([]);
    const [visibleColumns, setVisibleColumns] = useState<ColumnKey[]>(DEFAULT_VISIBLE);
    const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: number; name: string }>({
        open: false, id: 0, name: '',
    });
    const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);

    const filteredRoles = useMemo(() => {
        const q = searchQuery.toLowerCase();
        return roles.filter((role) =>
            !q ||
            role.id.toString().includes(q) ||
            role.name?.toLowerCase().includes(q) ||
            role.description?.toLowerCase().includes(q) ||
            role.permissions?.some((p) => p.name.toLowerCase().includes(q)),
        );
    }, [roles, searchQuery]);

    const sortedRoles = useMemo(() => {
        if (!sortConfig.key) return filteredRoles;
        return [...filteredRoles].sort((a, b) => {
            const aVal = a[sortConfig.key!];
            const bVal = b[sortConfig.key!];
            if (aVal == null && bVal == null) return 0;
            if (aVal == null) return 1;
            if (bVal == null) return -1;
            if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [filteredRoles, sortConfig]);

    const paginatedRoles = useMemo(
        () => sortedRoles.slice((currentPage - 1) * pageSize, currentPage * pageSize),
        [sortedRoles, currentPage, pageSize],
    );

    const handleSort = (key: keyof Role) => {
        setSortConfig((prev) => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
        }));
    };

    const handleSelectAll = (e: ChangeEvent<HTMLInputElement>) => {
        setSelectedRows(e.target.checked ? paginatedRoles.map((r) => r.id) : []);
    };

    const handleSelectRow = (id: number) => {
        setSelectedRows((prev) => (prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]));
    };

    const handleDelete = (id: number, name: string) => {
        setDeleteDialog({ open: true, id, name });
    };

    const confirmDelete = () => {
        setHideAlert(false);
        destroy(`/admin/roles/${deleteDialog.id}`, {
            onSuccess: () => setDeleteDialog({ open: false, id: 0, name: '' }),
        });
    };

    const handleBulkDelete = () => setShowBulkDeleteDialog(true);

    const confirmBulkDelete = () => {
        setSelectedRows([]);
        setShowBulkDeleteDialog(false);
    };

    const toggleColumnVisibility = (key: ColumnKey) => {
        setVisibleColumns((prev) => (prev.includes(key) ? prev.filter((c) => c !== key) : [...prev, key]));
    };

    const handleExport = () => {
        const exportCols = ROLE_COLUMNS.filter((col) => visibleColumns.includes(col.key));
        const rows = sortedRoles.map((row) =>
            exportCols
                .map((col) => {
                    const value = row[col.key];
                    if (col.key === 'created_at' && value) return new Date(value as string).toDateString();
                    if (col.key === 'is_active') return value ? 'Active' : 'Inactive';
                    if (col.key === 'permissions')
                        return Array.isArray(value) ? (value as Permission[]).map((p) => p.name).join('; ') : '';
                    if (col.key === 'users') return Array.isArray(value) ? value.length : 0;
                    return value || '';
                })
                .join(','),
        );

        const csv = [exportCols.map((c) => c.label).join(','), ...rows].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `roles-${new Date().toISOString().split('T')[0]}.csv`;
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
        filteredRoles,
        sortedRoles,
        paginatedRoles,
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
