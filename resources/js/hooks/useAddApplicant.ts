import { applicantFormSchema, type ApplicantFormValues } from '@/schemas/applicant-form';
import { router, usePage } from '@inertiajs/react';
import { zodResolver } from '@hookform/resolvers/zod';
import axios from 'axios';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

type PsgcItem = { code: string; name: string };

export function useAddApplicant() {
    const currentSemester = usePage().props.currentSemester as { name: string | null; school_year: string | null } | null;

    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [pendingAction, setPendingAction] = useState<'discard' | 'reset' | null>(null);

    const form = useForm<ApplicantFormValues>({
        resolver: zodResolver(applicantFormSchema) as any,
        mode: 'onChange',
        defaultValues: {
            application_date: new Date().toISOString().split('T')[0],
            school_year: currentSemester?.school_year ?? '',
            application_number: '',
            application_status: 'Pending',
            year_level: '',
            semester: currentSemester?.name ?? '',
            strand: '',
            classification: '',
            learning_mode: '',
            accomplished_by_name: '',
            last_name: '',
            first_name: '',
            middle_name: '',
            suffix: '',
            learner_reference_number: '',
            gender: '',
            citizenship: '',
            religion: '',
            date_of_birth: '',
            place_of_birth: '',
            has_sibling: false,
            email: '',
            alt_email: '',
            mobile_number: '',
            present_street: '',
            present_brgy: '',
            present_city: '',
            present_province: '',
            present_zip: '',
            permanent_street: '',
            permanent_brgy: '',
            permanent_city: '',
            permanent_province: '',
            permanent_zip: '',
            stopped_studying: '',
            accelerated: '',
            health_conditions: [],
            has_doctors_note: false,
            doctors_note_file: null,
            father_lname: '',
            father_fname: '',
            father_mname: '',
            father_living: '',
            father_citizenship: '',
            father_religion: '',
            father_highest_educ: '',
            father_occupation: '',
            father_income: '',
            father_business_emp: '',
            father_business_address: '',
            father_contact_no: '',
            father_email: '',
            father_slu_employee: false,
            father_slu_dept: '',
            mother_lname: '',
            mother_fname: '',
            mother_mname: '',
            mother_living: '',
            mother_citizenship: '',
            mother_religion: '',
            mother_highest_educ: '',
            mother_occupation: '',
            mother_income: '',
            mother_business_emp: '',
            mother_business_address: '',
            mother_contact_no: '',
            mother_email: '',
            mother_slu_employee: false,
            mother_slu_dept: '',
            guardian_lname: '',
            guardian_fname: '',
            guardian_mname: '',
            guardian_relationship: '',
            guardian_citizenship: '',
            guardian_religion: '',
            guardian_highest_educ: '',
            guardian_occupation: '',
            guardian_income: '',
            guardian_business_emp: '',
            guardian_business_address: '',
            guardian_contact_no: '',
            guardian_email: '',
            guardian_slu_employee: false,
            guardian_slu_dept: '',
            emergency_contact_name: '',
            emergency_relationship: '',
            emergency_home_phone: '',
            emergency_mobile_phone: '',
            emergency_email: '',
            siblings: [],
            schools: [],
            certificate_of_enrollment: null,
            birth_certificate: null,
            latest_report_card_front: null,
            latest_report_card_back: null,
        },
    });

    const [presentRegions, setPresentRegions] = useState<PsgcItem[]>([]);
    const [presentProvinces, setPresentProvinces] = useState<PsgcItem[]>([]);
    const [presentCities, setPresentCities] = useState<PsgcItem[]>([]);
    const [presentBarangays, setPresentBarangays] = useState<PsgcItem[]>([]);
    const [selectedPresentRegion, setSelectedPresentRegion] = useState('');
    const [selectedPresentProvince, setSelectedPresentProvince] = useState('');
    const [selectedPresentCity, setSelectedPresentCity] = useState('');

    const [permanentRegions, setPermanentRegions] = useState<PsgcItem[]>([]);
    const [permanentProvinces, setPermanentProvinces] = useState<PsgcItem[]>([]);
    const [permanentCities, setPermanentCities] = useState<PsgcItem[]>([]);
    const [permanentBarangays, setPermanentBarangays] = useState<PsgcItem[]>([]);
    const [selectedPermanentRegion, setSelectedPermanentRegion] = useState('');
    const [selectedPermanentProvince, setSelectedPermanentProvince] = useState('');
    const [selectedPermanentCity, setSelectedPermanentCity] = useState('');

    const [isSameAddress, setIsSameAddress] = useState(false);

    const allValues = form.watch();
    const hasChanges = useMemo(() => {
        return Object.entries(allValues).some(([key, value]) => {
            if (['application_date', 'school_year', 'application_status'].includes(key)) return false;
            if (Array.isArray(value)) return value.length > 0;
            if (typeof value === 'boolean') return value === true;
            if (value instanceof File) return true;
            if (typeof value === 'string') return value.trim() !== '';
            return value !== null && value !== undefined;
        });
    }, [allValues]);

    useEffect(() => {
        const load = async () => {
            try {
                const res = await axios.get<PsgcItem[]>('https://psgc.gitlab.io/api/regions');
                setPresentRegions(res.data);
                setPermanentRegions(res.data);
            } catch {
                toast.error('Failed to load address data.');
            }
        };
        load();
    }, []);

    useEffect(() => {
        if (!selectedPresentRegion) return;
        const load = async () => {
            try {
                const res = await axios.get<PsgcItem[]>(`https://psgc.gitlab.io/api/regions/${selectedPresentRegion}/provinces`);
                setPresentProvinces(res.data);
            } catch {
                toast.error('Failed to load address data.');
            }
        };
        load();
        setPresentCities([]);
        setPresentBarangays([]);
        setSelectedPresentProvince('');
        setSelectedPresentCity('');
        form.setValue('present_province', '');
        form.setValue('present_city', '');
        form.setValue('present_brgy', '');
    }, [selectedPresentRegion]);

    useEffect(() => {
        if (!selectedPresentProvince) return;
        const load = async () => {
            try {
                const res = await axios.get<PsgcItem[]>(`https://psgc.gitlab.io/api/provinces/${selectedPresentProvince}/cities-municipalities`);
                setPresentCities(res.data);
            } catch {
                toast.error('Failed to load address data.');
            }
        };
        load();
        setPresentBarangays([]);
        setSelectedPresentCity('');
        form.setValue('present_city', '');
        form.setValue('present_brgy', '');
    }, [selectedPresentProvince]);

    useEffect(() => {
        if (!selectedPresentCity) return;
        const load = async () => {
            try {
                const res = await axios.get<PsgcItem[]>(`https://psgc.gitlab.io/api/cities-municipalities/${selectedPresentCity}/barangays`);
                setPresentBarangays(res.data);
            } catch {
                toast.error('Failed to load address data.');
            }
        };
        load();
        form.setValue('present_brgy', '');
    }, [selectedPresentCity]);

    useEffect(() => {
        if (!isSameAddress) return;
        if (presentRegions.length > 0) setPermanentRegions(presentRegions);
        if (presentProvinces.length > 0) setPermanentProvinces(presentProvinces);
        if (presentCities.length > 0) setPermanentCities(presentCities);
        if (presentBarangays.length > 0) setPermanentBarangays(presentBarangays);
        if (selectedPresentRegion !== selectedPermanentRegion) setSelectedPermanentRegion(selectedPresentRegion);
        if (selectedPresentProvince !== selectedPermanentProvince) setSelectedPermanentProvince(selectedPresentProvince);
        if (selectedPresentCity !== selectedPermanentCity) setSelectedPermanentCity(selectedPresentCity);
        form.setValue('permanent_street', form.getValues('present_street') || '', { shouldValidate: false, shouldDirty: false });
        form.setValue('permanent_zip', form.getValues('present_zip') || '', { shouldValidate: false, shouldDirty: false });
        form.setValue('permanent_province', form.getValues('present_province') || '', { shouldValidate: false, shouldDirty: false });
        form.setValue('permanent_city', form.getValues('present_city') || '', { shouldValidate: false, shouldDirty: false });
        form.setValue('permanent_brgy', form.getValues('present_brgy') || '', { shouldValidate: false, shouldDirty: false });
    }, [
        isSameAddress,
        selectedPresentRegion,
        selectedPresentProvince,
        selectedPresentCity,
        form.watch('present_street'),
        form.watch('present_zip'),
        form.watch('present_province'),
        form.watch('present_city'),
        form.watch('present_brgy'),
        presentRegions,
        presentProvinces,
        presentCities,
        presentBarangays,
    ]);

    useEffect(() => {
        if (isSameAddress || !selectedPermanentRegion) return;
        const load = async () => {
            try {
                const res = await axios.get<PsgcItem[]>(`https://psgc.gitlab.io/api/regions/${selectedPermanentRegion}/provinces`);
                setPermanentProvinces(res.data);
            } catch {
                toast.error('Failed to load address data.');
            }
        };
        load();
        setPermanentCities([]);
        setPermanentBarangays([]);
        setSelectedPermanentProvince('');
        setSelectedPermanentCity('');
        form.setValue('permanent_province', '');
        form.setValue('permanent_city', '');
        form.setValue('permanent_brgy', '');
    }, [selectedPermanentRegion, isSameAddress]);

    useEffect(() => {
        if (isSameAddress || !selectedPermanentProvince) return;
        const load = async () => {
            try {
                const res = await axios.get<PsgcItem[]>(`https://psgc.gitlab.io/api/provinces/${selectedPermanentProvince}/cities-municipalities`);
                setPermanentCities(res.data);
            } catch {
                toast.error('Failed to load address data.');
            }
        };
        load();
        setPermanentBarangays([]);
        setSelectedPermanentCity('');
        form.setValue('permanent_city', '');
        form.setValue('permanent_brgy', '');
    }, [selectedPermanentProvince, isSameAddress]);

    useEffect(() => {
        if (isSameAddress || !selectedPermanentCity) return;
        const load = async () => {
            try {
                const res = await axios.get<PsgcItem[]>(`https://psgc.gitlab.io/api/cities-municipalities/${selectedPermanentCity}/barangays`);
                setPermanentBarangays(res.data);
            } catch {
                toast.error('Failed to load address data.');
            }
        };
        load();
        form.setValue('permanent_brgy', '');
    }, [selectedPermanentCity, isSameAddress]);

    const handleReset = () => {
        const currentSchoolYear = form.getValues('school_year');
        const currentApplicationDate = form.getValues('application_date');
        form.reset({
            ...form.formState.defaultValues,
            application_date: currentApplicationDate,
            school_year: currentSchoolYear,
        });
    };

    const handleConfirmAction = () => {
        if (pendingAction === 'discard') {
            window.history.back();
        } else if (pendingAction === 'reset') {
            handleReset();
        }
        setShowConfirmDialog(false);
        setPendingAction(null);
    };

    async function onSubmit(values: ApplicantFormValues) {
        try {
            const formData = new FormData();
            Object.entries(values).forEach(([key, value]) => {
                if (key === 'siblings' || key === 'schools') {
                    if (Array.isArray(value) && value.length > 0) formData.append(key, JSON.stringify(value));
                    return;
                }
                if (key === 'health_conditions') {
                    if (Array.isArray(value) && value.length > 0) formData.append(key, JSON.stringify(value));
                    else if (typeof value === 'string' && value) formData.append(key, value);
                    return;
                }
                if (['certificate_of_enrollment', 'birth_certificate', 'latest_report_card_front', 'latest_report_card_back', 'doctors_note_file'].includes(key)) {
                    if (value instanceof File) formData.append(key, value);
                    return;
                }
                if (typeof value === 'boolean') {
                    formData.append(key, value ? '1' : '0');
                    return;
                }
                if (value !== null && value !== undefined && value !== '') {
                    formData.append(key, value.toString());
                }
            });
            router.post('/admin/applicants', formData, {
                forceFormData: true,
                onSuccess: () => router.visit('/applications/success', { replace: true }),
                onError: (errors) => {
                    const firstError = Object.values(errors)[0];
                    toast.error(firstError || 'Failed to submit application. Please check the form.');
                    Object.keys(errors).forEach((key) => {
                        form.setError(key as any, { type: 'manual', message: errors[key] });
                    });
                },
            });
        } catch {
            toast.error('An unexpected error occurred. Please try again.');
        }
    }

    return {
        form,
        showConfirmDialog,
        setShowConfirmDialog,
        pendingAction,
        setPendingAction,
        hasChanges,
        handleConfirmAction,
        onSubmit,
        presentRegions,
        presentProvinces,
        presentCities,
        presentBarangays,
        selectedPresentRegion,
        setSelectedPresentRegion,
        selectedPresentProvince,
        setSelectedPresentProvince,
        selectedPresentCity,
        setSelectedPresentCity,
        permanentRegions,
        permanentProvinces,
        permanentCities,
        permanentBarangays,
        selectedPermanentRegion,
        setSelectedPermanentRegion,
        selectedPermanentProvince,
        setSelectedPermanentProvince,
        selectedPermanentCity,
        setSelectedPermanentCity,
        isSameAddress,
        setIsSameAddress,
    };
}
