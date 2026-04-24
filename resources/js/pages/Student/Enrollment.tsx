import { SearchableSelect } from '@/components/searchable-select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useBarangays } from '@/hooks/use-barangays';
import { useCities } from '@/hooks/use-cities';
import { useProvinces } from '@/hooks/use-provinces';
import { useRegions } from '@/hooks/use-regions';
import StudentLayout from '@/layouts/student-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { AlertCircle, CalendarX, Check, CheckCircle2, ChevronRight, Clock, CreditCard, Loader2, Printer, User } from 'lucide-react';
import { useState } from 'react';

interface FeeItem {
    id: number;
    name: string;
    code: string;
    category: string;
    is_per_unit: boolean;
    amount: number;
}

interface DiscountItem {
    id: number;
    name: string;
    code: string;
    discount_type: string;
    value: number;
    applies_to: string;
}

interface Props {
    student: {
        id: number;
        username: string;
    };
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
    familyBackground: {
        emergency_contact_name: string | null;
        emergency_mobile_phone: string | null;
    } | null;
    application: {
        id: number;
        school_year: string;
        semester: string | null;
        grade_level: string;
        student_type: string;
        student_category: string;
        application_status: string;
        date_applied: string;
        exam_status: string | null;
        exam_date: string | null;
    } | null;
    studentRecord: {
        id: number;
        student_id: string;
        enrollment_status: string;
        enrollment_date: string | null;
        current_year_level: string | null;
        current_school_year: string | null;
    } | null;
    canEnroll: boolean;
    isEnrolled: boolean;
    awaitingPayment: boolean;
    enrollmentOpen: boolean;
    documents: {
        birth_certificate: string | null;
        report_card: string | null;
        good_moral: string | null;
        id_photo: string | null;
    } | null;
    maxLoad: number;
    fees: FeeItem[];
    availableDiscounts: DiscountItem[];
    assessment: {
        assessment_number: string;
        school_year: string;
        semester: string;
        status: string;
        mode_of_payment: string | null;
        payment_plan: string;
        minimum_amount: number;
        total_paid: number;
        total_tuition: number;
        total_misc_fees: number;
        total_lab_fees: number;
        total_other_fees: number;
        gross_amount: number;
        total_discounts: number;
        net_amount: number;
        finalized_at: string | null;
    } | null;
}

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Enrollment', href: '/student/enrollment' }];

const enrollmentSteps = [
    { id: 1, name: 'Personal Info', icon: User },
    { id: 2, name: 'Fee & Payment', icon: CreditCard },
    { id: 3, name: 'Summary', icon: CheckCircle2 },
];

const confirmationSteps = [
    { id: 1, name: 'Personal Info', icon: User },
    { id: 2, name: 'Fee & Payment', icon: CreditCard },
    { id: 3, name: 'Confirmation', icon: CheckCircle2 },
];

const paymentModeLabels: Record<string, string> = {
    cash: 'Cash',
    bank_transfer: 'Bank Transfer',
    online_banking: 'Online Banking',
    gcash: 'GCash',
};

