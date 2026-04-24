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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import {
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    ChevronUp,
    ChevronsLeft,
    ChevronsRight,
    Eye,
    Key,
    KeyRound,
    Mail,
    RefreshCw,
    Search,
} from 'lucide-react';
import { useMemo, useState } from 'react';

interface PersonalData {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
}

interface Credential {
    id: number;
    username: string;
    access_status: string;
    credentials_sent_at: string | null;
    last_login_at: string | null;
    login_attempts: number;
    personal_data?: PersonalData;
}

interface Props {
    credentials: Credential[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Portal Credentials', href: '/portal-credentials' },
];

type SortKey = 'name' | 'username' | 'status' | 'last_login_at' | 'credentials_sent_at';

export default function Index({ credentials }: Props) {
    const [sendDialogOpen, setSendDialogOpen] = useState(false);
    const [resendDialogOpen, setResendDialogOpen] = useState(false);
    const [selectedCredential, setSelectedCredential] = useState<Credential | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [sortConfig, setSortConfig] = useState<{ key: SortKey | null; direction: 'asc' | 'desc' }>({ key: null, direction: 'asc' });

    const filteredItems = useMemo(() => {
        return credentials.filter((c) => {
            const q = searchQuery.toLowerCase();
            const fullName = `${c.personal_data?.first_name ?? ''} ${c.personal_data?.last_name ?? ''}`.toLowerCase();
            const matchesSearch =
                !q ||
                fullName.includes(q) ||
                (c.personal_data?.email ?? '').toLowerCase().includes(q) ||
                c.username.toLowerCase().includes(q);
            const matchesStatus = !selectedStatus || c.access_status?.toLowerCase() === selectedStatus.toLowerCase();
            return matchesSearch && matchesStatus;
        });
    }, [credentials, searchQuery, selectedStatus]);

    const sortedItems = useMemo(() => {
        if (!sortConfig.key) return filteredItems;
        return [...filteredItems].sort((a, b) => {
            let aVal = '';
            let bVal = '';
            if (sortConfig.key === 'name') {
                aVal = `${a.personal_data?.last_name ?? ''} ${a.personal_data?.first_name ?? ''}`;
                bVal = `${b.personal_data?.last_name ?? ''} ${b.personal_data?.first_name ?? ''}`;
            } else if (sortConfig.key === 'username') { aVal = a.username; bVal = b.username; }
            else if (sortConfig.key === 'status') { aVal = a.access_status; bVal = b.access_status; }
            else if (sortConfig.key === 'last_login_at') { aVal = a.last_login_at ?? ''; bVal = b.last_login_at ?? ''; }
            else if (sortConfig.key === 'credentials_sent_at') { aVal = a.credentials_sent_at ?? ''; bVal = b.credentials_sent_at ?? ''; }
            return aVal.localeCompare(bVal) * (sortConfig.direction === 'asc' ? 1 : -1);
        });
    }, [filteredItems, sortConfig]);

    const totalPages = Math.ceil(sortedItems.length / pageSize);
    const paginatedItems = useMemo(
        () => sortedItems.slice((currentPage - 1) * pageSize, currentPage * pageSize),
        [sortedItems, currentPage, pageSize],
    );

    const toggleSort = (key: SortKey) =>
        setSortConfig((prev) =>
            prev.key === key ? { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' } : { key, direction: 'asc' },
        );

    const SortIcon = ({ col }: { col: SortKey }) =>
        sortConfig.key !== col ? (
            <ChevronUp className="ml-1 inline h-3 w-3 opacity-30" />
        ) : sortConfig.direction === 'asc' ? (
            <ChevronUp className="ml-1 inline h-3 w-3" />
        ) : (
            <ChevronDown className="ml-1 inline h-3 w-3" />
        );

    const clearFilters = () => {
        setSearchQuery('');
        setSelectedStatus('');
        setCurrentPage(1);
    };

    const hasFilters = searchQuery || selectedStatus;

    const getStatusBadge = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'active': return <Badge className="bg-green-100 text-green-800">Active</Badge>;
            case 'suspended': return <Badge variant="destructive">Suspended</Badge>;
            case 'inactive': return <Badge variant="secondary">Inactive</Badge>;
            default: return <Badge variant="outline">{status || 'Active'}</Badge>;
        }
    };

    const handleSendCredentials = () => {
        if (selectedCredential) {
            router.post(`/portal-credentials/${selectedCredential.id}/send`, {}, {
                onSuccess: () => { setSendDialogOpen(false); setSelectedCredential(null); },
            });
        }
    };

