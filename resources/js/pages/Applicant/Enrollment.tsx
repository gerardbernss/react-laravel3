import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import StudentLayout from '@/layouts/student-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { CheckCircle2, ChevronRight, ClipboardList, CreditCard, Printer, User } from 'lucide-react';
import { useState } from 'react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Fee {
    id: number;
    name: string;
    code: string;
    category: string;
    is_per_unit: boolean;
    amount: number;
}

interface AssessmentSubject {
    code: string;
    name: string;
    type: string;
    units: number;
}

interface Discount {
    id: number;
    name: string;
    code: string;
    discount_type: 'percentage' | 'fixed_amount';
    value: number;
    applies_to: string;
}

interface Props {
    personalData: {
        id: number;
        first_name: string;
        last_name: string;
        middle_name: string | null;
        email: string;
        mobile_number: string | null;
        present_street: string | null;
        present_brgy: string | null;
        present_city: string | null;
        present_province: string | null;
        present_zip: string | null;
    } | null;
    application: {
        id: number;
        application_number: string | null;
        school_year: string;
        semester: string | null;
        grade_level: string;
        application_status: string;
        preferred_payment_plan: string | null;
        preferred_payment_mode: string | null;
    } | null;
    fees: Fee[];
    availableDiscounts: Discount[];
    applicantEnrollmentOpen: boolean;
    assessmentNumber: string | null;
    assessmentSubjects: AssessmentSubject[];
}

// ─── Constants ───────────────────────────────────────────────────────────────

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/applicant/dashboard' },
    { title: 'Enrollment', href: '/applicant/enrollment' },
];

const STEPS = [
    { id: 1, name: 'Personal Info', icon: User },
    { id: 2, name: 'Fee Assessment', icon: CreditCard },
    { id: 3, name: 'Summary', icon: CheckCircle2 },
];

const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount);

const s = (v: string | null | undefined) => v ?? '';

// ─── Component ───────────────────────────────────────────────────────────────

