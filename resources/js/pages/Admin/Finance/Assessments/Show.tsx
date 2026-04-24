import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { AlertCircle, ArrowLeft, CheckCircle2, Clock, Pencil, Receipt, Trash2, X } from 'lucide-react';
import { useState } from 'react';

interface Payment {
    id: number;
    amount_paid: number;
    payment_method: string;
    reference_number: string | null;
    payment_date: string;
    notes: string | null;
    processed_by: string;
}

interface Assessment {
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

interface Props {
    assessment: Assessment;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Finance', href: '/admin/finance/assessments' },
    { title: 'Assessment Detail', href: '#' },
];

const paymentMethodLabels: Record<string, string> = {
    cash:          'Cash',
    check:         'Check',
    bank_transfer: 'Bank Transfer',
    gcash:         'GCash',
    maya:          'Maya',
};

const statusConfig: Record<string, { label: string; color: string }> = {
    finalized: { label: 'Pending Payment', color: 'text-amber-700 bg-amber-50 border-amber-200' },
    partial:   { label: 'Partial Payment', color: 'text-blue-700 bg-blue-50 border-blue-200' },
    paid:      { label: 'Fully Paid',      color: 'text-green-700 bg-green-50 border-green-200' },
};

function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount);
}

export default function AssessmentShow({ assessment }: Props) {
    const { data, setData, post, processing, errors, reset } = useForm({
        amount_paid:      '',
        payment_method:   'cash',
        reference_number: '',
        payment_date:     new Date().toISOString().split('T')[0],
        notes:            '',
    });

    const {
        data: editData,
        setData: setEditData,
        put,
        processing: editProcessing,
        errors: editErrors,
        reset: resetEdit,
    } = useForm({
        amount_paid:      '',
        payment_method:   'cash',
        reference_number: '',
        payment_date:     '',
        notes:            '',
    });

    const [editingId, setEditingId] = useState<number | null>(null);
    const [editingMinimum, setEditingMinimum] = useState(false);
    const { data: minData, setData: setMinData, patch: patchMin, processing: minProcessing, reset: resetMin } = useForm({
        minimum_amount: String(assessment.minimum_amount),
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(`/admin/finance/assessments/${assessment.id}/payments`, {
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

    const handleUpdate = (e: React.FormEvent, paymentId: number) => {
        e.preventDefault();
        put(`/admin/finance/assessments/${assessment.id}/payments/${paymentId}`, {
            onSuccess: () => { setEditingId(null); resetEdit(); },
        });
    };

    const handleDelete = (paymentId: number) => {
        if (!confirm('Delete this payment record? This will update the assessment balance.')) return;
        router.delete(`/admin/finance/assessments/${assessment.id}/payments/${paymentId}`);
    };

    const sc = statusConfig[assessment.status] ?? { label: assessment.status, color: '' };
    const isPaid = assessment.status === 'paid';
    const minAmount = 0.01;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Assessment ${assessment.assessment_number}`} />

            <div className="p-6">
                {/* Back + header */}
                <div className="mb-6 flex items-start justify-between">
                    <div>
                        <Link href="/admin/finance/assessments">
                            <Button variant="ghost" size="sm" className="mb-2 -ml-2">
                                <ArrowLeft className="mr-1 h-4 w-4" />
                                Back to Assessments
                            </Button>
                        </Link>
                        <h1 className="text-2xl font-bold text-gray-900">
                            {assessment.assessment_number}
                        </h1>
                        <p className="mt-1 text-sm text-gray-500">
                            {assessment.school_year} · {assessment.semester}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className={`rounded-full border px-3 py-1 text-sm font-medium ${sc.color}`}>
                            {sc.label}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.post(`/admin/finance/assessments/${assessment.id}/sync-status`)}
                        >
                            Sync Status
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* Right column — assessment details */}
                    <div className="space-y-4 lg:order-last lg:col-span-2">
                        {/* Student info */}
                        {assessment.student && (
                            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                                <h2 className="mb-3 text-sm font-semibold uppercase text-gray-500">
                                    Student Information
                                </h2>
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div>
                                        <p className="text-gray-500">Name</p>
                                        <p className="font-medium text-gray-900">{assessment.student.name}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500">Student ID</p>
                                        <p className="font-medium text-gray-900">
                                            {assessment.student.student_id ?? '—'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500">Grade Level</p>
                                        <p className="font-medium text-gray-900">
                                            {assessment.student.grade_level ?? '—'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Fee breakdown */}
                        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                            <h2 className="mb-3 text-sm font-semibold uppercase text-gray-500">
                                Fee Assessment
                            </h2>
                            <div className="space-y-1 text-sm">
                                {assessment.total_tuition > 0 && (
                                    <div className="flex justify-between text-gray-600">
                                        <span>Tuition Fees</span>
                                        <span>{formatCurrency(assessment.total_tuition)}</span>
                                    </div>
                                )}
                                {assessment.total_misc_fees > 0 && (
                                    <div className="flex justify-between text-gray-600">
                                        <span>Miscellaneous Fees</span>
                                        <span>{formatCurrency(assessment.total_misc_fees)}</span>
                                    </div>
                                )}
                                {assessment.total_lab_fees > 0 && (
                                    <div className="flex justify-between text-gray-600">
                                        <span>Laboratory Fees</span>
                                        <span>{formatCurrency(assessment.total_lab_fees)}</span>
                                    </div>
                                )}
                                {assessment.total_other_fees > 0 && (
                                    <div className="flex justify-between text-gray-600">
                                        <span>Other Fees</span>
                                        <span>{formatCurrency(assessment.total_other_fees)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between border-t pt-1 text-gray-700">
                                    <span>Gross Total</span>
                                    <span>{formatCurrency(assessment.gross_amount)}</span>
                                </div>
                                {assessment.total_discounts > 0 && (
                                    <div className="flex justify-between text-green-600">
                                        <span>Less: Discounts</span>
                                        <span>− {formatCurrency(assessment.total_discounts)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between border-t pt-2 text-base font-bold text-gray-900">
                                    <span>Net Amount Due</span>
                                    <span>{formatCurrency(assessment.net_amount)}</span>
                                </div>
                            </div>

                            {/* Running balance */}
                            <div className="mt-4 grid grid-cols-3 gap-3 rounded-lg bg-gray-50 p-3 text-center text-sm">
                                <div>
                                    <p className="text-gray-500">Net Amount</p>
                                    <p className="font-semibold text-gray-900">
                                        {formatCurrency(assessment.net_amount)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-gray-500">Total Paid</p>
                                    <p className="font-semibold text-green-700">
                                        {formatCurrency(assessment.total_paid)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-gray-500">Balance</p>
                                    <p className={`font-bold text-lg ${assessment.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                        {assessment.balance > 0 ? formatCurrency(assessment.balance) : '✓ Paid'}
                                    </p>
                                </div>
                            </div>

                            {/* Payment plan & minimum */}
                            <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <span className="font-medium text-blue-900">
                                            {assessment.payment_plan === 'installment' ? 'Installment Plan' : 'Full Payment Plan'}
                                        </span>
                                        <span className="ml-2 text-blue-600">
                                            · Min. to enroll: <span className="font-semibold">{formatCurrency(assessment.minimum_amount)}</span>
                                        </span>
                                    </div>
                                    {assessment.payment_plan === 'installment' && !isPaid && (
                                        <button
                                            type="button"
                                            onClick={() => setEditingMinimum(!editingMinimum)}
                                            className="text-xs text-blue-600 underline hover:text-blue-800"
                                        >
                                            {editingMinimum ? 'Cancel' : 'Edit'}
                                        </button>
                                    )}
                                </div>
                                {editingMinimum && (
                                    <form
                                        onSubmit={(e) => {
                                            e.preventDefault();
                                            patchMin(`/admin/finance/assessments/${assessment.id}/minimum-amount`, {
                                                onSuccess: () => { setEditingMinimum(false); resetMin(); },
                                            });
                                        }}
                                        className="mt-2 flex items-center gap-2"
                                    >
                                        <Input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            max={assessment.net_amount}
                                            value={minData.minimum_amount}
                                            onChange={(e) => setMinData('minimum_amount', e.target.value)}
                                            className="h-7 w-36 text-xs"
                                        />
                                        <Button type="submit" size="sm" className="h-7 text-xs" disabled={minProcessing}>
                                            Save
                                        </Button>
                                    </form>
                                )}
                                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-blue-200">
                                    <div
                                        className="h-full rounded-full bg-blue-500 transition-all"
                                        style={{ width: `${Math.min(100, (assessment.total_paid / assessment.minimum_amount) * 100)}%` }}
                                    />
                                </div>
                                <p className="mt-1 text-xs text-blue-600">
                                    {assessment.total_paid >= assessment.minimum_amount
                                        ? '✓ Minimum payment met — student is enrolled'
                                        : `${formatCurrency(Math.max(0, assessment.minimum_amount - assessment.total_paid))} more needed to enroll`}
                                </p>
                            </div>
                        </div>

                        {/* Payment history */}
                        <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
                            <div className="border-b px-4 py-3">
                                <h2 className="text-sm font-semibold uppercase text-gray-500">
                                    Payment History
                                </h2>
                            </div>
                            {assessment.payments.length === 0 ? (
                                <div className="px-4 py-8 text-center text-sm text-gray-400">
                                    No payments recorded yet.
                                </div>
                            ) : (
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50 text-xs font-semibold uppercase text-gray-500">
                                        <tr>
                                            <th className="px-4 py-2 text-left">Date</th>
                                            <th className="px-4 py-2 text-left">Method</th>
                                            <th className="px-4 py-2 text-left">Reference</th>
                                            <th className="px-4 py-2 text-right">Amount</th>
                                            <th className="px-4 py-2 text-left">Processed By</th>
                                            <th className="px-4 py-2 text-center">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {assessment.payments.map((p) => (
                                            editingId === p.id ? (
                                                /* ── Inline edit row ── */
                                                <tr key={p.id} className="bg-blue-50">
                                                    <td colSpan={6} className="px-4 py-3">
                                                        <form
                                                            onSubmit={(e) => handleUpdate(e, p.id)}
                                                            className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6"
                                                        >
                                                            {/* Date */}
                                                            <div>
                                                                <label className="mb-1 block text-xs font-medium text-gray-600">Date</label>
                                                                <Input
                                                                    type="date"
                                                                    value={editData.payment_date}
                                                                    onChange={(e) => setEditData('payment_date', e.target.value)}
                                                                    className="h-8 text-xs"
                                                                />
                                                                {editErrors.payment_date && <p className="mt-0.5 text-xs text-red-500">{editErrors.payment_date}</p>}
                                                            </div>
                                                            {/* Method */}
                                                            <div>
                                                                <label className="mb-1 block text-xs font-medium text-gray-600">Method</label>
                                                                <Select
                                                                    value={editData.payment_method}
                                                                    onValueChange={(v) => setEditData('payment_method', v)}
                                                                >
                                                                    <SelectTrigger className="h-8 text-xs">
                                                                        <SelectValue />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="cash">Cash</SelectItem>
                                                                        <SelectItem value="check">Check</SelectItem>
                                                                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                                                                        <SelectItem value="gcash">GCash</SelectItem>
                                                                        <SelectItem value="maya">Maya</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>
                                                            {/* Reference */}
                                                            <div>
                                                                <label className="mb-1 block text-xs font-medium text-gray-600">Reference</label>
                                                                <Input
                                                                    placeholder="OR No."
                                                                    value={editData.reference_number}
                                                                    onChange={(e) => setEditData('reference_number', e.target.value)}
                                                                    className="h-8 text-xs"
                                                                />
                                                            </div>
                                                            {/* Amount */}
                                                            <div>
                                                                <label className="mb-1 block text-xs font-medium text-gray-600">Amount</label>
                                                                <Input
                                                                    type="number"
                                                                    step="0.01"
                                                                    min="0.01"
                                                                    value={editData.amount_paid}
                                                                    onChange={(e) => setEditData('amount_paid', e.target.value)}
                                                                    className="h-8 text-xs"
                                                                />
                                                                {editErrors.amount_paid && <p className="mt-0.5 text-xs text-red-500">{editErrors.amount_paid}</p>}
                                                            </div>
                                                            {/* Notes */}
                                                            <div>
                                                                <label className="mb-1 block text-xs font-medium text-gray-600">Notes</label>
                                                                <Input
                                                                    placeholder="Optional"
                                                                    value={editData.notes}
                                                                    onChange={(e) => setEditData('notes', e.target.value)}
                                                                    className="h-8 text-xs"
                                                                />
                                                            </div>
                                                            {/* Actions */}
                                                            <div className="flex items-end gap-2">
                                                                <Button type="submit" size="sm" className="h-8" disabled={editProcessing}>
                                                                    Save
                                                                </Button>
                                                                <Button type="button" size="sm" variant="outline" className="h-8" onClick={cancelEdit}>
                                                                    <X className="h-3.5 w-3.5" />
                                                                </Button>
                                                            </div>
                                                        </form>
                                                    </td>
                                                </tr>
                                            ) : (
                                                /* ── Normal display row ── */
                                                <tr key={p.id} className="hover:bg-gray-50">
                                                    <td className="px-4 py-2">{p.payment_date}</td>
                                                    <td className="px-4 py-2">
                                                        {paymentMethodLabels[p.payment_method] ?? p.payment_method}
                                                    </td>
                                                    <td className="px-4 py-2 text-gray-400">
                                                        {p.reference_number ?? '—'}
                                                    </td>
                                                    <td className="px-4 py-2 text-right font-semibold text-green-700">
                                                        {formatCurrency(p.amount_paid)}
                                                    </td>
                                                    <td className="px-4 py-2 text-gray-500">{p.processed_by}</td>
                                                    <td className="px-4 py-2">
                                                        <div className="flex items-center justify-center gap-1">
                                                            <button
                                                                type="button"
                                                                onClick={() => startEdit(p)}
                                                                className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-blue-600"
                                                                title="Edit"
                                                            >
                                                                <Pencil className="h-3.5 w-3.5" />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleDelete(p.id)}
                                                                className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-red-600"
                                                                title="Delete"
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>

                    {/* Left column — record payment */}
                    <div className="lg:order-first">
                        {isPaid ? (
                            <div className="rounded-lg border-2 border-green-200 bg-green-50 p-6 text-center shadow-sm">
                                <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-green-500" />
                                <h3 className="font-semibold text-green-800">Fully Paid</h3>
                                <p className="mt-1 text-sm text-green-600">
                                    This assessment has been fully settled.
                                </p>
                            </div>
                        ) : (
                            <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
                                <div className="mb-4 flex items-center gap-2">
                                    <Receipt className="h-5 w-5 text-blue-600" />
                                    <h2 className="font-semibold text-gray-900">Record Payment</h2>
                                </div>

                                {/* Balance indicator */}
                                <div className="mb-4 space-y-2">
                                    <div className="rounded-lg bg-amber-50 p-3 text-center">
                                        <p className="text-xs text-amber-600">Balance Remaining</p>
                                        <p className="text-2xl font-bold text-amber-800">
                                            {formatCurrency(assessment.balance)}
                                        </p>
                                    </div>
                                    {assessment.total_paid < assessment.minimum_amount && (
                                        <div className="rounded-lg bg-blue-50 p-2 text-center">
                                            <p className="text-xs text-blue-600">
                                                Min. to enroll: <span className="font-semibold">{formatCurrency(assessment.minimum_amount)}</span>
                                                {' '}· needs {formatCurrency(assessment.minimum_amount - assessment.total_paid)} more
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-4">
                                    {/* Amount */}
                                    <div>
                                        <label className="mb-1 block text-sm font-medium text-gray-700">
                                            Amount Paid <span className="text-red-500">*</span>
                                        </label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            min={minAmount}
                                            max={assessment.balance}
                                            placeholder={`Max: ${formatCurrency(assessment.balance)}`}
                                            value={data.amount_paid}
                                            onChange={(e) => setData('amount_paid', e.target.value)}
                                        />
                                        {errors.amount_paid && (
                                            <p className="mt-1 text-xs text-red-500">{errors.amount_paid}</p>
                                        )}
                                    </div>

                                    {/* Payment method */}
                                    <div>
                                        <label className="mb-1 block text-sm font-medium text-gray-700">
                                            Payment Method <span className="text-red-500">*</span>
                                        </label>
                                        <Select
                                            value={data.payment_method}
                                            onValueChange={(v) => setData('payment_method', v)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="cash">Cash</SelectItem>
                                                <SelectItem value="check">Check</SelectItem>
                                                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                                                <SelectItem value="gcash">GCash</SelectItem>
                                                <SelectItem value="maya">Maya</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        {errors.payment_method && (
                                            <p className="mt-1 text-xs text-red-500">{errors.payment_method}</p>
                                        )}
                                    </div>

                                    {/* Reference number */}
                                    <div>
                                        <label className="mb-1 block text-sm font-medium text-gray-700">
                                            Reference / OR No.{' '}
                                            <span className="text-gray-400">(optional)</span>
                                        </label>
                                        <Input
                                            placeholder="e.g. OR-2026-00001"
                                            value={data.reference_number}
                                            onChange={(e) => setData('reference_number', e.target.value)}
                                        />
                                        {errors.reference_number && (
                                            <p className="mt-1 text-xs text-red-500">{errors.reference_number}</p>
                                        )}
                                    </div>

                                    {/* Payment date */}
                                    <div>
                                        <label className="mb-1 block text-sm font-medium text-gray-700">
                                            Payment Date <span className="text-red-500">*</span>
                                        </label>
                                        <Input
                                            type="date"
                                            value={data.payment_date}
                                            onChange={(e) => setData('payment_date', e.target.value)}
                                        />
                                        {errors.payment_date && (
                                            <p className="mt-1 text-xs text-red-500">{errors.payment_date}</p>
                                        )}
                                    </div>

                                    {/* Notes */}
                                    <div>
                                        <label className="mb-1 block text-sm font-medium text-gray-700">
                                            Notes <span className="text-gray-400">(optional)</span>
                                        </label>
                                        <textarea
                                            rows={2}
                                            placeholder="Any remarks..."
                                            value={data.notes}
                                            onChange={(e) => setData('notes', e.target.value)}
                                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        />
                                        {errors.notes && (
                                            <p className="mt-1 text-xs text-red-500">{errors.notes}</p>
                                        )}
                                    </div>

                                    {/* Payment hint */}
                                    {data.amount_paid && (() => {
                                        const entered = parseFloat(data.amount_paid) || 0;
                                        const newTotal = assessment.total_paid + entered;
                                        const willEnroll = newTotal >= assessment.minimum_amount && assessment.total_paid < assessment.minimum_amount;
                                        const willFullyPay = entered >= assessment.balance;
                                        return (
                                            <div className={`rounded-md p-2 text-xs ${
                                                willFullyPay ? 'bg-green-50 text-green-700'
                                                : willEnroll ? 'bg-blue-50 text-blue-700'
                                                : 'bg-amber-50 text-amber-700'
                                            }`}>
                                                {willFullyPay ? (
                                                    <span className="flex items-center gap-1">
                                                        <CheckCircle2 className="h-3.5 w-3.5" />
                                                        This will fully settle the balance.
                                                    </span>
                                                ) : willEnroll ? (
                                                    <span className="flex items-center gap-1">
                                                        <CheckCircle2 className="h-3.5 w-3.5" />
                                                        Minimum met — student will be <strong>Enrolled</strong>. Remaining: {formatCurrency(assessment.balance - entered)}
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="h-3.5 w-3.5" />
                                                        Partial payment — {formatCurrency(Math.max(0, assessment.minimum_amount - newTotal))} more needed to enroll.
                                                    </span>
                                                )}
                                            </div>
                                        );
                                    })()}

                                    {errors.error && (
                                        <div className="flex items-center gap-2 rounded-md bg-red-50 p-2 text-xs text-red-700">
                                            <AlertCircle className="h-3.5 w-3.5" />
                                            {errors.error}
                                        </div>
                                    )}

                                    <Button
                                        type="submit"
                                        className="w-full"
                                        disabled={processing || !data.amount_paid}
                                    >
                                        {processing ? 'Recording...' : 'Record Payment'}
                                    </Button>
                                </form>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
