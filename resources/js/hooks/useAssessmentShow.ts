import { router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { type FormEvent } from 'react';

export interface Payment {
    id: number;
    amount_paid: number;
    payment_method: string;
    reference_number: string | null;
    payment_date: string;
    notes: string | null;
    processed_by: string;
}

export interface Assessment {
    id: number;
    assessment_number: string;
    school_year: string;
    semester: string;
    status: 'finalized' | 'partial' | 'paid' | 'draft' | 'cancelled';
    total_tuition: number;
    total_misc_fees: number;
    total_lab_fees: number;
    total_other_fees: number;
    gross_amount: number;
    total_discounts: number;
    prior_balance: number;
    net_amount: number;
    payment_plan: 'full' | 'installment';
    minimum_amount: number;
    total_paid: number;
    balance: number;
    finalized_at: string | null;
    student: {
        student_id: string;
        name: string;
        grade_level: string | null;
        school_year: string | null;
    } | null;
    payments: Payment[];
}

interface Params {
    assessment: Assessment;
}

/**
 * Manage the student assessment detail page — add, inline-edit, and delete payment records,
 * and update the minimum required payment amount.
 */
export function useAssessmentShow({ assessment }: Params) {
    const { data, setData, post, processing, errors, reset } = useForm({
        amount_paid: '',
        payment_method: 'cash',
        reference_number: '',
        payment_date: new Date().toISOString().split('T')[0],
        notes: '',
    });

    const {
        data: editData,
        setData: setEditData,
        put,
        processing: editProcessing,
        errors: editErrors,
        reset: resetEdit,
    } = useForm({
        amount_paid: '',
        payment_method: 'cash',
        reference_number: '',
        payment_date: '',
        notes: '',
    });

    const [editingId, setEditingId] = useState<number | null>(null);
    const [editingMinimum, setEditingMinimum] = useState(false);

    const { data: minData, setData: setMinData, patch: patchMin, processing: minProcessing, reset: resetMin } = useForm({
        minimum_amount: String(assessment.minimum_amount),
    });

    const isPaid = assessment.status === 'paid';
    const minAmount = 0.01;

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        post(`/admin/fee-assessments/${assessment.id}/payments`, {
            onSuccess: () => reset(),
        });
    };

    const startEdit = (p: Payment) => {
        setEditingId(p.id);
        setEditData('amount_paid', String(p.amount_paid));
        setEditData('payment_method', p.payment_method);
        setEditData('reference_number', p.reference_number ?? '');
        setEditData('payment_date', p.payment_date);
        setEditData('notes', p.notes ?? '');
    };

    const cancelEdit = () => {
        setEditingId(null);
        resetEdit();
    };

    const handleUpdate = (e: FormEvent, paymentId: number) => {
        e.preventDefault();
        put(`/admin/fee-assessments/${assessment.id}/payments/${paymentId}`, {
            onSuccess: () => {
                setEditingId(null);
                resetEdit();
            },
        });
    };

    const handleDelete = (paymentId: number) => {
        if (!confirm('Delete this payment record? This will update the assessment balance.')) return;
        router.delete(`/admin/fee-assessments/${assessment.id}/payments/${paymentId}`);
    };

    const handleSaveMinimum = (e: FormEvent) => {
        e.preventDefault();
        patchMin(`/admin/fee-assessments/${assessment.id}/minimum-amount`, {
            onSuccess: () => {
                setEditingMinimum(false);
                resetMin();
            },
        });
    };

    return {
        data, setData, processing, errors,
        editData, setEditData, editProcessing, editErrors,
        editingId,
        editingMinimum, setEditingMinimum,
        minData, setMinData, minProcessing,
        isPaid,
        minAmount,
        handleSubmit,
        startEdit,
        cancelEdit,
        handleUpdate,
        handleDelete,
        handleSaveMinimum,
    };
}