export default function Enrollment({ personalData, application, fees, availableDiscounts, applicantEnrollmentOpen, assessmentNumber, assessmentSubjects }: Props) {
    const { errors } = usePage().props as { errors: Record<string, string> };

    const initialStep = assessmentNumber ? 3 : 1;
    const [step, setStep] = useState(initialStep);
    const [processing, setProcessing] = useState(false);

    // Step 1 form state
    const initialForm = {
        email: s(personalData?.email),
        mobile_number: s(personalData?.mobile_number),
        present_street: s(personalData?.present_street),
        present_brgy: s(personalData?.present_brgy),
        present_city: s(personalData?.present_city),
        present_province: s(personalData?.present_province),
        present_zip: s(personalData?.present_zip),
    };
    const [form, setForm] = useState(initialForm);

    // Fee calculations
    const tuitionFee = fees.filter((f) => f.category === 'tuition').reduce((s, f) => s + f.amount, 0);
    const miscFees   = fees.filter((f) => f.category === 'miscellaneous').reduce((s, f) => s + f.amount, 0);
    const labFees    = fees.filter((f) => f.category === 'laboratory').reduce((s, f) => s + f.amount, 0);
    const otherFees  = fees.filter((f) => f.category === 'special').reduce((s, f) => s + f.amount, 0);
    const grossTotal = tuitionFee + miscFees + labFees + otherFees;
    const netTotal   = grossTotal; // no discounts at this stage
    const minimumDue = Math.round(netTotal * 0.3 * 100) / 100;

    const isFormDirty = (Object.keys(initialForm) as (keyof typeof initialForm)[]).some(
        (k) => form[k] !== initialForm[k],
    );

    // Step 1 → save personal info only if changed, then advance
    const handleStep1Next = () => {
        if (!isFormDirty) {
            setStep(2);
            return;
        }
        setProcessing(true);
        router.post(
            '/applicant/personal-info',
            { ...form },
            {
                preserveScroll: true,
                onSuccess: () => { setStep(2); setProcessing(false); },
                onError: () => setProcessing(false),
            },
        );
    };

    // Step 2 → generate assessment then advance
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

    if (!application) {
        return (
            <StudentLayout breadcrumbs={breadcrumbs}>
                <Head title="Enrollment" />
                <div className="mx-auto max-w-2xl px-4 py-16 text-center">
                    <p className="text-gray-500">No application record found. Please contact the Registrar's Office.</p>
                </div>
            </StudentLayout>
        );
    }

    if (!applicantEnrollmentOpen) {
        return (
            <StudentLayout breadcrumbs={breadcrumbs}>
                <Head title="Enrollment" />
                <div className="mx-auto max-w-2xl px-4 py-16 text-center">
                    <ClipboardList className="mx-auto mb-4 h-12 w-12 text-gray-300" />
                    <h2 className="text-lg font-semibold text-gray-700">Enrollment is Not Yet Open</h2>
                    <p className="mt-2 text-sm text-gray-500">Enrollment is not currently open. Please check back later.</p>
                </div>
            </StudentLayout>
        );
    }

    return (
        <StudentLayout breadcrumbs={breadcrumbs}>
            <Head title="Enrollment" />

            {/* ── Screen view ── */}
            <div className="mx-auto max-w-3xl px-4 py-8 print:hidden">

                {/* Step indicator */}
                <nav className="mb-8 flex items-center justify-center gap-0">
                    {STEPS.map((s, i) => {
                        const Icon = s.icon;
                        const active   = step === s.id;
                        const complete = step > s.id;
                        return (
                            <div key={s.id} className="flex items-center">
                                <div className="flex flex-col items-center">
                                    <div className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors ${
                                        complete ? 'border-green-500 bg-green-500 text-white'
                                               : active ? 'border-blue-600 bg-blue-600 text-white'
                                               : 'border-gray-300 bg-white text-gray-400'
                                    }`}>
                                        <Icon className="h-5 w-5" />
                                    </div>
                                    <span className={`mt-1 text-xs font-medium ${active ? 'text-blue-600' : complete ? 'text-green-600' : 'text-gray-400'}`}>
                                        {s.name}
                                    </span>
                                </div>
                                {i < STEPS.length - 1 && (
                                    <div className={`mx-2 mb-5 h-0.5 w-16 ${step > s.id ? 'bg-green-500' : 'bg-gray-200'}`} />
                                )}
                            </div>
                        );
                    })}
                </nav>

                {/* ── Step 1: Personal Info ── */}
                {step === 1 && (
                    <div className="rounded-xl border bg-white p-6 shadow-sm">
                        <h2 className="mb-1 text-lg font-semibold text-gray-900">Personal Information</h2>
                        <p className="mb-6 text-sm text-gray-500">Please review and update your contact details before proceeding.</p>

                        <div className="space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="mb-1 block">Email <span className="text-red-500">*</span></Label>
                                    <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} type="email" />
                                    {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
                                </div>
                                <div>
                                    <Label className="mb-1 block">Mobile Number</Label>
                                    <Input value={form.mobile_number} onChange={(e) => setForm({ ...form, mobile_number: e.target.value })} />
                                    {errors.mobile_number && <p className="mt-1 text-xs text-red-600">{errors.mobile_number}</p>}
                                </div>
                            </div>

                            <p className="text-sm font-medium text-gray-700">Present Address</p>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="mb-1 block">Street</Label>
                                    <Input value={form.present_street} onChange={(e) => setForm({ ...form, present_street: e.target.value })} />
                                </div>
                                <div>
                                    <Label className="mb-1 block">Barangay</Label>
                                    <Input value={form.present_brgy} onChange={(e) => setForm({ ...form, present_brgy: e.target.value })} />
                                </div>
                                <div>
                                    <Label className="mb-1 block">City / Municipality</Label>
                                    <Input value={form.present_city} onChange={(e) => setForm({ ...form, present_city: e.target.value })} />
                                </div>
                                <div>
                                    <Label className="mb-1 block">Province</Label>
                                    <Input value={form.present_province} onChange={(e) => setForm({ ...form, present_province: e.target.value })} />
                                </div>
                                <div>
                                    <Label className="mb-1 block">ZIP Code</Label>
                                    <Input value={form.present_zip} onChange={(e) => setForm({ ...form, present_zip: e.target.value })} />
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end">
                            <Button onClick={handleStep1Next} disabled={processing} className="gap-2">
                                {processing ? 'Saving...' : 'Next'}
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                )}

                {/* ── Step 2: Fee Assessment ── */}
                {step === 2 && (
                    <div className="rounded-xl border bg-white p-6 shadow-sm">
                        <h2 className="mb-1 text-lg font-semibold text-gray-900">Fee Assessment</h2>
                        <p className="mb-6 text-sm text-gray-500">Review your fees below, then click Next to generate your assessment.</p>

                        {fees.length === 0 ? (
                            <p className="mb-6 text-sm text-amber-600">No fees configured for your grade level. Please contact the Registrar's Office.</p>
                        ) : (
                            <div className="mb-6 rounded-lg border">
                                <table className="w-full text-sm">
                                    <tbody>
                                        {tuitionFee > 0 && (
                                            <tr className="border-b">
                                                <td className="px-4 py-2 text-gray-600">Tuition Fees</td>
                                                <td className="px-4 py-2 text-right font-medium">{formatCurrency(tuitionFee)}</td>
                                            </tr>
                                        )}
                                        {miscFees > 0 && (
                                            <tr className="border-b">
                                                <td className="px-4 py-2 text-gray-600">Miscellaneous Fees</td>
                                                <td className="px-4 py-2 text-right font-medium">{formatCurrency(miscFees)}</td>
                                            </tr>
                                        )}
                                        {labFees > 0 && (
                                            <tr className="border-b">
                                                <td className="px-4 py-2 text-gray-600">Laboratory Fees</td>
                                                <td className="px-4 py-2 text-right font-medium">{formatCurrency(labFees)}</td>
                                            </tr>
                                        )}
                                        {otherFees > 0 && (
                                            <tr className="border-b">
                                                <td className="px-4 py-2 text-gray-600">Special Fees</td>
                                                <td className="px-4 py-2 text-right font-medium">{formatCurrency(otherFees)}</td>
                                            </tr>
                                        )}
                                        <tr className="bg-blue-50">
                                            <td className="px-4 py-3 text-base font-bold text-blue-900">NET AMOUNT DUE</td>
                                            <td className="px-4 py-3 text-right text-base font-bold text-blue-900">{formatCurrency(netTotal)}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {assessmentSubjects.length > 0 && (
                            <div className="mb-6 rounded-lg border">
                                <div className="border-b bg-gray-50 px-4 py-2">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                                        Pre-enrolled Subjects ({assessmentSubjects.length} subjects · {assessmentSubjects.reduce((sum, s) => sum + s.units, 0)} units)
                                    </p>
                                </div>
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b bg-gray-50 text-xs text-gray-500">
                                            <th className="px-4 py-2 text-left font-medium">Code</th>
                                            <th className="px-4 py-2 text-left font-medium">Subject Name</th>
                                            <th className="px-4 py-2 text-left font-medium">Type</th>
                                            <th className="px-4 py-2 text-right font-medium">Units</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {assessmentSubjects.map((s) => (
                                            <tr key={s.code} className="border-b last:border-0">
                                                <td className="px-4 py-2 font-mono text-xs text-gray-700">{s.code}</td>
                                                <td className="px-4 py-2 text-gray-900">{s.name}</td>
                                                <td className="px-4 py-2 text-gray-500">{s.type}</td>
                                                <td className="px-4 py-2 text-right text-gray-700">{s.units}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                            <p className="font-medium">Payment Options</p>
                            <div className="mt-2 grid grid-cols-2 gap-3">
                                <div className="rounded-lg bg-white p-3 shadow-sm">
                                    <p className="text-xs text-gray-500">Full Payment</p>
                                    <p className="text-lg font-bold text-gray-900">{formatCurrency(netTotal)}</p>
                                </div>
                                <div className="rounded-lg bg-white p-3 shadow-sm">
                                    <p className="text-xs text-gray-500">Minimum Upon Enrollment (30%)</p>
                                    <p className="text-lg font-bold text-green-700">{formatCurrency(minimumDue)}</p>
                                </div>
                            </div>
                            <p className="mt-3 text-xs text-amber-700">Mode of Payment: <strong>Cash</strong></p>
                        </div>

                        <div className="flex justify-between">
                            <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
                            <Button onClick={handleStep2Next} disabled={processing || fees.length === 0} className="gap-2">
                                {processing ? 'Generating...' : 'Next'}
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                )}

                {/* ── Step 3: Summary ── */}
                {step === 3 && (
                    <div className="rounded-xl border bg-white p-6 shadow-sm">
                        <h2 className="mb-1 text-lg font-semibold text-gray-900">Enrollment Summary</h2>
                        <p className="mb-6 text-sm text-gray-500">
                            Please print this summary and present it at the <strong>Cashier's Office</strong> to complete your enrollment.
                        </p>

                        {/* Student info */}
                        <div className="mb-4 rounded-lg border p-4">
                            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Student Information</p>
                            <div className="grid grid-cols-2 gap-y-2 text-sm">
                                <div>
                                    <span className="text-gray-500">Name: </span>
                                    <span className="font-medium">
                                        {personalData
                                            ? `${personalData.last_name}, ${personalData.first_name}${personalData.middle_name ? ' ' + personalData.middle_name : ''}`
                                            : '—'}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-gray-500">Application No.: </span>
                                    <span className="font-mono font-medium">{application.application_number ?? '—'}</span>
                                </div>
                                <div>
                                    <span className="text-gray-500">Grade Level: </span>
                                    <span className="font-medium">{application.grade_level}</span>
                                </div>
                                <div>
                                    <span className="text-gray-500">School Year: </span>
                                    <span className="font-medium">
                                        {application.school_year}{application.semester ? ` · ${application.semester}` : ''}
                                    </span>
                                </div>
                                {assessmentNumber && (
                                    <div className="col-span-2">
                                        <span className="text-gray-500">Assessment No.: </span>
                                        <span className="font-mono font-medium text-blue-700">{assessmentNumber}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Fee summary */}
                        {fees.length > 0 && (
                            <div className="mb-4 rounded-lg border p-4">
                                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Fee Assessment</p>
                                <div className="space-y-1 text-sm">
                                    {tuitionFee > 0 && <div className="flex justify-between"><span className="text-gray-600">Tuition Fees</span><span>{formatCurrency(tuitionFee)}</span></div>}
                                    {miscFees > 0 && <div className="flex justify-between"><span className="text-gray-600">Miscellaneous Fees</span><span>{formatCurrency(miscFees)}</span></div>}
                                    {labFees > 0 && <div className="flex justify-between"><span className="text-gray-600">Laboratory Fees</span><span>{formatCurrency(labFees)}</span></div>}
                                    {otherFees > 0 && <div className="flex justify-between"><span className="text-gray-600">Special Fees</span><span>{formatCurrency(otherFees)}</span></div>}
                                    <div className="flex justify-between border-t pt-2 text-base font-bold text-blue-900">
                                        <span>NET AMOUNT DUE</span>
                                        <span>{formatCurrency(netTotal)}</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Subjects */}
                        {assessmentSubjects.length > 0 && (
                            <div className="mb-4 rounded-lg border p-4">
                                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Pre-enrolled Subjects ({assessmentSubjects.length} · {assessmentSubjects.reduce((sum, s) => sum + s.units, 0)} units)
                                </p>
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b text-xs text-gray-500">
                                            <th className="pb-1 text-left font-medium">Code</th>
                                            <th className="pb-1 text-left font-medium">Subject Name</th>
                                            <th className="pb-1 text-left font-medium">Type</th>
                                            <th className="pb-1 text-right font-medium">Units</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {assessmentSubjects.map((s) => (
                                            <tr key={s.code} className="border-b last:border-0">
                                                <td className="py-1 font-mono text-xs text-gray-700">{s.code}</td>
                                                <td className="py-1 text-gray-900">{s.name}</td>
                                                <td className="py-1 text-gray-500">{s.type}</td>
                                                <td className="py-1 text-right text-gray-700">{s.units}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Payment options */}
                        <div className="mb-6 grid grid-cols-2 gap-3">
                            <div className="rounded-lg border p-4 text-center">
                                <p className="text-xs text-gray-500">Full Payment</p>
                                <p className="mt-1 text-xl font-bold text-gray-900">{formatCurrency(netTotal)}</p>
                            </div>
                            <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-center">
                                <p className="text-xs text-gray-500">Minimum Upon Enrollment (30%)</p>
                                <p className="mt-1 text-xl font-bold text-green-700">{formatCurrency(minimumDue)}</p>
                            </div>
                        </div>
                        <p className="mb-6 text-center text-sm text-gray-500">Mode of Payment: <strong>Cash</strong></p>

                        <div className="flex justify-between">
                            <Button variant="outline" onClick={() => setStep(2)} disabled={!!assessmentNumber}>Back</Button>
                            <Button onClick={handlePrint} className="gap-2">
                                <Printer className="h-4 w-4" />
                                Print Summary
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Printable Summary ── */}
            <div className="hidden p-10 font-sans text-sm text-black print:block">
                <div className="mb-6 border-b-2 border-black pb-4 text-center">
                    <h1 className="text-2xl font-bold tracking-wide uppercase">St. Louis University</h1>
                    <h2 className="text-base font-semibold">Student Enrollment Summary</h2>
                </div>

                <div className="mb-4 flex justify-between text-xs">
                    <div>
                        <p><strong>School Year:</strong> {application.school_year}</p>
                        <p><strong>Semester:</strong> {application.semester ?? '—'}</p>
                    </div>
                    <div className="text-right">
                        <p><strong>Mode of Payment:</strong> Cash</p>
                        {assessmentNumber && <p><strong>Assessment No.:</strong> {assessmentNumber}</p>}
                    </div>
                </div>

                <div className="mb-4 border border-black p-3">
                    <p className="mb-2 font-bold uppercase">Student Information</p>
                    <div className="grid grid-cols-2 gap-1 text-xs">
                        <p>
                            <strong>Name:</strong>{' '}
                            {personalData
                                ? `${personalData.last_name}, ${personalData.first_name}${personalData.middle_name ? ' ' + personalData.middle_name : ''}`
                                : '—'}
                        </p>
                        <p><strong>Application No.:</strong> {application.application_number ?? '—'}</p>
                        <p><strong>Grade Level:</strong> {application.grade_level}</p>
                    </div>
                </div>

                {fees.length > 0 && (
                    <div className="mb-4 border border-black p-3">
                        <p className="mb-2 font-bold uppercase">Fee Assessment</p>
                        <table className="w-full text-xs">
                            <tbody>
                                {tuitionFee > 0 && <tr><td className="py-0.5">Tuition Fees</td><td className="py-0.5 text-right">{formatCurrency(tuitionFee)}</td></tr>}
                                {miscFees > 0 && <tr><td className="py-0.5">Miscellaneous Fees</td><td className="py-0.5 text-right">{formatCurrency(miscFees)}</td></tr>}
                                {labFees > 0 && <tr><td className="py-0.5">Laboratory Fees</td><td className="py-0.5 text-right">{formatCurrency(labFees)}</td></tr>}
                                {otherFees > 0 && <tr><td className="py-0.5">Special Fees</td><td className="py-0.5 text-right">{formatCurrency(otherFees)}</td></tr>}
                                <tr className="border-t-2 border-black text-sm font-bold">
                                    <td className="pt-1">NET AMOUNT DUE</td>
                                    <td className="pt-1 text-right">{formatCurrency(netTotal)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                )}

                {assessmentSubjects.length > 0 && (
                    <div className="mb-4 border border-black p-3">
                        <p className="mb-2 font-bold uppercase">
                            Pre-enrolled Subjects ({assessmentSubjects.length} subjects · {assessmentSubjects.reduce((sum, s) => sum + s.units, 0)} total units)
                        </p>
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="border-b border-black">
                                    <th className="py-0.5 text-left font-semibold">Code</th>
                                    <th className="py-0.5 text-left font-semibold">Subject Name</th>
                                    <th className="py-0.5 text-left font-semibold">Type</th>
                                    <th className="py-0.5 text-right font-semibold">Units</th>
                                </tr>
                            </thead>
                            <tbody>
                                {assessmentSubjects.map((s) => (
                                    <tr key={s.code} className="border-b border-gray-300 last:border-0">
                                        <td className="py-0.5 font-mono">{s.code}</td>
                                        <td className="py-0.5">{s.name}</td>
                                        <td className="py-0.5">{s.type}</td>
                                        <td className="py-0.5 text-right">{s.units}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <div className="mb-4 border border-black p-3">
                    <p className="mb-2 font-bold uppercase">Payment Options</p>
                    <table className="w-full text-xs">
                        <tbody>
                            <tr>
                                <td className="py-0.5">Full Payment</td>
                                <td className="py-0.5 text-right font-bold">{formatCurrency(netTotal)}</td>
                            </tr>
                            <tr>
                                <td className="py-0.5">Minimum Upon Enrollment (30%)</td>
                                <td className="py-0.5 text-right font-bold">{formatCurrency(minimumDue)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <p className="mt-8 text-center text-xs text-gray-500">
                    Please present this summary at the Cashier's Office to complete your enrollment.
                </p>
            </div>
        </StudentLayout>
    );
}
