import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { usePermissions } from '@/hooks/useAuth';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type Role, type User } from '@/types';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, ChevronsLeft, ChevronsRight, Megaphone, Search, Shield, UserPlus, X } from 'lucide-react';
import { useMemo, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Users',
        href: '/users',
    },
];

interface PageProps {
    flash: {
        message?: string;
    };
    users: User[];
    roles: Role[];
}

export default function Index() {
    const { flash, users, roles } = usePage().props as unknown as PageProps;
    const { hasPermission } = usePermissions();

    const [hideAlert, setHideAlert] = useState<boolean>(false);
    const { processing, delete: destroy, errors } = useForm();
    const [searchQuery, setSearchQuery] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: keyof User | null; direction: 'asc' | 'desc' }>({
        key: null,
        direction: 'asc',
    });
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [selectedRows, setSelectedRows] = useState<number[]>([]);
    const [visibleColumns, setVisibleColumns] = useState<(keyof User | 'actions')[]>([
        'id',
        'name',
        'email',
        'roles',
        'email_verified_at',
        'created_at',
        'actions',
    ]);

    const handleDelete = (id: number, name: string) => {
        setHideAlert(false);
        if (confirm(`Confirm to delete the user - ${id} ${name}?`)) {
            destroy(`/users/${id}`);
        }
    };

    const handleSort = (key: keyof User) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedRows(paginatedUsers.map((row) => row.id));
        } else {
            setSelectedRows([]);
        }
    };

    const handleSelectRow = (id: number) => {
        setSelectedRows((prev) => (prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]));
    };

    const handleBulkDelete = () => {
        if (confirm(`Delete ${selectedRows.length} selected users?`)) {
            // Implement bulk delete logic here
            alert(`${selectedRows.length} users deleted successfully!`);
            setSelectedRows([]);
        }
    };

    const toggleColumnVisibility = (key: keyof User | 'actions') => {
        setVisibleColumns((prev) => (prev.includes(key) ? prev.filter((col) => col !== key) : [...prev, key]));
    };

    const handleExport = () => {
        const headers = columns.filter((col) => visibleColumns.includes(col.key) && col.key !== 'actions').map((col) => col.label);

        const csvContent = [
            headers.join(','),
            ...sortedUsers.map((row) =>
                columns
                    .filter((col) => visibleColumns.includes(col.key) && col.key !== 'actions')
                    .map((col) => {
                        const value = row[col.key as keyof User];
                        if (col.key === 'created_at' && value) {
                            return new Date(value).toDateString();
                        }
                        if (col.key === 'email_verified_at') {
                            return value ? 'Yes' : 'No';
                        }
                        if (col.key === 'roles') {
                            return Array.isArray(value) ? value.map((r: Role) => r.name).join('; ') : '';
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
        a.download = `users-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    const filteredUsers = useMemo(() => {
        return users.filter((user) => {
            const matchesSearch =
                user.id.toString().includes(searchQuery) ||
                user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                user.roles?.some((role) => role.name.toLowerCase().includes(searchQuery.toLowerCase()));

            return matchesSearch;
        });
    }, [users, searchQuery]);

    const sortedUsers = useMemo(() => {
        if (!sortConfig.key) return filteredUsers;

        return [...filteredUsers].sort((a, b) => {
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
    }, [filteredUsers, sortConfig]);

    const paginatedUsers = useMemo(() => {
        const startIndex = (currentPage - 1) * pageSize;
        return sortedUsers.slice(startIndex, startIndex + pageSize);
    }, [sortedUsers, currentPage, pageSize]);

    const totalPages = Math.ceil(sortedUsers.length / pageSize);

    const columns = [
        { key: 'id' as keyof User, label: 'ID' },
        { key: 'name' as keyof User, label: 'Name' },
        { key: 'email' as keyof User, label: 'Email' },
        { key: 'roles' as keyof User, label: 'Roles' },
        { key: 'email_verified_at' as keyof User, label: 'Verified?' },
        { key: 'created_at' as keyof User, label: 'Created At' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Users" />

            <div className="p-10">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-semibold text-gray-800">Users</h1>
                        {flash.message && !hideAlert && (
                            <Alert variant={'success'} onClose={() => setHideAlert(true)} className="mt-4">
                                <Megaphone className="h-4 w-4" />
                                <AlertTitle className="font-extrabold">Notification</AlertTitle>
                                <AlertDescription>{flash.message}</AlertDescription>
                            </Alert>
                        )}
                    </div>
                    {hasPermission('create-users') && (
                        <Link href="/users/create">
                            <Button>
                                <UserPlus className="mr-2 h-4 w-4" />
                                Create User
                            </Button>
                        </Link>
                    )}
                </div>

                {/* Search Bar */}
                <div className="mb-4 flex flex-col">
                    <label className="mb-1 text-xs font-medium text-gray-600">Search</label>
                    <div className="relative max-w-md">
                        <Search className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 transform text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by ID, Name, Email, or Role..."
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="h-10 w-full rounded-md border-2 border-gray-300 bg-gray-50 py-2 pr-10 pl-10 text-sm text-gray-700 focus:border-blue-600 focus:ring-2 focus:ring-blue-400 focus:outline-none"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute top-1/2 right-3 -translate-y-1/2 transform text-gray-400 hover:text-gray-600"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Bulk Actions */}
                {selectedRows.length > 0 && (
                    <div className="mb-4 flex items-center gap-3 rounded-lg bg-blue-50 p-3">
                        <span className="text-sm font-medium text-gray-700">{selectedRows.length} row(s) selected</span>
                        {hasPermission('delete-users') && (
                            <button
                                onClick={handleBulkDelete}
                                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
                            >
                                Delete Selected
                            </button>
                        )}
                    </div>
                )}

                {/* Custom DataGrid Table */}
                <div className="overflow-hidden rounded-lg bg-white shadow-md">
                    {/* Toolbar */}
                    <div className="flex items-center justify-end gap-2 border-b border-gray-200 bg-gray-50 p-2">
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" size="sm" className="h-8 text-xs">
                                    <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                    </svg>
                                    Columns
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-56" align="end">
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

                        <Button variant="outline" size="sm" className="h-8 text-xs" onClick={handleExport}>
                            <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                />
                            </svg>
                            Export
                        </Button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gradient-to-r from-slate-700 to-slate-800 text-white">
                                <tr>
                                    <th className="px-4 py-3 text-left">
                                        <input
                                            type="checkbox"
                                            checked={paginatedUsers.length > 0 && selectedRows.length === paginatedUsers.length}
                                            onChange={handleSelectAll}
                                            className="h-3.5 w-3.5 cursor-pointer rounded border-gray-300"
                                        />
                                    </th>
                                    {columns
                                        .filter((col) => visibleColumns.includes(col.key))
                                        .map((column) => (
                                            <th
                                                key={String(column.key)}
                                                onClick={() => column.key !== 'roles' && handleSort(column.key)}
                                                className={`px-4 py-3 text-left text-xs font-semibold transition-colors ${
                                                    column.key !== 'roles' ? 'cursor-pointer hover:bg-slate-600' : ''
                                                }`}
                                            >
                                                <div className="flex items-center gap-2">
                                                    {column.label}
                                                    {sortConfig.key === column.key &&
                                                        (sortConfig.direction === 'asc' ? (
                                                            <ChevronUp className="h-3.5 w-3.5" />
                                                        ) : (
                                                            <ChevronDown className="h-3.5 w-3.5" />
                                                        ))}
                                                </div>
                                            </th>
                                        ))}
                                    {visibleColumns.includes('actions') && <th className="px-4 py-3 text-center text-xs font-semibold">Actions</th>}
                                </tr>
                            </thead>
                            <tbody className="text-xs">
                                {paginatedUsers.map((user) => (
                                    <tr
                                        key={user.id}
                                        className={`border-b border-gray-200 transition-all hover:bg-slate-50 ${
                                            selectedRows.includes(user.id) ? 'bg-blue-50' : ''
                                        }`}
                                    >
                                        <td className="px-4 py-3">
                                            <input
                                                type="checkbox"
                                                checked={selectedRows.includes(user.id)}
                                                onChange={() => handleSelectRow(user.id)}
                                                className="h-3.5 w-3.5 cursor-pointer rounded border-gray-300"
                                            />
                                        </td>
                                        {visibleColumns.includes('id') && <td className="px-4 py-3 font-medium text-gray-900">{user.id}</td>}
                                        {visibleColumns.includes('name') && <td className="px-4 py-3 font-medium text-gray-900">{user.name}</td>}
                                        {visibleColumns.includes('email') && <td className="px-4 py-3 text-gray-600">{user.email}</td>}
                                        {visibleColumns.includes('roles') && (
                                            <td className="px-4 py-3">
                                                <div className="flex flex-wrap gap-1">
                                                    {user.roles?.slice(0, 2).map((role) => (
                                                        <Badge key={role.id} variant="outline" className="px-1.5 py-0 text-[10px]">
                                                            <Shield className="mr-0.5 h-2.5 w-2.5" />
                                                            {role.name}
                                                        </Badge>
                                                    ))}
                                                    {user.roles && user.roles.length > 2 && (
                                                        <Badge variant="outline" className="px-1.5 py-0 text-[10px]">
                                                            +{user.roles.length - 2} more
                                                        </Badge>
                                                    )}
                                                    {(!user.roles || user.roles.length === 0) && (
                                                        <span className="text-xs text-gray-500">No roles</span>
                                                    )}
                                                </div>
                                            </td>
                                        )}
                                        {visibleColumns.includes('email_verified_at') && (
                                            <td className="px-4 py-3 text-gray-900">{user.email_verified_at ? 'Yes' : 'No'}</td>
                                        )}
                                        {visibleColumns.includes('created_at') && (
                                            <td className="px-4 py-3 text-gray-900">{new Date(user.created_at).toDateString()}</td>
                                        )}
                                        {visibleColumns.includes('actions') && (
                                            <td className="px-4 py-3">
                                                <div className="flex justify-center gap-1.5">
                                                    {hasPermission('update-users') && (
                                                        <Link href={`/users/${user.id}/edit`}>
                                                            <Button
                                                                disabled={processing}
                                                                size="sm"
                                                                className="h-7 bg-blue-500 px-2.5 text-xs hover:bg-blue-700"
                                                            >
                                                                Edit
                                                            </Button>
                                                        </Link>
                                                    )}

                                                    {hasPermission('delete-users') && (
                                                        <Button
                                                            disabled={processing}
                                                            size="sm"
                                                            onClick={() => handleDelete(user.id, user.name)}
                                                            className="h-7 bg-red-500 px-2.5 text-xs hover:bg-red-700"
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
                </div>

                {/* Pagination Footer */}
                <div className="mt-4 flex items-center justify-between rounded-lg bg-white p-4 shadow-md">
                    <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-700">Rows per page:</span>
                        <select
                            value={pageSize}
                            onChange={(e) => {
                                setPageSize(Number(e.target.value));
                                setCurrentPage(1);
                            }}
                            className="rounded-lg border border-gray-300 px-3 py-1 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                        >
                            <option value={5}>5</option>
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                        </select>
                        <span className="text-sm text-gray-700">
                            {sortedUsers.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} - {Math.min(currentPage * pageSize, sortedUsers.length)}{' '}
                            of {sortedUsers.length}
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setCurrentPage(1)}
                            disabled={currentPage === 1}
                            className="rounded-lg p-2 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <ChevronsLeft className="h-5 w-5" />
                        </button>
                        <button
                            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            className="rounded-lg p-2 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <ChevronLeft className="h-5 w-5" />
                        </button>
                        <span className="px-4 py-2 text-sm font-medium">
                            Page {currentPage} of {totalPages || 1}
                        </span>
                        <button
                            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages || totalPages === 0}
                            className="rounded-lg p-2 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <ChevronRight className="h-5 w-5" />
                        </button>
                        <button
                            onClick={() => setCurrentPage(totalPages)}
                            disabled={currentPage === totalPages || totalPages === 0}
                            className="rounded-lg p-2 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <ChevronsRight className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
