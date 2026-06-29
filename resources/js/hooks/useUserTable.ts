import { type Role, type User } from '@/types';
import { useForm } from '@inertiajs/react';
import { type ChangeEvent, useMemo, useState } from 'react';

export type UserColumnKey = keyof User | 'actions';

export const USER_COLUMNS: { key: keyof User; label: string }[] = [
    { key: 'id',                label: 'ID' },
    { key: 'name',              label: 'Name' },
    { key: 'email',             label: 'Email' },
    { key: 'roles',             label: 'Roles' },
    { key: 'email_verified_at', label: 'Verified?' },
    { key: 'created_at',        label: 'Created At' },
];

const DEFAULT_VISIBLE: UserColumnKey[] = [
    'id', 'name', 'email', 'roles', 'email_verified_at', 'created_at', 'actions',
];

export function useUserTable(users: User[]) {
    const { processing, delete: destroy } = useForm();

    const [hideAlert, setHideAlert] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: keyof User | null; direction: 'asc' | 'desc' }>({
        key: null,
        direction: 'asc',
    });
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [selectedRows, setSelectedRows] = useState<number[]>([]);
    const [visibleColumns, setVisibleColumns] = useState<UserColumnKey[]>(DEFAULT_VISIBLE);
    const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: number; name: string }>({
        open: false, id: 0, name: '',
    });
    const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);

    const filteredUsers = useMemo(() => {
        const q = searchQuery.toLowerCase();
        return users.filter((user) =>
            !q ||
            user.id.toString().includes(q) ||
            user.name?.toLowerCase().includes(q) ||
            user.email?.toLowerCase().includes(q) ||
            user.roles?.some((role) => role.name.toLowerCase().includes(q)),
        );
    }, [users, searchQuery]);

    const sortedUsers = useMemo(() => {
        if (!sortConfig.key) return filteredUsers;
        return [...filteredUsers].sort((a, b) => {
            const aVal = a[sortConfig.key!];
            const bVal = b[sortConfig.key!];
            if (aVal == null && bVal == null) return 0;
            if (aVal == null) return 1;
            if (bVal == null) return -1;
            if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [filteredUsers, sortConfig]);

    const paginatedUsers = useMemo(
        () => sortedUsers.slice((currentPage - 1) * pageSize, currentPage * pageSize),
        [sortedUsers, currentPage, pageSize],
    );

    const handleSort = (key: keyof User) => {
        setSortConfig((prev) => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
        }));
    };

    const handleSelectAll = (e: ChangeEvent<HTMLInputElement>) => {
        setSelectedRows(e.target.checked ? paginatedUsers.map((u) => u.id) : []);
    };

    const handleSelectRow = (id: number) => {
        setSelectedRows((prev) => (prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]));
    };

    const handleDelete = (id: number, name: string) => {
        setDeleteDialog({ open: true, id, name });
    };

    const confirmDelete = () => {
        setHideAlert(false);
        destroy(`/users/${deleteDialog.id}`, {
            onSuccess: () => setDeleteDialog({ open: false, id: 0, name: '' }),
        });
    };

    const handleBulkDelete = () => setShowBulkDeleteDialog(true);

    const confirmBulkDelete = () => {
        setSelectedRows([]);
        setShowBulkDeleteDialog(false);
    };

    const toggleColumnVisibility = (key: UserColumnKey) => {
        setVisibleColumns((prev) => (prev.includes(key) ? prev.filter((c) => c !== key) : [...prev, key]));
    };

    const handleExport = () => {
        const exportCols = USER_COLUMNS.filter((col) => visibleColumns.includes(col.key));
        const rows = sortedUsers.map((row) =>
            exportCols
                .map((col) => {
                    const value = row[col.key];
                    if (col.key === 'created_at' && value) return new Date(value as string).toDateString();
                    if (col.key === 'email_verified_at') return value ? 'Yes' : 'No';
                    if (col.key === 'roles') return Array.isArray(value) ? (value as Role[]).map((r) => r.name).join('; ') : '';
                    return value || '';
                })
                .join(','),
        );

        const csv = [exportCols.map((c) => c.label).join(','), ...rows].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `users-${new Date().toISOString().split('T')[0]}.csv`;
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
        sortedUsers,
        paginatedUsers,
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
