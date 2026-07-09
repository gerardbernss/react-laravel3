import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TablePagination } from '@/components/ui/table-pagination';
import { CARD, FILTER_CARD, PAGE_PADDING, PAGE_TITLE, TABLE_HEADER_CELL, TABLE_HEADER_CELL_CENTER, TABLE_ROW, TABLE_ROW_ACTION } from '@/constants/ui';
import { usePortalCredentials, type Credential, type CredentialSortKey } from '@/hooks/usePortalCredentials';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { ChevronDown, ChevronUp, Eye, Key, KeyRound, Mail, RefreshCw, Search } from 'lucide-react';

interface Props {
    credentials: Credential[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Portal Credentials', href: '/admin/portal-credentials' },
];

function SortIcon({ col, sortConfig }: { col: CredentialSortKey; sortConfig: { key: CredentialSortKey | null; direction: 'asc' | 'desc' } }) {
    if (sortConfig.key !== col) return <ChevronUp className="ml-1 inline h-3 w-3 opacity-30" />;
    return sortConfig.direction === 'asc'
        ? <ChevronUp className="ml-1 inline h-3 w-3" />
        : <ChevronDown className="ml-1 inline h-3 w-3" />;
}

function getStatusBadge(status: string) {
    switch (status?.toLowerCase()) {
        case 'active':    return <Badge className="bg-green-100 text-green-800">Active</Badge>;
        case 'suspended': return <Badge variant="destructive">Suspended</Badge>;
        case 'inactive':  return <Badge variant="secondary">Inactive</Badge>;
        default:          return <Badge variant="outline">{status || 'Active'}</Badge>;
    }
}

interface CredentialRowProps {
    credential: Credential;
    onSend: (credential: Credential) => void;
    onResend: (credential: Credential) => void;
}

function CredentialRow({ credential, onSend, onResend }: CredentialRowProps) {
    return (
        <tr className={TABLE_ROW}>
            <td className="px-4 py-3">
                <p className="font-medium text-gray-900">
                    {credential.personal_data?.first_name} {credential.personal_data?.last_name}
                </p>
                <p className="text-sm text-gray-500">{credential.personal_data?.email}</p>
            </td>
            <td className="px-4 py-3 font-mono text-gray-600">{credential.username}</td>
            <td className="px-4 py-3 text-center">{getStatusBadge(credential.access_status)}</td>
            <td className="px-4 py-3 text-center text-gray-600">{credential.login_attempts || 0}/5</td>
            <td className="px-4 py-3 text-gray-600">
                {credential.last_login_at
                    ? new Date(credential.last_login_at).toLocaleDateString()
                    : 'Never'}
            </td>
            <td className="px-4 py-3 text-center">
                {credential.credentials_sent_at ? (
                    <Badge className="bg-green-100 text-green-800">
                        {new Date(credential.credentials_sent_at).toLocaleDateString()}
                    </Badge>
                ) : (
                    <Badge variant="secondary">Not Sent</Badge>
                )}
            </td>
            <td className="px-4 py-3">
                <div className="flex justify-center gap-1">
                    <Link href={`/admin/portal-credentials/${credential.id}`}>
                        <Button variant="outline" size="sm" title="View Details">
                            <Eye className="h-4 w-4" />
                        </Button>
                    </Link>
                    {!credential.credentials_sent_at && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onSend(credential)}
                            className="text-green-600 hover:text-green-700"
                            title="Send Credentials"
                        >
                            <Mail className="h-4 w-4" />
                        </Button>
                    )}
                    {credential.credentials_sent_at && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onResend(credential)}
                            className="text-purple-600 hover:text-purple-700"
                            title="Resend Credentials"
                        >
                            <RefreshCw className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </td>
        </tr>
    );
}

