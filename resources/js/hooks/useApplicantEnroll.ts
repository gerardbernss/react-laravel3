import { useForm } from '@inertiajs/react';
import { type FormEvent } from 'react';

interface Params {
    applicantId: number;
}

export function useApplicantEnroll({ applicantId }: Params) {
    const { data, setData, post, processing, errors } = useForm({
        amount_paid: '',
        notes: '',
    });

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        post(`/admissions/applicants/${applicantId}/enroll`);
    };

    return { data, setData, processing, errors, handleSubmit };
}
