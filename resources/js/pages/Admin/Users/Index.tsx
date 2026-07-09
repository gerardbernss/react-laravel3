import { AppBadge } from '@/components/AppBadge';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { TablePagination } from '@/components/ui/table-pagination';
import { BODY_TEXT, CARD, LABEL_TEXT, PAGE_PADDING, PAGE_TITLE, TABLE_HEADER_CELL, TABLE_HEADER_CELL_CENTER, TABLE_ROW_ACTION, TABLE_ROW_ACTION_DANGER } from '@/constants/ui';
import { usePermissions } from '@/hooks/useAuth';
import { USER_COLUMNS, useUserTable, type UserColumnKey } from '@/hooks/useUserTable';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type User } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import {
    ChevronDown,
    ChevronUp,
    Columns,
    Download,
    Megaphone,
    Pencil,
    Search,
    Shield,
    Trash2,
    UserPlus,
    X,
} from 'lucide-react';

interface PageProps {
    flash: { message?: string };
    users: User[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Users', href: '/admin/users' },
];

interface UserTableRowProps {
    user: User;
    visibleColumns: UserColumnKey[];
    isSelected: boolean;
    processing: boolean;
    onSelect: (id: number) => void;
    onDelete: (id: number, name: string) => void;
}

function UserTableRow({ user, visibleColumns, isSelected, processing, onSelect, onDelete }: UserTableRowProps) {
    const { hasPermission } = usePermissions();

    return (
        <tr className={`hover:bg-gray-50 ${isSelected ? 'bg-blue-50' : ''}`}>
            <td className="whitespace-nowrap px-6 py-4">
                <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onSelect(user.id)}
                    className="h-4 w-4 rounded border-gray-300"
                />
            </td>
            {visibleColumns.includes('id') && (
                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">{user.id}</td>
            )}
            {visibleColumns.includes('name') && (
                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">{user.name}</td>
            )}
            {visibleColumns.includes('email') && (
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">{user.email}</td>
            )}
            {visibleColumns.includes('roles') && (
                <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                        {user.roles?.slice(0, 2).map((role) => (
                            <Badge key={role.id} variant="outline" className="text-xs">
                                <Shield className="mr-1 h-3 w-3" />
                                {role.name}
                            </Badge>
                        ))}
                        {user.roles && user.roles.length > 2 && (
                            <Badge variant="outline" className="text-xs">+{user.roles.length - 2}</Badge>
                        )}
                        {(!user.roles || user.roles.length === 0) && (
                            <span className="text-sm text-gray-400">No roles</span>
                        )}
                    </div>
                </td>
            )}
            {visibleColumns.includes('email_verified_at') && (
                <td className="whitespace-nowrap px-6 py-4 text-sm">
                    <AppBadge status={user.email_verified_at ? 'active' : 'inactive'}>
                        {user.email_verified_at ? 'Yes' : 'No'}
                    </AppBadge>
                </td>
            )}
            {visibleColumns.includes('created_at') && (
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                    {new Date(user.created_at).toLocaleDateString()}
                </td>
            )}
            {visibleColumns.includes('actions') && (
                <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex justify-center gap-2">
                        {hasPermission('update-users') && (
                            <Link href={`/admin/users/${user.id}/edit`}>
                                <button className={TABLE_ROW_ACTION}>
                                    <Pencil className="h-3 w-3" /> Edit
                                </button>
                            </Link>
                        )}
                        {hasPermission('delete-users') && (
                            <button
                                disabled={processing}
                                onClick={() => onDelete(user.id, user.name)}
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

export default function Index() {
    const { flash, users } = usePage().props as unknown as PageProps;
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
    } = useUserTable(users);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Users" />

            <div className={`space-y-6 ${PAGE_PADDING}`}>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className={PAGE_TITLE}>Users</h1>
                        <p className={`mt-1 ${BODY_TEXT}`}>Manage system users and their roles</p>
                    </div>
                    {hasPermission('create-users') && (
                        <Link href="/admin/users/create">
                            <Button>
                                <UserPlus className="mr-2 h-4 w-4" />
                                Create User
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

                <div className={`${CARD} p-6`}>
                    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
                        <div className="flex-1 md:max-w-sm">
                            <label className={`mb-1 block ${LABEL_TEXT}`}>Search</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                <Input
                                    type="text"
                                    placeholder="Search by ID, Name, Email, or Role..."
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
                                        {[...USER_COLUMNS, { key: 'actions' as const, label: 'Actions' }].map((col) => (
                                            <div key={String(col.key)} className="flex items-center space-x-2">
                                                <input
                                                    type="checkbox"
                                                    id={`user-col-${String(col.key)}`}
                                                    checked={visibleColumns.includes(col.key)}
                                                    onChange={() => toggleColumnVisibility(col.key)}
                                                    className="h-4 w-4 rounded border-gray-300"
                                                />
                                                <label htmlFor={`user-col-${String(col.key)}`} className="text-sm">
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
                        {hasPermission('delete-users') && (
                            <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Selected
                            </Button>
                        )}
                    </div>
                )}

                <div className={`overflow-hidden ${CARD}`}>
                    <div className="max-h-[70vh] overflow-x-auto overflow-y-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="sticky top-0 z-10 bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left">
                                        <input
                                            type="checkbox"
                                            checked={paginatedUsers.length > 0 && selectedRows.length === paginatedUsers.length}
                                            onChange={handleSelectAll}
                                            className="h-4 w-4 rounded border-gray-300"
                                        />
                                    </th>
                                    {USER_COLUMNS.filter((col) => visibleColumns.includes(col.key)).map((col) => (
                                        <th
                                            key={String(col.key)}
                                            onClick={() => col.key !== 'roles' && handleSort(col.key)}
                                            className={`${TABLE_HEADER_CELL} ${col.key !== 'roles' ? 'cursor-pointer hover:bg-gray-100' : ''}`}
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
                                {paginatedUsers.length > 0 ? (
                                    paginatedUsers.map((user) => (
                                        <UserTableRow
                                            key={user.id}
                                            user={user}
                                            visibleColumns={visibleColumns}
                                            isSelected={selectedRows.includes(user.id)}
                                            processing={processing}
                                            onSelect={handleSelectRow}
                                            onDelete={handleDelete}
                                        />
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={USER_COLUMNS.length + 2} className="px-6 py-12 text-center">
                                            <span className={BODY_TEXT}>No users found.</span>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <TablePagination
                        total={sortedUsers.length}
                        pageSize={pageSize}
                        currentPage={currentPage}
                        onPageChange={setCurrentPage}
                        onPageSizeChange={(s) => { setPageSize(s); setCurrentPage(1); }}
                    />
                </div>
            </div>

            <ConfirmDialog
                open={deleteDialog.open}
                onClose={() => setDeleteDialog({ open: false, id: 0, name: '' })}
                onConfirm={confirmDelete}
                title="Delete User"
                description={`Are you sure you want to delete "${deleteDialog.name}"? This action cannot be undone.`}
                confirmLabel="Delete"
                processingLabel="Deleting..."
                processing={processing}
            />
            <ConfirmDialog
                open={showBulkDeleteDialog}
                onClose={() => setShowBulkDeleteDialog(false)}
                onConfirm={confirmBulkDelete}
                title="Delete Selected Users"
                description={`Are you sure you want to delete ${selectedRows.length} selected user(s)? This action cannot be undone.`}
                confirmLabel="Delete All"
                processingLabel="Deleting..."
                processing={processing}
            />
        </AppLayout>
    );
}
