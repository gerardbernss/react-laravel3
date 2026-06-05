import { ConfirmDialog } from '@/components/confirm-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { ArrowLeft, CheckCircle, ClipboardList, History, RotateCcw, Tag, User } from 'lucide-react';
import { useMemo, useState } from 'react';

interface FamilyBackground {
    father_name: string | null;
    mother_name: string | null;
    guardian_name: string | null;
}

interface PersonalData {
    first_name: string;
    last_name: string;
    middle_name: string | null;
    email: string;
    mobile_number: string | null;
    gender: string | null;
    date_of_birth: string | null;
    citizenship: string | null;
    family_background: FamilyBackground | null;
}

interface AuditLog {
    id: number;
    action: string;
    performed_by: string | null;
    details: string | null;
    created_at: string;
}

interface Fee {
    id: number;
    name: string;
    category: string;
    is_per_unit: boolean;
    amount: number;
}

interface DiscountType {
    id: number;
    name: string;
    code: string;
    discount_type: 'percentage' | 'fixed_amount';
    value: string;
    applies_to: 'tuition_only' | 'miscellaneous_only' | 'all_fees';
    is_stackable: boolean;
    max_discount_cap: string | null;
    description: string | null;
    auto_applied: boolean;
}

interface ExistingAssessment {
    assessment_number: string;
    net_amount: number;
    payment_plan: string;
    status: string;
}

interface Applicant {
    id: number;
    application_number: string;
    application_status: string;
    student_id_number: string | null;
    year_level: string | null;
    student_category: string | null;
    school_year: string | null;
    semester: string | null;
    strand: string | null;
    classification: string | null;
    application_date: string | null;
    personal_data: PersonalData | null;
    audit_logs: AuditLog[];
}

interface Props {
    applicant: Applicant;
    fees: Fee[];
    units: number;
    discountTypes: DiscountType[];
    existingAssessment: ExistingAssessment | null;
}

const CATEGORY_LABELS: Record<string, string> = {
    tuition: 'Tuition',
    miscellaneous: 'Miscellaneous',
    laboratory: 'Laboratory',
    special: 'Special Fees',
    other: 'Other',
};

const CATEGORY_ORDER = ['tuition', 'miscellaneous', 'laboratory', 'special', 'other'];

function calcDiscountAmount(dt: DiscountType, tuitionTotal: number, miscTotal: number, grossAmount: number): number {
    const base = dt.applies_to === 'tuition_only' ? tuitionTotal
               : dt.applies_to === 'miscellaneous_only' ? miscTotal
               : grossAmount;
    let amount = dt.discount_type === 'percentage'
        ? base * (parseFloat(dt.value) / 100)
        : parseFloat(dt.value);
    if (dt.max_discount_cap && amount > parseFloat(dt.max_discount_cap)) {
        amount = parseFloat(dt.max_discount_cap);
    }
    return Math.round(amount * 100) / 100;
}

