import { router, usePage } from '@inertiajs/react';
import { useState } from 'react';

interface PersonalData {
    email: string;
    mobile_number: string | null;
    present_street: string | null;
    present_brgy: string | null;
    present_city: string | null;
    present_province: string | null;
    present_zip: string | null;
}

interface Fee {
    id: number;
    category: string;
    amount: number;
}

interface Params {
    personalData: PersonalData | null;
    fees: Fee[];
    assessmentNumber: string | null;
}

const str = (v: string | null | undefined) => v ?? '';

export function useApplicantEnrollment({ personalData, fees, assessmentNumber }: Params) {
    const { errors } = usePage().props as { errors: Record<string, string> };

    const initialStep = assessmentNumber ? 3 : 1;
    const [step, setStep] = useState(initialStep);
    const [processing, setProcessing] = useState(false);

    const initialForm = {
        email: str(personalData?.email),
        mobile_number: str(personalData?.mobile_number),
        present_street: str(personalData?.present_street),
        present_brgy: str(personalData?.present_brgy),
        present_city: str(personalData?.present_city),
        present_province: str(personalData?.present_province),
        present_zip: str(personalData?.present_zip),
    };
    const [form, setForm] = useState(initialForm);

    const tuitionFee = fees.filter((f) => f.category === 'tuition').reduce((sum, f) => sum + f.amount, 0);
    const miscFees   = fees.filter((f) => f.category === 'miscellaneous').reduce((sum, f) => sum + f.amount, 0);
    const labFees    = fees.filter((f) => f.category === 'laboratory').reduce((sum, f) => sum + f.amount, 0);
    const otherFees  = fees.filter((f) => f.category === 'special').reduce((sum, f) => sum + f.amount, 0);
    const netTotal   = tuitionFee + miscFees + labFees + otherFees;
    const minimumDue = Math.round(netTotal * 0.3 * 100) / 100;

    const isFormDirty = (Object.keys(initialForm) as (keyof typeof initialForm)[]).some(
        (k) => form[k] !== initialForm[k],
    );

    const handleStep1Next = () => {
        if (!isFormDirty) {
            setStep(2);
            return;
        }
        setProcessing(true);
        router.put(
            '/applicant/profile',
            { ...form },
            {
                preserveScroll: true,
                onSuccess: () => { setStep(2); setProcessing(false); },
                onError: () => setProcessing(false),
            },
        );
    };

    const handleStep2Next = () => {
        setProcessing(true);
        router.post(
            '/applicant/enrollment/generate-assessment',
            {},
            {
                preserveScroll: true,
                onSuccess: () => { setStep(3); setProcessing(false); },
                onError: () => setProcessing(false),
            },
        );
    };

    const handlePrint = () => window.print();

    return {
        errors,
        step,
        setStep,
        processing,
        form,
        setForm,
        tuitionFee,
        miscFees,
        labFees,
        otherFees,
        netTotal,
        minimumDue,
        handleStep1Next,
        handleStep2Next,
        handlePrint,
    };
}
