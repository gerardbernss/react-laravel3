import StudentLayout from '@/layouts/student-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { Wallet } from 'lucide-react';

interface Payment {
    id: number;
    amount_paid: number;
    payment_method: string;
    reference_number: string | null;
    payment_date: string;
    notes: string | null;
}

interface AssessmentEntry {
    id: number;
    assessment_number: string;
    school_year: string;
    semester: string;
    status: string;
    total_tuition: number;
    total_misc_fees: number;
    total_lab_fees: number;
    total_other_fees: number;
    gross_amount: number;
    total_discounts: number;
    prior_balance: number;
    net_amount: number;
    total_paid: number;
    balance: number;
    finalized_at: string | null;
    payments: Payment[];
}

interface Props {
    statement: AssessmentEntry[];
    totalBilled: number;
    totalPaid: number;
    currentBalance: number;
}

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Statement of Account', href: '/student/statement-of-account' }];

const formatCurrency = (amount: number) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount);

const paymentMethodLabels: Record<string, string> = {
    cash: 'Cash',
    check: 'Check',
    bank_transfer: 'Bank Transfer',
    gcash: 'GCash',
    maya: 'Maya',
};

const statusStyles: Record<string, string> = {
    paid: 'bg-green-50 text-green-700 border-green-200',
    partial: 'bg-blue-50 text-blue-700 border-blue-200',
    finalized: 'bg-amber-50 text-amber-700 border-amber-200',
    draft: 'bg-gray-50 text-gray-600 border-gray-200',
    cancelled: 'bg-red-50 text-red-700 border-red-200',
};

const statusLabels: Record<string, string> = {
    paid: 'Paid',
    partial: 'Partial Payment',
    finalized: 'Finalized',
    draft: 'Draft',
    cancelled: 'Cancelled',
};

