import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import StudentLayout from '@/layouts/student-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import {
    AlertCircle,
    Check,
    CheckCircle2,
    ChevronRight,
    Clock,
    CreditCard,
    FileText,
    GraduationCap,
    Loader2,
    Users,
} from 'lucide-react';
import { useState } from 'react';

interface Subject {
    id: number;
    code: string;
    name: string;
    units: number;
    type: string;
    strand: string | null;
}

interface BlockSection {
    id: number;
    name: string;
    code: string;
    grade_level: string;
    adviser: string;
    room: string;
    capacity: number;
    current_enrollment: number;
    schedule: string;
    subjects: Subject[];
    total_units: number;
}

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
    } | null;
    application: {
        id: number;
        school_year: string;
        grade_level: string;
        student_type: string;
        student_category?: string;
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
    documents: {
        birth_certificate: string | null;
        report_card: string | null;
        good_moral: string | null;
        id_photo: string | null;
    } | null;
    // Program props
    maxLoad: number;
    programName: string | null;
    // Enrollment wizard props
    blockSections?: BlockSection[];
    fees?: FeeItem[];
    availableDiscounts?: DiscountItem[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/student/dashboard' },
    { title: 'Enrollment', href: '/student/enrollment' },
];

// Enrollment wizard steps
const enrollmentSteps = [
    { id: 1, name: 'Select Section', icon: Users },
    { id: 2, name: 'Fee Summary', icon: FileText },
    { id: 3, name: 'Payment', icon: CreditCard },
];

export default function Enrollment({
    personalData,
    application,
    studentRecord,
    canEnroll,
    isEnrolled,
    maxLoad,
    programName,
    blockSections = [],
    fees = [],
    availableDiscounts = [],
}: Props) {
    // Enrollment wizard state
    const [wizardStep, setWizardStep] = useState(1);
    const [selectedBlockSection, setSelectedBlockSection] = useState<BlockSection | null>(null);
    const [selectedDiscounts, setSelectedDiscounts] = useState<number[]>([]);
    const [paymentMethod, setPaymentMethod] = useState<'full' | 'installment'>('full');
    const [acceptedTerms, setAcceptedTerms] = useState(false);

    const { processing } = useForm();

    // Total units from selected block section
    const totalUnits = selectedBlockSection?.total_units ?? 0;

    // Max load enforcement
    const remainingUnits = maxLoad > 0 ? maxLoad - totalUnits : Infinity;
    const exceedsMaxLoad = maxLoad > 0 && totalUnits > maxLoad;

    // Check if a block section exceeds max load
    const blockExceedsMaxLoad = (blockTotalUnits: number) => {
        if (maxLoad <= 0) return false;
        return blockTotalUnits > maxLoad;
    };

    // Calculate fees
    const calculateFees = () => {
        let tuitionFee = 0;
        let miscFees = 0;
        let labFees = 0;
        let specialFees = 0;

        fees.forEach((fee) => {
            const amount = fee.is_per_unit ? fee.amount * totalUnits : fee.amount;
            switch (fee.category) {
                case 'tuition':
                    tuitionFee += amount;
                    break;
                case 'miscellaneous':
                    miscFees += amount;
                    break;
                case 'laboratory':
                    labFees += amount;
                    break;
                case 'special':
                    specialFees += amount;
                    break;
            }
        });

        return { tuitionFee, miscFees, labFees, specialFees };
    };

    const { tuitionFee, miscFees, labFees, specialFees } = calculateFees();
    const grossTotal = tuitionFee + miscFees + labFees + specialFees;

    // Calculate discounts
    const calculateDiscounts = () => {
        let totalDiscount = 0;
        const appliedDiscounts: { name: string; amount: number }[] = [];

        availableDiscounts
            .filter((d) => selectedDiscounts.includes(d.id))
            .forEach((discount) => {
                let discountAmount = 0;
                const baseAmount =
                    discount.applies_to === 'tuition_only'
                        ? tuitionFee
                        : discount.applies_to === 'miscellaneous_only'
                          ? miscFees
                          : grossTotal;

                if (discount.discount_type === 'percentage') {
                    discountAmount = (baseAmount * discount.value) / 100;
                } else {
                    discountAmount = discount.value;
                }

                totalDiscount += discountAmount;
                appliedDiscounts.push({ name: discount.name, amount: discountAmount });
            });

        return { totalDiscount, appliedDiscounts };
    };

    const { totalDiscount, appliedDiscounts } = calculateDiscounts();
    const netTotal = grossTotal - totalDiscount;

    // Handle discount selection
    const toggleDiscount = (discountId: number) => {
        setSelectedDiscounts((prev) =>
            prev.includes(discountId) ? prev.filter((id) => id !== discountId) : [...prev, discountId],
        );
    };

    // Handle enrollment submission
    const handleSubmit = () => {
        const data = {
            selection_type: 'block',
            block_section_id: selectedBlockSection?.id,
            discount_ids: selectedDiscounts,
            payment_method: paymentMethod,
            total_amount: netTotal,
        };

        router.post('/student/enrollment/process', data);
    };

    // Can proceed to next step
    const canProceedWizard = () => {
        if (wizardStep === 1) {
            if (exceedsMaxLoad) return false;
            return !!selectedBlockSection;
        }
        if (wizardStep === 2) {
            return true;
        }
        if (wizardStep === 3) {
            return acceptedTerms && !!paymentMethod;
        }
        return false;
    };

    const getStatusDetails = () => {
        if (isEnrolled) {
            return {
                color: 'bg-blue-100 text-blue-800 border-blue-200',
                icon: <GraduationCap className="h-6 w-6 text-blue-600" />,
                label: 'Enrolled',
                description: 'You are officially enrolled. Welcome to the school!',
            };
        }
        return {
            color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            icon: <Clock className="h-6 w-6 text-yellow-600" />,
            label: 'Pending Enrollment',
            description: 'Please complete the enrollment process below.',
        };
    };

    const statusDetails = application ? getStatusDetails() : null;

    return (
        <StudentLayout breadcrumbs={breadcrumbs}>
            <Head title="Enrollment" />

            <div className="p-6 md:p-10">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Enrollment</h1>
                    <p className="mt-2 text-gray-600">
                        {canEnroll
                            ? 'Complete your enrollment process'
                            : isEnrolled
                              ? 'View your enrollment details'
                              : 'Track the progress of your enrollment application'}
                    </p>
                </div>

                {application ? (
                    <div className="space-y-8">
                        {/* Status Card */}
                        <div className="rounded-lg border bg-white p-6 shadow-sm transition-all hover:shadow-md">
                            <div className="flex items-start gap-4">
                                {statusDetails?.icon}
                                <div className="flex-1">
                                    <div className="flex items-center gap-3">
                                        <span
                                            className={`inline-flex rounded-full border px-4 py-1.5 text-sm font-semibold ${statusDetails?.color}`}
                                        >
                                            {statusDetails?.label}
                                        </span>
                                    </div>
                                    <p className="mt-2 text-gray-600">{statusDetails?.description}</p>
                                </div>
                            </div>
                        </div>

                        {/* Enrollment Wizard - Only show when canEnroll is true */}
                        {canEnroll && (
                            <div className="rounded-lg border-2 border-green-200 bg-white shadow-sm">
                                {/* Horizontal Progress Stepper */}
                                <div className="border-b bg-gray-50 px-6 py-4">
                                    <div className="mx-auto flex max-w-md items-center justify-center">
                                        {enrollmentSteps.map((s, index) => {
                                            const isCompleted = wizardStep > s.id;
                                            const isCurrent = wizardStep === s.id;
                                            const Icon = s.icon;

                                            return (
                                                <div key={s.id} className="flex items-center">
                                                    {/* Step Badge */}
                                                    <div className="flex flex-col items-center">
                                                        <div
                                                            className={`flex h-9 w-9 items-center justify-center rounded-full border-2 transition-all ${
                                                                isCompleted
                                                                    ? 'border-green-500 bg-green-500 text-white'
                                                                    : isCurrent
                                                                      ? 'border-green-500 bg-green-50 text-green-600'
                                                                      : 'border-gray-300 bg-white text-gray-400'
                                                            }`}
                                                        >
                                                            {isCompleted ? (
                                                                <Check className="h-4 w-4" />
                                                            ) : (
                                                                <Icon className="h-4 w-4" />
                                                            )}
                                                        </div>
                                                        <span
                                                            className={`mt-1.5 text-xs font-medium ${
                                                                isCompleted || isCurrent
                                                                    ? 'text-green-600'
                                                                    : 'text-gray-500'
                                                            }`}
                                                        >
                                                            {s.name}
                                                        </span>
                                                    </div>

                                                    {/* Connector Line */}
                                                    {index < enrollmentSteps.length - 1 && (
                                                        <div className="mx-3 w-16">
                                                            <div
                                                                className={`h-0.5 rounded-full transition-all ${
                                                                    wizardStep > s.id ? 'bg-green-500' : 'bg-gray-200'
                                                                }`}
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Step 1: Select Block Section */}
                                {wizardStep === 1 && (
                                    <div className="p-6">
                                        <div className="mb-4 flex items-center justify-between">
                                            <h2 className="text-xl font-semibold text-gray-900">
                                                Select Your Section
                                            </h2>
                                            {maxLoad > 0 && (
                                                <div className="flex items-center gap-3">
                                                    {programName && (
                                                        <span className="text-sm text-gray-500">{programName}</span>
                                                    )}
                                                    <Badge variant={exceedsMaxLoad ? 'destructive' : remainingUnits <= 5 && remainingUnits > 0 ? 'secondary' : 'outline'}>
                                                        {totalUnits} / {maxLoad} units
                                                    </Badge>
                                                </div>
                                            )}
                                        </div>

                                        {/* Block Section Selection */}
                                        <div className="space-y-4">
                                            <p className="text-sm text-gray-600">
                                                Select a block section to enroll in all its subjects together.
                                            </p>
                                            {blockSections.length > 0 ? (
                                                <div className="grid gap-4 md:grid-cols-2">
                                                    {blockSections.map((block) => {
                                                        const isBlockDisabled = blockExceedsMaxLoad(block.total_units);
                                                        return (
                                                        <div
                                                            key={block.id}
                                                            onClick={() => !isBlockDisabled && setSelectedBlockSection(block)}
                                                            className={`rounded-lg border-2 p-4 transition-all ${
                                                                isBlockDisabled
                                                                    ? 'cursor-not-allowed border-orange-300 bg-orange-50 opacity-75'
                                                                    : selectedBlockSection?.id === block.id
                                                                      ? 'cursor-pointer border-green-500 bg-green-50'
                                                                      : 'cursor-pointer border-gray-200 hover:border-gray-300 hover:shadow-sm'
                                                            }`}
                                                        >
                                                            <div className="flex items-start justify-between">
                                                                <div>
                                                                    <h3 className="font-semibold text-gray-900">
                                                                        {block.name}
                                                                    </h3>
                                                                    <p className="text-sm text-gray-500">{block.code}</p>
                                                                </div>
                                                                {isBlockDisabled ? (
                                                                    <Lock className="h-5 w-5 text-orange-500" />
                                                                ) : selectedBlockSection?.id === block.id ? (
                                                                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                                                                ) : null}
                                                            </div>
                                                            {blockExceedsMaxLoad(block.total_units) && (
                                                                <div className="mt-2 flex items-center gap-1 text-sm text-orange-600">
                                                                    <Lock className="h-4 w-4" />
                                                                    <span>Exceeds maximum unit load ({maxLoad})</span>
                                                                </div>
                                                            )}
                                                            <div className="mt-3 flex flex-wrap gap-2 text-sm text-gray-600">
                                                                <span>Adviser: {block.adviser}</span>
                                                                <span>•</span>
                                                                <span>Room: {block.room}</span>
                                                            </div>
                                                            <div className="mt-2 flex items-center justify-between text-sm">
                                                                <span className="text-gray-600">
                                                                    {block.subjects.length} subjects • {block.total_units} units
                                                                </span>
                                                                <Badge
                                                                    variant={
                                                                        block.current_enrollment < block.capacity
                                                                            ? 'success'
                                                                            : 'destructive'
                                                                    }
                                                                >
                                                                    {block.capacity - block.current_enrollment} slots left
                                                                </Badge>
                                                            </div>
                                                        </div>
                                                        );
                                                    })}
                                                </div>
                                            ) : (
                                                <div className="rounded-lg border border-dashed p-8 text-center">
                                                    <Users className="mx-auto h-12 w-12 text-gray-400" />
                                                    <p className="mt-2 text-gray-500">No block sections available for your grade level.</p>
                                                </div>
                                            )}

                                            {/* Show selected block's subjects */}
                                            {selectedBlockSection && (
                                                <div className="mt-6 rounded-lg border bg-gray-50 p-4">
                                                    <h4 className="mb-3 font-medium text-gray-900">
                                                        Subjects in {selectedBlockSection.name}
                                                    </h4>
                                                    <div className="grid gap-2 md:grid-cols-2">
                                                        {selectedBlockSection.subjects.map((subject) => (
                                                            <div
                                                                key={subject.id}
                                                                className="flex items-center justify-between rounded bg-white p-2 text-sm"
                                                            >
                                                                <div className="flex items-center gap-2">
                                                                    <span>{subject.name}</span>
                                                                </div>
                                                                <Badge variant="outline">{subject.units} units</Badge>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Step 2: Fee Summary */}
                                {wizardStep === 2 && (
                                    <div className="p-6">
                                        <h2 className="mb-4 text-xl font-semibold text-gray-900">Fee Summary</h2>

                                        {/* Enrollment Summary */}
                                        <div className="mb-6 rounded-lg border bg-gray-50 p-4">
                                            <h3 className="mb-2 font-medium text-gray-900">Enrollment Details</h3>
                                            <div className="grid gap-2 text-sm md:grid-cols-2">
                                                <div>
                                                    <span className="text-gray-500">Student:</span>{' '}
                                                    <span className="font-medium">
                                                        {personalData?.last_name}, {personalData?.first_name}
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className="text-gray-500">Grade Level:</span>{' '}
                                                    <span className="font-medium">{application?.grade_level}</span>
                                                </div>
                                                <div>
                                                    <span className="text-gray-500">School Year:</span>{' '}
                                                    <span className="font-medium">{application?.school_year}</span>
                                                </div>
                                                <div>
                                                    <span className="text-gray-500">Total Units:</span>{' '}
                                                    <span className="font-medium">{totalUnits} units</span>
                                                </div>
                                                {selectedBlockSection && (
                                                    <div className="md:col-span-2">
                                                        <span className="text-gray-500">Block Section:</span>{' '}
                                                        <span className="font-medium">{selectedBlockSection.name}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Fee Breakdown */}
                                        <div className="mb-6 space-y-4">
                                            <h3 className="font-medium text-gray-900">Fee Breakdown</h3>

                                            {/* Tuition */}
                                            <div className="rounded-lg border p-4">
                                                <div className="flex items-center justify-between">
                                                    <span className="font-medium text-gray-900">Tuition Fee</span>
                                                    <span className="font-semibold">
                                                        ₱{tuitionFee.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                                                    </span>
                                                </div>
                                                <p className="mt-1 text-sm text-gray-500">
                                                    {totalUnits} units × ₱{fees.find((f) => f.category === 'tuition')?.amount.toLocaleString() || 0}/unit
                                                </p>
                                            </div>

                                            {/* Miscellaneous Fees */}
                                            {miscFees > 0 && (
                                                <div className="rounded-lg border p-4">
                                                    <div className="flex items-center justify-between">
                                                        <span className="font-medium text-gray-900">Miscellaneous Fees</span>
                                                        <span className="font-semibold">
                                                            ₱{miscFees.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                                                        </span>
                                                    </div>
                                                    <div className="mt-2 space-y-1">
                                                        {fees
                                                            .filter((f) => f.category === 'miscellaneous')
                                                            .map((fee) => (
                                                                <div key={fee.id} className="flex justify-between text-sm text-gray-600">
                                                                    <span>{fee.name}</span>
                                                                    <span>₱{fee.amount.toLocaleString()}</span>
                                                                </div>
                                                            ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Laboratory Fees */}
                                            {labFees > 0 && (
                                                <div className="rounded-lg border p-4">
                                                    <div className="flex items-center justify-between">
                                                        <span className="font-medium text-gray-900">Laboratory Fees</span>
                                                        <span className="font-semibold">
                                                            ₱{labFees.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                                                        </span>
                                                    </div>
                                                    <div className="mt-2 space-y-1">
                                                        {fees
                                                            .filter((f) => f.category === 'laboratory')
                                                            .map((fee) => (
                                                                <div key={fee.id} className="flex justify-between text-sm text-gray-600">
                                                                    <span>{fee.name}</span>
                                                                    <span>₱{fee.amount.toLocaleString()}</span>
                                                                </div>
                                                            ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Special Fees */}
                                            {specialFees > 0 && (
                                                <div className="rounded-lg border p-4">
                                                    <div className="flex items-center justify-between">
                                                        <span className="font-medium text-gray-900">Special Fees</span>
                                                        <span className="font-semibold">
                                                            ₱{specialFees.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                                                        </span>
                                                    </div>
                                                    <div className="mt-2 space-y-1">
                                                        {fees
                                                            .filter((f) => f.category === 'special')
                                                            .map((fee) => (
                                                                <div key={fee.id} className="flex justify-between text-sm text-gray-600">
                                                                    <span>{fee.name}</span>
                                                                    <span>₱{fee.amount.toLocaleString()}</span>
                                                                </div>
                                                            ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Available Discounts */}
                                        {availableDiscounts.length > 0 && (
                                            <div className="mb-6">
                                                <h3 className="mb-3 font-medium text-gray-900">Available Discounts</h3>
                                                <div className="space-y-2">
                                                    {availableDiscounts.map((discount) => (
                                                        <label
                                                            key={discount.id}
                                                            className={`flex cursor-pointer items-center justify-between rounded-lg border p-3 transition-all ${
                                                                selectedDiscounts.includes(discount.id)
                                                                    ? 'border-green-500 bg-green-50'
                                                                    : 'hover:border-gray-300'
                                                            }`}
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={selectedDiscounts.includes(discount.id)}
                                                                    onChange={() => toggleDiscount(discount.id)}
                                                                    className="h-4 w-4 rounded border-gray-300 text-green-600"
                                                                />
                                                                <div>
                                                                    <p className="font-medium text-gray-900">{discount.name}</p>
                                                                    <p className="text-sm text-gray-500">
                                                                        {discount.discount_type === 'percentage'
                                                                            ? `${discount.value}% off`
                                                                            : `₱${discount.value.toLocaleString()} off`}
                                                                        {' • '}
                                                                        {discount.applies_to === 'tuition_only'
                                                                            ? 'Tuition only'
                                                                            : discount.applies_to === 'miscellaneous_only'
                                                                              ? 'Misc fees only'
                                                                              : 'All fees'}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            {selectedDiscounts.includes(discount.id) && (
                                                                <Badge variant="success">Applied</Badge>
                                                            )}
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Total Summary */}
                                        <div className="rounded-lg border-2 border-green-500 bg-green-50 p-4">
                                            <div className="space-y-2">
                                                <div className="flex justify-between text-gray-600">
                                                    <span>Gross Total</span>
                                                    <span>₱{grossTotal.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
                                                </div>
                                                {appliedDiscounts.length > 0 && (
                                                    <>
                                                        {appliedDiscounts.map((d, i) => (
                                                            <div key={i} className="flex justify-between text-green-600">
                                                                <span>Less: {d.name}</span>
                                                                <span>-₱{d.amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
                                                            </div>
                                                        ))}
                                                    </>
                                                )}
                                                <div className="border-t border-green-200 pt-2">
                                                    <div className="flex justify-between text-lg font-bold text-green-700">
                                                        <span>Net Total</span>
                                                        <span>₱{netTotal.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Step 3: Payment Options */}
                                {wizardStep === 3 && (
                                    <div className="p-6">
                                        <h2 className="mb-4 text-xl font-semibold text-gray-900">Payment Options</h2>

                                        {/* Amount Due */}
                                        <div className="mb-6 rounded-lg border-2 border-green-500 bg-green-50 p-4 text-center">
                                            <p className="text-sm text-gray-600">Amount Due</p>
                                            <p className="text-3xl font-bold text-green-700">
                                                ₱{netTotal.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                                            </p>
                                        </div>

                                        {/* Payment Method Selection */}
                                        <div className="mb-6">
                                            <h3 className="mb-3 font-medium text-gray-900">Select Payment Method</h3>
                                            <div className="grid gap-4 md:grid-cols-2">
                                                <button
                                                    onClick={() => setPaymentMethod('full')}
                                                    className={`rounded-lg border-2 p-4 text-left transition-all ${
                                                        paymentMethod === 'full'
                                                            ? 'border-green-500 bg-green-50'
                                                            : 'border-gray-200 hover:border-gray-300'
                                                    }`}
                                                >
                                                    <div className="flex items-start justify-between">
                                                        <div>
                                                            <h4 className="font-semibold text-gray-900">Full Payment</h4>
                                                            <p className="mt-1 text-sm text-gray-500">
                                                                Pay the full amount now
                                                            </p>
                                                        </div>
                                                        {paymentMethod === 'full' && (
                                                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                                                        )}
                                                    </div>
                                                    <p className="mt-3 text-lg font-bold text-green-700">
                                                        ₱{netTotal.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                                                    </p>
                                                </button>

                                                <button
                                                    onClick={() => setPaymentMethod('installment')}
                                                    className={`rounded-lg border-2 p-4 text-left transition-all ${
                                                        paymentMethod === 'installment'
                                                            ? 'border-green-500 bg-green-50'
                                                            : 'border-gray-200 hover:border-gray-300'
                                                    }`}
                                                >
                                                    <div className="flex items-start justify-between">
                                                        <div>
                                                            <h4 className="font-semibold text-gray-900">Installment</h4>
                                                            <p className="mt-1 text-sm text-gray-500">
                                                                Pay in 3 monthly installments
                                                            </p>
                                                        </div>
                                                        {paymentMethod === 'installment' && (
                                                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                                                        )}
                                                    </div>
                                                    <p className="mt-3 text-lg font-bold text-green-700">
                                                        ₱{(netTotal / 3).toLocaleString('en-PH', { minimumFractionDigits: 2 })}/month
                                                    </p>
                                                </button>
                                            </div>
                                        </div>

                                        {/* Installment Schedule */}
                                        {paymentMethod === 'installment' && (
                                            <div className="mb-6 rounded-lg border bg-gray-50 p-4">
                                                <h4 className="mb-3 font-medium text-gray-900">Payment Schedule</h4>
                                                <div className="space-y-2">
                                                    <div className="flex justify-between text-sm">
                                                        <span>1st Payment (Upon Enrollment)</span>
                                                        <span className="font-medium">
                                                            ₱{(netTotal / 3).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between text-sm">
                                                        <span>2nd Payment (Mid-term)</span>
                                                        <span className="font-medium">
                                                            ₱{(netTotal / 3).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between text-sm">
                                                        <span>3rd Payment (Before Finals)</span>
                                                        <span className="font-medium">
                                                            ₱{(netTotal / 3).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Payment Instructions */}
                                        <div className="mb-6 rounded-lg border bg-blue-50 p-4">
                                            <h4 className="mb-2 font-medium text-blue-900">Payment Instructions</h4>
                                            <ul className="space-y-1 text-sm text-blue-800">
                                                <li>• Visit the Finance Office to complete your payment</li>
                                                <li>• Bring a copy of your enrollment summary</li>
                                                <li>• Accepted payment methods: Cash, Check, Bank Transfer, GCash</li>
                                                <li>• Keep your official receipt for your records</li>
                                            </ul>
                                        </div>

                                        {/* Terms and Conditions */}
                                        <label className="flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-all hover:border-gray-300">
                                            <input
                                                type="checkbox"
                                                checked={acceptedTerms}
                                                onChange={(e) => setAcceptedTerms(e.target.checked)}
                                                className="mt-1 h-4 w-4 rounded border-gray-300 text-green-600"
                                            />
                                            <div>
                                                <p className="font-medium text-gray-900">Accept Terms and Conditions</p>
                                                <p className="text-sm text-gray-500">
                                                    I agree to pay the assessed fees and comply with the school's enrollment policies
                                                    and payment terms.
                                                </p>
                                            </div>
                                        </label>
                                    </div>
                                )}

                                {/* Navigation Buttons */}
                                <div className="flex items-center justify-between border-t bg-gray-50 p-4">
                                    <Button
                                        variant="outline"
                                        onClick={() => setWizardStep(wizardStep - 1)}
                                        disabled={wizardStep === 1}
                                    >
                                        Back
                                    </Button>

                                    <div className="flex items-center gap-2">
                                        {wizardStep < 3 ? (
                                            <Button onClick={() => setWizardStep(wizardStep + 1)} disabled={!canProceedWizard()}>
                                                Continue
                                                <ChevronRight className="ml-1 h-4 w-4" />
                                            </Button>
                                        ) : (
                                            <Button
                                                onClick={handleSubmit}
                                                disabled={!canProceedWizard() || processing}
                                                variant="success"
                                            >
                                                {processing ? (
                                                    <>
                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                        Processing...
                                                    </>
                                                ) : (
                                                    <>
                                                        <GraduationCap className="mr-2 h-4 w-4" />
                                                        Confirm Enrollment
                                                    </>
                                                )}
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Student ID (if enrolled) */}
                        {studentRecord && isEnrolled && (
                            <div className="rounded-lg border-2 border-blue-200 bg-blue-50 p-6">
                                <div className="flex items-center gap-4">
                                    <GraduationCap className="h-8 w-8 text-blue-600" />
                                    <div>
                                        <h2 className="text-lg font-semibold text-blue-900">
                                            You are officially enrolled!
                                        </h2>
                                        {studentRecord.student_id && (
                                            <p className="text-2xl font-bold text-blue-700">
                                                Student ID: {studentRecord.student_id}
                                            </p>
                                        )}
                                        {studentRecord.enrollment_date && (
                                            <p className="mt-1 text-sm text-blue-600">
                                                Enrolled on:{' '}
                                                {new Date(studentRecord.enrollment_date).toLocaleDateString()}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                    </div>
                ) : (
                    <div className="rounded-lg border bg-white p-8 text-center shadow-sm">
                        <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
                        <h2 className="mt-4 text-lg font-semibold text-gray-900">No Application Found</h2>
                        <p className="mt-2 text-gray-600">
                            We couldn&apos;t find an application associated with your account. Please contact the
                            admissions office for assistance.
                        </p>
                    </div>
                )}
            </div>
        </StudentLayout>
    );
}
