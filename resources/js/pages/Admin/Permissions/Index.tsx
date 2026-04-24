import { ConfirmDialog } from '@/components/confirm-dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { usePermissions } from '@/hooks/useAuth';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type Permission } from '@/types';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import {
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    ChevronUp,
    ChevronsLeft,
    ChevronsRight,
    Columns,
    Download,
    Key,
    Megaphone,
    Plus,
    Search,
    Trash2,
    Users,
    X,
} from 'lucide-react';
import { useMemo, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Permissions', href: '/permissions' },
];

interface PageProps {
    flash: {
        message?: string;
    };
    permissions: Permission[];
}

export default function Index() {
    const { flash, permissions } = usePage().props as unknown as PageProps;
    const { hasPermission } = usePermissions();

    const [hideAlert, setHideAlert] = useState<boolean>(false);
    const { processing, delete: destroy } = useForm();
    const [searchQuery, setSearchQuery] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: keyof Permission | null; direction: 'asc' | 'desc' }>({
        key: null,
        direction: 'asc',
    });
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [selectedRows, setSelectedRows] = useState<number[]>([]);
    const [visibleColumns, setVisibleColumns] = useState<(keyof Permission | 'actions')[]>([
        'id',
        'name',
        'slug',
        'description',
        'roles_count',
        'created_at',
        'actions',
    ]);

    const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: number; name: string }>({ open: false, id: 0, name: '' });
    const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);

    const handleDelete = (id: number, name: string) => {
        setDeleteDialog({ open: true, id, name });
    };

    const confirmDelete = () => {
        setHideAlert(false);
        destroy(`/permissions/${deleteDialog.id}`, {
            onSuccess: () => setDeleteDialog({ open: false, id: 0, name: '' }),
        });
    };

    const handleSort = (key: keyof Permission) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedRows(paginatedPermissions.map((row) => row.id));
        } else {
            setSelectedRows([]);
        }
    };

    const handleSelectRow = (id: number) => {
        setSelectedRows((prev) => (prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]));
    };

    const handleBulkDelete = () => {
        setShowBulkDeleteDialog(true);
    };

    const confirmBulkDelete = () => {
        // TODO: implement actual bulk delete endpoint
        setSelectedRows([]);
        setShowBulkDeleteDialog(false);
    };

    const toggleColumnVisibility = (key: keyof Permission | 'actions') => {
        setVisibleColumns((prev) => (prev.includes(key) ? prev.filter((col) => col !== key) : [...prev, key]));
    };

    const handleExport = () => {
        const headers = columns.filter((col) => visibleColumns.includes(col.key) && col.key !== 'actions').map((col) => col.label);

        const csvContent = [
            headers.join(','),
            ...sortedPermissions.map((row) =>
                columns
                    .filter((col) => visibleColumns.includes(col.key) && col.key !== 'actions')
                    .map((col) => {
                        const value = row[col.key as keyof Permission];
                        if (col.key === 'created_at' && value) {
                            return new Date(value as string).toDateString();
                        }
                        if (col.key === 'roles_count') {
                            return value || 0;
                        }
                        return value || '';
                    })
                    .join(','),
            ),
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `permissions-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    const filteredPermissions = useMemo(() => {
        return permissions.filter((permission) => {
            const matchesSearch =
                permission.id.toString().includes(searchQuery) ||
                permission.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                permission.slug?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                permission.description?.toLowerCase().includes(searchQuery.toLowerCase());

            return matchesSearch;
        });
    }, [permissions, searchQuery]);

    const sortedPermissions = useMemo(() => {
        if (!sortConfig.key) return filteredPermissions;

        return [...filteredPermissions].sort((a, b) => {
            const aValue = a[sortConfig.key!];
            const bValue = b[sortConfig.key!];

            if (aValue == null && bValue == null) return 0;
            if (aValue == null) return 1;
            if (bValue == null) return -1;

            if (aValue < bValue) {
                return sortConfig.direction === 'asc' ? -1 : 1;
            }
            if (aValue > bValue) {
                return sortConfig.direction === 'asc' ? 1 : -1;
            }
            return 0;
        });
    }, [filteredPermissions, sortConfig]);

    const paginatedPermissions = useMemo(() => {
        const startIndex = (currentPage - 1) * pageSize;
        return sortedPermissions.slice(startIndex, startIndex + pageSize);
    }, [sortedPermissions, currentPage, pageSize]);

    const totalPages = Math.ceil(sortedPermissions.length / pageSize);

    const columns = [
        { key: 'id' as keyof Permission, label: 'ID' },
        { key: 'name' as keyof Permission, label: 'Name' },
        { key: 'slug' as keyof Permission, label: 'Slug' },
        { key: 'description' as keyof Permission, label: 'Description' },
        { key: 'roles_count' as keyof Permission, label: 'Roles Count' },
        { key: 'created_at' as keyof Permission, label: 'Created At' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Permissions" />

            <div className="space-y-6 p-6 md:p-10">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">System Permissions</h1>
                        <p className="mt-1 text-gray-600">Manage system permissions and access controls</p>
                    </div>
                    {hasPermission('create-permissions') && (
                        <Link href="/permissions/create">
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Create Permission
                            </Button>
                        </Link>
                    )}
                </div>

                {/* Flash Message */}
                {flash.message && !hideAlert && (
                    <Alert variant="default" className="border-green-200 bg-green-50">
                        <Megaphone className="h-4 w-4 text-green-600" />
                        <AlertTitle className="text-green-800">Success</AlertTitle>
                        <AlertDescription className="text-green-700">{flash.message}</AlertDescription>
                        <button onClick={() => setHideAlert(true)} className="absolute right-4 top-4">
                            <X className="h-4 w-4 text-green-600" />
                        </button>
                    </Alert>
                )}

                {/* Filters */}
                <div className="rounded-lg border bg-white p-6 shadow-sm">
                    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
                        {/* Search */}
                        <div className="flex-1 md:max-w-sm">
                            <label className="mb-1 block text-sm font-medium text-gray-700">Search</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                <Input
                                    type="text"
                                    placeholder="Search by ID, Name, Slug, or Description..."
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                    className="pl-10 pr-10"
                                />
                                {searchQuery && (
                                    <button
                                        onClick={() => setSearchQuery('')}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Columns + Export */}
                        <div className="flex gap-2">
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline">
                                        <Columns className="mr-2 h-4 w-4" />
                                        Columns
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-48" align="end">
                                    <div className="space-y-2">
                                        <h4 className="mb-2 text-sm font-semibold">Toggle Columns</h4>
                                        {[...columns, { key: 'actions' as const, label: 'Actions' }].map((column) => (
                                            <div key={String(column.key)} className="flex items-center space-x-2">
                                                <input
                                                    type="checkbox"
                                                    id={String(column.key)}
                                                    checked={visibleColumns.includes(column.key)}
                                                    onChange={() => toggleColumnVisibility(column.key)}
                                                    className="h-4 w-4 rounded border-gray-300"
                                                />
                                                <label htmlFor={String(column.key)} className="text-sm">
                                                    {column.label}
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </PopoverContent>
                            </Popover>

                            <Button variant="outline" onClick={handleExport}>
                                <Download className="mr-2 h-4 w-4" />
                                Export
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Bulk Actions */}
                {selectedRows.length > 0 && (
                    <div className="flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4">
                        <span className="text-sm font-medium text-blue-800">{selectedRows.length} row(s) selected</span>
                        {hasPermission('delete-permissions') && (
                            <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Selected
                            </Button>
                        )}
                    </div>
                )}

                {/* Table */}
                {permissions?.length > 0 ? (
                    <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
                        <div className="max-h-[70vh] overflow-x-auto overflow-y-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="sticky top-0 z-10 bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left">
                                            <input
                                                type="checkbox"
                                                checked={paginatedPermissions.length > 0 && selectedRows.length === paginatedPermissions.length}
                                                onChange={handleSelectAll}
                                                className="h-4 w-4 rounded border-gray-300"
                                            />
                                        </th>
                                        {columns
                                            .filter((col) => visibleColumns.includes(col.key))
                                            .map((column) => (
                                                <th
                                                    key={String(column.key)}
                                                    onClick={() => handleSort(column.key)}
                                                    className="cursor-pointer px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 hover:bg-gray-100"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        {column.label}
                                                        {sortConfig.key === column.key &&
                                                            (sortConfig.direction === 'asc' ? (
                                                                <ChevronUp className="h-4 w-4" />
                                                            ) : (
                                                                <ChevronDown className="h-4 w-4" />
                                                            ))}
                                                    </div>
                                                </th>
                                            ))}
                                        {visibleColumns.includes('actions') && (
                                            <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                                                Actions
                                            </th>
                                        )}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white">
                                    {paginatedPermissions.map((permission) => (
                                        <tr
                                            key={permission.id}
                                            className={`hover:bg-gray-50 ${selectedRows.includes(permission.id) ? 'bg-blue-50' : ''}`}
                                        >
                                            <td className="whitespace-nowrap px-6 py-4">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedRows.includes(permission.id)}
                                                    onChange={() => handleSelectRow(permission.id)}
                                                    className="h-4 w-4 rounded border-gray-300"
                                                />
                                            </td>
                                            {visibleColumns.includes('id') && (
                                                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">{permission.id}</td>
                                            )}
                                            {visibleColumns.includes('name') && (
                                                <td className="whitespace-nowrap px-6 py-4 text-sm">
                                                    <div className="flex items-center gap-2 font-medium text-gray-900">
                                                        <Key className="h-4 w-4" />
                                                        {permission.name}
                                                    </div>
                                                </td>
                                            )}
                                            {visibleColumns.includes('slug') && (
                                                <td className="whitespace-nowrap px-6 py-4 text-sm">
                                                    <Badge variant="outline" className="font-mono text-xs">
                                                        {permission.slug}
                                                    </Badge>
                                                </td>
                                            )}
                                            {visibleColumns.includes('description') && (
                                                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                                                    {permission.description || 'No description'}
                                                </td>
                                            )}
                                            {visibleColumns.includes('roles_count') && (
                                                <td className="whitespace-nowrap px-6 py-4 text-sm">
                                                    <div className="flex items-center gap-1 text-gray-600">
                                                        <Users className="h-4 w-4" />
                                                        {permission.roles_count || 0}
                                                    </div>
                                                </td>
                                            )}
                                            {visibleColumns.includes('created_at') && (
                                                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                                                    {new Date(permission.created_at).toLocaleDateString()}
                                                </td>
                                            )}
                                            {visibleColumns.includes('actions') && (
                                                <td className="whitespace-nowrap px-6 py-4">
                                                    <div className="flex justify-center gap-2">
                                                        {hasPermission('view-permissions') && (
                                                            <Link href={`/permissions/${permission.id}`}>
                                                                <Button variant="outline" size="sm" disabled={processing}>
                                                                    View
                                                                </Button>
                                                            </Link>
                                                        )}
                                                        {hasPermission('update-permissions') && (
                                                            <Link href={`/permissions/${permission.id}/edit`}>
                                                                <Button variant="outline" size="sm" disabled={processing}>
                                                                    Edit
                                                                </Button>
                                                            </Link>
                                                        )}
                                                        {hasPermission('delete-permissions') && (
                                                            <Button
                                                                variant="destructive"
                                                                size="sm"
                                                                disabled={processing}
                                                                onClick={() => handleDelete(permission.id, permission.name)}
                                                            >
                                                                Delete
                                                            </Button>
                                                        )}
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    <div className="flex items-center justify-between border-t bg-white px-4 py-3">
                        <div className="flex items-center gap-3">
                            <span className="text-sm text-gray-700">Rows per page:</span>
                            <select
                                value={pageSize}
                                onChange={(e) => {
                                    setPageSize(Number(e.target.value));
                                    setCurrentPage(1);
                                }}
                                className="rounded-md border border-gray-300 px-3 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            >
                                <option value={5}>5</option>
                                <option value={10}>10</option>
                                <option value={25}>25</option>
                                <option value={50}>50</option>
                            </select>
                            <span className="text-sm text-gray-600">
                                {sortedPermissions.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} -{' '}
                                {Math.min(currentPage * pageSize, sortedPermissions.length)} of {sortedPermissions.length}
                            </span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Button variant="outline" size="sm" onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>
                                <ChevronsLeft className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))} disabled={currentPage === 1}>
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <span className="px-3 py-1 text-sm">Page {currentPage} of {totalPages || 1}</span>
                            <Button variant="outline" size="sm" onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages || totalPages === 0}>
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages || totalPages === 0}>
                                <ChevronsRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                    </div>
                ) : (
                    <div className="rounded-lg border bg-white p-12 text-center shadow-sm">
                        <Key className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-4 text-lg font-semibold text-gray-900">No permissions found</h3>
                        <p className="mt-2 text-gray-600">Get started by creating your first permission.</p>
                        {hasPermission('create-permissions') && (
                            <Link href="/permissions/create">
                                <Button className="mt-4">
                                    <Plus className="mr-2 h-4 w-4" />
                                    Create Permission
                                </Button>
                            </Link>
                        )}
                    </div>
                )}

            </div>
            <ConfirmDialog
                open={deleteDialog.open}
                onClose={() => setDeleteDialog({ open: false, id: 0, name: '' })}
                onConfirm={confirmDelete}
                title="Delete Permission"
                description={`Are you sure you want to delete "${deleteDialog.name}"? This action cannot be undone.`}
                confirmLabel="Delete"
                processingLabel="Deleting..."
                processing={processing}
            />
            <ConfirmDialog
                open={showBulkDeleteDialog}
                onClose={() => setShowBulkDeleteDialog(false)}
                onConfirm={confirmBulkDelete}
                title="Delete Selected Permissions"
                description={`Are you sure you want to delete ${selectedRows.length} selected permission(s)? This action cannot be undone.`}
                confirmLabel="Delete All"
                processingLabel="Deleting..."
                processing={processing}
            />
        </AppLayout>
    );
}
