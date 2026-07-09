import { useForm } from '@inertiajs/react';
import { type FormEvent } from 'react';

interface Params {
    applicantId: number;
}

/** Manage the applicant enrollment form, posting initial payment amount and notes to /admin/applicants/:id/enroll. */
export function useApplicantEnroll({ applicantId }: Params) {
    const { data, setData, post, processing, errors } = useForm({
        amount_paid: '',
        notes: '',
    });

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        post(`/admin/applicants/${applicantId}/enroll`);
    };

    return { data, setData, processing, errors, handleSubmit };
}
