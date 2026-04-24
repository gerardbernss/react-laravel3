import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, History } from 'lucide-react';
import { useMemo, useState } from 'react';

interface AuditLog {
    id: number;
    action: string;
    new_status: string | null;
    previous_status: string | null;
    performed_by: string | null;
    details: string | null;
    ip_address: string | null;
    created_at: string;
}

interface Applicant {
    id: number;
    application_number: string;
    personal_data: {
        first_name: string;
        last_name: string;
    } | null;
}

interface Props {
    applicant: Applicant;
    auditLogs: AuditLog[];
}

export default function AuditLog({ applicant, auditLogs }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Enrollment Management', href: '/enrollment/dashboard' },
        {
            title: `${applicant.personal_data?.last_name}, ${applicant.personal_data?.first_name}`,
            href: `/enrollment/${applicant.id}`,
        },
        { title: 'Audit Log', href: `/enrollment/${applicant.id}/audit-log` },
    ];

    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const totalPages = Math.ceil(auditLogs.length / pageSize);

    const paginatedLogs = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return auditLogs.slice(start, start + pageSize);
    }, [auditLogs, currentPage, pageSize]);

    const getActionBadge = (action: string) => {
        const actionLower = action.toLowerCase();
        if (actionLower.includes('enrolled') || actionLower.includes('complete')) {
            return <Badge className="bg-green-100 text-green-800">{action}</Badge>;
        }
        if (actionLower.includes('revert') || actionLower.includes('pending')) {
            return <Badge className="bg-yellow-100 text-yellow-800">{action}</Badge>;
        }
        return <Badge className="bg-blue-100 text-blue-800">{action}</Badge>;
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Enrollment Audit Log" />

            <div className="space-y-6 p-6 md:p-10">
                {/* Header */}
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Enrollment Audit Log</h1>
                        <p className="mt-1 text-gray-600">
                            Complete activity history for {applicant.personal_data?.first_name} {applicant.personal_data?.last_name}
                        </p>
                        <p className="text-sm text-gray-500">Application #: {applicant.application_number}</p>
                    </div>
                    <Link href={`/enrollment/${applicant.id}`}>
                        <Button variant="outline">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Details
                        </Button>
                    </Link>
                </div>

                {/* Audit Log Table */}
                <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
                    <div className="flex items-center gap-2 border-b bg-gray-50 px-6 py-4">
                        <History className="h-5 w-5 text-gray-600" />
                        <h2 className="font-semibold">Activity History</h2>
                        <Badge variant="outline" className="ml-auto">
                            {auditLogs.length} entries
                        </Badge>
                    </div>

                    <div className="max-h-[70vh] overflow-x-auto overflow-y-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="sticky top-0 z-10 bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                        Date &amp; Time
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                        Action
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                        Status Change
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                        Performed By
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                        Details
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white">
                                {paginatedLogs.length > 0 ? (
                                    paginatedLogs.map((log) => (
                                        <tr key={log.id} className="hover:bg-gray-50">
                                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                                                {new Date(log.created_at).toLocaleString()}
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4">{getActionBadge(log.action)}</td>
                                            <td className="whitespace-nowrap px-6 py-4 text-sm">
                                                {log.previous_status && log.new_status ? (
                                                    <span>
                                                        <span className="text-gray-500">{log.previous_status}</span>
                                                        <span className="mx-2">→</span>
                                                        <span className="font-medium text-gray-900">{log.new_status}</span>
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400">-</span>
                                                )}
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                                                {log.performed_by || 'System'}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                {log.details ? (
                                                    <details className="cursor-pointer">
                                                        <summary className="text-blue-600 hover:text-blue-800">View Details</summary>
                                                        <pre className="mt-2 max-w-lg overflow-auto rounded bg-gray-100 p-2 text-xs">
                                                            {JSON.stringify(JSON.parse(log.details), null, 2)}
                                                        </pre>
                                                    </details>
                                                ) : (
                                                    <span className="text-gray-400">No details</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                            <History className="mx-auto h-12 w-12 text-gray-400" />
                                            <p className="mt-2">No audit log entries found.</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {auditLogs.length > 0 && (
                        <div className="flex items-center justify-between border-t bg-white px-4 py-3">
                            <div className="flex items-center gap-3">
                                <span className="text-sm text-gray-700">Rows per page:</span>
                                <select
                                    value={pageSize}
                                    onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                                    className="rounded-md border border-gray-300 px-3 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                >
                                    <option value={5}>5</option>
                                    <option value={10}>10</option>
                                    <option value={25}>25</option>
                                    <option value={50}>50</option>
                                </select>
                                <span className="text-sm text-gray-600">
                                    {auditLogs.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}–
                                    {Math.min(currentPage * pageSize, auditLogs.length)} of {auditLogs.length}
                                </span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Button variant="outline" size="sm" onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>
                                    <ChevronsLeft className="h-4 w-4" />
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <span className="px-3 py-1 text-sm">Page {currentPage} of {totalPages || 1}</span>
                                <Button variant="outline" size="sm" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages === 0}>
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages || totalPages === 0}>
                                    <ChevronsRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
