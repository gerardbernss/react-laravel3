import { type BreadcrumbItem } from '@/types';
import { useState } from 'react';

interface Params {
    applicant: any;
}

export function useApplicantView({ applicant }: Params) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Applicant List', href: '/admissions/applicants' },
        {
            title: `${applicant.first_name ?? ''} ${applicant.last_name ?? ''}`,
            href: `/admissions/applicants/${applicant.id}/show`,
        },
    ];

    const [open, setOpen] = useState(false);

    return { breadcrumbs, open, setOpen };
}