    const handleResend = () => {
        if (selectedCredential) {
            router.post(`/portal-credentials/${selectedCredential.id}/resend`, {}, {
                onSuccess: () => { setResendDialogOpen(false); setSelectedCredential(null); },
            });
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Portal Credentials" />

            <div className="space-y-6 p-6 md:p-10">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="flex items-center gap-3">
                            <KeyRound className="h-7 w-7 text-primary" />
                            <h1 className="text-3xl font-bold text-gray-900">Portal Credentials</h1>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="rounded-lg border bg-white p-6 shadow-sm">
                    <div>
                        <label className="mb-1 block text-xs font-medium text-gray-600">Search</label>
                        <div className="mb-3 flex h-10 w-full items-center rounded-lg border border-gray-300 bg-white md:w-[400px]">
                            <span className="pl-3 pr-2 text-gray-500"><Search className="h-4 w-4" /></span>
                            <input
                                className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400"
                                placeholder="Search by name, email, or username..."
                                value={searchQuery}
                                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
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

                {/* Table */}
                <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
                    <div className="max-h-[70vh] overflow-x-auto overflow-y-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="cursor-pointer px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500" onClick={() => toggleSort('name')}>
                                        Applicant <SortIcon col="name" />
                                    </th>
                                    <th className="cursor-pointer px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500" onClick={() => toggleSort('username')}>
                                        Username (Email) <SortIcon col="username" />
                                    </th>
                                    <th className="cursor-pointer px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500" onClick={() => toggleSort('status')}>
                                        Status <SortIcon col="status" />
                                    </th>
                                    <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">Login Attempts</th>
                                    <th className="cursor-pointer px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500" onClick={() => toggleSort('last_login_at')}>
                                        Last Login <SortIcon col="last_login_at" />
                                    </th>
                                    <th className="cursor-pointer px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500" onClick={() => toggleSort('credentials_sent_at')}>
                                        Credentials Sent <SortIcon col="credentials_sent_at" />
                                    </th>
                                    <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th>
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
                                    <tr key={credential.id} className="border-b border-gray-200 transition-all hover:bg-slate-50">
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
                                            {credential.last_login_at ? new Date(credential.last_login_at).toLocaleDateString() : 'Never'}
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
                                                <Link href={`/portal-credentials/${credential.id}`}>
                                                    <Button variant="outline" size="sm" title="View Details">
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                </Link>
                                                {!credential.credentials_sent_at && (
                                                    <Button
                                                        variant="outline" size="sm"
                                                        onClick={() => { setSelectedCredential(credential); setSendDialogOpen(true); }}
                                                        className="text-green-600 hover:text-green-700"
                                                        title="Send Credentials"
                                                    >
                                                        <Mail className="h-4 w-4" />
                                                    </Button>
                                                )}
                                                {credential.credentials_sent_at && (
                                                    <Button
                                                        variant="outline" size="sm"
                                                        onClick={() => { setSelectedCredential(credential); setResendDialogOpen(true); }}
                                                        className="text-purple-600 hover:text-purple-700"
                                                        title="Resend Credentials"
                                                    >
                                                        <RefreshCw className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Bar */}
                    <div className="flex items-center justify-between border-t bg-white px-4 py-3">
                        <div className="flex items-center gap-3">
                            <span className="text-sm text-gray-700">Rows per page:</span>
                            <select
                                value={pageSize}
                                onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                                className="rounded-lg border border-gray-300 px-3 py-1 text-sm focus:outline-none"
                            >
                                <option value={5}>5</option>
                                <option value={10}>10</option>
                                <option value={25}>25</option>
                                <option value={50}>50</option>
                            </select>
                            <span className="text-sm text-gray-700">
                                {sortedItems.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}–{Math.min(currentPage * pageSize, sortedItems.length)} of {sortedItems.length}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40">
                                <ChevronsLeft className="h-4 w-4" />
                            </button>
                            <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40">
                                <ChevronLeft className="h-4 w-4" />
                            </button>
                            <span className="px-4 py-2 text-sm font-medium">Page {currentPage} of {totalPages || 1}</span>
                            <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages === 0} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40">
                                <ChevronRight className="h-4 w-4" />
                            </button>
                            <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages || totalPages === 0} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40">
                                <ChevronsRight className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Send Credentials Dialog */}
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

            {/* Resend Credentials Dialog */}
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
