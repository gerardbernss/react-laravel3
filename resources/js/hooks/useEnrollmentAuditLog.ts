import { type BreadcrumbItem } from '@/types';
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
    personal_data: { first_name: string; last_name: string } | null;
}

interface Params {
    applicant: Applicant;
    auditLogs: AuditLog[];
}

export function useEnrollmentAuditLog({ applicant, auditLogs }: Params) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Enrollment Management', href: '/admin/enrollment/dashboard' },
        {
            title: `${applicant.personal_data?.last_name}, ${applicant.personal_data?.first_name}`,
            href: `/admin/enrollment/${applicant.id}`,
        },
        { title: 'Audit Log', href: `/admin/enrollment/${applicant.id}/audit-log` },
    ];

    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const totalPages = Math.ceil(auditLogs.length / pageSize);

    const paginatedLogs = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return auditLogs.slice(start, start + pageSize);
    }, [auditLogs, currentPage, pageSize]);

    const handlePageSizeChange = (size: number) => {
        setPageSize(size);
        setCurrentPage(1);
    };

    return { breadcrumbs, currentPage, setCurrentPage, pageSize, totalPages, paginatedLogs, handlePageSizeChange };
}