/** Portal credentials list for admissions staff — search, filter by status, and manage applicant login credentials. */
export default function Index({ credentials }: Props) {
    const {
        sendDialogOpen, setSendDialogOpen,
        resendDialogOpen, setResendDialogOpen,
        selectedCredential,
        searchQuery, setSearchQuery,
        selectedStatus, setSelectedStatus,
        currentPage, setCurrentPage,
        pageSize, setPageSize,
        sortConfig,
        hasFilters,
        sortedItems,
        paginatedItems,
        toggleSort,
        clearFilters,
        openSendDialog,
        openResendDialog,
        handleSendCredentials,
        handleResend,
    } = usePortalCredentials(credentials);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Portal Credentials" />

            <div className={`space-y-6 ${PAGE_PADDING}`}>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <KeyRound className="h-7 w-7 text-primary" />
                        <h1 className={PAGE_TITLE}>Portal Credentials</h1>
                    </div>
                </div>

                <div className={FILTER_CARD}>
                    <div className="mb-3">
                        <label className="mb-1 block text-xs font-medium text-gray-600">Search</label>
                        <div className="relative w-full md:w-[400px]">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <Input
                                placeholder="Search by name, email, or username..."
                                value={searchQuery}
                                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                                className="pl-10"
                            />
                        </div>
                    </div>
                    <div className="flex flex-wrap items-end gap-3">
                        <Select value={selectedStatus || 'all'} onValueChange={(v) => { setSelectedStatus(v === 'all' ? '' : v); setCurrentPage(1); }}>
                            <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="Active">Active</SelectItem>
                                <SelectItem value="Inactive">Inactive</SelectItem>
                                <SelectItem value="Suspended">Suspended</SelectItem>
                            </SelectContent>
                        </Select>
                        {hasFilters && <Button variant="ghost" onClick={clearFilters}>Clear</Button>}
                    </div>
                </div>

                <div className={`overflow-hidden ${CARD}`}>
                    <div className="max-h-[70vh] overflow-x-auto overflow-y-auto">
                        <table className="w-full text-sm">
                            <thead className="sticky top-0 z-10 bg-gray-50">
                                <tr>
                                    <th className={`${TABLE_HEADER_CELL} cursor-pointer hover:bg-gray-100`} onClick={() => toggleSort('name')}>
                                        Name <SortIcon col="name" sortConfig={sortConfig} />
                                    </th>
                                    <th className={`${TABLE_HEADER_CELL} cursor-pointer hover:bg-gray-100`} onClick={() => toggleSort('username')}>
                                        Username (Email) <SortIcon col="username" sortConfig={sortConfig} />
                                    </th>
                                    <th className={`${TABLE_HEADER_CELL_CENTER} cursor-pointer hover:bg-gray-100`} onClick={() => toggleSort('status')}>
                                        Status <SortIcon col="status" sortConfig={sortConfig} />
                                    </th>
                                    <th className={TABLE_HEADER_CELL_CENTER}>Login Attempts</th>
                                    <th className={`${TABLE_HEADER_CELL} cursor-pointer hover:bg-gray-100`} onClick={() => toggleSort('last_login_at')}>
                                        Last Login <SortIcon col="last_login_at" sortConfig={sortConfig} />
                                    </th>
                                    <th className={`${TABLE_HEADER_CELL_CENTER} cursor-pointer hover:bg-gray-100`} onClick={() => toggleSort('credentials_sent_at')}>
                                        Credentials Sent <SortIcon col="credentials_sent_at" sortConfig={sortConfig} />
                                    </th>
                                    <th className={TABLE_HEADER_CELL_CENTER}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedItems.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-4 py-12 text-center">
                                            <Key className="mx-auto h-10 w-10 text-gray-300" />
                                            <p className="mt-2 text-gray-500">
                                                {hasFilters ? 'No credentials match your filters.' : 'No portal credentials found.'}
                                            </p>
                                        </td>
                                    </tr>
                                ) : paginatedItems.map((credential) => (
                                    <CredentialRow
                                        key={credential.id}
                                        credential={credential}
                                        onSend={openSendDialog}
                                        onResend={openResendDialog}
                                    />
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <TablePagination
                        total={sortedItems.length}
                        pageSize={pageSize}
                        currentPage={currentPage}
                        onPageChange={setCurrentPage}
                        onPageSizeChange={(s) => { setPageSize(s); setCurrentPage(1); }}
                    />
                </div>
            </div>

            <AlertDialog open={sendDialogOpen} onOpenChange={setSendDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Send Portal Credentials</AlertDialogTitle>
                        <AlertDialogDescription>
                            {selectedCredential && (
                                <>
                                    Login credentials will be sent to <strong>{selectedCredential.personal_data?.email}</strong>.
                                    <br /><br />
                                    The applicant will use these credentials to access their portal.
                                </>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleSendCredentials}>Send Credentials</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={resendDialogOpen} onOpenChange={setResendDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Resend Portal Credentials</AlertDialogTitle>
                        <AlertDialogDescription>
                            {selectedCredential && (
                                <>
                                    A new password will be generated and sent to <strong>{selectedCredential.personal_data?.email}</strong>.
                                    <br /><br />
                                    The previous password will no longer work.
                                </>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleResend}>Resend Credentials</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}
