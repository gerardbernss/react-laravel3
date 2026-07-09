import { useBarangays } from '@/hooks/use-barangays';
import { useCities } from '@/hooks/use-cities';
import { useProvinces } from '@/hooks/use-provinces';
import { useRegions } from '@/hooks/use-regions';
import { useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';

export interface EnrollmentPersonalData {
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
}

export interface EnrollmentFamilyBackground {
    emergency_contact_name: string | null;
    emergency_mobile_phone: string | null;
}

export interface Fee {
    id: number;
    name: string;
    category: string;
    is_per_unit: boolean;
    amount: number;
}

/** Format a number as Philippine Peso currency (e.g. ₱1,234.00). */
export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount);
}

/**
 * Manage the student self-enrollment wizard — contact info updates with PSGC address cascades,
 * fee summary, payment plan selection, and final enrollment form submission.
 */
export function useStudentEnrollment(
    personalData: EnrollmentPersonalData | null,
    familyBackground: EnrollmentFamilyBackground | null,
    fees: Fee[],
    priorBalance: number,
) {
    const currentSemester = usePage().props.currentSemester as { name: string | null; school_year: string } | null;

    const [isSavingContact, setIsSavingContact] = useState(false);
    const [viewStep, setViewStep] = useState(3);
    const [editingPaymentMode, setEditingPaymentMode] = useState(false);
    const [enrollStep, setEnrollStep] = useState(1);
    const [regionCode, setRegionCode] = useState<string | undefined>(undefined);
    const [provinceCode, setProvinceCode] = useState<string | undefined>(undefined);
    const [cityCode, setCityCode] = useState<string | undefined>(undefined);

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

    const { regions } = useRegions();
    const { provinces } = useProvinces(regionCode);
    const { cities } = useCities(provinceCode);
    const { barangays } = useBarangays(cityCode);

    const grossFees = fees.reduce((sum, f) => sum + f.amount, 0);
    const totalWithPrior = grossFees + priorBalance;

    const enrollForm = useForm({
        payment_plan: 'full',
        mode_of_payment: 'cash',
        total_amount: String(grossFees),
    });

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

    const handleContactCancel = () => {
        resetContact();
        setRegionCode(undefined);
        setProvinceCode(undefined);
        setCityCode(undefined);
    };

    const handlePersonalInfoSave = () => {
        setIsSavingContact(true);
        putContact('/student/profile', {
            onFinish: () => setIsSavingContact(false),
        });
    };

    const handleEnrollStep1Next = () => {
        if (!contactDirty) { setEnrollStep(2); return; }
        setIsSavingContact(true);
        putContact('/student/profile', {
            preserveScroll: true,
            onSuccess: () => { setEnrollStep(2); setIsSavingContact(false); },
            onError: () => setIsSavingContact(false),
        });
    };

    const handleEnroll = (e: React.FormEvent) => {
        e.preventDefault();
        enrollForm.setData('total_amount', String(grossFees));
        enrollForm.post('/student/enrollment/process');
    };

    const handlePrint = () => window.print();

    return {
        currentSemester,
        isSavingContact,
        viewStep, setViewStep,
        editingPaymentMode, setEditingPaymentMode,
        enrollStep, setEnrollStep,
        regionCode,
        provinceCode,
        cityCode,
        contactData, setContactData,
        contactDirty,
        regions, provinces, cities, barangays,
        grossFees, totalWithPrior,
        enrollForm,
        handleRegionChange,
        handleProvinceChange,
        handleCityChange,
        handleBarangayChange,
        handleContactCancel,
        handlePersonalInfoSave,
        handleEnrollStep1Next,
        handleEnroll,
        handlePrint,
    };
}
