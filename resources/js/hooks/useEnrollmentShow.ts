import { type BreadcrumbItem } from '@/types';
import { router, useForm } from '@inertiajs/react';
import { type FormEvent, useMemo, useState } from 'react';

export interface Fee {
    id: number;
    name: string;
    category: string;
    is_per_unit: boolean;
    amount: number;
}

export interface DiscountType {
    id: number;
    name: string;
    code: string;
    discount_type: 'percentage' | 'fixed_amount';
    value: string;
    applies_to: 'tuition_only' | 'miscellaneous_only' | 'all_fees';
    is_stackable: boolean;
    description: string | null;
    auto_applied: boolean;
}

/** Calculate the peso discount amount for a discount type based on which fee categories it applies to. */
export function calcDiscountAmount(dt: DiscountType, tuitionTotal: number, miscTotal: number, grossAmount: number): number {
    const base =
        dt.applies_to === 'tuition_only' ? tuitionTotal
        : dt.applies_to === 'miscellaneous_only' ? miscTotal
        : grossAmount;
    const amount = dt.discount_type === 'percentage' ? base * (parseFloat(dt.value) / 100) : parseFloat(dt.value);
    return Math.round(amount * 100) / 100;
}

interface ApplicantParams {
    id: number;
    personal_data: { first_name: string; last_name: string } | null;
    student_id_number: string | null;
}

interface Params {
    applicant: ApplicantParams;
    fees: Fee[];
    units: number;
    discountTypes: DiscountType[];
}

/**
 * Manage the enrollment detail page — fee breakdown, discount selection (with stackability rules),
 * net amount computation, onsite enrollment form, withdrawal dialog, and revert-to-pending action.
 */
export function useEnrollmentShow({ applicant, fees, units, discountTypes }: Params) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Enrollment Management', href: '/admin/enrollment/dashboard' },
        {
            title: `${applicant.personal_data?.last_name}, ${applicant.personal_data?.first_name}`,
            href: `/admin/enrollment/${applicant.id}`,
        },
    ];

    const [showEnrollForm, setShowEnrollForm] = useState(false);
    const [showRevertDialog, setShowRevertDialog] = useState(false);
    const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);

    const withdrawForm = useForm({ withdrawal_type: 'during_enrollment', refund_amount: '0', reason: '' });

    const handleWithdraw = (e: FormEvent) => {
        e.preventDefault();
        withdrawForm.post(`/admin/enrollment/${applicant.id}/withdraw`, {
            onSuccess: () => {
                setShowWithdrawDialog(false);
                withdrawForm.reset();
            },
        });
    };

    const enrollForm = useForm({ student_id_number: '' });

    const handleEnroll = (e: FormEvent) => {
        e.preventDefault();
        enrollForm.post(`/admin/enrollment/${applicant.id}/enroll`, {
            onSuccess: () => setShowEnrollForm(false),
        });
    };

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

    const handleOnsiteEnroll = (e: FormEvent) => {
        e.preventDefault();
        onsiteForm.post(`/admin/enrollment/${applicant.id}/process-onsite`);
    };

    const confirmRevert = () => {
        router.post(`/admin/enrollment/${applicant.id}/revert-to-pending`, {}, {
            onSuccess: () => setShowRevertDialog(false),
        });
    };

    return {
        breadcrumbs,
        showEnrollForm, setShowEnrollForm,
        showRevertDialog, setShowRevertDialog,
        showWithdrawDialog, setShowWithdrawDialog,
        withdrawForm, handleWithdraw,
        enrollForm, handleEnroll,
        feesByCategory, feeAmount, categoryTotal,
        grossAmount, tuitionTotal, miscTotal,
        onsiteForm, selectedDiscountIds, toggleDiscount, hasNonStackableSelected,
        appliedDiscounts, totalDiscount, netAmount,
        handleOnsiteEnroll, confirmRevert,
    };
}
