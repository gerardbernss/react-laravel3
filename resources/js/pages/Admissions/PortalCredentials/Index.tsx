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
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { Eye, Key, Mail, RefreshCw, Search, X } from 'lucide-react';
import { useState } from 'react';

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

interface PaginatedData {
    data: Credential[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
}

interface Props {
    credentials: PaginatedData;
    filters: {
        status?: string;
        search?: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Portal Credentials', href: '/portal-credentials' },
];

export default function Index({ credentials, filters = {} }: Props) {
    const [sendDialogOpen, setSendDialogOpen] = useState(false);
    const [resendDialogOpen, setResendDialogOpen] = useState(false);
    const [selectedCredential, setSelectedCredential] = useState<Credential | null>(null);

    const handleSearch = (value: string) => {
        router.get('/portal-credentials', { ...filters, search: value || undefined }, { preserveState: true });
    };

    const handleFilter = (key: string, value: string) => {
        router.get('/portal-credentials', { ...filters, [key]: value === 'all' ? undefined : value }, { preserveState: true });
    };

    const clearFilters = () => {
        router.get('/portal-credentials');
    };

    const handleSendCredentials = () => {
        if (selectedCredential) {
            router.post(`/portal-credentials/${selectedCredential.id}/send`, {}, {
                onSuccess: () => {
                    setSendDialogOpen(false);
                    setSelectedCredential(null);
                },
            });
        }
    };

    const handleResend = () => {
        if (selectedCredential) {
            router.post(`/portal-credentials/${selectedCredential.id}/resend`, {}, {
                onSuccess: () => {
                    setResendDialogOpen(false);
                    setSelectedCredential(null);
                },
            });
        }
    };

    const openSendDialog = (credential: Credential) => {
        setSelectedCredential(credential);
        setSendDialogOpen(true);
    };

    const openResendDialog = (credential: Credential) => {
        setSelectedCredential(credential);
        setResendDialogOpen(true);
    };

    const getStatusBadge = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'active':
                return <Badge className="bg-green-100 text-green-800">Active</Badge>;
            case 'suspended':
                return <Badge variant="destructive">Suspended</Badge>;
            case 'inactive':
                return <Badge variant="secondary">Inactive</Badge>;
            default:
                return <Badge variant="outline">{status || 'Active'}</Badge>;
        }
    };

    const hasFilters = filters.search || filters.status;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Portal Credentials" />

            <div className="space-y-6 p-6 md:p-10">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Portal Credentials</h1>
                        <p className="mt-1 text-gray-600">Manage applicant portal access and credentials</p>
                    </div>
                </div>

                {/* Filters */}
                <div className="rounded-lg border bg-white p-6 shadow-sm">
                    <div className="grid gap-4 md:grid-cols-4">
                        {/* Search */}
                        <div className="relative md:col-span-2">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <Input
                                placeholder="Search by name, email, or username..."
                                defaultValue={filters.search}
                                onChange={(e) => handleSearch(e.target.value)}
                                className="pl-10"
                            />
                        </div>

                        {/* Status Filter */}
                        <Select value={filters.status || 'all'} onValueChange={(v) => handleFilter('status', v)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="Active">Active</SelectItem>
                                <SelectItem value="Inactive">Inactive</SelectItem>
                                <SelectItem value="Suspended">Suspended</SelectItem>
                            </SelectContent>
                        </Select>

                        <div className="flex items-end">
                            {hasFilters && (
                                <Button variant="ghost" onClick={clearFilters} className="w-full">
                                    <X className="mr-2 h-4 w-4" />
                                    Clear Filters
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Table */}
                {credentials.data && credentials.data.length > 0 ? (
                    <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                            Applicant
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                            Username (Email)
                                        </th>
                                        <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                                            Status
                                        </th>
                                        <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                                            Login Attempts
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                            Last Login
                                        </th>
                                        <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                                            Credentials Sent
                                        </th>
                                        <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {credentials.data.map((credential) => (
                                        <tr key={credential.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3">
                                                <div>
                                                    <p className="font-medium text-gray-900">
                                                        {credential.personal_data?.first_name} {credential.personal_data?.last_name}
                                                    </p>
                                                    <p className="text-sm text-gray-500">{credential.personal_data?.email}</p>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="font-mono text-gray-600">{credential.username}</span>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                {getStatusBadge(credential.access_status)}
                                            </td>
                                            <td className="px-4 py-3 text-center text-gray-600">
                                                {credential.login_attempts || 0}/5
                                            </td>
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
                                                    <Link href={`/portal-credentials/${credential.id}`}>
                                                        <Button variant="outline" size="sm" title="View Details">
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                    </Link>
                                                    {!credential.credentials_sent_at && (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => openSendDialog(credential)}
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
                                                            onClick={() => openResendDialog(credential)}
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

                        {/* Pagination */}
                        {credentials.last_page > 1 && (
                            <div className="flex items-center justify-between border-t px-4 py-3">
                                <p className="text-sm text-gray-600">
                                    Showing {(credentials.current_page - 1) * credentials.per_page + 1} to{' '}
                                    {Math.min(credentials.current_page * credentials.per_page, credentials.total)} of{' '}
                                    {credentials.total} results
                                </p>
                                <div className="flex gap-1">
                                    {credentials.links.map((link, index) => (
                                        <Button
                                            key={index}
                                            variant={link.active ? 'default' : 'outline'}
                                            size="sm"
                                            disabled={!link.url}
                                            onClick={() => link.url && router.get(link.url)}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="rounded-lg border bg-white p-12 text-center shadow-sm">
                        <Key className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-4 text-lg font-semibold text-gray-900">No credentials found</h3>
                        <p className="mt-2 text-gray-600">
                            {hasFilters
                                ? 'No credentials match your filters. Try adjusting your search criteria.'
                                : 'No portal credentials have been generated yet.'}
                        </p>
                    </div>
                )}
            </div>

            {/* Send Credentials Dialog */}
            <AlertDialog open={sendDialogOpen} onOpenChange={setSendDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Send Portal Credentials</AlertDialogTitle>
                        <AlertDialogDescription>
                            {selectedCredential && (
                                <>
                                    Login credentials will be sent to{' '}
                                    <strong>{selectedCredential.personal_data?.email}</strong>.
                                    <br />
                                    <br />
                                    The applicant will use these credentials to access their portal.
                                </>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleSendCredentials}>
                            Send Credentials
                        </AlertDialogAction>
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
                                    A new password will be generated and sent to{' '}
                                    <strong>{selectedCredential.personal_data?.email}</strong>.
                                    <br />
                                    <br />
                                    The previous password will no longer work.
                                </>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleResend}>
                            Resend Credentials
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}
