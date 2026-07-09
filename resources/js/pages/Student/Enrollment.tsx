import { SearchableSelect } from '@/components/searchable-select';
import { Button } from '@/components/ui/button';
import { LABEL_TEXT, SECTION_HEADING } from '@/constants/ui';
import { formatCurrency, useStudentEnrollment, type Fee } from '@/hooks/useStudentEnrollment';
import StudentLayout from '@/layouts/student-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import { AlertCircle, Check, CheckCircle2, ChevronLeft, ChevronRight, Clock, CreditCard, Loader2, Printer, User, XCircle } from 'lucide-react';

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
        application_number: string | null;
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
    isEnrolled: boolean;
    awaitingPayment: boolean;
    enrollmentOpen: boolean;
    targetYear: string | null;
    targetSemester: string | null;
    fees: Fee[];
    priorBalance: number;
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
        prior_balance: number;
        net_amount: number;
        finalized_at: string | null;
    } | null;
}

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Enrollment', href: '/student/enrollment' }];

const confirmationSteps = [
    { id: 1, name: 'Personal Info', icon: User },
    { id: 2, name: 'Fee & Payment', icon: CreditCard },
    { id: 3, name: 'Confirmation', icon: CheckCircle2 },
];

const paymentModeLabels: Record<string, string> = {
    cash: 'Cash',
    bank_transfer: 'Bank Transfer',
    online_banking: 'Online Banking',
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
                <Button variant="outline" size="sm" onClick={onCancel} disabled={processing}>Cancel</Button>
                <Button size="sm" onClick={handleSave} disabled={processing}>
                    {processing && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
                    Save
                </Button>
            </div>
        </div>
    );
}

