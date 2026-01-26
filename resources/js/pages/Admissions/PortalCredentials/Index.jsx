import React, { useState } from 'react';
import { Link, router } from '@inertiajs/react';
import Authenticated from '@/Layouts/AuthenticatedLayout';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import DangerButton from '@/Components/DangerButton';
import { Badge, StatusBadge } from '@/Components/Badge';
import Table from '@/Components/Table';
import Pagination from '@/Components/Pagination';

export default function PortalCredentialsIndex({ auth, credentials, filters = {} }) {
    const [search, setSearch] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || '');

    const handleSearch = (e) => {
        e.preventDefault();
        router.get(route('portal-credentials.index'), {
            search,
            status: statusFilter,
        }, { preserveScroll: true });
    };

    const handleSendCredentials = (credentialId) => {
        if (confirm('Send portal credentials to applicant? They will receive login details via email.')) {
            router.post(route('portal-credentials.send', credentialId), {}, {
                onSuccess: () => {
                    alert('Credentials sent successfully');
                }
            });
        }
    };

    const getAccessStatus = (credential) => {
        if (credential.access_suspended_at) return 'suspended';
        if (credential.is_activated) return 'active';
        return 'inactive';
    };

    return (
        <Authenticated user={auth.user}>
            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="mb-6 flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Portal Credentials Management</h1>
                            <p className="text-gray-600 mt-1">Manage applicant portal access and credentials</p>
                        </div>
                        <Link href={route('portal-credentials.create')}>
                            <PrimaryButton>Create New Credential</PrimaryButton>
                        </Link>
                    </div>

                    {/* Filters */}
                    <div className="bg-white shadow rounded-lg p-6 mb-6">
                        <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Search Applicant</label>
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Name, email, or username..."
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                >
                                    <option value="">All Statuses</option>
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                    <option value="suspended">Suspended</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">&nbsp;</label>
                                <button
                                    type="submit"
                                    className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition"
                                >
                                    Search
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Table */}
                    <div className="bg-white shadow rounded-lg overflow-hidden">
                        <Table>
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applicant</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Login Attempts</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Login</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Activated</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {credentials.data && credentials.data.length > 0 ? (
                                    credentials.data.map((credential) => (
                                        <tr key={credential.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {credential.applicant_personal_data?.first_name} {credential.applicant_personal_data?.last_name}
                                                </div>
                                                <div className="text-sm text-gray-500">{credential.applicant_personal_data?.email_address}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                {credential.portal_username}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <StatusBadge
                                                    status={getAccessStatus(credential)}
                                                    colorMap={(s) => {
                                                        switch(s) {
                                                            case 'active': return 'success';
                                                            case 'suspended': return 'danger';
                                                            default: return 'warning';
                                                        }
                                                    }}
                                                />
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                {credential.failed_login_attempts || 0}/3
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                {credential.last_login_at ? new Date(credential.last_login_at).toLocaleDateString() : 'Never'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {credential.credentials_sent_at ? (
                                                    <Badge variant="success">
                                                        {new Date(credential.credentials_sent_at).toLocaleDateString()}
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="warning">Not Sent</Badge>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                                                <Link href={route('portal-credentials.show', credential.id)}>
                                                    <SecondaryButton size="sm">View</SecondaryButton>
                                                </Link>
                                                {!credential.credentials_sent_at && (
                                                    <button
                                                        onClick={() => handleSendCredentials(credential.id)}
                                                        className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                                                    >
                                                        Send
                                                    </button>
                                                )}
                                                {credential.credentials_sent_at && !credential.access_suspended_at && (
                                                    <button
                                                        onClick={() => {
                                                            if (confirm('Resend credentials? A new password will be generated.')) {
                                                                router.post(route('portal-credentials.resend', credential.id));
                                                            }
                                                        }}
                                                        className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                                                    >
                                                        Resend
                                                    </button>
                                                )}
                                                {credential.access_suspended_at ? (
                                                    <button
                                                        onClick={() => {
                                                            if (confirm('Reactivate this credential?')) {
                                                                router.post(route('portal-credentials.reactivate', credential.id));
                                                            }
                                                        }}
                                                        className="text-green-600 hover:text-green-900 text-sm font-medium"
                                                    >
                                                        Reactivate
                                                    </button>
                                                ) : (
                                                    credential.credentials_sent_at && (
                                                        <button
                                                            onClick={() => {
                                                                if (confirm('Suspend this credential? The applicant will not be able to access the portal.')) {
                                                                    router.post(route('portal-credentials.suspend', credential.id));
                                                                }
                                                            }}
                                                            className="text-red-600 hover:text-red-900 text-sm font-medium"
                                                        >
                                                            Suspend
                                                        </button>
                                                    )
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                                            No credentials found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    {credentials.links && credentials.links.length > 0 && (
                        <Pagination links={credentials.links} />
                    )}
                </div>
            </div>
        </Authenticated>
    );
}
