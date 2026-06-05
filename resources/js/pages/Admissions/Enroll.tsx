import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { AlertCircle, AlertTriangle, ArrowLeft, CheckCircle2, Clock, GraduationCap, Receipt } from 'lucide-react';

interface ApplicantInfo {
    id: number;
    application_number: string;
    application_status: string;
    year_level: string;
    school_year: string;
    semester: string | null;
    name: string;
}

interface AssessmentInfo {
    assessment_number: string;
    school_year: string;
    semester: string | null;
    total_tuition: number;
    total_misc_fees: number;
    total_lab_fees: number;
    total_other_fees: number;
    gross_amount: number;
    net_amount: number;
    minimum_amount: number;
    status: string;
}

interface Props {
    applicant: ApplicantInfo;
    assessment: AssessmentInfo | null;
}

function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount);
}

export default function ApplicantEnroll({ applicant, assessment }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Finance', href: '/admin/finance/assessments' },
        { title: 'Assessments', href: '/admin/finance/assessments' },
        { title: 'Enrollment Payment', href: '#' },
    ];

    const { data, setData, post, processing, errors } = useForm({
        amount_paid: '',
        notes: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(`/admissions/applicants/${applicant.id}/enroll`);
    };

    const enteredAmount = parseFloat(data.amount_paid) || 0;
    const willFullyPay  = assessment ? enteredAmount >= assessment.net_amount : false;
    const willEnroll    = assessment ? enteredAmount >= assessment.minimum_amount : false;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Enrollment — ${applicant.name}`} />

            <div className="p-6">
                {/* Header */}
                <div className="mb-6">
                    <Link href="/admin/finance/assessments">
                        <Button variant="ghost" size="sm" className="mb-2 -ml-2">
                            <ArrowLeft className="mr-1 h-4 w-4" />
                            Back to Assessments
                        </Button>
                    </Link>
                    <h1 className="text-2xl font-bold text-gray-900">Enrollment Payment</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        {applicant.application_number} · {applicant.year_level} · {applicant.school_year}
                        {applicant.semester ? ` · ${applicant.semester}` : ''}
                    </p>
                </div>

                {!assessment ? (
                    /* No assessment — applicant hasn't completed wizard */
                    <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-5">
                        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                        <div>
                            <p className="font-medium text-amber-800">Assessment not yet generated</p>
                            <p className="mt-1 text-sm text-amber-700">
                                The applicant must log in to the portal and complete the enrollment wizard before a payment can be recorded.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                        {/* Right column — assessment details */}
                        <div className="space-y-4 lg:order-last lg:col-span-2">
                            {/* Applicant info */}
                            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                                <h2 className="mb-3 text-sm font-semibold uppercase text-gray-500">
                                    Applicant Information
                                </h2>
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div>
                                        <p className="text-gray-500">Name</p>
                                        <p className="font-medium text-gray-900">{applicant.name}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500">Application No.</p>
                                        <p className="font-medium text-gray-900">{applicant.application_number}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500">Grade Level</p>
                                        <p className="font-medium text-gray-900">{applicant.year_level}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500">School Year</p>
                                        <p className="font-medium text-gray-900">
                                            {applicant.school_year}
                                            {applicant.semester ? ` · ${applicant.semester}` : ''}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Fee breakdown */}
                            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                                <h2 className="mb-3 text-sm font-semibold uppercase text-gray-500">
                                    Fee Assessment — {assessment.assessment_number}
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
                                    <div className="flex justify-between border-t pt-2 text-base font-bold text-gray-900">
                                        <span>Net Amount Due</span>
                                        <span>{formatCurrency(assessment.net_amount)}</span>
                                    </div>
                                </div>

                                {/* Minimum payment info */}
                                <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm">
                                    <div className="flex items-center gap-2">
                                        <GraduationCap className="h-4 w-4 text-blue-600" />
                                        <span className="font-medium text-blue-900">Installment Plan</span>
                                        <span className="text-blue-600">
                                            · Min. to enroll:{' '}
                                            <span className="font-semibold">{formatCurrency(assessment.minimum_amount)}</span>
                                        </span>
                                    </div>
                                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-blue-200">
                                        <div
                                            className="h-full rounded-full bg-blue-500 transition-all"
                                            style={{
                                                width: `${Math.min(100, (enteredAmount / assessment.minimum_amount) * 100)}%`,
                                            }}
                                        />
                                    </div>
                                    <p className="mt-1 text-xs text-blue-600">
                                        {willEnroll
                                            ? '✓ Minimum payment met — applicant will be Enrolled'
                                            : `${formatCurrency(Math.max(0, assessment.minimum_amount - enteredAmount))} more needed to enroll`}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Left column — record payment */}
                        <div className="lg:order-first">
                            <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
                                <div className="mb-4 flex items-center gap-2">
                                    <Receipt className="h-5 w-5 text-blue-600" />
                                    <h2 className="font-semibold text-gray-900">Record Payment</h2>
                                </div>

                                {/* Amount due indicators */}
                                <div className="mb-4 space-y-2">
                                    <div className="rounded-lg bg-amber-50 p-3 text-center">
                                        <p className="text-xs text-amber-600">Total Amount Due</p>
                                        <p className="text-2xl font-bold text-amber-800">
                                            {formatCurrency(assessment.net_amount)}
                                        </p>
                                    </div>
                                    <div className="rounded-lg bg-blue-50 p-2 text-center">
                                        <p className="text-xs text-blue-600">
                                            Min. to enroll:{' '}
                                            <span className="font-semibold">{formatCurrency(assessment.minimum_amount)}</span>
                                        </p>
                                    </div>
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
                                            min="0"
                                            placeholder={`Min: ${formatCurrency(assessment.minimum_amount)}`}
                                            value={data.amount_paid}
                                            onChange={(e) => setData('amount_paid', e.target.value)}
                                        />
                                        {errors.amount_paid && (
                                            <p className="mt-1 text-xs text-red-500">{errors.amount_paid}</p>
                                        )}
                                    </div>

                                    {/* Notes */}
                                    <div>
                                        <label className="mb-1 block text-sm font-medium text-gray-700">
                                            Notes <span className="text-gray-400">(optional)</span>
                                        </label>
                                        <textarea
                                            rows={2}
                                            placeholder="e.g. OR number, remarks..."
                                            value={data.notes}
                                            onChange={(e) => setData('notes', e.target.value)}
                                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        />
                                        {errors.notes && (
                                            <p className="mt-1 text-xs text-red-500">{errors.notes}</p>
                                        )}
                                    </div>

                                    {/* Payment hint */}
                                    {data.amount_paid && (
                                        <div
                                            className={`rounded-md p-2 text-xs ${
                                                willFullyPay
                                                    ? 'bg-green-50 text-green-700'
                                                    : willEnroll
                                                      ? 'bg-blue-50 text-blue-700'
                                                      : 'bg-amber-50 text-amber-700'
                                            }`}
                                        >
                                            {willFullyPay ? (
                                                <span className="flex items-center gap-1">
                                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                                    Full payment — applicant will be <strong>Enrolled</strong>.
                                                </span>
                                            ) : willEnroll ? (
                                                <span className="flex items-center gap-1">
                                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                                    Minimum met — applicant will be <strong>Enrolled</strong>. Remaining balance:{' '}
                                                    {formatCurrency(assessment.net_amount - enteredAmount)}
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1">
                                                    <Clock className="h-3.5 w-3.5" />
                                                    Below minimum —{' '}
                                                    {formatCurrency(assessment.minimum_amount - enteredAmount)} more needed to enroll.
                                                </span>
                                            )}
                                        </div>
                                    )}

                                    {(errors as Record<string, string>).error && (
                                        <div className="flex items-center gap-2 rounded-md bg-red-50 p-2 text-xs text-red-700">
                                            <AlertCircle className="h-3.5 w-3.5" />
                                            {(errors as Record<string, string>).error}
                                        </div>
                                    )}

                                    <Button
                                        type="submit"
                                        className="w-full"
                                        disabled={processing || !data.amount_paid}
                                    >
                                        {processing ? 'Enrolling...' : 'Enroll & Record Payment'}
                                    </Button>
                                </form>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