function PaymentModeEditor({ currentMode, onCancel, onSaved }: { currentMode: string; onCancel: () => void; onSaved: () => void }) {
    const { data, setData, patch, processing } = useForm({ mode_of_payment: currentMode });

    const handleSave = () => {
        patch('/student/enrollment/payment-mode', { onSuccess: () => onSaved() });
    };

    return (
        <div className="space-y-3 rounded-lg border p-4">
            <p className="text-sm font-medium text-gray-700">Change Mode of Payment</p>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {Object.entries(paymentModeLabels).map(([value, label]) => (
                    <label
                        key={value}
                        className={`cursor-pointer rounded-lg border-2 p-2 text-center transition-all ${
                            data.mode_of_payment === value ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                        }`}
                    >
                        <input
                            type="radio"
                            name="payment_mode"
                            value={value}
                            checked={data.mode_of_payment === value}
                            onChange={() => setData('mode_of_payment', value)}
                            className="sr-only"
                        />
                        <p className="text-xs font-medium text-gray-900">{label}</p>
                    </label>
                ))}
            </div>
            <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={onCancel} disabled={processing}>
                    Cancel
                </Button>
                <Button size="sm" onClick={handleSave} disabled={processing}>
                    {processing && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
                    Save
                </Button>
            </div>
        </div>
    );
}

export default function Enrollment({
    student,
    personalData,
    familyBackground,
    application,
    studentRecord,
    canEnroll,
    isEnrolled,
    awaitingPayment,
    enrollmentOpen,
    documents,
    maxLoad,
    fees,
    availableDiscounts,
    assessment,
}: Props) {
    const currentSemester = usePage().props.currentSemester as { name: string | null; school_year: string } | null;

    const [wizardStep, setWizardStep] = useState(1);
    const [selectedDiscounts, setSelectedDiscounts] = useState<number[]>([]);
    const [paymentMode, setPaymentMode] = useState<string>('cash');
    const [paymentPlan, setPaymentPlan] = useState<'full' | 'installment'>('full');
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSavingContact, setIsSavingContact] = useState(false);
    // Enrolled view: which step is being viewed (1 = personal info, 2 = fee summary, 3 = payment, 4 = confirmation)
    const [viewStep, setViewStep] = useState(3);
    const [editingPaymentMode, setEditingPaymentMode] = useState(false);

    const {
        data: contactData,
        setData: setContactData,
        put: putContact,
        reset: resetContact,
        isDirty: contactDirty,
    } = useForm({
        mobile_number: personalData?.mobile_number ?? '',
        present_street: personalData?.present_street ?? '',
        present_brgy: personalData?.present_brgy ?? '',
        present_city: personalData?.present_city ?? '',
        present_province: personalData?.present_province ?? '',
        present_zip: personalData?.present_zip ?? '',
        emergency_contact_name: familyBackground?.emergency_contact_name ?? '',
        emergency_mobile_phone: familyBackground?.emergency_mobile_phone ?? '',
    });

    // PSGC cascade state (not persisted — only drives cascaded dropdowns)
    const [regionCode, setRegionCode] = useState<string | undefined>(undefined);
    const [provinceCode, setProvinceCode] = useState<string | undefined>(undefined);
    const [cityCode, setCityCode] = useState<string | undefined>(undefined);

    const { regions } = useRegions();
    const { provinces } = useProvinces(regionCode);
    const { cities } = useCities(provinceCode);
    const { barangays } = useBarangays(cityCode);

    const handleRegionChange = (name: string) => {
        const opt = regions.find((r) => r.value === name);
        setRegionCode(opt?.code);
        setProvinceCode(undefined);
        setCityCode(undefined);
        setContactData('present_province', '');
        setContactData('present_city', '');
        setContactData('present_brgy', '');
    };

    const handleProvinceChange = (name: string) => {
        const opt = provinces.find((p) => p.value === name);
        setProvinceCode(opt?.code);
        setCityCode(undefined);
        setContactData('present_province', name);
        setContactData('present_city', '');
        setContactData('present_brgy', '');
    };

    const handleCityChange = (name: string) => {
        const opt = cities.find((c) => c.value === name);
        setCityCode(opt?.code);
        setContactData('present_city', name);
        setContactData('present_brgy', '');
    };

    const handleBarangayChange = (name: string) => {
        setContactData('present_brgy', name);
    };

    const handleCancel = () => {
        resetContact();
        setRegionCode(undefined);
        setProvinceCode(undefined);
        setCityCode(undefined);
    };

    const handlePersonalInfoSave = () => {
        setIsSavingContact(true);
        putContact('/student/personal-info', {
            onFinish: () => setIsSavingContact(false),
        });
    };

    // Fee calculation
    const totalUnits = maxLoad;

    const tuitionFee = fees
        .filter((f) => f.category === 'tuition')
        .reduce((sum, fee) => sum + (fee.is_per_unit ? fee.amount * totalUnits : fee.amount), 0);

    const miscFees = fees
        .filter((f) => f.category === 'miscellaneous')
        .reduce((sum, fee) => sum + (fee.is_per_unit ? fee.amount * totalUnits : fee.amount), 0);

    const labFees = fees
        .filter((f) => f.category === 'laboratory')
        .reduce((sum, fee) => sum + (fee.is_per_unit ? fee.amount * totalUnits : fee.amount), 0);

    const specialFees = fees
        .filter((f) => f.category === 'special')
        .reduce((sum, fee) => sum + (fee.is_per_unit ? fee.amount * totalUnits : fee.amount), 0);

    const grossTotal = tuitionFee + miscFees + labFees + specialFees;

    const totalDiscount = availableDiscounts
        .filter((d) => selectedDiscounts.includes(d.id))
        .reduce((sum, discount) => {
            let baseAmount = grossTotal;
            if (discount.applies_to === 'tuition_only') baseAmount = tuitionFee;
            else if (discount.applies_to === 'miscellaneous_only') baseAmount = miscFees;
            const amount = discount.discount_type === 'percentage' ? (baseAmount * discount.value) / 100 : discount.value;
            return sum + amount;
        }, 0);

    const netTotal = Math.max(0, grossTotal - totalDiscount);

    const canProceedWizard = () => {
        if (wizardStep === 1) return true;
        if (wizardStep === 2) return acceptedTerms;
        if (wizardStep === 3) return true;
        return false;
    };

    const toggleDiscount = (id: number) => {
        setSelectedDiscounts((prev) => (prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]));
    };

    const handlePrint = () => window.print();

    const handleSubmit = () => {
        setIsProcessing(true);
        router.post(
            '/student/enrollment/process',
            {
                discount_ids: selectedDiscounts,
                mode_of_payment: paymentMode,
                payment_plan: paymentPlan,
                total_amount: netTotal,
            },
            {
                onFinish: () => setIsProcessing(false),
            },
        );
    };

    const formatCurrency = (amount: number) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount);

    return (
        <StudentLayout breadcrumbs={breadcrumbs}>
            <Head title="Enrollment" />

            <div className="mx-auto max-w-4xl px-4 py-8 print:hidden">
                {/* Page header */}
                <div className="mb-6">
                    <div className="flex items-start justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Enrollment</h1>
                            <p className="mt-1 text-sm text-gray-500">
                                {awaitingPayment
                                    ? 'Your fee assessment has been submitted. Please proceed to the Cashier\'s Office to complete payment.'
                                    : canEnroll && enrollmentOpen
                                      ? 'Complete your enrollment process'
                                      : canEnroll && !enrollmentOpen
                                        ? 'Enrollment is currently closed'
                                        : isEnrolled
                                          ? 'View your enrollment details'
                                          : 'Track the progress of your enrollment application'}
                            </p>
                        </div>
                        {currentSemester?.name && (
                            <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                                <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                                {currentSemester.name} · {currentSemester.school_year}
                            </div>
                        )}
                    </div>
                </div>

                {/* Enrolled — simple confirmation, no steps */}
                {isEnrolled && (
                    <div className="rounded-lg border-2 border-green-200 bg-green-50 p-10 text-center shadow-sm">
                        <CheckCircle2 className="mx-auto mb-4 h-14 w-14 text-green-500" />
                        <h3 className="text-xl font-bold text-green-800">You are enrolled</h3>
                        <p className="mt-2 text-sm text-green-600">
                            {application?.school_year}
                            {application?.semester ? ` · ${application.semester}` : ''}
                        </p>
                        {studentRecord?.student_id && (
                            <p className="mt-3 text-sm text-gray-600">
                                Student ID: <span className="font-mono font-semibold text-gray-800">{studentRecord.student_id}</span>
                            </p>
                        )}
                    </div>
                )}

                {/* Awaiting payment — wizard-style layout, opens at step 3 */}
                {awaitingPayment && (
                    <>
                        {/* Step indicator — completed steps are clickable */}
                        <div className="mb-6 flex items-center">
                            {confirmationSteps.map((step, idx) => (
                                <div key={step.id} className="flex items-center">
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setViewStep(step.id)}
                                            className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-opacity ${
                                                viewStep > step.id
                                                    ? 'cursor-pointer bg-green-500 text-white hover:opacity-80'
                                                    : viewStep === step.id
                                                      ? 'cursor-default bg-blue-600 text-white'
                                                      : 'cursor-default bg-gray-200 text-gray-500'
                                            }`}
                                            disabled={step.id > viewStep}
                                        >
                                            {viewStep > step.id ? <Check className="h-4 w-4" /> : step.id}
                                        </button>
                                        <span className={`text-sm font-medium ${viewStep === step.id ? 'text-blue-600' : 'text-gray-500'}`}>
                                            {step.name}
                                        </span>
                                    </div>
                                    {idx < confirmationSteps.length - 1 && <ChevronRight className="mx-3 h-4 w-4 text-gray-300" />}
                                </div>
                            ))}
                        </div>

                        <div className="rounded-lg border-2 border-gray-100 bg-white shadow-sm">
                            {/* View step 1: Personal Info (editable) */}
                            {viewStep === 1 && (
                                <div className="p-6">
                                    <h2 className="mb-1 text-lg font-semibold text-gray-900">Personal Information</h2>
                                    <p className="mb-6 text-sm text-gray-500">Update your contact details below.</p>

                                    <div className="space-y-5">
                                        {/* Phone Number */}
                                        <div>
                                            <label className="mb-1 block text-sm font-medium text-gray-700">Phone Number</label>
                                            <input
                                                type="text"
                                                value={contactData.mobile_number}
                                                onChange={(e) => setContactData('mobile_number', e.target.value)}
                                                placeholder="e.g. 09171234567"
                                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                                            />
                                        </div>

                                        {/* Present Address */}
                                        <div>
                                            <h3 className="mb-2 text-sm font-medium text-gray-700">Present Address</h3>
                                            <div className="space-y-3">
                                                <div>
                                                    <label className="mb-1 block text-sm font-medium text-gray-700">Street / House No.</label>
                                                    <input
                                                        type="text"
                                                        value={contactData.present_street}
                                                        onChange={(e) => setContactData('present_street', e.target.value)}
                                                        placeholder="e.g. 123 Rizal St."
                                                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="mb-1 block text-sm font-medium text-gray-700">Region</label>
                                                    <SearchableSelect
                                                        value={regions.find((r) => r.code === regionCode)?.value ?? ''}
                                                        onChange={handleRegionChange}
                                                        options={regions}
                                                        placeholder="Select region"
                                                    />
                                                </div>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="mb-1 block text-sm font-medium text-gray-700">Province</label>
                                                        <SearchableSelect
                                                            value={contactData.present_province}
                                                            onChange={handleProvinceChange}
                                                            options={provinces}
                                                            placeholder="Select province"
                                                            disabled={!regionCode}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="mb-1 block text-sm font-medium text-gray-700">City / Municipality</label>
                                                        <SearchableSelect
                                                            value={contactData.present_city}
                                                            onChange={handleCityChange}
                                                            options={cities}
                                                            placeholder="Select city"
                                                            disabled={!provinceCode}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="mb-1 block text-sm font-medium text-gray-700">Barangay</label>
                                                        <SearchableSelect
                                                            value={contactData.present_brgy}
                                                            onChange={handleBarangayChange}
                                                            options={barangays}
                                                            placeholder="Select barangay"
                                                            disabled={!cityCode}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="mb-1 block text-sm font-medium text-gray-700">ZIP Code</label>
                                                        <input
                                                            type="text"
                                                            value={contactData.present_zip}
                                                            onChange={(e) => setContactData('present_zip', e.target.value)}
                                                            placeholder="e.g. 2600"
                                                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Emergency Contact */}
                                        <div>
                                            <h3 className="mb-2 text-sm font-medium text-gray-700">Emergency Contact</h3>
                                            <div className="space-y-2">
                                                <input
                                                    type="text"
                                                    value={contactData.emergency_contact_name}
                                                    onChange={(e) => setContactData('emergency_contact_name', e.target.value)}
                                                    placeholder="Full Name"
                                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                                                />
                                                <input
                                                    type="text"
                                                    value={contactData.emergency_mobile_phone}
                                                    onChange={(e) => setContactData('emergency_mobile_phone', e.target.value)}
                                                    placeholder="Contact Number"
                                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                                                />
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex justify-end gap-2 border-t pt-4">
                                            <Button size="sm" variant="outline" onClick={handleCancel} disabled={!contactDirty || isSavingContact}>
                                                Cancel
                                            </Button>
                                            <Button size="sm" onClick={handlePersonalInfoSave} disabled={!contactDirty || isSavingContact}>
                                                {isSavingContact ? (
                                                    <>
                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                        Saving...
                                                    </>
                                                ) : (
                                                    'Save'
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* View step 2: Fee Summary (read-only) */}
                            {viewStep === 2 && assessment && (
                                <div className="p-6">
                                    <h2 className="mb-4 text-lg font-semibold text-gray-900">Fee Summary</h2>
                                    <div className="mb-4 rounded-lg bg-gray-50 p-4">
                                        <h3 className="mb-3 text-sm font-medium text-gray-700">Enrollment Details</h3>
                                        <div className="grid grid-cols-2 gap-3 text-sm">
                                            <div>
                                                <span className="text-gray-500">Student</span>
                                                <p className="font-medium">
                                                    {personalData?.last_name}, {personalData?.first_name} {personalData?.middle_name ?? ''}
                                                </p>
                                            </div>
                                            <div>
                                                <span className="text-gray-500">Grade Level</span>
                                                <p className="font-medium">{application?.grade_level}</p>
                                            </div>
                                            <div>
                                                <span className="text-gray-500">School Year</span>
                                                <p className="font-medium">{assessment.school_year}</p>
                                            </div>
                                            <div>
                                                <span className="text-gray-500">Semester</span>
                                                <p className="font-medium">{assessment.semester}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="rounded-lg bg-gray-50 p-4">
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
                                            <div className="flex justify-between border-t pt-1 text-gray-600">
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
                                    </div>

                                    {/* Payment */}
                                    <div className="mt-6">
                                        <div className="mb-4 flex items-center justify-between rounded-lg bg-green-50 px-4 py-3">
                                            <p className="text-sm text-gray-500">Total Amount Due</p>
                                            <p className="text-lg font-bold text-green-700">{formatCurrency(assessment.net_amount)}</p>
                                        </div>
                                        {editingPaymentMode ? (
                                            <PaymentModeEditor
                                                currentMode={assessment.mode_of_payment ?? 'cash'}
                                                onCancel={() => setEditingPaymentMode(false)}
                                                onSaved={() => setEditingPaymentMode(false)}
                                            />
                                        ) : (
                                            <div className="flex items-center justify-between rounded-lg border p-4">
                                                <div>
                                                    <p className="mb-1 text-sm text-gray-500">Mode of Payment</p>
                                                    <p className="font-semibold text-gray-900">
                                                        {assessment.mode_of_payment ? paymentModeLabels[assessment.mode_of_payment] : 'Not set'}
                                                    </p>
                                                </div>
                                                {assessment.status !== 'paid' && (
                                                    <Button variant="outline" size="sm" onClick={() => setEditingPaymentMode(true)}>
                                                        {assessment.mode_of_payment ? 'Change' : 'Select'}
                                                    </Button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* View step 3: Confirmation */}
                            {viewStep === 3 && (
                                <div className="space-y-4 p-6">
                                    {/* Status header — varies by payment status */}
                                    {assessment?.status === 'paid' ? (
                                        <div className="rounded-lg border-2 border-green-200 bg-green-50 p-6 shadow-sm">
                                            <div className="flex items-center gap-3">
                                                <CheckCircle2 className="h-8 w-8 shrink-0 text-green-500" />
                                                <div>
                                                    <h3 className="text-lg font-semibold text-green-800">Payment Complete</h3>
                                                    <p className="text-sm text-green-600">
                                                        You are fully enrolled.
                                                        {application?.semester ? ` · ${application.semester}` : ''}
                                                    </p>
                                                </div>
                                                <div className="ml-auto text-right">
                                                    <p className="text-xs text-gray-500">Assessment No.</p>
                                                    <p className="font-mono text-sm font-semibold text-gray-800">{assessment.assessment_number}</p>
                                                    {assessment.finalized_at && <p className="text-xs text-gray-400">{assessment.finalized_at}</p>}
                                                </div>
                                            </div>
                                        </div>
                                    ) : application?.application_status === 'Enrolled' && assessment ? (
                                        <div className="rounded-lg border-2 border-blue-200 bg-blue-50 p-6 shadow-sm">
                                            <div className="flex items-center gap-3">
                                                <CheckCircle2 className="h-8 w-8 shrink-0 text-blue-500" />
                                                <div className="flex-1">
                                                    <h3 className="text-lg font-semibold text-blue-800">Enrolled</h3>
                                                    <p className="text-sm text-blue-600">
                                                        Minimum payment received. You are officially enrolled.
                                                    </p>
                                                    <p className="mt-1 text-sm text-blue-600">
                                                        Please settle your remaining balance at the Cashier's Office.
                                                    </p>
                                                </div>
                                                <div className="ml-auto text-right">
                                                    <p className="text-xs text-gray-500">Assessment No.</p>
                                                    <p className="font-mono text-sm font-semibold text-gray-800">{assessment.assessment_number}</p>
                                                    {assessment.finalized_at && <p className="text-xs text-gray-400">{assessment.finalized_at}</p>}
                                                </div>
                                            </div>
                                        </div>
                                    ) : assessment ? (
                                        <div className="rounded-lg border-2 border-amber-200 bg-amber-50 p-6 shadow-sm">
                                            <div className="flex items-center gap-3">
                                                <Clock className="h-8 w-8 shrink-0 text-amber-500" />
                                                <div className="flex-1">
                                                    <h3 className="text-lg font-semibold text-amber-800">Awaiting Payment</h3>
                                                    <p className="text-sm text-amber-600">
                                                        Please present your assessment to the Cashier's Office to complete your enrollment.
                                                    </p>
                                                    <p className="mt-1 text-sm font-medium text-amber-700">
                                                        Minimum payment upon enrollment:{' '}
                                                        <span className="font-bold">{formatCurrency(assessment.minimum_amount)}</span>
                                                    </p>
                                                </div>
                                                <div className="ml-auto text-right">
                                                    <p className="text-xs text-gray-500">Assessment No.</p>
                                                    <p className="font-mono text-sm font-semibold text-gray-800">{assessment.assessment_number}</p>
                                                    {assessment.finalized_at && <p className="text-xs text-gray-400">{assessment.finalized_at}</p>}
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="rounded-lg border-2 border-green-200 bg-green-50 p-6 shadow-sm">
                                            <div className="flex items-center gap-3">
                                                <CheckCircle2 className="h-8 w-8 shrink-0 text-green-500" />
                                                <div>
                                                    <h3 className="text-lg font-semibold text-green-800">Enrollment Confirmed</h3>
                                                    <p className="text-sm text-green-600">
                                                        {application?.school_year}
                                                        {application?.semester ? ` · ${application.semester}` : ''}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Fee summary card */}
                                    {assessment && (
                                        <div className="rounded-lg border border-gray-200 bg-white">
                                            <div className="border-b p-4">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="text-xs text-gray-500">Student ID</p>
                                                        <p className="text-xl font-bold text-gray-900">{studentRecord?.student_id ?? '—'}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-xs text-gray-500">Grade Level</p>
                                                        <p className="font-medium text-gray-800">{application?.grade_level}</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="p-4">
                                                <h4 className="mb-3 text-sm font-semibold text-gray-700">Fee Assessment</h4>
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
                                                    <div className="flex justify-between border-t pt-1 text-gray-600">
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
                                                    <div className="flex justify-between rounded bg-amber-50 px-2 py-1.5 text-sm font-semibold text-amber-800">
                                                        <span>Minimum Payment Upon Enrollment</span>
                                                        <span>{formatCurrency(assessment.net_amount / 3)}</span>
                                                    </div>
                                                </div>
                                                <Button
                                                    onClick={handlePrint}
                                                    variant={awaitingPayment ? 'outline' : undefined}
                                                    className={awaitingPayment ? 'mt-4 w-full' : 'mt-4 w-full bg-green-600 hover:bg-green-700'}
                                                >
                                                    <Printer className="mr-2 h-4 w-4" />
                                                    {awaitingPayment ? 'Print Assessment' : 'Print Receipt'}
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Navigation */}
                            <div className="flex items-center justify-between border-t p-4">
                                <Button variant="outline" onClick={() => setViewStep((s) => s - 1)} disabled={viewStep === 1}>
                                    Back
                                </Button>
                                {viewStep < 3 && <Button onClick={() => setViewStep((s) => s + 1)}>Next</Button>}
                            </div>
                        </div>
                    </>
                )}


                {/* Enrollment closed */}
                {canEnroll && !enrollmentOpen && (
                    <div className="rounded-lg border-2 border-gray-200 bg-gray-50 p-10 text-center shadow-sm">
                        <CalendarX className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                        <h3 className="text-lg font-semibold text-gray-800">Enrollment is Currently Closed</h3>
                        <p className="mt-2 text-sm text-gray-500">
                            Enrollment for your semester is not yet open or has ended.
                            <br />
                            Please check back later for enrollment updates.
                        </p>
                    </div>
                )}

                {/* Enrollment wizard */}
                {canEnroll && enrollmentOpen && (
                    <>
                        {/* Step indicator */}
                        <div className="mb-6 flex items-center">
                            {enrollmentSteps.map((step, idx) => (
                                <div key={step.id} className="flex items-center">
                                    <div className="flex items-center gap-2">
                                        <div
                                            className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                                                wizardStep > step.id
                                                    ? 'bg-green-500 text-white'
                                                    : wizardStep === step.id
                                                      ? 'bg-blue-600 text-white'
                                                      : 'bg-gray-200 text-gray-500'
                                            }`}
                                        >
                                            {wizardStep > step.id ? <Check className="h-4 w-4" /> : step.id}
                                        </div>
                                        <span className={`text-sm font-medium ${wizardStep === step.id ? 'text-blue-600' : 'text-gray-500'}`}>
                                            {step.name}
                                        </span>
                                    </div>
                                    {idx < enrollmentSteps.length - 1 && <ChevronRight className="mx-3 h-4 w-4 text-gray-300" />}
                                </div>
                            ))}
                        </div>

                        <div className="rounded-lg border-2 border-gray-100 bg-white shadow-sm">
                            {/* Step 1: Personal Info */}
                            {wizardStep === 1 && (
                                <div className="p-6">
                                    <h2 className="mb-1 text-lg font-semibold text-gray-900">Personal Information</h2>
                                    <p className="mb-6 text-sm text-gray-500">
                                        Please verify or update your contact details before proceeding with enrollment.
                                    </p>

                                    <div className="space-y-5">
                                        {/* Phone Number */}
                                        <div>
                                            <label className="mb-1 block text-sm font-medium text-gray-700">Phone Number</label>
                                            <input
                                                type="text"
                                                value={contactData.mobile_number}
                                                onChange={(e) => setContactData('mobile_number', e.target.value)}
                                                placeholder="e.g. 09171234567"
                                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                                            />
                                        </div>

                                        {/* Present Address */}
                                        <div>
                                            <h3 className="mb-2 text-sm font-medium text-gray-700">Present Address</h3>
                                            <div className="space-y-3">
                                                <div>
                                                    <label className="mb-1 block text-sm font-medium text-gray-700">Street / House No.</label>
                                                    <input
                                                        type="text"
                                                        value={contactData.present_street}
                                                        onChange={(e) => setContactData('present_street', e.target.value)}
                                                        placeholder="e.g. 123 Rizal St."
                                                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="mb-1 block text-sm font-medium text-gray-700">Region</label>
                                                    <SearchableSelect
                                                        value={regions.find((r) => r.code === regionCode)?.value ?? ''}
                                                        onChange={handleRegionChange}
                                                        options={regions}
                                                        placeholder="Select region"
                                                    />
                                                </div>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="mb-1 block text-sm font-medium text-gray-700">Province</label>
                                                        <SearchableSelect
                                                            value={contactData.present_province}
                                                            onChange={handleProvinceChange}
                                                            options={provinces}
                                                            placeholder="Select province"
                                                            disabled={!regionCode}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="mb-1 block text-sm font-medium text-gray-700">City / Municipality</label>
                                                        <SearchableSelect
                                                            value={contactData.present_city}
                                                            onChange={handleCityChange}
                                                            options={cities}
                                                            placeholder="Select city"
                                                            disabled={!provinceCode}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="mb-1 block text-sm font-medium text-gray-700">Barangay</label>
                                                        <SearchableSelect
                                                            value={contactData.present_brgy}
                                                            onChange={handleBarangayChange}
                                                            options={barangays}
                                                            placeholder="Select barangay"
                                                            disabled={!cityCode}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="mb-1 block text-sm font-medium text-gray-700">ZIP Code</label>
                                                        <input
                                                            type="text"
                                                            value={contactData.present_zip}
                                                            onChange={(e) => setContactData('present_zip', e.target.value)}
                                                            placeholder="e.g. 2600"
                                                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Emergency Contact */}
                                        <div>
                                            <h3 className="mb-2 text-sm font-medium text-gray-700">Emergency Contact</h3>
                                            <div className="space-y-2">
                                                <input
                                                    type="text"
                                                    value={contactData.emergency_contact_name}
                                                    onChange={(e) => setContactData('emergency_contact_name', e.target.value)}
                                                    placeholder="Full Name"
                                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                                                />
                                                <input
                                                    type="text"
                                                    value={contactData.emergency_mobile_phone}
                                                    onChange={(e) => setContactData('emergency_mobile_phone', e.target.value)}
                                                    placeholder="Contact Number"
                                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                                                />
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex justify-end gap-2 border-t pt-4">
                                            <Button size="sm" variant="outline" onClick={handleCancel} disabled={!contactDirty || isSavingContact}>
                                                Cancel
                                            </Button>
                                            <Button size="sm" onClick={handlePersonalInfoSave} disabled={!contactDirty || isSavingContact}>
                                                {isSavingContact ? (
                                                    <>
                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                        Saving...
                                                    </>
                                                ) : (
                                                    'Save'
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Step 2: Fee Summary */}
                            {wizardStep === 2 && (
                                <div className="p-6">
                                    <h2 className="mb-4 text-lg font-semibold text-gray-900">Fee Summary</h2>

                                    {/* Enrollment details */}
                                    <div className="mb-6 rounded-lg bg-gray-50 p-4">
                                        <h3 className="mb-3 text-sm font-medium text-gray-700">Enrollment Details</h3>
                                        <div className="grid grid-cols-2 gap-3 text-sm">
                                            <div>
                                                <span className="text-gray-500">Student</span>
                                                <p className="font-medium">
                                                    {personalData?.last_name}, {personalData?.first_name} {personalData?.middle_name ?? ''}
                                                </p>
                                            </div>
                                            <div>
                                                <span className="text-gray-500">Grade Level</span>
                                                <p className="font-medium">{application?.grade_level}</p>
                                            </div>
                                            <div>
                                                <span className="text-gray-500">School Year</span>
                                                <p className="font-medium">{application?.school_year}</p>
                                            </div>
                                            <div>
                                                <span className="text-gray-500">Total Units</span>
                                                <p className="font-medium">{totalUnits} units</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Fee breakdown */}
                                    <div className="mb-6 space-y-3">
                                        {tuitionFee > 0 && (
                                            <div className="rounded-lg border p-4">
                                                <h4 className="mb-2 text-sm font-medium text-gray-700">Tuition Fee</h4>
                                                {fees
                                                    .filter((f) => f.category === 'tuition')
                                                    .map((fee) => (
                                                        <div key={fee.id} className="flex justify-between text-sm">
                                                            <span className="text-gray-600">
                                                                {fee.name}
                                                                {fee.is_per_unit && (
                                                                    <span className="ml-1 text-xs text-gray-400">× {totalUnits} units</span>
                                                                )}
                                                            </span>
                                                            <span className="font-medium">
                                                                {formatCurrency(fee.is_per_unit ? fee.amount * totalUnits : fee.amount)}
                                                            </span>
                                                        </div>
                                                    ))}
                                            </div>
                                        )}

                                        {miscFees > 0 && (
                                            <div className="rounded-lg border p-4">
                                                <h4 className="mb-2 text-sm font-medium text-gray-700">Miscellaneous Fees</h4>
                                                {fees
                                                    .filter((f) => f.category === 'miscellaneous')
                                                    .map((fee) => (
                                                        <div key={fee.id} className="flex justify-between text-sm">
                                                            <span className="text-gray-600">
                                                                {fee.name}
                                                                {fee.is_per_unit && (
                                                                    <span className="ml-1 text-xs text-gray-400">× {totalUnits} units</span>
                                                                )}
                                                            </span>
                                                            <span className="font-medium">
                                                                {formatCurrency(fee.is_per_unit ? fee.amount * totalUnits : fee.amount)}
                                                            </span>
                                                        </div>
                                                    ))}
                                            </div>
                                        )}

                                        {labFees > 0 && (
                                            <div className="rounded-lg border p-4">
                                                <h4 className="mb-2 text-sm font-medium text-gray-700">Laboratory Fees</h4>
                                                {fees
                                                    .filter((f) => f.category === 'laboratory')
                                                    .map((fee) => (
                                                        <div key={fee.id} className="flex justify-between text-sm">
                                                            <span className="text-gray-600">
                                                                {fee.name}
                                                                {fee.is_per_unit && (
                                                                    <span className="ml-1 text-xs text-gray-400">× {totalUnits} units</span>
                                                                )}
                                                            </span>
                                                            <span className="font-medium">
                                                                {formatCurrency(fee.is_per_unit ? fee.amount * totalUnits : fee.amount)}
                                                            </span>
                                                        </div>
                                                    ))}
                                            </div>
                                        )}

                                        {specialFees > 0 && (
                                            <div className="rounded-lg border p-4">
                                                <h4 className="mb-2 text-sm font-medium text-gray-700">Special Fees</h4>
                                                {fees
                                                    .filter((f) => f.category === 'special')
                                                    .map((fee) => (
                                                        <div key={fee.id} className="flex justify-between text-sm">
                                                            <span className="text-gray-600">
                                                                {fee.name}
                                                                {fee.is_per_unit && (
                                                                    <span className="ml-1 text-xs text-gray-400">× {totalUnits} units</span>
                                                                )}
                                                            </span>
                                                            <span className="font-medium">
                                                                {formatCurrency(fee.is_per_unit ? fee.amount * totalUnits : fee.amount)}
                                                            </span>
                                                        </div>
                                                    ))}
                                            </div>
                                        )}

                                        {fees.length === 0 && (
                                            <div className="rounded-lg border border-dashed p-6 text-center text-sm text-gray-400">
                                                No fees configured for your grade level.
                                            </div>
                                        )}
                                    </div>

                                    {/* Discounts */}
                                    {availableDiscounts.length > 0 && (
                                        <div className="mb-6">
                                            <h3 className="mb-3 text-sm font-medium text-gray-700">Available Discounts</h3>
                                            <div className="space-y-2">
                                                {availableDiscounts.map((discount) => (
                                                    <label
                                                        key={discount.id}
                                                        className="flex cursor-pointer items-center justify-between rounded-lg border p-3 hover:bg-gray-50"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedDiscounts.includes(discount.id)}
                                                                onChange={() => toggleDiscount(discount.id)}
                                                                className="h-4 w-4 rounded border-gray-300 text-blue-600"
                                                            />
                                                            <div>
                                                                <p className="text-sm font-medium text-gray-900">{discount.name}</p>
                                                                <p className="text-xs text-gray-500">
                                                                    Applies to:{' '}
                                                                    {discount.applies_to === 'tuition_only'
                                                                        ? 'Tuition only'
                                                                        : discount.applies_to === 'miscellaneous_only'
                                                                          ? 'Miscellaneous only'
                                                                          : 'All fees'}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <Badge variant="secondary">
                                                            {discount.discount_type === 'percentage'
                                                                ? `${discount.value}%`
                                                                : formatCurrency(discount.value)}
                                                        </Badge>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Totals */}
                                    <div className="rounded-lg bg-gray-50 p-4">
                                        <div className="space-y-1 text-sm">
                                            <div className="flex justify-between text-gray-600">
                                                <span>Gross Total</span>
                                                <span>{formatCurrency(grossTotal)}</span>
                                            </div>
                                            {totalDiscount > 0 && (
                                                <div className="flex justify-between text-green-600">
                                                    <span>Less: Discounts</span>
                                                    <span>− {formatCurrency(totalDiscount)}</span>
                                                </div>
                                            )}
                                            <div className="flex justify-between border-t pt-2 text-base font-bold text-gray-900">
                                                <span>Net Total</span>
                                                <span>{formatCurrency(netTotal)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Amount due */}
                                    <div className="mt-6 flex items-center justify-between rounded-lg bg-green-50 px-4 py-3">
                                        <p className="text-sm text-gray-500">Total Amount Due</p>
                                        <p className="text-lg font-bold text-green-700">{formatCurrency(netTotal)}</p>
                                    </div>

                                    {/* Payment Plan */}
                                    <div className="mt-6">
                                        <h3 className="mb-3 text-sm font-medium text-gray-700">Payment Plan</h3>
                                        <div className="grid grid-cols-2 gap-3">
                                            {([
                                                {
                                                    value: 'full' as const,
                                                    label: 'Full Payment',
                                                    description: `Pay ${formatCurrency(netTotal)} in full`,
                                                    minimum: netTotal,
                                                },
                                                {
                                                    value: 'installment' as const,
                                                    label: 'Installment',
                                                    description: `Pay ${formatCurrency(Math.round(netTotal * 0.30 * 100) / 100)} down (30%)`,
                                                    minimum: Math.round(netTotal * 0.30 * 100) / 100,
                                                },
                                            ] as const).map((plan) => (
                                                <label
                                                    key={plan.value}
                                                    className={`cursor-pointer rounded-lg border-2 p-4 transition-all ${
                                                        paymentPlan === plan.value
                                                            ? 'border-blue-500 bg-blue-50'
                                                            : 'border-gray-200 hover:border-gray-300'
                                                    }`}
                                                >
                                                    <input
                                                        type="radio"
                                                        name="payment_plan"
                                                        value={plan.value}
                                                        checked={paymentPlan === plan.value}
                                                        onChange={() => setPaymentPlan(plan.value)}
                                                        className="sr-only"
                                                    />
                                                    <p className="font-medium text-gray-900">{plan.label}</p>
                                                    <p className="mt-1 text-sm text-gray-500">{plan.description}</p>
                                                    <p className="mt-1 text-xs font-semibold text-blue-600">
                                                        Min. to enroll: {formatCurrency(plan.minimum)}
                                                    </p>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Mode of Payment */}
                                    <div className="mt-6">
                                        <h3 className="mb-3 text-sm font-medium text-gray-700">Mode of Payment</h3>
                                        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                                            {[
                                                { value: 'cash', label: 'Cash' },
                                                { value: 'bank_transfer', label: 'Bank Transfer' },
                                                { value: 'online_banking', label: 'Online Banking' },
                                                { value: 'gcash', label: 'GCash' },
                                            ].map((m) => (
                                                <label
                                                    key={m.value}
                                                    className={`cursor-pointer rounded-lg border-2 p-3 text-center transition-all ${
                                                        paymentMode === m.value
                                                            ? 'border-blue-500 bg-blue-50'
                                                            : 'border-gray-200 hover:border-gray-300'
                                                    }`}
                                                >
                                                    <input
                                                        type="radio"
                                                        name="payment_mode"
                                                        value={m.value}
                                                        checked={paymentMode === m.value}
                                                        onChange={() => setPaymentMode(m.value)}
                                                        className="sr-only"
                                                    />
                                                    <p className="text-sm font-medium text-gray-900">{m.label}</p>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Payment instructions */}
                                    <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4">
                                        <div className="flex gap-2">
                                            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                                            <div className="text-sm text-amber-700">
                                                <p className="font-medium">Payment Instructions</p>
                                                <ul className="mt-1 list-disc space-y-1 pl-4">
                                                    <li>Proceed to the Finance Office to complete payment</li>
                                                    <li>Bring a copy of your enrollment summary</li>
                                                    <li>Accepted: Cash, Check, Bank Transfer, GCash</li>
                                                    <li>Keep your official receipt</li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Terms */}
                                    <label className="mt-6 flex cursor-pointer items-start gap-3">
                                        <input
                                            type="checkbox"
                                            checked={acceptedTerms}
                                            onChange={(e) => setAcceptedTerms(e.target.checked)}
                                            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600"
                                        />
                                        <span className="text-sm text-gray-600">
                                            I understand and agree to the payment terms. I confirm that the enrollment details above are correct.
                                        </span>
                                    </label>
                                </div>
                            )}

                            {/* Step 3: Summary */}
                            {wizardStep === 3 && (
                                <div className="p-6">
                                    <h2 className="mb-1 text-lg font-semibold text-gray-900">Enrollment Summary</h2>
                                    <p className="mb-6 text-sm text-gray-500">
                                        Please review your enrollment details before confirming.
                                    </p>

                                    {/* Enrollment details */}
                                    <div className="mb-4 rounded-lg bg-gray-50 p-4">
                                        <h3 className="mb-3 text-sm font-medium text-gray-700">Enrollment Details</h3>
                                        <div className="grid grid-cols-2 gap-3 text-sm">
                                            <div>
                                                <span className="text-gray-500">Student</span>
                                                <p className="font-medium">
                                                    {personalData?.last_name}, {personalData?.first_name} {personalData?.middle_name ?? ''}
                                                </p>
                                            </div>
                                            <div>
                                                <span className="text-gray-500">Grade Level</span>
                                                <p className="font-medium">{application?.grade_level}</p>
                                            </div>
                                            <div>
                                                <span className="text-gray-500">School Year</span>
                                                <p className="font-medium">{application?.school_year}</p>
                                            </div>
                                            <div>
                                                <span className="text-gray-500">Semester</span>
                                                <p className="font-medium">{application?.semester ?? '—'}</p>
                                            </div>
                                            <div>
                                                <span className="text-gray-500">Payment Plan</span>
                                                <p className="font-medium capitalize">{paymentPlan === 'full' ? 'Full Payment' : 'Installment (30% down)'}</p>
                                            </div>
                                            <div>
                                                <span className="text-gray-500">Mode of Payment</span>
                                                <p className="font-medium">{paymentModeLabels[paymentMode] ?? paymentMode}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Fee breakdown */}
                                    <div className="rounded-lg border border-gray-200 bg-white">
                                        <div className="border-b p-4">
                                            <h4 className="text-sm font-semibold text-gray-700">Fee Assessment</h4>
                                        </div>
                                        <div className="p-4">
                                            <div className="space-y-1 text-sm">
                                                {tuitionFee > 0 && (
                                                    <div className="flex justify-between text-gray-600">
                                                        <span>Tuition Fees</span>
                                                        <span>{formatCurrency(tuitionFee)}</span>
                                                    </div>
                                                )}
                                                {miscFees > 0 && (
                                                    <div className="flex justify-between text-gray-600">
                                                        <span>Miscellaneous Fees</span>
                                                        <span>{formatCurrency(miscFees)}</span>
                                                    </div>
                                                )}
                                                {labFees > 0 && (
                                                    <div className="flex justify-between text-gray-600">
                                                        <span>Laboratory Fees</span>
                                                        <span>{formatCurrency(labFees)}</span>
                                                    </div>
                                                )}
                                                {specialFees > 0 && (
                                                    <div className="flex justify-between text-gray-600">
                                                        <span>Special Fees</span>
                                                        <span>{formatCurrency(specialFees)}</span>
                                                    </div>
                                                )}
                                                <div className="flex justify-between border-t pt-1 text-gray-600">
                                                    <span>Gross Total</span>
                                                    <span>{formatCurrency(grossTotal)}</span>
                                                </div>
                                                {totalDiscount > 0 && (
                                                    <div className="flex justify-between text-green-600">
                                                        <span>Less: Discounts</span>
                                                        <span>− {formatCurrency(totalDiscount)}</span>
                                                    </div>
                                                )}
                                                <div className="flex justify-between border-t pt-2 text-base font-bold text-gray-900">
                                                    <span>Net Amount Due</span>
                                                    <span>{formatCurrency(netTotal)}</span>
                                                </div>
                                                {paymentPlan === 'installment' && (
                                                    <div className="flex justify-between rounded bg-amber-50 px-2 py-1.5 text-sm font-semibold text-amber-800">
                                                        <span>Minimum Payment Upon Enrollment (30%)</span>
                                                        <span>{formatCurrency(Math.round(netTotal * 0.3 * 100) / 100)}</span>
                                                    </div>
                                                )}
                                            </div>
                                            <Button onClick={handlePrint} variant="outline" className="mt-4 w-full">
                                                <Printer className="mr-2 h-4 w-4" />
                                                Print Summary
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Navigation */}
                            <div className="flex items-center justify-between border-t p-4">
                                <Button variant="outline" onClick={() => setWizardStep((s) => s - 1)} disabled={wizardStep === 1}>
                                    Back
                                </Button>

                                {wizardStep < enrollmentSteps.length ? (
                                    <Button
                                        onClick={() => setWizardStep((s) => s + 1)}
                                        disabled={!canProceedWizard()}
                                    >
                                        Continue
                                    </Button>
                                ) : (
                                    <Button
                                        onClick={handleSubmit}
                                        disabled={!canProceedWizard() || isProcessing}
                                        className="bg-green-600 hover:bg-green-700"
                                    >
                                        {isProcessing ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Processing...
                                            </>
                                        ) : (
                                            'Confirm Enrollment'
                                        )}
                                    </Button>
                                )}
                            </div>
                        </div>
                    </>
                )}

                {/* No application */}
                {!application && (
                    <div className="rounded-lg border-2 border-gray-200 bg-gray-50 p-10 text-center shadow-sm">
                        <AlertCircle className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                        <h3 className="text-lg font-semibold text-gray-800">No Application Found</h3>
                        <p className="mt-2 text-sm text-gray-500">No application record found. Please contact the Registrar&apos;s Office.</p>
                    </div>
                )}
            </div>

            {/* ── Printable assessment (awaiting-payment state) ── */}
            {awaitingPayment && assessment && (
                <div className="hidden p-10 font-sans text-sm text-black print:block">
                    <div className="mb-6 border-b-2 border-black pb-4 text-center">
                        <h1 className="text-2xl font-bold tracking-wide uppercase">St. Louis University</h1>
                        <h2 className="text-base font-semibold">Student Fee Assessment</h2>
                    </div>
                    <div className="mb-4 flex justify-between text-xs">
                        <div>
                            <p><strong>Assessment No.:</strong> {assessment.assessment_number}</p>
                            <p><strong>Date:</strong> {assessment.finalized_at ?? '—'}</p>
                        </div>
                        <div className="text-right">
                            <p><strong>School Year:</strong> {assessment.school_year}</p>
                            <p><strong>Semester:</strong> {assessment.semester}</p>
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
                            <p><strong>Grade Level:</strong> {application?.grade_level ?? '—'}</p>
                        </div>
                    </div>
                    <div className="mb-4 border border-black p-3">
                        <p className="mb-2 font-bold uppercase">Fee Assessment</p>
                        <table className="w-full text-xs">
                            <tbody>
                                {assessment.total_tuition > 0 && (
                                    <tr><td className="py-0.5">Tuition Fees</td><td className="py-0.5 text-right">{formatCurrency(assessment.total_tuition)}</td></tr>
                                )}
                                {assessment.total_misc_fees > 0 && (
                                    <tr><td className="py-0.5">Miscellaneous Fees</td><td className="py-0.5 text-right">{formatCurrency(assessment.total_misc_fees)}</td></tr>
                                )}
                                {assessment.total_lab_fees > 0 && (
                                    <tr><td className="py-0.5">Laboratory Fees</td><td className="py-0.5 text-right">{formatCurrency(assessment.total_lab_fees)}</td></tr>
                                )}
                                {assessment.total_other_fees > 0 && (
                                    <tr><td className="py-0.5">Other Fees</td><td className="py-0.5 text-right">{formatCurrency(assessment.total_other_fees)}</td></tr>
                                )}
                                <tr className="border-t border-black">
                                    <td className="py-1">Gross Total</td>
                                    <td className="py-1 text-right">{formatCurrency(assessment.gross_amount)}</td>
                                </tr>
                                {assessment.total_discounts > 0 && (
                                    <tr><td className="py-0.5">Less: Discounts</td><td className="py-0.5 text-right">− {formatCurrency(assessment.total_discounts)}</td></tr>
                                )}
                                <tr className="border-t-2 border-black text-sm font-bold">
                                    <td className="pt-1">NET AMOUNT DUE</td>
                                    <td className="pt-1 text-right">{formatCurrency(assessment.net_amount)}</td>
                                </tr>
                                <tr>
                                    <td className="pt-1">Minimum Payment Upon Enrollment</td>
                                    <td className="pt-1 text-right">{formatCurrency(assessment.minimum_amount)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <p className="mt-8 text-center text-xs text-gray-500">Please present this assessment at the Cashier&apos;s Office for payment.</p>
                </div>
            )}

            {/* ── Printable summary for wizard step 3 (pre-enrollment) ── */}
            {canEnroll && enrollmentOpen && wizardStep === 3 && (
                <div className="hidden p-10 font-sans text-sm text-black print:block">
                    <div className="mb-6 border-b-2 border-black pb-4 text-center">
                        <h1 className="text-2xl font-bold tracking-wide uppercase">St. Louis University</h1>
                        <h2 className="text-base font-semibold">Student Enrollment Summary</h2>
                    </div>
                    <div className="mb-4 flex justify-between text-xs">
                        <div>
                            <p><strong>School Year:</strong> {application?.school_year}</p>
                            <p><strong>Semester:</strong> {application?.semester ?? '—'}</p>
                        </div>
                        <div className="text-right">
                            <p><strong>Payment Plan:</strong> {paymentPlan === 'full' ? 'Full Payment' : 'Installment'}</p>
                            <p><strong>Mode of Payment:</strong> {paymentModeLabels[paymentMode] ?? paymentMode}</p>
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
                            <p><strong>Grade Level:</strong> {application?.grade_level ?? '—'}</p>
                        </div>
                    </div>
                    <div className="mb-4 border border-black p-3">
                        <p className="mb-2 font-bold uppercase">Fee Assessment</p>
                        <table className="w-full text-xs">
                            <tbody>
                                {tuitionFee > 0 && (
                                    <tr>
                                        <td className="py-0.5">Tuition Fees</td>
                                        <td className="py-0.5 text-right">{formatCurrency(tuitionFee)}</td>
                                    </tr>
                                )}
                                {miscFees > 0 && (
                                    <tr>
                                        <td className="py-0.5">Miscellaneous Fees</td>
                                        <td className="py-0.5 text-right">{formatCurrency(miscFees)}</td>
                                    </tr>
                                )}
                                {labFees > 0 && (
                                    <tr>
                                        <td className="py-0.5">Laboratory Fees</td>
                                        <td className="py-0.5 text-right">{formatCurrency(labFees)}</td>
                                    </tr>
                                )}
                                {specialFees > 0 && (
                                    <tr>
                                        <td className="py-0.5">Special Fees</td>
                                        <td className="py-0.5 text-right">{formatCurrency(specialFees)}</td>
                                    </tr>
                                )}
                                <tr className="border-t border-black">
                                    <td className="py-1">Gross Total</td>
                                    <td className="py-1 text-right">{formatCurrency(grossTotal)}</td>
                                </tr>
                                {totalDiscount > 0 && (
                                    <tr>
                                        <td className="py-0.5">Less: Discounts</td>
                                        <td className="py-0.5 text-right">− {formatCurrency(totalDiscount)}</td>
                                    </tr>
                                )}
                                <tr className="border-t-2 border-black text-sm font-bold">
                                    <td className="pt-1">NET AMOUNT DUE</td>
                                    <td className="pt-1 text-right">{formatCurrency(netTotal)}</td>
                                </tr>
                                {paymentPlan === 'installment' && (
                                    <tr>
                                        <td className="pt-1">Minimum Payment (30%)</td>
                                        <td className="pt-1 text-right">{formatCurrency(Math.round(netTotal * 0.3 * 100) / 100)}</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <p className="mt-8 text-center text-xs text-gray-500">Please present this summary at the Cashier&apos;s Office for payment.</p>
                </div>
            )}

            {/* ── Printable receipt ── hidden on screen, shown only when printing ── */}
            {isEnrolled && assessment && (
                <div className="hidden p-10 font-sans text-sm text-black print:block">
                    {/* Header */}
                    <div className="mb-6 border-b-2 border-black pb-4 text-center">
                        <h1 className="text-2xl font-bold tracking-wide uppercase">St. Louis University</h1>
                        <h2 className="text-base font-semibold">Student Enrollment Receipt</h2>
                    </div>

                    {/* Assessment metadata */}
                    <div className="mb-4 flex justify-between text-xs">
                        <div>
                            <p>
                                <strong>Assessment No.:</strong> {assessment.assessment_number}
                            </p>
                            <p>
                                <strong>Date:</strong> {assessment.finalized_at ?? '—'}
                            </p>
                        </div>
                        <div className="text-right">
                            <p>
                                <strong>School Year:</strong> {assessment.school_year}
                            </p>
                            <p>
                                <strong>Semester:</strong> {assessment.semester}
                            </p>
                        </div>
                    </div>

                    {/* Student info */}
                    <div className="mb-4 border border-black p-3">
                        <p className="mb-2 font-bold uppercase">Student Information</p>
                        <div className="grid grid-cols-2 gap-1 text-xs">
                            <p>
                                <strong>Name:</strong>{' '}
                                {personalData
                                    ? `${personalData.last_name}, ${personalData.first_name}${personalData.middle_name ? ' ' + personalData.middle_name : ''}`
                                    : '—'}
                            </p>
                            <p>
                                <strong>Student ID:</strong> {studentRecord?.student_id ?? '—'}
                            </p>
                            <p>
                                <strong>Grade Level:</strong> {application?.grade_level ?? '—'}
                            </p>
                            <p>
                                <strong>Status:</strong> Enrolled
                            </p>
                        </div>
                    </div>

                    {/* Fee table */}
                    <div className="mb-4 border border-black p-3">
                        <p className="mb-2 font-bold uppercase">Fee Assessment</p>
                        <table className="w-full text-xs">
                            <tbody>
                                {assessment.total_tuition > 0 && (
                                    <tr>
                                        <td className="py-0.5">Tuition Fees</td>
                                        <td className="py-0.5 text-right">{formatCurrency(assessment.total_tuition)}</td>
                                    </tr>
                                )}
                                {assessment.total_misc_fees > 0 && (
                                    <tr>
                                        <td className="py-0.5">Miscellaneous Fees</td>
                                        <td className="py-0.5 text-right">{formatCurrency(assessment.total_misc_fees)}</td>
                                    </tr>
                                )}
                                {assessment.total_lab_fees > 0 && (
                                    <tr>
                                        <td className="py-0.5">Laboratory Fees</td>
                                        <td className="py-0.5 text-right">{formatCurrency(assessment.total_lab_fees)}</td>
                                    </tr>
                                )}
                                {assessment.total_other_fees > 0 && (
                                    <tr>
                                        <td className="py-0.5">Other Fees</td>
                                        <td className="py-0.5 text-right">{formatCurrency(assessment.total_other_fees)}</td>
                                    </tr>
                                )}
                                <tr className="border-t border-black">
                                    <td className="py-1">Gross Total</td>
                                    <td className="py-1 text-right">{formatCurrency(assessment.gross_amount)}</td>
                                </tr>
                                {assessment.total_discounts > 0 && (
                                    <tr>
                                        <td className="py-0.5">Less: Discounts</td>
                                        <td className="py-0.5 text-right">− {formatCurrency(assessment.total_discounts)}</td>
                                    </tr>
                                )}
                                <tr className="border-t-2 border-black text-sm font-bold">
                                    <td className="pt-1">NET AMOUNT DUE</td>
                                    <td className="pt-1 text-right">{formatCurrency(assessment.net_amount)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Footer */}
                    <p className="mt-8 text-center text-xs text-gray-500">Please present this receipt at the Cashier&apos;s Office for payment.</p>
                </div>
            )}
        </StudentLayout>
    );
}