/** Student portal enrollment page — shows fee assessment, prior balance, and payment status; guides the student through the enrollment wizard. */
export default function Enrollment({ personalData, familyBackground, application, studentRecord, isEnrolled, awaitingPayment, enrollmentOpen, targetYear, targetSemester, fees, priorBalance, assessment }: Props) {
    const {
        currentSemester,
        isSavingContact,
        viewStep, setViewStep,
        editingPaymentMode, setEditingPaymentMode,
        enrollStep, setEnrollStep,
        regionCode, provinceCode, cityCode,
        contactData, setContactData,
        contactDirty,
        regions, provinces, cities, barangays,
        grossFees, totalWithPrior,
        enrollForm,
        handleRegionChange, handleProvinceChange, handleCityChange, handleBarangayChange,
        handleContactCancel, handlePersonalInfoSave, handleEnrollStep1Next, handleEnroll, handlePrint,
    } = useStudentEnrollment(personalData, familyBackground, fees, priorBalance);

    return (
        <StudentLayout breadcrumbs={breadcrumbs}>
            <Head title="Enrollment" />

            <div className="mx-auto max-w-4xl px-4 py-8 print:hidden">
                {studentRecord?.enrollment_status === 'Withdrawn' && (
                    <div className="rounded-lg border-2 border-red-200 bg-red-50 p-10 text-center shadow-sm">
                        <XCircle className="mx-auto mb-4 h-14 w-14 text-red-500" />
                        <h3 className="text-xl font-bold text-red-800">Enrollment Withdrawn</h3>
                        <p className="mt-2 text-sm text-red-600">Your enrollment has been withdrawn. Please contact the Registrar's Office for assistance.</p>
                    </div>
                )}

                {studentRecord?.enrollment_status !== 'Withdrawn' && <>
                    <div className="mb-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Enrollment</h1>
                                <p className="mt-1 text-sm text-gray-500">
                                    {awaitingPayment
                                        ? "Your fee assessment has been submitted. Please proceed to the Cashier's Office to complete payment."
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

                    {awaitingPayment && (
                        <>
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
                                {viewStep === 1 && (
                                    <div className="p-6">
                                        <h2 className={`mb-1 ${SECTION_HEADING}`}>Personal Information</h2>
                                        <p className="mb-6 text-sm text-gray-500">Update your contact details below.</p>

                                        <div className="space-y-5">
                                            <div>
                                                <label className={`mb-1 block ${LABEL_TEXT}`}>Phone Number</label>
                                                <input
                                                    type="text"
                                                    value={contactData.mobile_number}
                                                    onChange={(e) => setContactData('mobile_number', e.target.value)}
                                                    placeholder="e.g. 09171234567"
                                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                                                />
                                            </div>

                                            <div>
                                                <h3 className="mb-2 text-sm font-medium text-gray-700">Present Address</h3>
                                                <div className="space-y-3">
                                                    <div>
                                                        <label className={`mb-1 block ${LABEL_TEXT}`}>Street / House No.</label>
                                                        <input
                                                            type="text"
                                                            value={contactData.present_street}
                                                            onChange={(e) => setContactData('present_street', e.target.value)}
                                                            placeholder="e.g. 123 Rizal St."
                                                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className={`mb-1 block ${LABEL_TEXT}`}>Region</label>
                                                        <SearchableSelect
                                                            value={regions.find((r) => r.code === regionCode)?.value ?? ''}
                                                            onChange={handleRegionChange}
                                                            options={regions}
                                                            placeholder="Select region"
                                                        />
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div>
                                                            <label className={`mb-1 block ${LABEL_TEXT}`}>Province</label>
                                                            <SearchableSelect
                                                                value={contactData.present_province}
                                                                onChange={handleProvinceChange}
                                                                options={provinces}
                                                                placeholder="Select province"
                                                                disabled={!regionCode}
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className={`mb-1 block ${LABEL_TEXT}`}>City / Municipality</label>
                                                            <SearchableSelect
                                                                value={contactData.present_city}
                                                                onChange={handleCityChange}
                                                                options={cities}
                                                                placeholder="Select city"
                                                                disabled={!provinceCode}
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className={`mb-1 block ${LABEL_TEXT}`}>Barangay</label>
                                                            <SearchableSelect
                                                                value={contactData.present_brgy}
                                                                onChange={handleBarangayChange}
                                                                options={barangays}
                                                                placeholder="Select barangay"
                                                                disabled={!cityCode}
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className={`mb-1 block ${LABEL_TEXT}`}>ZIP Code</label>
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

                                            <div className="flex justify-end gap-2 border-t pt-4">
                                                <Button size="sm" variant="outline" onClick={handleContactCancel} disabled={!contactDirty || isSavingContact}>
                                                    Cancel
                                                </Button>
                                                <Button size="sm" onClick={handlePersonalInfoSave} disabled={!contactDirty || isSavingContact}>
                                                    {isSavingContact ? (
                                                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</>
                                                    ) : (
                                                        'Save'
                                                    )}
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {viewStep === 2 && assessment && (
                                    <div className="p-6">
                                        <h2 className={`mb-4 ${SECTION_HEADING}`}>Fee Summary</h2>
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
                                                <div className={`flex justify-between ${assessment.prior_balance > 0 ? 'text-red-600' : 'text-gray-500'}`}>
                                                    <span>Prior Balance (Previous Semester)</span>
                                                    <span>{assessment.prior_balance > 0 ? `+ ${formatCurrency(assessment.prior_balance)}` : formatCurrency(0)}</span>
                                                </div>
                                                <div className="flex justify-between border-t pt-2 text-base font-bold text-gray-900">
                                                    <span>Net Amount Due</span>
                                                    <span>{formatCurrency(assessment.net_amount)}</span>
                                                </div>
                                            </div>
                                        </div>

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

                                {viewStep === 3 && (
                                    <div className="space-y-4 p-6">
                                        {assessment?.status === 'paid' || assessment?.status === 'partial' ? (
                                            <div className="rounded-lg border-2 border-green-200 bg-green-50 p-6 shadow-sm">
                                                <div className="flex items-center gap-3">
                                                    <CheckCircle2 className="h-8 w-8 shrink-0 text-green-500" />
                                                    <div>
                                                        <h3 className="text-lg font-semibold text-green-800">
                                                            {assessment.status === 'paid' ? 'Payment Complete' : 'Enrolled'}
                                                        </h3>
                                                        <p className="text-sm text-green-600">
                                                            {assessment.status === 'paid'
                                                                ? `You are fully enrolled.${application?.semester ? ` · ${application.semester}` : ''}`
                                                                : 'Minimum payment received. Please settle your remaining balance at the Cashier\'s Office.'}
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
                                                        <div className={`flex justify-between ${assessment.prior_balance > 0 ? 'text-red-600' : 'text-gray-500'}`}>
                                                            <span>Prior Balance (Previous Semester)</span>
                                                            <span>{assessment.prior_balance > 0 ? `+ ${formatCurrency(assessment.prior_balance)}` : formatCurrency(0)}</span>
                                                        </div>
                                                        <div className="flex justify-between border-t pt-2 text-base font-bold text-gray-900">
                                                            <span>Net Amount Due</span>
                                                            <span>{formatCurrency(assessment.net_amount)}</span>
                                                        </div>
                                                        <div className="flex justify-between rounded bg-amber-50 px-2 py-1.5 text-sm font-semibold text-amber-800">
                                                            <span>Minimum Payment Upon Enrollment</span>
                                                            <span>{formatCurrency(assessment.minimum_amount)}</span>
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

                                <div className="flex items-center justify-between border-t p-4">
                                    <Button variant="outline" onClick={() => setViewStep((s) => s - 1)} disabled={viewStep === 1}>
                                        Back
                                    </Button>
                                    {viewStep < 3 && <Button onClick={() => setViewStep((s) => s + 1)}>Next</Button>}
                                </div>
                            </div>
                        </>
                    )}

                    {application && !isEnrolled && !awaitingPayment && (
                        <div className="rounded-xl border-2 border-gray-100 bg-white shadow-sm">
                            {enrollmentOpen ? (
                                <>
                                    <div className="border-b px-6 pt-6 pb-4">
                                        <nav className="flex items-center justify-center gap-0">
                                            {[
                                                { id: 1, label: 'Personal Info', Icon: User },
                                                { id: 2, label: 'Fee Summary',   Icon: CreditCard },
                                            ].map(({ id, label, Icon }, i, arr) => {
                                                const active   = enrollStep === id;
                                                const complete = enrollStep > id;
                                                return (
                                                    <div key={id} className="flex items-center">
                                                        <div className="flex flex-col items-center">
                                                            <div className={`flex h-9 w-9 items-center justify-center rounded-full border-2 transition-colors ${
                                                                complete ? 'border-green-500 bg-green-500 text-white'
                                                                         : active   ? 'border-primary bg-primary text-white'
                                                                                    : 'border-gray-300 bg-white text-gray-400'
                                                            }`}>
                                                                {complete ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                                                            </div>
                                                            <span className={`mt-1 text-xs font-medium ${active ? 'text-primary' : complete ? 'text-green-600' : 'text-gray-400'}`}>
                                                                {label}
                                                            </span>
                                                        </div>
                                                        {i < arr.length - 1 && (
                                                            <div className={`mx-2 mb-4 h-0.5 w-16 ${enrollStep > id ? 'bg-green-500' : 'bg-gray-200'}`} />
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </nav>
                                    </div>

                                    <div className="p-6">
                                        {enrollStep === 1 && (
                                            <div className="space-y-5">
                                                <div>
                                                    <h3 className="text-base font-semibold text-gray-900">Personal Information</h3>
                                                    <p className="mt-0.5 text-sm text-gray-500">Review and update your contact details before proceeding.</p>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className={`mb-1 block ${LABEL_TEXT}`}>Phone Number</label>
                                                        <input
                                                            type="text"
                                                            value={contactData.mobile_number}
                                                            onChange={(e) => setContactData('mobile_number', e.target.value)}
                                                            placeholder="e.g. 09171234567"
                                                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                        />
                                                    </div>
                                                </div>

                                                <div>
                                                    <h4 className="mb-2 text-sm font-medium text-gray-700">Present Address</h4>
                                                    <div className="space-y-3">
                                                        <div>
                                                            <label className={`mb-1 block ${LABEL_TEXT}`}>Street / House No.</label>
                                                            <input
                                                                type="text"
                                                                value={contactData.present_street}
                                                                onChange={(e) => setContactData('present_street', e.target.value)}
                                                                placeholder="e.g. 123 Rizal St."
                                                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className={`mb-1 block ${LABEL_TEXT}`}>Region</label>
                                                            <SearchableSelect
                                                                value={regions.find((r) => r.code === regionCode)?.value ?? ''}
                                                                onChange={handleRegionChange}
                                                                options={regions}
                                                                placeholder="Select region"
                                                            />
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-3">
                                                            <div>
                                                                <label className={`mb-1 block ${LABEL_TEXT}`}>Province</label>
                                                                <SearchableSelect
                                                                    value={contactData.present_province}
                                                                    onChange={handleProvinceChange}
                                                                    options={provinces}
                                                                    placeholder="Select province"
                                                                    disabled={!regionCode}
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className={`mb-1 block ${LABEL_TEXT}`}>City / Municipality</label>
                                                                <SearchableSelect
                                                                    value={contactData.present_city}
                                                                    onChange={handleCityChange}
                                                                    options={cities}
                                                                    placeholder="Select city"
                                                                    disabled={!provinceCode}
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className={`mb-1 block ${LABEL_TEXT}`}>Barangay</label>
                                                                <SearchableSelect
                                                                    value={contactData.present_brgy}
                                                                    onChange={handleBarangayChange}
                                                                    options={barangays}
                                                                    placeholder="Select barangay"
                                                                    disabled={!cityCode}
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className={`mb-1 block ${LABEL_TEXT}`}>ZIP Code</label>
                                                                <input
                                                                    type="text"
                                                                    value={contactData.present_zip}
                                                                    onChange={(e) => setContactData('present_zip', e.target.value)}
                                                                    placeholder="e.g. 2600"
                                                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div>
                                                    <h4 className="mb-2 text-sm font-medium text-gray-700">Emergency Contact</h4>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div>
                                                            <label className={`mb-1 block ${LABEL_TEXT}`}>Name</label>
                                                            <input
                                                                type="text"
                                                                value={contactData.emergency_contact_name}
                                                                onChange={(e) => setContactData('emergency_contact_name', e.target.value)}
                                                                placeholder="Full Name"
                                                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className={`mb-1 block ${LABEL_TEXT}`}>Mobile</label>
                                                            <input
                                                                type="text"
                                                                value={contactData.emergency_mobile_phone}
                                                                onChange={(e) => setContactData('emergency_mobile_phone', e.target.value)}
                                                                placeholder="Contact Number"
                                                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex justify-end">
                                                    <Button onClick={handleEnrollStep1Next} disabled={isSavingContact} className="gap-2">
                                                        {isSavingContact ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                                                        {isSavingContact ? 'Saving…' : 'Next'}
                                                        <ChevronRight className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        )}

                                        {enrollStep === 2 && (
                                            <form onSubmit={handleEnroll} className="space-y-5">
                                                <div>
                                                    <h3 className="text-base font-semibold text-gray-900">Fee Summary</h3>
                                                    <p className="mt-0.5 text-sm text-gray-500">Review your fees, choose a payment plan, and submit.</p>
                                                </div>
                                                {fees.length > 0 && (
                                                    <div className="overflow-hidden rounded-lg border">
                                                        <table className="w-full text-sm">
                                                            <tbody className="divide-y">
                                                                {fees.map((f) => (
                                                                    <tr key={f.id}>
                                                                        <td className="px-4 py-2 text-gray-600">{f.name}</td>
                                                                        <td className="px-4 py-2 text-right font-medium text-gray-900">{formatCurrency(f.amount)}</td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                            <tfoot className="border-t">
                                                                <tr className={priorBalance > 0 ? 'bg-red-50' : 'bg-gray-50'}>
                                                                    <td className={`px-4 py-2 ${priorBalance > 0 ? 'text-red-700' : 'text-gray-500'}`}>Prior Balance (Previous Semester)</td>
                                                                    <td className={`px-4 py-2 text-right ${priorBalance > 0 ? 'text-red-700 font-medium' : 'text-gray-500'}`}>
                                                                        {priorBalance > 0 ? `+ ${formatCurrency(priorBalance)}` : formatCurrency(0)}
                                                                    </td>
                                                                </tr>
                                                                <tr className="bg-blue-50">
                                                                    <td className="px-4 py-2 font-bold text-blue-900">NET AMOUNT DUE</td>
                                                                    <td className="px-4 py-2 text-right font-bold text-blue-900">{formatCurrency(totalWithPrior)}</td>
                                                                </tr>
                                                            </tfoot>
                                                        </table>
                                                    </div>
                                                )}
                                                <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm">
                                                    <p className="mb-1.5 text-xs font-medium text-amber-800">Payment Options</p>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <div className="rounded bg-white px-3 py-1.5 text-center shadow-sm">
                                                            <p className="text-xs text-gray-500">Full Payment</p>
                                                            <p className="text-sm font-bold text-gray-900">{formatCurrency(totalWithPrior)}</p>
                                                        </div>
                                                        <div className="rounded bg-white px-3 py-1.5 text-center shadow-sm">
                                                            <p className="text-xs text-gray-500">Minimum (30%)</p>
                                                            <p className="text-sm font-bold text-green-700">{formatCurrency(Math.round((grossFees * 0.3 + priorBalance) * 100) / 100)}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className={`mb-1 block ${LABEL_TEXT}`}>Payment Plan</label>
                                                        <select
                                                            value={enrollForm.data.payment_plan}
                                                            onChange={(e) => enrollForm.setData('payment_plan', e.target.value)}
                                                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                                                        >
                                                            <option value="full">Full Payment</option>
                                                            <option value="installment">Installment (30% minimum)</option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className={`mb-1 block ${LABEL_TEXT}`}>Mode of Payment</label>
                                                        <select
                                                            value={enrollForm.data.mode_of_payment}
                                                            onChange={(e) => enrollForm.setData('mode_of_payment', e.target.value)}
                                                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                                                        >
                                                            <option value="cash">Cash</option>
                                                            <option value="check">Check</option>
                                                            <option value="bank_transfer">Bank Transfer</option>
                                                            <option value="gcash">GCash</option>
                                                            <option value="maya">Maya</option>
                                                        </select>
                                                    </div>
                                                </div>
                                                {(enrollForm.errors as Record<string, string>).error && (
                                                    <p className="text-sm text-red-600">{(enrollForm.errors as Record<string, string>).error}</p>
                                                )}
                                                <div className="flex justify-between">
                                                    <Button type="button" variant="outline" onClick={() => setEnrollStep(1)} className="gap-2">
                                                        <ChevronLeft className="h-4 w-4" /> Back
                                                    </Button>
                                                    <Button type="submit" disabled={enrollForm.processing} className="gap-2">
                                                        {enrollForm.processing ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                                                        Submit Enrollment
                                                    </Button>
                                                </div>
                                            </form>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <div className="py-10 text-center">
                                    <Clock className="mx-auto mb-3 h-10 w-10 text-gray-300" />
                                    <h3 className="font-semibold text-gray-700">Enrollment Not Yet Open</h3>
                                    <p className="mt-1 text-sm text-gray-500">
                                        Enrollment for {targetSemester} {targetYear} is not yet open. Please check back later.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {!application && (
                        <div className="rounded-lg border-2 border-gray-200 bg-gray-50 p-10 text-center shadow-sm">
                            <AlertCircle className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                            <h3 className="text-lg font-semibold text-gray-800">No Application Found</h3>
                            <p className="mt-2 text-sm text-gray-500">No application record found. Please contact the Registrar&apos;s Office.</p>
                        </div>
                    )}
                </>}
            </div>

            {/* Printable assessment (awaiting-payment state) */}
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
                            <p>
                                <strong>{studentRecord ? 'Student ID' : 'Application No.'}:</strong>{' '}
                                {studentRecord ? studentRecord.student_id : (application?.application_number ?? '—')}
                            </p>
                            <p><strong>Grade Level:</strong> {application?.grade_level ?? '—'}</p>
                        </div>
                    </div>
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
                                <tr>
                                    <td className={`py-0.5 ${assessment.prior_balance > 0 ? '' : 'text-gray-400'}`}>Prior Balance (Previous Semester)</td>
                                    <td className={`py-0.5 text-right ${assessment.prior_balance > 0 ? '' : 'text-gray-400'}`}>
                                        {assessment.prior_balance > 0 ? `+ ${formatCurrency(assessment.prior_balance)}` : formatCurrency(0)}
                                    </td>
                                </tr>
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

            {/* Printable receipt (enrolled state) */}
            {isEnrolled && assessment && (
                <div className="hidden p-10 font-sans text-sm text-black print:block">
                    <div className="mb-6 border-b-2 border-black pb-4 text-center">
                        <h1 className="text-2xl font-bold tracking-wide uppercase">St. Louis University</h1>
                        <h2 className="text-base font-semibold">Student Enrollment Receipt</h2>
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
                            <p>
                                <strong>{studentRecord ? 'Student ID' : 'Application No.'}:</strong>{' '}
                                {studentRecord ? studentRecord.student_id : (application?.application_number ?? '—')}
                            </p>
                            <p><strong>Grade Level:</strong> {application?.grade_level ?? '—'}</p>
                            <p><strong>Status:</strong> Enrolled</p>
                        </div>
                    </div>
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
                    <p className="mt-8 text-center text-xs text-gray-500">Please present this receipt at the Cashier&apos;s Office for payment.</p>
                </div>
            )}
        </StudentLayout>
    );
}