export default function ShowEnrollment({ applicant, fees, units, discountTypes, existingAssessment }: Props) {
    const [showEnrollForm, setShowEnrollForm] = useState(false);
    const [showRevertDialog, setShowRevertDialog] = useState(false);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Enrollment Management', href: '/enrollment/dashboard' },
        {
            title: `${applicant.personal_data?.last_name}, ${applicant.personal_data?.first_name}`,
            href: `/enrollment/${applicant.id}`,
        },
    ];

    // ── Simple enroll form (Pending → Enrolled) ───────────────────────────────
    const enrollForm = useForm({ student_id_number: '' });

    const handleEnroll = (e: React.FormEvent) => {
        e.preventDefault();
        enrollForm.post(`/enrollment/${applicant.id}/enroll`, {
            onSuccess: () => setShowEnrollForm(false),
        });
    };

    // ── Fee helpers ───────────────────────────────────────────────────────────
    const feesByCategory = useMemo(() => {
        const map: Record<string, Fee[]> = {};
        for (const fee of fees) {
            const cat = fee.category ?? 'other';
            if (!map[cat]) map[cat] = [];
            map[cat].push(fee);
        }
        return map;
    }, [fees]);

    const feeAmount = (fee: Fee) => (fee.is_per_unit ? fee.amount * units : fee.amount);
    const categoryTotal = (cat: string) => (feesByCategory[cat] ?? []).reduce((s, f) => s + feeAmount(f), 0);

    const grossAmount  = useMemo(() => fees.reduce((sum, f) => sum + feeAmount(f), 0), [fees, units]);
    const tuitionTotal = useMemo(() => (feesByCategory['tuition'] ?? []).reduce((s, f) => s + feeAmount(f), 0), [feesByCategory, units]);
    const miscTotal    = useMemo(() => (feesByCategory['miscellaneous'] ?? []).reduce((s, f) => s + feeAmount(f), 0), [feesByCategory, units]);

    // ── Onsite enrollment form ────────────────────────────────────────────────
    const onsiteForm = useForm({
        student_id_number: applicant.student_id_number ?? '',
        payment_plan: 'full',
        mode_of_payment: 'cash',
        discount_ids: discountTypes.filter((dt) => dt.auto_applied).map((dt) => dt.id) as number[],
    });

    const selectedDiscountIds = onsiteForm.data.discount_ids;

    const toggleDiscount = (dt: DiscountType) => {
        if (dt.auto_applied) return;
        const current = onsiteForm.data.discount_ids;
        if (current.includes(dt.id)) {
            onsiteForm.setData('discount_ids', current.filter((x) => x !== dt.id));
        } else if (!dt.is_stackable) {
            // Replace other non-stackable non-auto discounts
            const nonStackableAutoIds = discountTypes.filter((d) => !d.is_stackable && d.auto_applied).map((d) => d.id);
            const kept = current.filter((x) => {
                const xdt = discountTypes.find((d) => d.id === x);
                return xdt?.is_stackable || nonStackableAutoIds.includes(x);
            });
            onsiteForm.setData('discount_ids', [...kept, dt.id]);
        } else {
            onsiteForm.setData('discount_ids', [...current, dt.id]);
        }
    };

    // Is another non-stackable already selected?
    const hasNonStackableSelected = discountTypes.some(
        (dt) => selectedDiscountIds.includes(dt.id) && !dt.is_stackable && !dt.auto_applied,
    );

    const appliedDiscounts = useMemo(
        () =>
            discountTypes
                .filter((dt) => selectedDiscountIds.includes(dt.id))
                .map((dt) => ({ ...dt, discountAmount: calcDiscountAmount(dt, tuitionTotal, miscTotal, grossAmount) })),
        [selectedDiscountIds, discountTypes, tuitionTotal, miscTotal, grossAmount],
    );

    const totalDiscount = useMemo(() => appliedDiscounts.reduce((s, d) => s + d.discountAmount, 0), [appliedDiscounts]);
    const netAmount     = useMemo(() => Math.max(0, grossAmount - totalDiscount), [grossAmount, totalDiscount]);

    const handleOnsiteEnroll = (e: React.FormEvent) => {
        e.preventDefault();
        onsiteForm.post(`/enrollment/${applicant.id}/process-onsite`);
    };

    // ── Revert ────────────────────────────────────────────────────────────────
    const confirmRevert = () => {
        router.post(`/enrollment/${applicant.id}/revert-to-pending`, {}, {
            onSuccess: () => setShowRevertDialog(false),
        });
    };

    // ── Status badge ──────────────────────────────────────────────────────────
    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'Enrolled':    return <Badge className="bg-green-100 text-green-800">Enrolled</Badge>;
            case 'Pending':     return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
            case 'For Exam':    return <Badge className="bg-blue-100 text-blue-800">For Exam</Badge>;
            case 'Exam Taken':  return <Badge className="bg-purple-100 text-purple-800">Exam Taken</Badge>;
            case 'Exam Passed': return <Badge className="bg-emerald-100 text-emerald-800">Exam Passed</Badge>;
            case 'Exam Failed': return <Badge className="bg-red-100 text-red-800">Exam Failed</Badge>;
            default:            return <Badge variant="outline">{status}</Badge>;
        }
    };

    const fmt = (n: number) => n.toLocaleString('en-PH', { minimumFractionDigits: 2 });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Applicant Enrollment Details" />

            <div className="space-y-6 p-6 md:p-10">
                {/* Header */}
                <div className="flex items-start justify-between">
                    <h1 className="text-3xl font-bold text-gray-900">Applicant Enrollment Details</h1>
                    <Link href="/enrollment/dashboard">
                        <Button variant="outline">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Dashboard
                        </Button>
                    </Link>
                </div>

                {/* Application Info */}
                <div className="rounded-lg border bg-white p-6 shadow-sm">
                    <h2 className="mb-4 text-lg font-semibold">Application Information</h2>
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
                        <div>
                            <p className="text-sm text-gray-600">Application Number</p>
                            <p className="font-mono font-medium">{applicant.application_number}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Status</p>
                            <div className="mt-1">{getStatusBadge(applicant.application_status)}</div>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Student ID</p>
                            <p className="font-medium">{applicant.student_id_number || 'Not assigned'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Date Applied</p>
                            <p className="font-medium">
                                {applicant.application_date ? new Date(applicant.application_date).toLocaleDateString() : 'N/A'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Personal Information */}
                <div className="rounded-lg border bg-white p-6 shadow-sm">
                    <div className="mb-4 flex items-center gap-2">
                        <User className="h-5 w-5 text-gray-600" />
                        <h2 className="text-lg font-semibold">Personal Information</h2>
                    </div>
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                        <div>
                            <p className="text-sm text-gray-600">Full Name</p>
                            <p className="text-lg font-medium">
                                {applicant.personal_data?.last_name}, {applicant.personal_data?.first_name}
                                {applicant.personal_data?.middle_name && ` ${applicant.personal_data.middle_name}`}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Email</p>
                            <p className="font-medium">{applicant.personal_data?.email}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Contact Number</p>
                            <p className="font-medium">{applicant.personal_data?.mobile_number || 'Not provided'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Gender</p>
                            <p className="font-medium">{applicant.personal_data?.gender || 'Not specified'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Date of Birth</p>
                            <p className="font-medium">
                                {applicant.personal_data?.date_of_birth
                                    ? new Date(applicant.personal_data.date_of_birth).toLocaleDateString()
                                    : 'Not provided'}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Citizenship</p>
                            <p className="font-medium">{applicant.personal_data?.citizenship || 'Not specified'}</p>
                        </div>
                    </div>
                </div>

                {/* Academic Information */}
                <div className="rounded-lg border bg-white p-6 shadow-sm">
                    <h2 className="mb-4 text-lg font-semibold">Academic Information</h2>
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
                        <div>
                            <p className="text-sm text-gray-600">Category</p>
                            <Badge variant="outline" className="mt-1">{applicant.student_category || 'N/A'}</Badge>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Grade Level Applied</p>
                            <p className="font-medium">{applicant.year_level || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">School Year</p>
                            <p className="font-medium">{applicant.school_year || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Semester</p>
                            <p className="font-medium">{applicant.semester || 'N/A'}</p>
                        </div>
                        {applicant.strand && (
                            <div>
                                <p className="text-sm text-gray-600">Strand</p>
                                <p className="font-medium">{applicant.strand}</p>
                            </div>
                        )}
                        {applicant.classification && (
                            <div>
                                <p className="text-sm text-gray-600">Classification</p>
                                <p className="font-medium">{applicant.classification}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Onsite Enrollment (Exam Passed only) ── */}
                {applicant.application_status === 'Exam Passed' && (
                    <div className="rounded-lg border bg-white p-6 shadow-sm">
                        <div className="mb-4 flex items-center gap-2">
                            <ClipboardList className="h-5 w-5 text-gray-600" />
                            <h2 className="text-lg font-semibold">Process Onsite Enrollment</h2>
                        </div>

                        {existingAssessment ? (
                            <div className="rounded border border-blue-200 bg-blue-50 p-4">
                                <p className="mb-1 text-sm font-semibold text-blue-900">Assessment Already Submitted</p>
                                <p className="text-sm text-blue-800">
                                    Assessment #{existingAssessment.assessment_number} &mdash;{' '}
                                    ₱{Number(existingAssessment.net_amount).toLocaleString('en-PH', { minimumFractionDigits: 2 })} &mdash;{' '}
                                    {existingAssessment.payment_plan === 'full' ? 'Full Payment' : 'Installment'} &mdash;{' '}
                                    <span className="capitalize">{existingAssessment.status}</span>
                                </p>
                            </div>
                        ) : (
                            <form onSubmit={handleOnsiteEnroll} className="space-y-6">
                                {/* Fee Breakdown */}
                                {fees.length > 0 && (
                                    <div>
                                        <h3 className="mb-3 text-sm font-semibold text-gray-700">Fee Breakdown</h3>
                                        <div className="overflow-x-auto rounded border">
                                            <table className="min-w-full divide-y divide-gray-200 text-sm">
                                                <thead className="bg-gray-50">
                                                    <tr>
                                                        <th className="px-4 py-2 text-left font-medium text-gray-600">Fee</th>
                                                        <th className="px-4 py-2 text-right font-medium text-gray-600">Amount</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100">
                                                    {CATEGORY_ORDER.filter((cat) => feesByCategory[cat]?.length).map((cat) => (
                                                        <>
                                                            <tr key={`cat-${cat}`} className="bg-gray-50">
                                                                <td colSpan={2} className="px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                                                    {CATEGORY_LABELS[cat] ?? cat}
                                                                </td>
                                                            </tr>
                                                            {feesByCategory[cat].map((fee) => (
                                                                <tr key={fee.id}>
                                                                    <td className="px-4 py-2 pl-8 text-gray-700">
                                                                        {fee.name}
                                                                        {fee.is_per_unit && (
                                                                            <span className="ml-1 text-xs text-gray-400">
                                                                                (₱{fee.amount.toFixed(2)} × {units} units)
                                                                            </span>
                                                                        )}
                                                                    </td>
                                                                    <td className="px-4 py-2 text-right text-gray-700">
                                                                        ₱{fmt(feeAmount(fee))}
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                            <tr key={`subtotal-${cat}`} className="border-t bg-gray-50">
                                                                <td className="px-4 py-1.5 pl-8 text-xs font-medium text-gray-500">Subtotal</td>
                                                                <td className="px-4 py-1.5 text-right text-xs font-medium text-gray-700">
                                                                    ₱{fmt(categoryTotal(cat))}
                                                                </td>
                                                            </tr>
                                                        </>
                                                    ))}
                                                    <tr className="border-t-2 bg-gray-100">
                                                        <td className="px-4 py-2 font-semibold text-gray-900">Gross Total</td>
                                                        <td className="px-4 py-2 text-right font-semibold text-gray-900">
                                                            ₱{fmt(grossAmount)}
                                                        </td>
                                                    </tr>
                                                    {/* Discount rows */}
                                                    {appliedDiscounts.map((d) => (
                                                        <tr key={d.id} className="bg-green-50">
                                                            <td className="px-4 py-1.5 pl-8 text-sm text-green-700">
                                                                {d.name}
                                                                <span className="ml-1 text-xs text-green-500">
                                                                    ({d.discount_type === 'percentage'
                                                                        ? `${d.value}% off ${d.applies_to === 'tuition_only' ? 'tuition' : d.applies_to === 'miscellaneous_only' ? 'misc' : 'all fees'}`
                                                                        : `fixed ₱${parseFloat(d.value).toLocaleString()}`})
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-1.5 text-right text-sm font-medium text-green-700">
                                                                − ₱{fmt(d.discountAmount)}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                    {totalDiscount > 0 && (
                                                        <tr className="border-t-2 bg-green-100">
                                                            <td className="px-4 py-2 font-bold text-gray-900">Net Amount Due</td>
                                                            <td className="px-4 py-2 text-right font-bold text-gray-900">
                                                                ₱{fmt(netAmount)}
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                {/* Discounts */}
                                {discountTypes.length > 0 && (
                                    <div>
                                        <div className="mb-3 flex items-center gap-2">
                                            <Tag className="h-4 w-4 text-gray-500" />
                                            <h3 className="text-sm font-semibold text-gray-700">Discounts</h3>
                                        </div>
                                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                            {discountTypes.map((dt) => {
                                                const isChecked  = selectedDiscountIds.includes(dt.id);
                                                const isDisabled = dt.auto_applied || (!dt.is_stackable && hasNonStackableSelected && !isChecked);
                                                return (
                                                    <label
                                                        key={dt.id}
                                                        className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
                                                            isChecked
                                                                ? 'border-green-400 bg-green-50'
                                                                : isDisabled
                                                                  ? 'cursor-not-allowed border-gray-200 bg-gray-50 opacity-50'
                                                                  : 'border-gray-200 hover:border-primary hover:bg-gray-50'
                                                        }`}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={isChecked}
                                                            disabled={isDisabled}
                                                            onChange={() => toggleDiscount(dt)}
                                                            className="mt-0.5 h-4 w-4 rounded border-gray-300"
                                                        />
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-sm font-medium text-gray-900">{dt.name}</span>
                                                                {dt.auto_applied && (
                                                                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                                                                        Auto-detected
                                                                    </span>
                                                                )}
                                                                {!dt.is_stackable && (
                                                                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">
                                                                        Non-stackable
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="mt-0.5 text-xs text-gray-500">
                                                                {dt.discount_type === 'percentage'
                                                                    ? `${dt.value}% off ${dt.applies_to === 'tuition_only' ? 'tuition' : dt.applies_to === 'miscellaneous_only' ? 'miscellaneous fees' : 'all fees'}`
                                                                    : `₱${parseFloat(dt.value).toLocaleString()} off ${dt.applies_to === 'tuition_only' ? 'tuition' : dt.applies_to === 'miscellaneous_only' ? 'miscellaneous fees' : 'all fees'}`}
                                                                {dt.max_discount_cap && ` (max ₱${parseFloat(dt.max_discount_cap).toLocaleString()})`}
                                                            </p>
                                                            {isChecked && (
                                                                <p className="mt-1 text-xs font-semibold text-green-700">
                                                                    − ₱{fmt(calcDiscountAmount(dt, tuitionTotal, miscTotal, grossAmount))}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                        {onsiteForm.errors.discount_ids && (
                                            <p className="mt-2 text-sm text-red-600">{onsiteForm.errors.discount_ids}</p>
                                        )}
                                    </div>
                                )}

                                {/* Form Fields */}
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div>
                                        <Label htmlFor="onsite_student_id">Student ID Number <span className="text-red-500">*</span></Label>
                                        <Input
                                            id="onsite_student_id"
                                            value={onsiteForm.data.student_id_number}
                                            onChange={(e) => onsiteForm.setData('student_id_number', e.target.value)}
                                            placeholder="e.g. 2025-00001"
                                            className="mt-1"
                                        />
                                        {onsiteForm.errors.student_id_number && (
                                            <p className="mt-1 text-sm text-red-600">{onsiteForm.errors.student_id_number}</p>
                                        )}
                                    </div>

                                    <div>
                                        <Label>Payment Plan <span className="text-red-500">*</span></Label>
                                        <Select value={onsiteForm.data.payment_plan} onValueChange={(v) => onsiteForm.setData('payment_plan', v)}>
                                            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="full">Full Payment</SelectItem>
                                                <SelectItem value="installment">Installment</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        {onsiteForm.errors.payment_plan && (
                                            <p className="mt-1 text-sm text-red-600">{onsiteForm.errors.payment_plan}</p>
                                        )}
                                    </div>

                                    <div>
                                        <Label>Mode of Payment</Label>
                                        <Select value={onsiteForm.data.mode_of_payment} onValueChange={(v) => onsiteForm.setData('mode_of_payment', v)}>
                                            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="cash">Cash</SelectItem>
                                                <SelectItem value="check">Check</SelectItem>
                                                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                                                <SelectItem value="gcash">GCash</SelectItem>
                                                <SelectItem value="maya">Maya</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Net Amount Summary */}
                                    <div>
                                        <Label>Net Amount Due</Label>
                                        <div className="mt-1 rounded-lg border bg-gray-50 px-3 py-2">
                                            <p className="text-lg font-bold text-gray-900">₱{fmt(netAmount)}</p>
                                            {totalDiscount > 0 && (
                                                <p className="text-xs text-green-600">
                                                    Gross ₱{fmt(grossAmount)} − Discounts ₱{fmt(totalDiscount)}
                                                </p>
                                            )}
                                            {onsiteForm.data.payment_plan === 'installment' && (
                                                <p className="mt-0.5 text-xs text-gray-500">
                                                    Min. due (30%): ₱{fmt(Math.round(netAmount * 0.3 * 100) / 100)}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <Button type="submit" disabled={onsiteForm.processing} className="bg-blue-600 hover:bg-blue-700">
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    {onsiteForm.processing ? 'Processing...' : 'Process Enrollment'}
                                </Button>
                            </form>
                        )}
                    </div>
                )}

                {/* Enrollment Actions */}
                <div className="rounded-lg border bg-white p-6 shadow-sm">
                    <h2 className="mb-4 text-lg font-semibold">Enrollment Actions</h2>
                    <div className="space-y-4">
                        {applicant.application_status === 'Pending' && (
                            <div className="rounded border border-green-200 bg-green-50 p-4">
                                <p className="mb-2 text-sm font-medium text-green-900">Enroll Applicant</p>
                                <p className="mb-3 text-sm text-green-700">Assign a student ID and change status to Enrolled.</p>
                                {!showEnrollForm ? (
                                    <Button onClick={() => setShowEnrollForm(true)} className="bg-green-600 hover:bg-green-700">
                                        <CheckCircle className="mr-2 h-4 w-4" />
                                        Enroll Applicant
                                    </Button>
                                ) : (
                                    <form onSubmit={handleEnroll} className="space-y-4">
                                        <div>
                                            <Label htmlFor="student_id_number">Student ID Number</Label>
                                            <Input
                                                id="student_id_number"
                                                value={enrollForm.data.student_id_number}
                                                onChange={(e) => enrollForm.setData('student_id_number', e.target.value)}
                                                placeholder="Enter student ID number"
                                                className="mt-1"
                                            />
                                            {enrollForm.errors.student_id_number && (
                                                <p className="mt-1 text-sm text-red-600">{enrollForm.errors.student_id_number}</p>
                                            )}
                                        </div>
                                        <div className="flex gap-2">
                                            <Button type="submit" disabled={enrollForm.processing} className="bg-green-600 hover:bg-green-700">
                                                {enrollForm.processing ? 'Enrolling...' : 'Confirm Enrollment'}
                                            </Button>
                                            <Button type="button" variant="outline" onClick={() => setShowEnrollForm(false)}>Cancel</Button>
                                        </div>
                                    </form>
                                )}
                            </div>
                        )}

                        {applicant.application_status === 'Enrolled' && (
                            <div className="rounded border border-yellow-200 bg-yellow-50 p-4">
                                <p className="mb-2 text-sm font-medium text-yellow-900">Revert to Pending</p>
                                <p className="mb-3 text-sm text-yellow-700">Change status back to Pending and remove student ID.</p>
                                <Button onClick={() => setShowRevertDialog(true)} variant="outline" className="border-yellow-600 text-yellow-600 hover:bg-yellow-100">
                                    <RotateCcw className="mr-2 h-4 w-4" />
                                    Revert to Pending
                                </Button>
                            </div>
                        )}

                        {!['Pending', 'Enrolled', 'Exam Passed'].includes(applicant.application_status) && (
                            <p className="text-sm text-gray-500">No enrollment actions available for the current status.</p>
                        )}
                    </div>
                </div>

                {/* Audit Log */}
                {applicant.audit_logs && applicant.audit_logs.length > 0 && (
                    <div className="rounded-lg border bg-white p-6 shadow-sm">
                        <div className="mb-4 flex items-center gap-2">
                            <History className="h-5 w-5 text-gray-600" />
                            <h2 className="text-lg font-semibold">Recent Activity</h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Date</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Action</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Performed By</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {applicant.audit_logs.slice(0, 5).map((log) => (
                                        <tr key={log.id}>
                                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                                                {new Date(log.created_at).toLocaleString()}
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4">
                                                <Badge className="bg-blue-100 text-blue-800">{log.action}</Badge>
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                                                {log.performed_by || 'System'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {applicant.audit_logs.length > 5 && (
                            <div className="mt-4 text-center">
                                <Link href={`/enrollment/${applicant.id}/audit-log`}>
                                    <Button variant="outline" size="sm">View Full Audit Log</Button>
                                </Link>
                            </div>
                        )}
                    </div>
                )}

                {/* Navigation */}
                <div className="flex items-center justify-between pt-4">
                    <Link href="/enrollment/dashboard">
                        <Button variant="outline">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Dashboard
                        </Button>
                    </Link>
                    <Link href={`/enrollment/${applicant.id}/audit-log`}>
                        <Button variant="outline">
                            <History className="mr-2 h-4 w-4" />
                            View Full Audit Log
                        </Button>
                    </Link>
                </div>
            </div>

            <ConfirmDialog
                open={showRevertDialog}
                onClose={() => setShowRevertDialog(false)}
                onConfirm={confirmRevert}
                title="Revert to Pending"
                description="Are you sure you want to revert this applicant back to Pending status?"
                confirmLabel="Revert"
                processingLabel="Reverting..."
                variant="warning"
            />
        </AppLayout>
    );
}