export default function StatementOfAccount({ statement, totalBilled, totalPaid, currentBalance }: Props) {
    return (
        <StudentLayout breadcrumbs={breadcrumbs}>
            <Head title="Statement of Account" />

            <div className="space-y-6 p-4 md:p-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Statement of Account</h1>
                    <p className="mt-1 text-sm text-gray-500">A record of all fee assessments and payments across your enrollment.</p>
                </div>

                {statement.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 py-16 text-center">
                        <Wallet className="mb-3 h-10 w-10 text-gray-400" />
                        <p className="text-sm font-medium text-gray-600">No billing records yet.</p>
                        <p className="mt-1 text-xs text-gray-400">
                            Your statement of account will appear here once a fee assessment has been generated.
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Summary cards */}
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                            <div className="rounded-lg border bg-white p-4 shadow-sm">
                                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Total Charges</p>
                                <p className="mt-1 text-xl font-bold text-gray-900">{formatCurrency(totalBilled)}</p>
                            </div>
                            <div className="rounded-lg border bg-white p-4 shadow-sm">
                                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Total Payments</p>
                                <p className="mt-1 text-xl font-bold text-green-700">{formatCurrency(totalPaid)}</p>
                            </div>
                            <div className={`rounded-lg border p-4 shadow-sm ${currentBalance > 0 ? 'bg-amber-50' : 'bg-white'}`}>
                                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Outstanding Balance</p>
                                <p className={`mt-1 text-xl font-bold ${currentBalance > 0 ? 'text-amber-700' : 'text-gray-900'}`}>
                                    {formatCurrency(currentBalance)}
                                </p>
                            </div>
                        </div>

                        {/* Per-semester ledger */}
                        <div className="space-y-4">
                            {statement.map((a) => (
                                <div key={a.id} className="overflow-hidden rounded-lg border bg-white shadow-sm">
                                    <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-gray-50 px-4 py-3">
                                        <div>
                                            <p className="font-mono text-xs text-gray-500">{a.assessment_number}</p>
                                            <p className="text-sm font-semibold text-gray-900">
                                                {a.semester} · {a.school_year}
                                            </p>
                                        </div>
                                        <span
                                            className={`rounded-full border px-2.5 py-1 text-xs font-medium ${
                                                statusStyles[a.status] ?? 'border-gray-200 bg-gray-50 text-gray-600'
                                            }`}
                                        >
                                            {statusLabels[a.status] ?? a.status}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 gap-6 p-4 md:grid-cols-2">
                                        {/* Fee breakdown */}
                                        <div className="space-y-1 text-sm">
                                            {a.total_tuition > 0 && (
                                                <div className="flex justify-between text-gray-600">
                                                    <span>Tuition Fees</span>
                                                    <span>{formatCurrency(a.total_tuition)}</span>
                                                </div>
                                            )}
                                            {a.total_misc_fees > 0 && (
                                                <div className="flex justify-between text-gray-600">
                                                    <span>Miscellaneous Fees</span>
                                                    <span>{formatCurrency(a.total_misc_fees)}</span>
                                                </div>
                                            )}
                                            {a.total_lab_fees > 0 && (
                                                <div className="flex justify-between text-gray-600">
                                                    <span>Laboratory Fees</span>
                                                    <span>{formatCurrency(a.total_lab_fees)}</span>
                                                </div>
                                            )}
                                            {a.total_other_fees > 0 && (
                                                <div className="flex justify-between text-gray-600">
                                                    <span>Other Fees</span>
                                                    <span>{formatCurrency(a.total_other_fees)}</span>
                                                </div>
                                            )}
                                            {a.total_discounts > 0 && (
                                                <div className="flex justify-between text-green-700">
                                                    <span>Discounts</span>
                                                    <span>-{formatCurrency(a.total_discounts)}</span>
                                                </div>
                                            )}
                                            {a.prior_balance > 0 && (
                                                <div className="flex justify-between text-gray-600">
                                                    <span>Prior Balance</span>
                                                    <span>{formatCurrency(a.prior_balance)}</span>
                                                </div>
                                            )}
                                            <div className="flex justify-between border-t pt-2 text-base font-bold text-gray-900">
                                                <span>Net Amount Due</span>
                                                <span>{formatCurrency(a.net_amount)}</span>
                                            </div>
                                            <div className="flex justify-between text-sm text-gray-600">
                                                <span>Total Paid</span>
                                                <span className="text-green-700">{formatCurrency(a.total_paid)}</span>
                                            </div>
                                            <div className="flex justify-between text-sm font-semibold">
                                                <span>Balance</span>
                                                <span className={a.balance > 0 ? 'text-red-600' : 'text-gray-900'}>
                                                    {formatCurrency(a.balance)}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Payment history */}
                                        <div>
                                            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Payment History</p>
                                            {a.payments.length === 0 ? (
                                                <p className="text-sm text-gray-400">No payments recorded yet.</p>
                                            ) : (
                                                <div className="overflow-hidden rounded-md border">
                                                    <table className="w-full text-sm">
                                                        <thead className="bg-gray-50">
                                                            <tr>
                                                                <th className="px-3 py-1.5 text-left text-xs font-medium uppercase text-gray-500">
                                                                    Date
                                                                </th>
                                                                <th className="px-3 py-1.5 text-left text-xs font-medium uppercase text-gray-500">
                                                                    Method
                                                                </th>
                                                                <th className="px-3 py-1.5 text-left text-xs font-medium uppercase text-gray-500">
                                                                    Reference
                                                                </th>
                                                                <th className="px-3 py-1.5 text-right text-xs font-medium uppercase text-gray-500">
                                                                    Amount
                                                                </th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y">
                                                            {a.payments.map((p) => (
                                                                <tr key={p.id}>
                                                                    <td className="px-3 py-1.5 text-gray-700">{p.payment_date}</td>
                                                                    <td className="px-3 py-1.5 text-gray-700">
                                                                        {paymentMethodLabels[p.payment_method] ?? p.payment_method}
                                                                    </td>
                                                                    <td className="px-3 py-1.5 text-gray-700">{p.reference_number ?? '—'}</td>
                                                                    <td className="px-3 py-1.5 text-right font-medium text-gray-900">
                                                                        {formatCurrency(p.amount_paid)}
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </StudentLayout>
    );
}
