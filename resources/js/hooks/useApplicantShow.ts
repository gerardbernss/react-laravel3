import { type BreadcrumbItem } from '@/types';
import { router } from '@inertiajs/react';
import { useState } from 'react';
import { toast } from 'sonner';

interface Params {
    applicant: any;
}

export function useApplicantShow({ applicant }: Params) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Applicant List', href: '/admin/applicants' },
        {
            title: `${applicant.personal_data.first_name ?? ''} ${applicant.personal_data.last_name ?? ''}`,
            href: `/admin/applicants/${applicant.id}/show`,
        },
    ];

    const [evaluateOpen, setEvaluateOpen] = useState(false);
    const [evaluating, setEvaluating] = useState(false);
    const [evalOutcome, setEvalOutcome] = useState<'approve' | 'revise' | 'reject' | ''>('');
    const [evalRemarks, setEvalRemarks] = useState<string>(applicant.remarks ?? '');

    const handleEvaluate = async () => {
        if (!evalOutcome) {
            toast.warning('Please select an evaluation outcome.');
            return;
        }
        if (evalOutcome === 'revise' && !evalRemarks.trim()) {
            toast.warning('Please describe what needs to be revised.');
            return;
        }
        setEvaluating(true);
        try {
            const csrfToken = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content;
            const response = await fetch(`/admin/applicants/${applicant.id}/evaluate`, {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken ?? '',
                },
                body: JSON.stringify({ evaluation: evalOutcome, remarks: evalRemarks }),
            });
            const json = await response.json();
            if (response.ok) {
                toast.success(json.message || 'Application evaluated successfully.');
                setEvaluateOpen(false);
                router.reload({ only: ['applicant'] });
            } else {
                toast.error(json.message || 'Failed to evaluate application.');
            }
        } catch {
            toast.error('An error occurred. Please try again.');
        } finally {
            setEvaluating(false);
        }
    };

    return {
        breadcrumbs,
        evaluateOpen, setEvaluateOpen,
        evaluating,
        evalOutcome, setEvalOutcome,
        evalRemarks, setEvalRemarks,
        handleEvaluate,
    };
}
