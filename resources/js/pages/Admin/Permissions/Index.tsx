import { ConfirmDialog } from '@/components/confirm-dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { TablePagination } from '@/components/ui/table-pagination';
import { BODY_TEXT, CARD, LABEL_TEXT, PAGE_PADDING, PAGE_TITLE, SECTION_HEADING, TABLE_HEADER_CELL, TABLE_HEADER_CELL_CENTER, TABLE_ROW_ACTION, TABLE_ROW_ACTION_DANGER } from '@/constants/ui';
import { usePermissions } from '@/hooks/useAuth';
import { PERMISSION_COLUMNS, usePermissionTable, type PermissionColumnKey } from '@/hooks/usePermissionTable';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type Permission } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import {
    ChevronDown,
    ChevronUp,
    Columns,
    Download,
    Eye,
    Key,
    Megaphone,
    Pencil,
    Plus,
    Search,
    Trash2,
    Users,
    X,
} from 'lucide-react';

interface PageProps {
    flash: { message?: string };
    permissions: Permission[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Permissions', href: '/admin/permissions' },
];

interface PermissionTableRowProps {
    permission: Permission;
    visibleColumns: PermissionColumnKey[];
    isSelected: boolean;
    processing: boolean;
    onSelect: (id: number) => void;
    onDelete: (id: number, name: string) => void;
}

function PermissionTableRow({ permission, visibleColumns, isSelected, processing, onSelect, onDelete }: PermissionTableRowProps) {
    const { hasPermission } = usePermissions();

    return (
        <tr className={`hover:bg-gray-50 ${isSelected ? 'bg-blue-50' : ''}`}>
            <td className="whitespace-nowrap px-6 py-4">
                <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onSelect(permission.id)}
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
                    <Badge variant="outline" className="font-mono text-xs">{permission.slug}</Badge>
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
                            <Link href={`/admin/permissions/${permission.id}`}>
                                <button className={TABLE_ROW_ACTION}>
                                    <Eye className="h-3 w-3" /> View
                                </button>
                            </Link>
                        )}
                        {hasPermission('update-permissions') && (
                            <Link href={`/admin/permissions/${permission.id}/edit`}>
                                <button className={TABLE_ROW_ACTION}>
                                    <Pencil className="h-3 w-3" /> Edit
                                </button>
                            </Link>
                        )}
                        {hasPermission('delete-permissions') && (
                            <button
                                disabled={processing}
                                onClick={() => onDelete(permission.id, permission.name)}
                                className={TABLE_ROW_ACTION_DANGER}
                            >
                                <Trash2 className="h-3 w-3" /> Delete
                            </button>
                        )}
                    </div>
                </td>
            )}
        </tr>
    );
}

/** Admin permissions list with search, sort, and delete actions. */
export default function Index() {
    const { flash, permissions } = usePage().props as unknown as PageProps;
    const { hasPermission } = usePermissions();
    const {
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
    } = usePermissionTable(permissions);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Permissions" />

            <div className={`space-y-6 ${PAGE_PADDING}`}>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className={PAGE_TITLE}>System Permissions</h1>
                        <p className={`mt-1 ${BODY_TEXT}`}>Manage system permissions and access controls</p>
                    </div>
                    {hasPermission('create-permissions') && (
                        <Link href="/admin/permissions/create">
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Create Permission
                            </Button>
                        </Link>
                    )}
                </div>

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

                <div>
                    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
                        <div className="flex-1 md:max-w-sm">
                            <label className={`mb-1 block ${LABEL_TEXT}`}>Search</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                <Input
                                    type="text"
                                    placeholder="Search by ID, Name, Slug, or Description..."
                                    value={searchQuery}
                                    onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
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
                                        {[...PERMISSION_COLUMNS, { key: 'actions' as const, label: 'Actions' }].map((col) => (
                                            <div key={String(col.key)} className="flex items-center space-x-2">
                                                <input
                                                    type="checkbox"
                                                    id={`perm-col-${String(col.key)}`}
                                                    checked={visibleColumns.includes(col.key)}
                                                    onChange={() => toggleColumnVisibility(col.key)}
                                                    className="h-4 w-4 rounded border-gray-300"
                                                />
                                                <label htmlFor={`perm-col-${String(col.key)}`} className="text-sm">
                                                    {col.label}
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

                {permissions?.length > 0 ? (
                    <div className={`overflow-hidden ${CARD}`}>
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
                                        {PERMISSION_COLUMNS.filter((col) => visibleColumns.includes(col.key)).map((col) => (
                                            <th
                                                key={String(col.key)}
                                                onClick={() => handleSort(col.key)}
                                                className={`${TABLE_HEADER_CELL} cursor-pointer hover:bg-gray-100`}
                                            >
                                                <div className="flex items-center gap-2">
                                                    {col.label}
                                                    {sortConfig.key === col.key &&
                                                        (sortConfig.direction === 'asc' ? (
                                                            <ChevronUp className="h-4 w-4" />
                                                        ) : (
                                                            <ChevronDown className="h-4 w-4" />
                                                        ))}
                                                </div>
                                            </th>
                                        ))}
                                        {visibleColumns.includes('actions') && (
                                            <th className={TABLE_HEADER_CELL_CENTER}>Actions</th>
                                        )}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white">
                                    {paginatedPermissions.map((permission) => (
                                        <PermissionTableRow
                                            key={permission.id}
                                            permission={permission}
                                            visibleColumns={visibleColumns}
                                            isSelected={selectedRows.includes(permission.id)}
                                            processing={processing}
                                            onSelect={handleSelectRow}
                                            onDelete={handleDelete}
                                        />
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <TablePagination
                            total={sortedPermissions.length}
                            pageSize={pageSize}
                            currentPage={currentPage}
                            onPageChange={setCurrentPage}
                            onPageSizeChange={(s) => { setPageSize(s); setCurrentPage(1); }}
                        />
                    </div>
                ) : (
                    <div className={`${CARD} p-12 text-center`}>
                        <Key className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className={`mt-4 ${SECTION_HEADING}`}>No permissions found</h3>
                        <p className={`mt-2 ${BODY_TEXT}`}>Get started by creating your first permission.</p>
                        {hasPermission('create-permissions') && (
                            <Link href="/admin/permissions/create">
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
