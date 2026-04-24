import { CitizenshipSelect } from '@/components/citizenship-select';
import { FileUpload } from '@/components/file-upload';
import { SearchableSelect } from '@/components/searchable-select';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { router, usePage } from '@inertiajs/react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { applicantFormSchema, type ApplicantFormValues } from '@/schemas/applicant-form';
import axios from 'axios';
import { ArrowLeft, ClipboardList, FileText, GraduationCap, HelpCircle, Trash2, User, UserPlus, Users } from 'lucide-react';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Add New Applicant', href: '/admissions/applicants/create' }];

// ✅ Reusable tooltip label component
const LabelWithTooltip = ({ label, tooltip }: { label: string; tooltip?: string }) => {
    return (
        <div className="flex items-center gap-2">
            <Label>{label}</Label>
            {tooltip && (
                <Tooltip>
                    <TooltipTrigger asChild>
                        <HelpCircle size={16} className="cursor-pointer text-gray-500 hover:text-gray-700" />
                    </TooltipTrigger>
                    <TooltipContent>
                        <p className="max-w-xs text-sm">{tooltip}</p>
                    </TooltipContent>
                </Tooltip>
            )}
        </div>
    );
};

const FormNavigation = () => {
    const [activeSection, setActiveSection] = React.useState('application');

    React.useEffect(() => {
        const handleScroll = () => {
            const sections = ['application', 'personal', 'family', 'siblings', 'education', 'documents'];

            let currentSection = 'application';

            for (const section of sections) {
                const element = document.getElementById(section);
                if (element) {
                    const rect = element.getBoundingClientRect();
                    if (rect.top <= 250) {
                        currentSection = section;
                    }
                }
            }

            setActiveSection(currentSection);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToSection = (sectionId: string) => {
        const element = document.getElementById(sectionId);
        if (element) {
            const offset = 200;
            const elementPosition = element.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - offset;

            setActiveSection(sectionId);

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth',
            });
        }
    };

    const navItems = [
        { id: 'application', label: 'Application Info', icon: <ClipboardList className="h-5 w-5" /> },
        { id: 'personal', label: 'Personal Info', icon: <User className="h-5 w-5" /> },
        { id: 'family', label: 'Family Background', icon: <Users className="h-5 w-5" /> },
        { id: 'siblings', label: 'Sibling Discount', icon: <UserPlus className="h-5 w-5" /> },
        { id: 'education', label: 'Education', icon: <GraduationCap className="h-5 w-5" /> },
        { id: 'documents', label: 'Documents', icon: <FileText className="h-5 w-5" /> },
    ];

    return (
        <div className="sticky top-0 z-50 mb-4 w-full rounded-lg bg-white shadow-md">
            <div className="flex items-center justify-between overflow-x-auto px-25 py-4">
                {navItems.map((item, index) => (
                    <div key={item.id} className="flex items-center">
                        {/* Step Circle */}
                        <button onClick={() => scrollToSection(item.id)} className={`flex flex-col items-center px-3 text-center transition-colors`}>
                            <div
                                className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                                    activeSection === item.id
                                        ? 'border-[#073066] bg-primary text-white shadow-md'
                                        : 'border-gray-200 bg-white text-gray-400 hover:border-gray-300 hover:text-gray-500'
                                } `}
                            >
                                {item.icon}
                            </div>
                            <span
                                className={`mt-2 text-xs whitespace-nowrap ${
                                    activeSection === item.id ? 'font-semibold text-[#073066]' : 'text-gray-600'
                                }`}
                            >
                                {item.label}
                            </span>
                        </button>

                        {/* Line Between Steps (except last) */}
                        {index < navItems.length - 1 && <div className="mx-2 h-0.5 w-31 bg-gray-300"></div>}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default function AddApplicant() {
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [pendingAction, setPendingAction] = useState<'discard' | 'reset' | null>(null);

    const currentSemester = usePage().props.currentSemester as { name: string | null } | null;

    const form = useForm<ApplicantFormValues>({
        resolver: zodResolver(applicantFormSchema) as any,
        mode: 'onChange',
        defaultValues: {
            //application info
            application_date: new Date().toISOString().split('T')[0],
            school_year: '',
            application_number: '',
            application_status: 'Pending',
            year_level: '',
            semester: currentSemester?.name ?? '',
            strand: '',
            classification: '',
            learning_mode: '',
            accomplished_by_name: '',

            //personal info
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

            //family
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

            //siblings
            siblings: [],

            //education
            schools: [],

            //uploads
            certificate_of_enrollment: null,
            birth_certificate: null,
            latest_report_card_front: null,
            latest_report_card_back: null,
        },
    });

    const handleReset = () => {
        const currentSchoolYear = form.getValues('school_year');
        const currentApplicationDate = form.getValues('application_date');

        form.reset({
            ...form.formState.defaultValues, // or your defaultValues object
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

    const applicationDate = form.watch('application_date');
    const allValues = form.watch();

    const hasChanges = React.useMemo(() => {
        return Object.entries(allValues).some(([key, value]) => {
            if (['application_date', 'school_year', 'application_status'].includes(key)) {
                return false;
            }
            if (Array.isArray(value)) return value.length > 0;
            if (typeof value === 'boolean') return value === true; // Assuming default is false
            if (value instanceof File) return true;
            if (typeof value === 'string') return value.trim() !== '';
            return value !== null && value !== undefined;
        });
    }, [allValues]);

    useEffect(() => {
        if (!applicationDate) return;

        const date = new Date(applicationDate);
        const year = date.getFullYear();

        // Philippine academic year normally starts in August
        // Adjust depending on your actual school rules
        const isBeforeAugust = date.getMonth() + 1 < 8;

        const startYear = isBeforeAugust ? year - 1 : year;
        const endYear = startYear + 1;

        form.setValue('school_year', `${startYear}-${endYear}`);
    }, [applicationDate]);

    // ==================== PSGC ADDRESS STATE ====================
    type PsgcItem = {
        code: string;
        name: string;
    };

    // States for PRESENT address dropdowns
    const [presentRegions, setPresentRegions] = useState<PsgcItem[]>([]);
    const [presentProvinces, setPresentProvinces] = useState<PsgcItem[]>([]);
    const [presentCities, setPresentCities] = useState<PsgcItem[]>([]);
    const [presentBarangays, setPresentBarangays] = useState<PsgcItem[]>([]);

    // Selected values for PRESENT address
    const [selectedPresentRegion, setSelectedPresentRegion] = useState<string>('');
    const [selectedPresentProvince, setSelectedPresentProvince] = useState<string>('');
    const [selectedPresentCity, setSelectedPresentCity] = useState<string>('');

    // States for PERMANENT address dropdowns
    const [permanentRegions, setPermanentRegions] = useState<PsgcItem[]>([]);
    const [permanentProvinces, setPermanentProvinces] = useState<PsgcItem[]>([]);
    const [permanentCities, setPermanentCities] = useState<PsgcItem[]>([]);
    const [permanentBarangays, setPermanentBarangays] = useState<PsgcItem[]>([]);

    // Selected values for PERMANENT address
    const [selectedPermanentRegion, setSelectedPermanentRegion] = useState<string>('');
    const [selectedPermanentProvince, setSelectedPermanentProvince] = useState<string>('');
    const [selectedPermanentCity, setSelectedPermanentCity] = useState<string>('');

    // State to track if addresses should stay synced
    const [isSameAddress, setIsSameAddress] = useState<boolean>(false);

    // ==================== PSGC ADDRESS EFFECTS ====================
    // Load regions on mount
    useEffect(() => {
        axios
            .get<PsgcItem[]>('https://psgc.gitlab.io/api/regions')
            .then((res) => {
                setPresentRegions(res.data);
                setPermanentRegions(res.data);
            })
            .catch(() => toast.error('Failed to load address data.'));
    }, []);

    // Load provinces when PRESENT region changes
    useEffect(() => {
        if (!selectedPresentRegion) return;

        axios
            .get<PsgcItem[]>(`https://psgc.gitlab.io/api/regions/${selectedPresentRegion}/provinces`)
            .then((res) => setPresentProvinces(res.data))
            .catch(() => toast.error('Failed to load address data.'));

        setPresentCities([]);
        setPresentBarangays([]);
        setSelectedPresentProvince('');
        setSelectedPresentCity('');
        form.setValue('present_province', '');
        form.setValue('present_city', '');
        form.setValue('present_brgy', '');
    }, [selectedPresentRegion]);

    // Load cities when PRESENT province changes
    useEffect(() => {
        if (!selectedPresentProvince) return;

        axios
            .get<PsgcItem[]>(`https://psgc.gitlab.io/api/provinces/${selectedPresentProvince}/cities-municipalities`)
            .then((res) => setPresentCities(res.data))
            .catch(() => toast.error('Failed to load address data.'));

        setPresentBarangays([]);
        setSelectedPresentCity('');
        form.setValue('present_city', '');
        form.setValue('present_brgy', '');
    }, [selectedPresentProvince]);

    // Load barangays when PRESENT city changes
    useEffect(() => {
        if (!selectedPresentCity) return;

        axios
            .get<PsgcItem[]>(`https://psgc.gitlab.io/api/cities-municipalities/${selectedPresentCity}/barangays`)
            .then((res) => setPresentBarangays(res.data))
            .catch(() => toast.error('Failed to load address data.'));

        form.setValue('present_brgy', '');
    }, [selectedPresentCity]);

    // Auto-sync present to permanent when checkbox is enabled
    useEffect(() => {
        if (!isSameAddress) return;

        if (presentRegions.length > 0) setPermanentRegions(presentRegions);
        if (presentProvinces.length > 0) setPermanentProvinces(presentProvinces);
        if (presentCities.length > 0) setPermanentCities(presentCities);
        if (presentBarangays.length > 0) setPermanentBarangays(presentBarangays);

        if (selectedPresentRegion !== selectedPermanentRegion) {
            setSelectedPermanentRegion(selectedPresentRegion);
        }
        if (selectedPresentProvince !== selectedPermanentProvince) {
            setSelectedPermanentProvince(selectedPresentProvince);
        }
        if (selectedPresentCity !== selectedPermanentCity) {
            setSelectedPermanentCity(selectedPresentCity);
        }

        const presentStreet = form.getValues('present_street');
        const presentZip = form.getValues('present_zip');
        const presentProvince = form.getValues('present_province');
        const presentCity = form.getValues('present_city');
        const presentBrgy = form.getValues('present_brgy');

        form.setValue('permanent_street', presentStreet || '', { shouldValidate: false, shouldDirty: false });
        form.setValue('permanent_zip', presentZip || '', { shouldValidate: false, shouldDirty: false });
        form.setValue('permanent_province', presentProvince || '', { shouldValidate: false, shouldDirty: false });
        form.setValue('permanent_city', presentCity || '', { shouldValidate: false, shouldDirty: false });
        form.setValue('permanent_brgy', presentBrgy || '', { shouldValidate: false, shouldDirty: false });
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

    // Load provinces when PERMANENT region changes
    useEffect(() => {
        if (isSameAddress) return;
        if (!selectedPermanentRegion) return;

        axios
            .get<PsgcItem[]>(`https://psgc.gitlab.io/api/regions/${selectedPermanentRegion}/provinces`)
            .then((res) => setPermanentProvinces(res.data))
            .catch(() => toast.error('Failed to load address data.'));

        if (!isSameAddress) {
            setPermanentCities([]);
            setPermanentBarangays([]);
            setSelectedPermanentProvince('');
            setSelectedPermanentCity('');
            form.setValue('permanent_province', '');
            form.setValue('permanent_city', '');
            form.setValue('permanent_brgy', '');
        }
    }, [selectedPermanentRegion, isSameAddress]);

    // Load cities when PERMANENT province changes
    useEffect(() => {
        if (isSameAddress) return;
        if (!selectedPermanentProvince) return;

        axios
            .get<PsgcItem[]>(`https://psgc.gitlab.io/api/provinces/${selectedPermanentProvince}/cities-municipalities`)
            .then((res) => setPermanentCities(res.data))
            .catch(() => toast.error('Failed to load address data.'));

        if (!isSameAddress) {
            setPermanentBarangays([]);
            setSelectedPermanentCity('');
            form.setValue('permanent_city', '');
            form.setValue('permanent_brgy', '');
        }
    }, [selectedPermanentProvince, isSameAddress]);

    // Load barangays when PERMANENT city changes
    useEffect(() => {
        if (isSameAddress) return;
        if (!selectedPermanentCity) return;

        axios
            .get<PsgcItem[]>(`https://psgc.gitlab.io/api/cities-municipalities/${selectedPermanentCity}/barangays`)
            .then((res) => setPermanentBarangays(res.data))
            .catch(() => toast.error('Failed to load address data.'));

        if (!isSameAddress) {
            form.setValue('permanent_brgy', '');
        }
    }, [selectedPermanentCity, isSameAddress]);

    async function onSubmit(values: ApplicantFormValues) {
        try {
            const formData = new FormData();

            // Append all regular form fields
            Object.entries(values).forEach(([key, value]) => {
                // Handle special fields that need JSON stringification
                if (key === 'siblings' || key === 'schools') {
                    if (Array.isArray(value) && value.length > 0) {
                        formData.append(key, JSON.stringify(value));
                    }
                    return; // Skip further processing for these fields
                }
                // Handle health_conditions array
                if (key === 'health_conditions') {
                    if (Array.isArray(value) && value.length > 0) {
                        formData.append(key, JSON.stringify(value));
                    } else if (typeof value === 'string' && value) {
                        formData.append(key, value);
                    }
                    return;
                }
                // Handle file uploads
                if (
                    key === 'certificate_of_enrollment' ||
                    key === 'birth_certificate' ||
                    key === 'latest_report_card_front' ||
                    key === 'latest_report_card_back' ||
                    key === 'doctors_note_file'
                ) {
                    if (value instanceof File) {
                        formData.append(key, value);
                    }
                    return;
                }
                // Handle boolean values
                if (typeof value === 'boolean') {
                    formData.append(key, value ? '1' : '0');
                    return;
                }
                // Handle all other fields
                if (value !== null && value !== undefined && value !== '') {
                    formData.append(key, value.toString());
                }
            });

            // Submit form using Inertia
            router.post('/admissions/applicants', formData, {
                forceFormData: true,
                onSuccess: () => {
                    // Redirect to success page
                    router.visit('/applications/success', {
                        replace: true,
                    });
                },
                onError: (errors) => {
                    // Show first error
                    const firstError = Object.values(errors)[0];
                    toast.error(firstError || 'Failed to submit application. Please check the form.');

                    // Set form errors
                    Object.keys(errors).forEach((key) => {
                        form.setError(key as any, {
                            type: 'manual',
                            message: errors[key],
                        });
                    });
                },
            });
        } catch {
            toast.error('An unexpected error occurred. Please try again.');
        }
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{pendingAction === 'discard' ? 'Discard Changes' : 'Reset Form'}</DialogTitle>
                        <DialogDescription>
                            {pendingAction === 'discard'
                                ? 'Are you sure you want to discard changes? All unsaved changes will be lost'
                                : 'Are you sure you want to reset the form? All progress will be lost'}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            className="mr-1 flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                            type="button"
                            variant="outline"
                            onClick={() => {
                                setShowConfirmDialog(false);
                                setPendingAction(null);
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#05509e]"
                            type="button"
                            onClick={handleConfirmAction}
                        >
                            Confirm
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <div className="min-h-screen bg-[#f5f5f5]">
                <div className="sticky top-0 z-50 bg-white shadow-sm">
                    <div className="mx-auto max-w-[1500px] px-10 pt-8 pb-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <button className="rounded-full p-2 transition-colors hover:bg-blue-100" onClick={() => window.history.back()}>
                                    <ArrowLeft className="h-5 w-5" />
                                </button>
                                <div>
                                    <h1 className="text-3xl font-bold text-gray-900">Add New Applicant</h1>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    onClick={() => {
                                        if (hasChanges) {
                                            setPendingAction('discard');
                                            setShowConfirmDialog(true);
                                        } else {
                                            window.history.back();
                                        }
                                    }}
                                    className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                                >
                                    Discard
                                </Button>
                                <Button
                                    type="button"
                                    disabled={!hasChanges}
                                    onClick={() => {
                                        setPendingAction('reset');
                                        setShowConfirmDialog(true);
                                    }}
                                    className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                                >
                                    Reset
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={form.formState.isSubmitting} // --- DISABLE IF NOT AGREED ---
                                    className="bg-primary text-white hover:bg-[#05509e]"
                                >
                                    {form.formState.isSubmitting ? (
                                        <>
                                            <span className="mr-2">
                                                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                                                    <circle
                                                        className="opacity-25"
                                                        cx="12"
                                                        cy="12"
                                                        r="10"
                                                        stroke="currentColor"
                                                        strokeWidth="4"
                                                        fill="none"
                                                    />
                                                    <path
                                                        className="opacity-75"
                                                        fill="currentColor"
                                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                    />
                                                </svg>
                                            </span>
                                            Submitting...
                                        </>
                                    ) : (
                                        'Add Applicant'
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                    <FormNavigation />
                </div>

                <div className="mx-auto max-w-[1500px] px-10 py-8">
                    <div className="flex-1">
                        <Form {...form}>
                            <TooltipProvider>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                    {/* Application Information */}
                                    <div id="application" className="rounded-lg border pb-6 shadow-sm">
                                        <div className="mb-6 rounded-tl-lg rounded-tr-lg bg-[#004c88] bg-linear-to-r p-4">
                                            <h2 className="text-xl font-bold text-white">Application Information</h2>
                                        </div>
                                        <div className="space-y-6 px-4">
                                            <div className="grid grid-cols-3 gap-6">
                                                <FormField
                                                    control={form.control}
                                                    name="application_date"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <LabelWithTooltip label="Application Date *" tooltip="Select the date of application." />
                                                            <FormControl>
                                                                <Input type="date" {...field} />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />

                                                <FormField
                                                    control={form.control}
                                                    name="school_year"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <LabelWithTooltip label="School Year *" />
                                                            <FormControl>
                                                                <Input {...field} />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name="application_number"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <LabelWithTooltip label="Application Number *" />
                                                            <FormControl>
                                                                <Input {...field} />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                                                <FormField
                                                    control={form.control}
                                                    name="year_level"
                                                    render={({ field }) => {
                                                        return (
                                                            <FormItem>
                                                                <LabelWithTooltip label="Year Level *" tooltip="Choose applicant year level." />
                                                                <Select
                                                                    onValueChange={(value) => {
                                                                        field.onChange(value);
                                                                        // Auto-set strand based on year level
                                                                        const elementaryLevels = [
                                                                            'Kindergarten',
                                                                            'Grade 1',
                                                                            'Grade 2',
                                                                            'Grade 3',
                                                                            'Grade 4',
                                                                            'Grade 5',
                                                                            'Grade 6',
                                                                        ];
                                                                        const juniorHighLevels = ['Grade 7', 'Grade 8', 'Grade 9', 'Grade 10'];

                                                                        if (elementaryLevels.includes(value)) {
                                                                            form.setValue('strand', 'Laboratory Elementary School');
                                                                        } else if (juniorHighLevels.includes(value)) {
                                                                            form.setValue('strand', 'Laboratory Junior High School');
                                                                        } else {
                                                                            // For Grade 11 and 12, clear the strand so user can choose
                                                                            form.setValue('strand', '');
                                                                        }
                                                                    }}
                                                                    value={field.value}
                                                                >
                                                                    <FormControl>
                                                                        <SelectTrigger>
                                                                            <SelectValue placeholder="Select year level" />
                                                                        </SelectTrigger>
                                                                    </FormControl>
                                                                    <SelectContent>
                                                                        <SelectGroup>
                                                                            <SelectLabel>Elementary (LES)</SelectLabel>
                                                                            <SelectItem value="Kindergarten">Kindergarten</SelectItem>
                                                                            <SelectItem value="Grade 1">Grade 1</SelectItem>
                                                                            <SelectItem value="Grade 2">Grade 2</SelectItem>
                                                                            <SelectItem value="Grade 3">Grade 3</SelectItem>
                                                                            <SelectItem value="Grade 4">Grade 4</SelectItem>
                                                                            <SelectItem value="Grade 5">Grade 5</SelectItem>
                                                                            <SelectItem value="Grade 6">Grade 6</SelectItem>
                                                                        </SelectGroup>
                                                                        <SelectGroup>
                                                                            <SelectLabel>Junior High School</SelectLabel>
                                                                            <SelectItem value="Grade 7">Grade 7</SelectItem>
                                                                            <SelectItem value="Grade 8">Grade 8</SelectItem>
                                                                            <SelectItem value="Grade 9">Grade 9</SelectItem>
                                                                            <SelectItem value="Grade 10">Grade 10</SelectItem>
                                                                        </SelectGroup>
                                                                        <SelectGroup>
                                                                            <SelectLabel>Senior High School</SelectLabel>
                                                                            <SelectItem value="Grade 11">Grade 11</SelectItem>
                                                                            <SelectItem value="Grade 12">Grade 12</SelectItem>
                                                                        </SelectGroup>
                                                                    </SelectContent>
                                                                </Select>
                                                                <FormMessage />
                                                            </FormItem>
                                                        );
                                                    }}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name="semester"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <LabelWithTooltip label="Semester *" tooltip="Choose semester." />
                                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                                <FormControl>
                                                                    <SelectTrigger>
                                                                        <SelectValue placeholder="Select" />
                                                                    </SelectTrigger>
                                                                </FormControl>
                                                                <SelectContent>
                                                                    <SelectItem value="First Semester">First Semester</SelectItem>
                                                                    <SelectItem value="Second Semester">Second Semester</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name="classification"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <LabelWithTooltip label="Entry Classification *" tooltip="Choose entry classification." />
                                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                                <FormControl>
                                                                    <SelectTrigger>
                                                                        <SelectValue placeholder="Select" />
                                                                    </SelectTrigger>
                                                                </FormControl>
                                                                <SelectContent>
                                                                    <SelectItem value="Freshman">New Applicant</SelectItem>
                                                                    <SelectItem value="Transferee">Transferee</SelectItem>
                                                                    <SelectItem value="Returnee">Returnee</SelectItem>
                                                                    <SelectItem value="Old Student">Old Student</SelectItem>
                                                                    <SelectItem value="Non Credit">Non Credit</SelectItem>
                                                                    <SelectItem value="Shifter">Shifter</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>

                                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                                <FormField
                                                    control={form.control}
                                                    name="strand"
                                                    render={({ field }) => {
                                                        return (
                                                            <FormItem>
                                                                <LabelWithTooltip
                                                                    label="Program/Strand"
                                                                    tooltip="Select preferred academic program or strand of the applicant."
                                                                />
                                                                <Select onValueChange={field.onChange} value={field.value}>
                                                                    <FormControl>
                                                                        <SelectTrigger>
                                                                            <SelectValue placeholder="Select a program" />
                                                                        </SelectTrigger>
                                                                    </FormControl>
                                                                    <SelectContent>
                                                                        <SelectItem value="Laboratory Elementary School">
                                                                            Laboratory Elementary School
                                                                        </SelectItem>
                                                                        <SelectItem value="Laboratory Junior High School">
                                                                            Laboratory Junior High School
                                                                        </SelectItem>

                                                                        <SelectItem value="Accountancy, Business, and Management">
                                                                            ABM - Accountancy, Business, and Management
                                                                        </SelectItem>
                                                                        <SelectItem value="Humanities and Social Sciences">
                                                                            HUMSS - Humanities and Social Sciences
                                                                        </SelectItem>
                                                                        <SelectItem value="Science, Technology, Engineering, and Mathematics">
                                                                            STEM - Science, Technology, Engineering, and Mathematics
                                                                        </SelectItem>
                                                                        <SelectItem value="General Academics">
                                                                            GAS - General Academic Strand
                                                                        </SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                                <FormMessage />
                                                            </FormItem>
                                                        );
                                                    }}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name="learning_mode"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <LabelWithTooltip label="Learning Mode" tooltip="Choose learning mode." />
                                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                                <FormControl>
                                                                    <SelectTrigger>
                                                                        <SelectValue placeholder="Select" />
                                                                    </SelectTrigger>
                                                                </FormControl>
                                                                <SelectContent>
                                                                    <SelectItem value="Face-to-Face">Face-to-Face</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    {/* Personal Information */}
                                    <div id="personal" className="rounded-lg border pb-6 shadow-sm">
                                        <div className="mb-6 rounded-tl-lg rounded-tr-lg bg-[#004c88] bg-linear-to-r p-4">
                                            <h2 className="text-xl font-bold text-white">Personal Information</h2>
                                        </div>
                                        <div className="px-4">
                                            <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-[1fr_1fr_1fr_auto]">
                                                <FormField
                                                    control={form.control}
                                                    name="last_name"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <LabelWithTooltip label="Last Name *" />
                                                            <FormControl>
                                                                <Input placeholder="Last Name" {...field} />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name="first_name"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <LabelWithTooltip label="First Name *" />
                                                            <FormControl>
                                                                <Input placeholder="First Name" {...field} />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name="middle_name"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <LabelWithTooltip label="Middle Name *" />
                                                            <FormControl>
                                                                <Input placeholder="Middle Name" {...field} />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />

                                                <FormField
                                                    control={form.control}
                                                    name="suffix"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <LabelWithTooltip label="Suffix" tooltip="Optional — e.g., Jr., Sr., III." />
                                                            <FormControl>
                                                                <Input placeholder="Jr., III" {...field} />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                            <div className="mt-6 grid grid-cols-1 gap-6">
                                                <FormField
                                                    control={form.control}
                                                    name="learner_reference_number"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <LabelWithTooltip label="LRN" tooltip="Enter applicant Learner Reference Number." />
                                                            <FormControl>
                                                                <Input placeholder="Learner Reference Number" {...field} />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>

                                            <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
                                                <FormField
                                                    control={form.control}
                                                    name="gender"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <LabelWithTooltip label="Gender *" />
                                                            <FormControl>
                                                                <Select onValueChange={field.onChange} value={field.value}>
                                                                    <SelectTrigger>
                                                                        <SelectValue placeholder="Select gender" />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="Male">Male</SelectItem>
                                                                        <SelectItem value="Female">Female</SelectItem>
                                                                        <SelectItem value="Other">Other</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name="citizenship"
                                                    render={({ field }) => (
                                                        <FormItem className="flex flex-col">
                                                            <LabelWithTooltip
                                                                label="Citizenship *"
                                                                tooltip="Enter applicant's citizenship (e.g., Filipino)."
                                                            />
                                                            <CitizenshipSelect
                                                                value={field.value}
                                                                onChange={field.onChange}
                                                                placeholder="Select citizenship"
                                                            />
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name="religion"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <LabelWithTooltip label="Religion" />
                                                            <FormControl>
                                                                <Input placeholder="Roman Catholic" {...field} />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                            <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
                                                <FormField
                                                    control={form.control}
                                                    name="date_of_birth"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <LabelWithTooltip label="Date of Birth *" tooltip="Set applicant's date of birth." />
                                                            <FormControl>
                                                                <input
                                                                    type="date"
                                                                    {...field}
                                                                    className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm"
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />

                                                <FormField
                                                    control={form.control}
                                                    name="place_of_birth"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <LabelWithTooltip label="Place of Birth" />
                                                            <FormControl>
                                                                <Input placeholder="e.g. Baguio City, Benguet" {...field} />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name="mobile_number"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <LabelWithTooltip label="Phone Number *" tooltip="Enter applicant's phone number." />
                                                            <FormControl>
                                                                <Input placeholder="" {...field} />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                            <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
                                                <FormField
                                                    control={form.control}
                                                    name="email"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <LabelWithTooltip label="Email Address *" tooltip="Enter your email." />
                                                            <FormControl>
                                                                <Input placeholder="" {...field} />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name="alt_email"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <LabelWithTooltip
                                                                label="Alternate email Address *"
                                                                tooltip="Enter your alternate email."
                                                            />
                                                            <FormControl>
                                                                <Input placeholder="" {...field} />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>

                                            {/* --- Present Address Section --- */}
                                            <div className="mt-6">
                                                <h2 className="text-l font-bold text-gray-900">Present Address</h2>

                                                <div className="mt-4 grid grid-cols-1 gap-6 px-4 md:grid-cols-3">
                                                    {/* Region */}
                                                    <div>
                                                        <LabelWithTooltip label="Region *" tooltip="Select your region." />
                                                        <div className="mt-2">
                                                            <SearchableSelect
                                                                value={selectedPresentRegion}
                                                                onChange={setSelectedPresentRegion}
                                                                options={(presentRegions ?? []).map((r) => ({
                                                                    label: r.name,
                                                                    value: r.code,
                                                                }))}
                                                                placeholder="Select Region"
                                                                searchPlaceholder="Search region..."
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Province */}
                                                    <FormField
                                                        control={form.control}
                                                        name="present_province"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <LabelWithTooltip label="Province/State *" tooltip="Specify province or state." />
                                                                <SearchableSelect
                                                                    value={selectedPresentProvince}
                                                                    onChange={(value) => {
                                                                        setSelectedPresentProvince(value);
                                                                        const selected = presentProvinces.find((p) => p.code === value);
                                                                        field.onChange(selected?.name || '');
                                                                    }}
                                                                    options={presentProvinces.map((p) => ({ label: p.name, value: p.code }))}
                                                                    placeholder="Select Province"
                                                                    searchPlaceholder="Search province..."
                                                                    disabled={!selectedPresentRegion}
                                                                />
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />

                                                    {/* City/Municipality */}
                                                    <FormField
                                                        control={form.control}
                                                        name="present_city"
                                                        render={({ field }) => (
                                                            <FormItem className="flex flex-col">
                                                                <LabelWithTooltip
                                                                    label="City/Municipality *"
                                                                    tooltip="Enter city or municipality of residence."
                                                                />
                                                                <SearchableSelect
                                                                    value={selectedPresentCity}
                                                                    onChange={(value) => {
                                                                        setSelectedPresentCity(value);
                                                                        const selected = presentCities.find((c) => c.code === value);
                                                                        field.onChange(selected?.name || '');
                                                                    }}
                                                                    options={presentCities.map((c) => ({ label: c.name, value: c.code }))}
                                                                    placeholder="Select City/Municipality"
                                                                    searchPlaceholder="Search city..."
                                                                    disabled={!selectedPresentProvince}
                                                                />
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                </div>

                                                <div className="mt-4 grid grid-cols-1 gap-6 px-4 md:grid-cols-3">
                                                    {/* Barangay */}
                                                    <FormField
                                                        control={form.control}
                                                        name="present_brgy"
                                                        render={({ field }) => (
                                                            <FormItem className="flex flex-col">
                                                                <LabelWithTooltip label="Barangay *" tooltip="Include barangay." />
                                                                <SearchableSelect
                                                                    value={presentBarangays.find((b) => b.name === field.value)?.code || ''}
                                                                    onChange={(value) => {
                                                                        const selected = presentBarangays.find((b) => b.code === value);
                                                                        field.onChange(selected?.name || '');
                                                                    }}
                                                                    options={presentBarangays.map((b) => ({ label: b.name, value: b.code }))}
                                                                    placeholder="Select Barangay"
                                                                    searchPlaceholder="Search barangay..."
                                                                    disabled={!selectedPresentCity}
                                                                />
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />

                                                    {/* Street Address */}
                                                    <FormField
                                                        control={form.control}
                                                        name="present_street"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <LabelWithTooltip
                                                                    label="Street Address"
                                                                    tooltip="Include house number, street name."
                                                                />
                                                                <FormControl>
                                                                    <Input placeholder="123 Main Street" {...field} />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />

                                                    {/* ZIP Code */}
                                                    <FormField
                                                        control={form.control}
                                                        name="present_zip"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <LabelWithTooltip
                                                                    label="ZIP Code *"
                                                                    tooltip="Enter your 4-6 digit postal ZIP code."
                                                                />
                                                                <FormControl>
                                                                    <Input type="text" inputMode="numeric" placeholder="2600" {...field} />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                </div>

                                                {/* Checkbox to copy address */}
                                                <div className="mt-4 flex items-center space-x-2 px-4">
                                                    <Checkbox
                                                        checked={isSameAddress}
                                                        onCheckedChange={(checked) => {
                                                            const isChecked = checked === true;
                                                            setIsSameAddress(isChecked);
                                                            if (!isChecked) {
                                                                // Clear permanent fields when unchecked
                                                                setSelectedPermanentRegion('');
                                                                setSelectedPermanentProvince('');
                                                                setSelectedPermanentCity('');
                                                                setPermanentProvinces([]);
                                                                setPermanentCities([]);
                                                                setPermanentBarangays([]);
                                                                form.setValue('permanent_street', '');
                                                                form.setValue('permanent_brgy', '');
                                                                form.setValue('permanent_city', '');
                                                                form.setValue('permanent_province', '');
                                                                form.setValue('permanent_zip', '');
                                                            }
                                                        }}
                                                    />
                                                    <label className="text-sm text-gray-700">Same as present address</label>
                                                </div>
                                            </div>

                                            {/* --- Permanent Address Section --- */}
                                            <div className="mt-4">
                                                <h2 className="text-l font-bold text-gray-900">Permanent Address</h2>

                                                <div className="mt-4 grid grid-cols-1 gap-6 px-4 md:grid-cols-3">
                                                    {/* Region */}
                                                    <div>
                                                        <LabelWithTooltip label="Region *" tooltip="Select your region." />
                                                        <div className="mt-2">
                                                            <SearchableSelect
                                                                value={selectedPermanentRegion}
                                                                onChange={setSelectedPermanentRegion}
                                                                options={(permanentRegions ?? []).map((r) => ({
                                                                    label: r.name,
                                                                    value: r.code,
                                                                }))}
                                                                placeholder="Select Region"
                                                                searchPlaceholder="Search region..."
                                                                disabled={isSameAddress}
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Province */}
                                                    <FormField
                                                        control={form.control}
                                                        name="permanent_province"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <LabelWithTooltip label="Province/State *" tooltip="Specify province or state." />
                                                                <SearchableSelect
                                                                    value={selectedPermanentProvince}
                                                                    onChange={(value) => {
                                                                        setSelectedPermanentProvince(value);
                                                                        const selected = permanentProvinces.find((p) => p.code === value);
                                                                        field.onChange(selected?.name || '');
                                                                    }}
                                                                    options={permanentProvinces.map((p) => ({ label: p.name, value: p.code }))}
                                                                    placeholder="Select Province"
                                                                    searchPlaceholder="Search province..."
                                                                    disabled={isSameAddress || !selectedPermanentRegion}
                                                                />
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />

                                                    {/* City/Municipality */}
                                                    <FormField
                                                        control={form.control}
                                                        name="permanent_city"
                                                        render={({ field }) => (
                                                            <FormItem className="flex flex-col">
                                                                <LabelWithTooltip
                                                                    label="City/Municipality *"
                                                                    tooltip="Enter city or municipality of residence."
                                                                />
                                                                <SearchableSelect
                                                                    value={selectedPermanentCity}
                                                                    onChange={(value) => {
                                                                        setSelectedPermanentCity(value);
                                                                        const selected = permanentCities.find((c) => c.code === value);
                                                                        field.onChange(selected?.name || '');
                                                                    }}
                                                                    options={permanentCities.map((c) => ({ label: c.name, value: c.code }))}
                                                                    placeholder="Select City/Municipality"
                                                                    searchPlaceholder="Search city..."
                                                                    disabled={isSameAddress || !selectedPermanentProvince}
                                                                />
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                </div>

                                                <div className="mt-4 grid grid-cols-1 gap-6 px-4 md:grid-cols-3">
                                                    {/* Barangay */}
                                                    <FormField
                                                        control={form.control}
                                                        name="permanent_brgy"
                                                        render={({ field }) => (
                                                            <FormItem className="flex flex-col">
                                                                <LabelWithTooltip label="Barangay *" tooltip="Include barangay." />
                                                                <SearchableSelect
                                                                    value={permanentBarangays.find((b) => b.name === field.value)?.code || ''}
                                                                    onChange={(value) => {
                                                                        const selected = permanentBarangays.find((b) => b.code === value);
                                                                        field.onChange(selected?.name || '');
                                                                    }}
                                                                    options={permanentBarangays.map((b) => ({ label: b.name, value: b.code }))}
                                                                    placeholder="Select Barangay"
                                                                    searchPlaceholder="Search barangay..."
                                                                    disabled={isSameAddress || !selectedPermanentCity}
                                                                />
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />

                                                    {/* Street Address */}
                                                    <FormField
                                                        control={form.control}
                                                        name="permanent_street"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <LabelWithTooltip
                                                                    label="Street Address"
                                                                    tooltip="Include house number, street name."
                                                                />
                                                                <FormControl>
                                                                    <Input placeholder="123 Main Street" {...field} disabled={isSameAddress} />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />

                                                    {/* ZIP Code */}
                                                    <FormField
                                                        control={form.control}
                                                        name="permanent_zip"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <LabelWithTooltip
                                                                    label="ZIP Code *"
                                                                    tooltip="Enter your 4-6 digit postal ZIP code."
                                                                />
                                                                <FormControl>
                                                                    <Input
                                                                        type="text"
                                                                        inputMode="numeric"
                                                                        placeholder="2600"
                                                                        {...field}
                                                                        disabled={isSameAddress}
                                                                    />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                </div>
                                            </div>

                                            <div className="mt-8 grid grid-cols-1 gap-6">
                                                <FormField
                                                    control={form.control}
                                                    name="stopped_studying"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <LabelWithTooltip label="Have you ever stopped studying? If yes, give the date and reason/s." />
                                                            <FormControl>
                                                                <Textarea
                                                                    {...field}
                                                                    placeholder=""
                                                                    className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                            <div className="mt-2 grid grid-cols-1 gap-6">
                                                <FormField
                                                    control={form.control}
                                                    name="accelerated"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <LabelWithTooltip label="Have you ever been accelerated in any school? If yes, give the reason/s." />
                                                            <FormControl>
                                                                <Textarea
                                                                    {...field}
                                                                    placeholder=""
                                                                    className="py-1.5m w-full rounded-md border border-input bg-background px-3 shadow-sm placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                            <div className="mt-2 grid grid-cols-1 gap-6">
                                                <FormField
                                                    control={form.control}
                                                    name="health_conditions"
                                                    render={({ field }) => (
                                                        <FormItem className="mt-2">
                                                            <FormLabel>Health Conditions (Tick the box/es if applicable.)</FormLabel>

                                                            <div className="mt-2 grid grid-cols-3 gap-2">
                                                                {[
                                                                    'Sensory Difficulties',
                                                                    'Intellectual Difficulties',
                                                                    'Communication Difficulties',
                                                                    'Autism Spectrum',
                                                                    'ADHD',
                                                                    'Physical And Motor Difficulties',
                                                                    'Medical Conditions',
                                                                    'Major Psychological Disorders',
                                                                ].map((option) => (
                                                                    <div key={option} className="flex items-center space-x-2">
                                                                        <Checkbox
                                                                            checked={Array.isArray(field.value) && field.value.includes(option)}
                                                                            onCheckedChange={(checked) => {
                                                                                const currentValue = Array.isArray(field.value) ? field.value : [];
                                                                                if (checked) {
                                                                                    field.onChange([...currentValue, option]);
                                                                                } else {
                                                                                    field.onChange(currentValue.filter((v: string) => v !== option));
                                                                                }
                                                                            }}
                                                                        />
                                                                        <Label className="text-sm font-normal text-gray-700">{option}</Label>
                                                                    </div>
                                                                ))}

                                                                {/* "Others" checkbox */}
                                                                <div className="flex items-center space-x-2">
                                                                    <Checkbox
                                                                        checked={
                                                                            Array.isArray(field.value) &&
                                                                            field.value.some((v) => v.startsWith('Others'))
                                                                        }
                                                                        onCheckedChange={(checked) => {
                                                                            const currentValue = Array.isArray(field.value) ? field.value : [];
                                                                            if (checked) {
                                                                                if (!currentValue.some((v) => v.startsWith('Others'))) {
                                                                                    field.onChange([...currentValue, 'Others:']);
                                                                                }
                                                                            } else {
                                                                                field.onChange(
                                                                                    currentValue.filter((v: string) => !v.startsWith('Others')),
                                                                                );
                                                                            }
                                                                        }}
                                                                    />
                                                                    <Label className="text-sm font-normal text-gray-700">
                                                                        Others (Please specify)
                                                                    </Label>
                                                                </div>
                                                            </div>

                                                            {/* "Others" text box */}
                                                            {Array.isArray(field.value) && field.value.some((v) => v.startsWith('Others')) && (
                                                                <Textarea
                                                                    className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
                                                                    placeholder="Please specify..."
                                                                    value={
                                                                        field.value
                                                                            .find((v: string) => v.startsWith('Others:'))
                                                                            ?.split('Others:')[1]
                                                                            ?.trim() || ''
                                                                    }
                                                                    onChange={(e) => {
                                                                        const otherValue = e.target.value;
                                                                        const currentValue = Array.isArray(field.value)
                                                                            ? field.value.filter((v: string) => !v.startsWith('Others'))
                                                                            : [];
                                                                        field.onChange([...currentValue, `Others: ${otherValue}`]);
                                                                    }}
                                                                />
                                                            )}

                                                            {/* Doctor's Note Checkbox - Shows when ANY health condition is checked */}
                                                            {Array.isArray(field.value) && field.value.length > 0 && (
                                                                <div className="mt-2 pt-2">
                                                                    <FormField
                                                                        control={form.control}
                                                                        name="has_doctors_note"
                                                                        render={({ field: noteField }) => (
                                                                            <FormItem className="mt-5">
                                                                                <div className="flex flex-row items-start space-y-0 space-x-3">
                                                                                    <FormControl>
                                                                                        <Checkbox
                                                                                            checked={noteField.value}
                                                                                            onCheckedChange={(checked) => {
                                                                                                noteField.onChange(checked === true);
                                                                                                if (!checked) {
                                                                                                    form.setValue('doctors_note_file', null);
                                                                                                }
                                                                                            }}
                                                                                            className="data-[state=checked]:border-blue-500 data-[state=checked]:bg-blue-500 data-[state=checked]:text-white"
                                                                                        />
                                                                                    </FormControl>
                                                                                    <div className="space-y-1 leading-none">
                                                                                        <Label className="text-sm font-normal text-gray-700">
                                                                                            With a physician's recommendation certifying that the
                                                                                            student is fit to attend school, along with a medical
                                                                                            certificate issued within the last two years.
                                                                                        </Label>
                                                                                    </div>
                                                                                </div>
                                                                            </FormItem>
                                                                        )}
                                                                    />

                                                                    {/* File Upload - Shows when "With doctor's note" is checked */}
                                                                    {form.watch('has_doctors_note') && (
                                                                        <FormField
                                                                            control={form.control}
                                                                            name="doctors_note_file"
                                                                            render={({ field }) => (
                                                                                <FormItem className="mt-2">
                                                                                    <FormControl>
                                                                                        <FileUpload
                                                                                            value={field.value}
                                                                                            onChange={field.onChange}
                                                                                            accept=".pdf,.jpg,.jpeg,.png"
                                                                                            description="PDF, JPG, JPEG, PNG (Optional)"
                                                                                        />
                                                                                    </FormControl>
                                                                                    <FormMessage />
                                                                                </FormItem>
                                                                            )}
                                                                        />
                                                                    )}
                                                                </div>
                                                            )}

                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    {/* Family Background */}
                                    <div id="family" className="rounded-lg border pb-6 shadow-sm">
                                        <div className="mb-6 rounded-tl-lg rounded-tr-lg bg-[#004c88] bg-linear-to-r p-4">
                                            <h2 className="text-xl font-bold text-white">Family Background</h2>
                                        </div>

                                        <div className="px-4">
                                            <div className="mt-6">
                                                <h2 className="text-l font-bold text-gray-900">Father's Details *</h2>
                                                <div className="mt-4 grid grid-cols-1 gap-6 px-4 md:grid-cols-4">
                                                    <FormField
                                                        control={form.control}
                                                        name="father_lname"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <LabelWithTooltip label="Father's Last Name" tooltip="" />
                                                                <FormControl>
                                                                    <Input placeholder="" {...field} />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField
                                                        control={form.control}
                                                        name="father_fname"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <LabelWithTooltip label="Father's First Name" tooltip="" />
                                                                <FormControl>
                                                                    <Input placeholder="" {...field} />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField
                                                        control={form.control}
                                                        name="father_mname"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <LabelWithTooltip label="Father's Middle Name" tooltip="" />
                                                                <FormControl>
                                                                    <Input placeholder="" {...field} />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField
                                                        control={form.control}
                                                        name="father_living"
                                                        render={({ field }) => (
                                                            <FormItem className="flex h-full flex-col justify-center">
                                                                <LabelWithTooltip label="Father's Status" tooltip="" />
                                                                <FormControl>
                                                                    <RadioGroup className="flex flex-row gap-4" value={field.value || ''} onValueChange={(value) => field.onChange(value)}>
                                                                        <div className="flex items-center gap-2">
                                                                            <RadioGroupItem value="Living" id={`${field.name}-living`} />
                                                                            <label htmlFor={`${field.name}-living`} className="text-sm">Living</label>
                                                                        </div>
                                                                        <div className="flex items-center gap-2">
                                                                            <RadioGroupItem value="Deceased" id={`${field.name}-deceased`} />
                                                                            <label htmlFor={`${field.name}-deceased`} className="text-sm">Deceased</label>
                                                                        </div>
                                                                    </RadioGroup>
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                </div>
                                                <div className="mt-4 grid grid-cols-1 gap-6 px-4 md:grid-cols-3">
                                                    <FormField
                                                        control={form.control}
                                                        name="father_citizenship"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <LabelWithTooltip label="Citizenship" tooltip="" />
                                                                <FormControl>
                                                                    <Input placeholder="" {...field} />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField
                                                        control={form.control}
                                                        name="father_religion"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <LabelWithTooltip label="Religion" tooltip="" />
                                                                <FormControl>
                                                                    <Input placeholder="" {...field} />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField
                                                        control={form.control}
                                                        name="father_highest_educ"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <LabelWithTooltip label="Highest Educational Attainment" tooltip="" />
                                                                <FormControl>
                                                                    <Input placeholder="" {...field} />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                </div>
                                                <div className="mt-4 grid grid-cols-1 gap-6 px-4 md:grid-cols-3">
                                                    <FormField
                                                        control={form.control}
                                                        name="father_occupation"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <LabelWithTooltip label="Occupation" tooltip="" />
                                                                <FormControl>
                                                                    <Input placeholder="" {...field} />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField
                                                        control={form.control}
                                                        name="father_income"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <LabelWithTooltip label="Monthly Income" tooltip="" />
                                                                <FormControl>
                                                                    <Input placeholder="" {...field} />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField
                                                        control={form.control}
                                                        name="father_business_emp"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <LabelWithTooltip label="Business/Employer" tooltip="" />
                                                                <FormControl>
                                                                    <Input placeholder="" {...field} />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                </div>
                                                <div className="mt-4 grid grid-cols-1 gap-6 px-4 md:grid-cols-3">
                                                    <FormField
                                                        control={form.control}
                                                        name="father_business_address"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <LabelWithTooltip label="Business Address" tooltip="" />
                                                                <FormControl>
                                                                    <Input placeholder="" {...field} />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField
                                                        control={form.control}
                                                        name="father_contact_no"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <LabelWithTooltip label="Contact No." tooltip="" />
                                                                <FormControl>
                                                                    <Input placeholder="" {...field} />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField
                                                        control={form.control}
                                                        name="father_email"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <LabelWithTooltip label="Email Address" tooltip="" />
                                                                <FormControl>
                                                                    <Input placeholder="" {...field} />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                </div>
                                                <div className="mt-4 grid grid-cols-1 gap-6 px-4 md:grid-cols-1">
                                                    <FormField
                                                        control={form.control}
                                                        name="father_slu_employee"
                                                        render={({ field }) => (
                                                            <FormItem className="flex h-full flex-col space-y-2">
                                                                <div className="flex items-center space-x-4">
                                                                    <LabelWithTooltip
                                                                        label="Father is an employee of Saint Louis University:"
                                                                        tooltip=""
                                                                    />
                                                                    <FormControl>
                                                                        <RadioGroup className="flex flex-row gap-4" value={field.value === true ? 'true' : field.value === false ? 'false' : ''} onValueChange={(value) => { field.onChange(value === 'true'); }}>
                                                                            <div className="flex items-center gap-2">
                                                                                <RadioGroupItem value="true" id={`${field.name}-yes`} />
                                                                                <label htmlFor={`${field.name}-yes`} className="text-sm">Yes</label>
                                                                            </div>
                                                                            <div className="flex items-center gap-2">
                                                                                <RadioGroupItem value="false" id={`${field.name}-no`} />
                                                                                <label htmlFor={`${field.name}-no`} className="text-sm">No</label>
                                                                            </div>
                                                                        </RadioGroup>
                                                                    </FormControl>
                                                                </div>

                                                                {/* Inline SLU Department field */}
                                                                {field.value === true && (
                                                                    <div className="flex items-center space-x-4">
                                                                        <LabelWithTooltip label="SLU Department" tooltip="Specify the department." />
                                                                        <FormControl className="flex-1">
                                                                            <Input
                                                                                placeholder="Enter SLU Department"
                                                                                {...form.register('father_slu_dept')}
                                                                            />
                                                                        </FormControl>
                                                                        <FormMessage />
                                                                    </div>
                                                                )}
                                                            </FormItem>
                                                        )}
                                                    />
                                                </div>
                                            </div>
                                            <div className="mt-6">
                                                <h2 className="text-l font-bold text-gray-900">Mother's Details *</h2>
                                                <div className="mt-4 grid grid-cols-1 gap-6 px-4 md:grid-cols-4">
                                                    <FormField
                                                        control={form.control}
                                                        name="mother_lname"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <LabelWithTooltip label="Mother's Last Name" tooltip="" />
                                                                <FormControl>
                                                                    <Input placeholder="" {...field} />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField
                                                        control={form.control}
                                                        name="mother_fname"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <LabelWithTooltip label="Mother's First Name" tooltip="" />
                                                                <FormControl>
                                                                    <Input placeholder="" {...field} />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField
                                                        control={form.control}
                                                        name="mother_mname"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <LabelWithTooltip label="Mother's Middle Name" tooltip="" />
                                                                <FormControl>
                                                                    <Input placeholder="" {...field} />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField
                                                        control={form.control}
                                                        name="mother_living"
                                                        render={({ field }) => (
                                                            <FormItem className="flex h-full flex-col justify-center">
                                                                <LabelWithTooltip label="Mother's Status" tooltip="" />
                                                                <FormControl>
                                                                    <RadioGroup className="flex flex-row gap-4" value={field.value || ''} onValueChange={(value) => field.onChange(value)}>
                                                                        <div className="flex items-center gap-2">
                                                                            <RadioGroupItem value="Living" id={`${field.name}-living`} />
                                                                            <label htmlFor={`${field.name}-living`} className="text-sm">Living</label>
                                                                        </div>
                                                                        <div className="flex items-center gap-2">
                                                                            <RadioGroupItem value="Deceased" id={`${field.name}-deceased`} />
                                                                            <label htmlFor={`${field.name}-deceased`} className="text-sm">Deceased</label>
                                                                        </div>
                                                                    </RadioGroup>
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                </div>
                                                <div className="mt-4 grid grid-cols-1 gap-6 px-4 md:grid-cols-3">
                                                    <FormField
                                                        control={form.control}
                                                        name="mother_citizenship"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <LabelWithTooltip label="Citizenship" tooltip="" />
                                                                <FormControl>
                                                                    <Input placeholder="" {...field} />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField
                                                        control={form.control}
                                                        name="mother_religion"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <LabelWithTooltip label="Religion" tooltip="" />
                                                                <FormControl>
                                                                    <Input placeholder="" {...field} />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField
                                                        control={form.control}
                                                        name="mother_highest_educ"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <LabelWithTooltip label="Highest Educational Attainment" tooltip="" />
                                                                <FormControl>
                                                                    <Input placeholder="" {...field} />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                </div>
                                                <div className="mt-4 grid grid-cols-1 gap-6 px-4 md:grid-cols-3">
                                                    <FormField
                                                        control={form.control}
                                                        name="mother_occupation"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <LabelWithTooltip label="Occupation" tooltip="" />
                                                                <FormControl>
                                                                    <Input placeholder="" {...field} />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField
                                                        control={form.control}
                                                        name="mother_income"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <LabelWithTooltip label="Monthly Income" tooltip="" />
                                                                <FormControl>
                                                                    <Input placeholder="" {...field} />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField
                                                        control={form.control}
                                                        name="mother_business_emp"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <LabelWithTooltip label="Business/Employer" tooltip="" />
                                                                <FormControl>
                                                                    <Input placeholder="" {...field} />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                </div>
                                                <div className="mt-4 grid grid-cols-1 gap-6 px-4 md:grid-cols-3">
                                                    <FormField
                                                        control={form.control}
                                                        name="mother_business_address"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <LabelWithTooltip label="Business Address" tooltip="" />
                                                                <FormControl>
                                                                    <Input placeholder="" {...field} />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField
                                                        control={form.control}
                                                        name="mother_contact_no"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <LabelWithTooltip label="Contact No." tooltip="" />
                                                                <FormControl>
                                                                    <Input placeholder="" {...field} />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField
                                                        control={form.control}
                                                        name="mother_email"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <LabelWithTooltip label="Email Address" tooltip="" />
                                                                <FormControl>
                                                                    <Input placeholder="" {...field} />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                </div>
                                                <div className="mt-4 grid grid-cols-1 gap-6 px-4 md:grid-cols-1">
                                                    <FormField
                                                        control={form.control}
                                                        name="mother_slu_employee"
                                                        render={({ field }) => (
                                                            <FormItem className="flex h-full flex-col space-y-2">
                                                                <div className="flex items-center space-x-4">
                                                                    <LabelWithTooltip
                                                                        label="Mother is an employee of Saint Louis University:"
                                                                        tooltip=""
                                                                    />
                                                                    <FormControl>
                                                                        <RadioGroup className="flex flex-row gap-4" value={field.value === true ? 'true' : field.value === false ? 'false' : ''} onValueChange={(value) => { field.onChange(value === 'true'); }}>
                                                                            <div className="flex items-center gap-2">
                                                                                <RadioGroupItem value="true" id={`${field.name}-yes`} />
                                                                                <label htmlFor={`${field.name}-yes`} className="text-sm">Yes</label>
                                                                            </div>
                                                                            <div className="flex items-center gap-2">
                                                                                <RadioGroupItem value="false" id={`${field.name}-no`} />
                                                                                <label htmlFor={`${field.name}-no`} className="text-sm">No</label>
                                                                            </div>
                                                                        </RadioGroup>
                                                                    </FormControl>
                                                                </div>

                                                                {/* Inline SLU Department field */}
                                                                {field.value === true && (
                                                                    <div className="flex items-center space-x-4">
                                                                        <LabelWithTooltip label="SLU Department" tooltip="Specify the department." />
                                                                        <FormControl className="flex-1">
                                                                            <Input
                                                                                placeholder="Enter SLU Department"
                                                                                {...form.register('mother_slu_dept')}
                                                                            />
                                                                        </FormControl>
                                                                        <FormMessage />
                                                                    </div>
                                                                )}
                                                            </FormItem>
                                                        )}
                                                    />
                                                </div>
                                            </div>
                                            <div className="mt-6">
                                                <h2 className="text-l font-bold text-gray-900">Guardian's Details *</h2>
                                                {/* Auto-fill checkboxes */}
                                                <div className="mt-4 flex gap-6 px-4">
                                                    <div className="flex items-center space-x-2">
                                                        <Checkbox
                                                            onCheckedChange={(checked) => {
                                                                if (checked) {
                                                                    // Copy father's info to guardian fields
                                                                    form.setValue('guardian_lname', form.getValues('father_lname'));
                                                                    form.setValue('guardian_fname', form.getValues('father_fname'));
                                                                    form.setValue('guardian_mname', form.getValues('father_mname'));
                                                                    form.setValue('guardian_citizenship', form.getValues('father_citizenship') || '');
                                                                    form.setValue('guardian_religion', form.getValues('father_religion') || '');
                                                                    form.setValue(
                                                                        'guardian_highest_educ',
                                                                        form.getValues('father_highest_educ') || '',
                                                                    );
                                                                    form.setValue('guardian_occupation', form.getValues('father_occupation') || '');
                                                                    form.setValue('guardian_income', form.getValues('father_income') || '');
                                                                    form.setValue(
                                                                        'guardian_business_emp',
                                                                        form.getValues('father_business_emp') || '',
                                                                    );
                                                                    form.setValue(
                                                                        'guardian_business_address',
                                                                        form.getValues('father_business_address') || '',
                                                                    );
                                                                    form.setValue('guardian_contact_no', form.getValues('father_contact_no') || '');
                                                                    form.setValue('guardian_email', form.getValues('father_email') || '');
                                                                    form.setValue('guardian_slu_employee', form.getValues('father_slu_employee'));
                                                                    form.setValue('guardian_slu_dept', form.getValues('father_slu_dept') || '');
                                                                    form.setValue('guardian_relationship', 'Father');
                                                                }
                                                            }}
                                                        />
                                                        <label className="text-sm text-gray-700">Choose Father as Guardian</label>
                                                    </div>

                                                    <div className="flex items-center space-x-2">
                                                        <Checkbox
                                                            onCheckedChange={(checked) => {
                                                                if (checked) {
                                                                    // Copy mother's info to guardian fields
                                                                    form.setValue('guardian_lname', form.getValues('mother_lname'));
                                                                    form.setValue('guardian_fname', form.getValues('mother_fname'));
                                                                    form.setValue('guardian_mname', form.getValues('mother_mname'));
                                                                    form.setValue('guardian_citizenship', form.getValues('mother_citizenship') || '');
                                                                    form.setValue('guardian_religion', form.getValues('mother_religion') || '');
                                                                    form.setValue(
                                                                        'guardian_highest_educ',
                                                                        form.getValues('mother_highest_educ') || '',
                                                                    );
                                                                    form.setValue('guardian_occupation', form.getValues('mother_occupation') || '');
                                                                    form.setValue('guardian_income', form.getValues('mother_income') || '');
                                                                    form.setValue(
                                                                        'guardian_business_emp',
                                                                        form.getValues('mother_business_emp') || '',
                                                                    );
                                                                    form.setValue(
                                                                        'guardian_business_address',
                                                                        form.getValues('mother_business_address') || '',
                                                                    );
                                                                    form.setValue('guardian_contact_no', form.getValues('mother_contact_no') || '');
                                                                    form.setValue('guardian_email', form.getValues('mother_email') || '');
                                                                    form.setValue('guardian_slu_employee', form.getValues('mother_slu_employee'));
                                                                    form.setValue('guardian_slu_dept', form.getValues('mother_slu_dept') || '');
                                                                    form.setValue('guardian_relationship', 'Mother');
                                                                }
                                                            }}
                                                        />
                                                        <label className="text-sm text-gray-700">Choose Mother as Guardian</label>
                                                    </div>
                                                </div>

                                                <div className="mt-6 grid grid-cols-1 gap-6 px-4 md:grid-cols-4">
                                                    <FormField
                                                        control={form.control}
                                                        name="guardian_lname"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <LabelWithTooltip label="Guardian's Last Name" tooltip="" />
                                                                <FormControl>
                                                                    <Input placeholder="" {...field} />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField
                                                        control={form.control}
                                                        name="guardian_fname"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <LabelWithTooltip label="Guardian's First Name" tooltip="" />
                                                                <FormControl>
                                                                    <Input placeholder="" {...field} />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField
                                                        control={form.control}
                                                        name="guardian_mname"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <LabelWithTooltip label="Guardian's Middle Name" tooltip="" />
                                                                <FormControl>
                                                                    <Input placeholder="" {...field} />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField
                                                        control={form.control}
                                                        name="guardian_relationship"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <LabelWithTooltip label="Relationship with guardian" tooltip="" />
                                                                <FormControl>
                                                                    <Input placeholder="" {...field} />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                </div>
                                                <div className="mt-4 grid grid-cols-1 gap-6 px-4 md:grid-cols-3">
                                                    <FormField
                                                        control={form.control}
                                                        name="guardian_citizenship"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <LabelWithTooltip label="Citizenship" tooltip="" />
                                                                <FormControl>
                                                                    <Input placeholder="" {...field} />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField
                                                        control={form.control}
                                                        name="guardian_religion"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <LabelWithTooltip label="Religion" tooltip="" />
                                                                <FormControl>
                                                                    <Input placeholder="" {...field} />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField
                                                        control={form.control}
                                                        name="guardian_highest_educ"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <LabelWithTooltip label="Highest Educational Attainment" tooltip="" />
                                                                <FormControl>
                                                                    <Input placeholder="" {...field} />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                </div>
                                                <div className="mt-4 grid grid-cols-1 gap-6 px-4 md:grid-cols-3">
                                                    <FormField
                                                        control={form.control}
                                                        name="guardian_occupation"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <LabelWithTooltip label="Occupation" tooltip="" />
                                                                <FormControl>
                                                                    <Input placeholder="" {...field} />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField
                                                        control={form.control}
                                                        name="guardian_income"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <LabelWithTooltip label="Monthly Income" tooltip="" />
                                                                <FormControl>
                                                                    <Input placeholder="" {...field} />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField
                                                        control={form.control}
                                                        name="guardian_business_emp"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <LabelWithTooltip label="Business/Employer" tooltip="" />
                                                                <FormControl>
                                                                    <Input placeholder="" {...field} />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                </div>
                                                <div className="mt-4 grid grid-cols-1 gap-6 px-4 md:grid-cols-3">
                                                    <FormField
                                                        control={form.control}
                                                        name="guardian_business_address"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <LabelWithTooltip label="Business Address" tooltip="" />
                                                                <FormControl>
                                                                    <Input placeholder="" {...field} />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField
                                                        control={form.control}
                                                        name="guardian_contact_no"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <LabelWithTooltip label="Contact No." tooltip="" />
                                                                <FormControl>
                                                                    <Input placeholder="" {...field} />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField
                                                        control={form.control}
                                                        name="guardian_email"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <LabelWithTooltip label="Email Address" tooltip="" />
                                                                <FormControl>
                                                                    <Input placeholder="" {...field} />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                </div>
                                                <div className="mt-4 grid grid-cols-1 gap-6 px-4 md:grid-cols-1">
                                                    <FormField
                                                        control={form.control}
                                                        name="guardian_slu_employee"
                                                        render={({ field }) => (
                                                            <FormItem className="flex h-full flex-col space-y-2">
                                                                <div className="flex items-center space-x-4">
                                                                    <LabelWithTooltip
                                                                        label="Guardian is an employee of Saint Louis University:"
                                                                        tooltip=""
                                                                    />
                                                                    <FormControl>
                                                                        <RadioGroup className="flex flex-row gap-4" value={field.value === true ? 'true' : field.value === false ? 'false' : ''} onValueChange={(value) => { field.onChange(value === 'true'); }}>
                                                                            <div className="flex items-center gap-2">
                                                                                <RadioGroupItem value="true" id={`${field.name}-yes`} />
                                                                                <label htmlFor={`${field.name}-yes`} className="text-sm">Yes</label>
                                                                            </div>
                                                                            <div className="flex items-center gap-2">
                                                                                <RadioGroupItem value="false" id={`${field.name}-no`} />
                                                                                <label htmlFor={`${field.name}-no`} className="text-sm">No</label>
                                                                            </div>
                                                                        </RadioGroup>
                                                                    </FormControl>
                                                                </div>

                                                                {/* Inline SLU Department field */}
                                                                {field.value === true && (
                                                                    <div className="flex items-center space-x-4">
                                                                        <LabelWithTooltip label="SLU Department" tooltip="Specify the department." />
                                                                        <FormControl className="flex-1">
                                                                            <Input
                                                                                placeholder="Enter SLU Department"
                                                                                {...form.register('guardian_slu_dept')}
                                                                            />
                                                                        </FormControl>
                                                                        <FormMessage />
                                                                    </div>
                                                                )}
                                                            </FormItem>
                                                        )}
                                                    />
                                                </div>
                                            </div>
                                            <div className="mt-6">
                                                <h2 className="text-l font-bold text-gray-900">Emergency Contact Details *</h2>
                                                <div className="mt-4 grid grid-cols-1 gap-6 px-4 md:grid-cols-2">
                                                    <FormField
                                                        control={form.control}
                                                        name="emergency_contact_name"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <LabelWithTooltip label="Contact Person" tooltip="" />
                                                                <FormControl>
                                                                    <Input placeholder="Full Name" {...field} />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField
                                                        control={form.control}
                                                        name="emergency_relationship"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <LabelWithTooltip label="Relationship with the contact." tooltip="" />
                                                                <FormControl>
                                                                    <Input placeholder="" {...field} />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField
                                                        control={form.control}
                                                        name="emergency_mobile_phone"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <LabelWithTooltip label="Phone Number." tooltip="" />
                                                                <FormControl>
                                                                    <Input placeholder="" {...field} />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField
                                                        control={form.control}
                                                        name="emergency_email"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <LabelWithTooltip label="Email Adrress" tooltip="" />
                                                                <FormControl>
                                                                    <Input placeholder="" {...field} />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    {/* Siblings */}
                                    <div id="siblings" className="rounded-lg border pb-6 shadow-sm">
                                        <div className="mb-6 rounded-tl-lg rounded-tr-lg bg-[#004c88] bg-linear-to-r p-4">
                                            <h2 className="text-xl font-bold text-white">Brother/Sister Discount (10%)</h2>
                                        </div>

                                        <div className="px-4">
                                            <div className="mt-4 grid grid-cols-1 gap-6 px-4">
                                                <FormField
                                                    control={form.control}
                                                    name="has_sibling"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            {/* Question + Radio */}
                                                            <div className="mt-1 space-x-4">
                                                                <LabelWithTooltip
                                                                    label="Do you have Brother(s)/Sister(s) currently enrolled or will enroll at Saint Louis University (Basic Ed or College) this Academic Year?"
                                                                    tooltip=""
                                                                />

                                                                <FormControl>
                                                                    <RadioGroup
                                                                        className="mt-2 flex flex-row gap-4 pl-4"
                                                                        value={field.value === true ? 'true' : field.value === false ? 'false' : ''}
                                                                        onValueChange={(value) => {
                                                                            const val = value === 'true'; // convert to boolean
                                                                            field.onChange(val);

                                                                            const siblings = form.getValues('siblings') ?? [];

                                                                            if (val && siblings.length === 0) {
                                                                                form.setValue('siblings', [
                                                                                    {
                                                                                        sibling_full_name: '',
                                                                                        sibling_grade_level: '',
                                                                                        sibling_id_number: '',
                                                                                    },
                                                                                ]);
                                                                            } else if (!val) {
                                                                                form.setValue('siblings', []);
                                                                            }
                                                                        }}
                                                                    >
                                                                        <div className="flex items-center gap-2">
                                                                            <RadioGroupItem value="true" id={`${field.name}-yes`} />
                                                                            <label htmlFor={`${field.name}-yes`} className="text-sm">Yes</label>
                                                                        </div>
                                                                        <div className="flex items-center gap-2">
                                                                            <RadioGroupItem value="false" id={`${field.name}-no`} />
                                                                            <label htmlFor={`${field.name}-no`} className="text-sm">No</label>
                                                                        </div>
                                                                    </RadioGroup>
                                                                </FormControl>
                                                            </div>

                                                            {/* Dynamic Siblings Table */}
                                                            {field.value === true && (
                                                                <div className="mt-4 rounded-lg border p-4 shadow-sm">
                                                                    <LabelWithTooltip
                                                                        label="Siblings Currently Enrolled or Will Enroll"
                                                                        tooltip="Provide the details of each sibling."
                                                                    />

                                                                    <div className="mt-3">
                                                                        {form.watch('siblings')?.map((sibling, index) => (
                                                                            <div
                                                                                key={index}
                                                                                className="mb-2 grid grid-cols-[1fr_1fr_1fr_auto] items-center gap-3"
                                                                            >
                                                                                {/* Grade Level */}
                                                                                <FormControl>
                                                                                    <Input
                                                                                        placeholder="Grade Level"
                                                                                        {...form.register(`siblings.${index}.sibling_grade_level`)}
                                                                                    />
                                                                                </FormControl>

                                                                                {/* Full Name */}
                                                                                <FormControl>
                                                                                    <Input
                                                                                        placeholder="Full Name"
                                                                                        {...form.register(`siblings.${index}.sibling_full_name`)}
                                                                                    />
                                                                                </FormControl>

                                                                                {/* ID Number */}
                                                                                <FormControl>
                                                                                    <Input
                                                                                        placeholder="ID Number"
                                                                                        {...form.register(`siblings.${index}.sibling_id_number`)}
                                                                                    />
                                                                                </FormControl>

                                                                                {/* Remove Button */}
                                                                                <Button
                                                                                    type="button"
                                                                                    variant="ghost"
                                                                                    size="icon"
                                                                                    onClick={() => {
                                                                                        const updated = [...(form.getValues('siblings') ?? [])];
                                                                                        updated.splice(index, 1);
                                                                                        form.setValue('siblings', updated);
                                                                                    }}
                                                                                    className="text-red-500 hover:text-red-700"
                                                                                >
                                                                                    <Trash2 className="h-4 w-4" />
                                                                                </Button>
                                                                            </div>
                                                                        ))}

                                                                        {/* Add Sibling Button */}
                                                                        <Button
                                                                            type="button"
                                                                            variant="outline"
                                                                            size="sm"
                                                                            onClick={() =>
                                                                                form.setValue('siblings', [
                                                                                    ...(form.getValues('siblings') || []),
                                                                                    {
                                                                                        sibling_full_name: '',
                                                                                        sibling_grade_level: '',
                                                                                        sibling_id_number: '',
                                                                                    },
                                                                                ])
                                                                            }
                                                                            className="mt-3"
                                                                        >
                                                                            + Add Sibling
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            )}

                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Educational Background */}
                                    <div id="education" className="rounded-lg border pb-6 shadow-sm">
                                        <div className="mb-6 rounded-tl-lg rounded-tr-lg bg-[#004c88] bg-linear-to-r p-4">
                                            <h2 className="text-xl font-bold text-white">Educational Background</h2>
                                        </div>
                                        <div className="px-4">
                                            <div className="mt-4 grid grid-cols-1 gap-6 px-4 md:grid-cols-1">
                                                <FormField
                                                    control={form.control}
                                                    name="schools"
                                                    render={() => (
                                                        <FormItem>
                                                            <LabelWithTooltip
                                                                label="List of Schools Attended"
                                                                tooltip="Provide all schools attended in chronological order."
                                                            />

                                                            <div className="mt-3 space-y-4">
                                                                {(form.watch('schools') || []).map((school, index) => (
                                                                    <div key={index} className="relative mb-4 rounded-lg border p-4 pr-12 shadow-sm">
                                                                        {/* Row 1: School Name, School Address */}
                                                                        <div className="grid grid-cols-2 gap-3">
                                                                            <FormControl>
                                                                                <Input
                                                                                    placeholder="School Name"
                                                                                    {...form.register(`schools.${index}.school_name`)}
                                                                                />
                                                                            </FormControl>
                                                                            <FormControl>
                                                                                <Input
                                                                                    placeholder="School Address"
                                                                                    {...form.register(`schools.${index}.school_address`)}
                                                                                />
                                                                            </FormControl>
                                                                        </div>

                                                                        {/* Row 2: From Grade, To Grade, From Year, To Year */}
                                                                        <div className="mt-3 grid grid-cols-4 gap-3">
                                                                            <FormControl>
                                                                                <Input
                                                                                    placeholder="From Grade"
                                                                                    {...form.register(`schools.${index}.from_grade`)}
                                                                                />
                                                                            </FormControl>
                                                                            <FormControl>
                                                                                <Input
                                                                                    placeholder="To Grade"
                                                                                    {...form.register(`schools.${index}.to_grade`)}
                                                                                />
                                                                            </FormControl>
                                                                            <FormControl>
                                                                                <Input
                                                                                    placeholder="From Year"
                                                                                    {...form.register(`schools.${index}.from_year`)}
                                                                                />
                                                                            </FormControl>
                                                                            <FormControl>
                                                                                <Input
                                                                                    placeholder="To Year"
                                                                                    {...form.register(`schools.${index}.to_year`)}
                                                                                />
                                                                            </FormControl>
                                                                        </div>

                                                                        {/* Row 3: Honors, Average, Rank, Size */}
                                                                        <div className="mt-3 grid grid-cols-4 gap-3">
                                                                            <FormControl>
                                                                                <Input
                                                                                    placeholder="Honors and Awards"
                                                                                    {...form.register(`schools.${index}.honors_awards`)}
                                                                                />
                                                                            </FormControl>
                                                                            <FormControl>
                                                                                <Input
                                                                                    placeholder="General Average"
                                                                                    {...form.register(`schools.${index}.general_average`)}
                                                                                />
                                                                            </FormControl>
                                                                            <FormControl>
                                                                                <Input
                                                                                    placeholder="Class Rank"
                                                                                    {...form.register(`schools.${index}.class_rank`)}
                                                                                />
                                                                            </FormControl>
                                                                            <FormControl>
                                                                                <Input
                                                                                    placeholder="Class Size"
                                                                                    {...form.register(`schools.${index}.class_size`)}
                                                                                />
                                                                            </FormControl>
                                                                        </div>

                                                                        {/* Remove Button (right side, vertically centered) */}
                                                                        <Button
                                                                            type="button"
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            onClick={() => {
                                                                                const updated = [...(form.getValues('schools') || [])];
                                                                                updated.splice(index, 1);
                                                                                form.setValue('schools', updated);
                                                                            }}
                                                                            className="absolute top-1/2 right-2 -translate-y-1/2 text-red-500 hover:text-red-700"
                                                                        >
                                                                            <Trash2 className="h-5 w-5" />
                                                                        </Button>
                                                                    </div>
                                                                ))}

                                                                {/* Add New School */}
                                                                <Button
                                                                    type="button"
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() =>
                                                                        form.setValue('schools', [
                                                                            ...(form.getValues('schools') || []),
                                                                            {
                                                                                school_name: '',
                                                                                school_address: '',
                                                                                from_grade: '',
                                                                                to_grade: '',
                                                                                from_year: '',
                                                                                to_year: '',
                                                                                honors_awards: '',
                                                                                general_average: '',
                                                                                class_rank: '',
                                                                                class_size: '',
                                                                            },
                                                                        ])
                                                                    }
                                                                    className="mt-3"
                                                                >
                                                                    + Add School
                                                                </Button>
                                                            </div>
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Documents Section */}
                                    <div id="documents" className="rounded-lg border pb-6 shadow-sm">
                                        <div className="mb-6 rounded-tl-lg rounded-tr-lg bg-[#004c88] bg-linear-to-r p-4">
                                            <h2 className="text-xl font-bold text-white">Required Documents</h2>
                                        </div>

                                        <div className="px-4">
                                            <div className="mt-4 grid grid-cols-1 gap-6 px-4 md:grid-cols-2">
                                                {/* Certificate of Enrollment */}
                                                <FormField
                                                    control={form.control}
                                                    name="certificate_of_enrollment"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <LabelWithTooltip
                                                                label="Certificate of Enrollment"
                                                                tooltip="Upload your official Certificate of Enrollment."
                                                            />
                                                            <FormControl>
                                                                <FileUpload
                                                                    value={field.value}
                                                                    onChange={field.onChange}
                                                                    accept=".pdf,.jpg,.jpeg,.png"
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />

                                                {/* Birth Certificate */}
                                                <FormField
                                                    control={form.control}
                                                    name="birth_certificate"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <LabelWithTooltip
                                                                label="Birth Certificate"
                                                                tooltip="Upload your PSA or NSO Birth Certificate."
                                                            />
                                                            <FormControl>
                                                                <FileUpload
                                                                    value={field.value}
                                                                    onChange={field.onChange}
                                                                    accept=".pdf,.jpg,.jpeg,.png"
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />

                                                {/* Latest Report Card (Front) */}
                                                <FormField
                                                    control={form.control}
                                                    name="latest_report_card_front"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <LabelWithTooltip
                                                                label="Latest Report Card (Front)"
                                                                tooltip="Upload the front side of your most recent report card."
                                                            />
                                                            <FormControl>
                                                                <FileUpload
                                                                    value={field.value}
                                                                    onChange={field.onChange}
                                                                    accept=".pdf,.jpg,.jpeg,.png"
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />

                                                {/* Latest Report Card (Back) */}
                                                <FormField
                                                    control={form.control}
                                                    name="latest_report_card_back"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <LabelWithTooltip
                                                                label="Latest Report Card (Back)"
                                                                tooltip="Upload the back side of your most recent report card."
                                                            />
                                                            <FormControl>
                                                                <FileUpload
                                                                    value={field.value}
                                                                    onChange={field.onChange}
                                                                    accept=".pdf,.jpg,.jpeg,.png"
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </form>
                            </TooltipProvider>
                        </Form>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
