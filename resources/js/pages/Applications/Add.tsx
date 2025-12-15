import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { zodResolver } from '@hookform/resolvers/zod';
import { Head, router } from '@inertiajs/react';
import { Box, Checkbox, FormControlLabel, Radio, RadioGroup } from '@mui/material';
import TextareaAutosize from '@mui/material/TextareaAutosize';
import { Facebook, HelpCircle, Info, Mail, MapPin, Phone, Trash2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Toaster, toast } from 'sonner';
import { z } from 'zod';

// ✅ Reusable tooltip label component
const LabelWithTooltip = ({ label, tooltip }: { label: string; tooltip?: string }) => {
    return (
        <div className="flex items-center gap-2">
            <FormLabel>{label}</FormLabel>
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

const phoneRegex = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,4}[-\s\.]?[0-9]{1,9}$/;

const applicantFormSchema = z.object({
    // Application info
    application_date: z.string().min(1, { message: 'Application date is required.' }),
    school_year: z.string().min(1, { message: 'Application date is required.' }),
    application_status: z.string().min(1, { message: 'Application status is required.' }),
    year_level: z.string().min(1, { message: 'Please select year level.' }),
    semester: z.string().min(1, { message: 'Please select semester.' }),
    strand: z.string().min(1, { message: 'Please select strand.' }),
    classification: z.string().min(1, { message: 'Please select entry classification.' }),
    learning_mode: z.string().min(1, { message: 'Please select learning mode.' }),
    accomplished_by_name: z.string().optional(),

    //Personal Data
    last_name: z.string().min(2, { message: 'Last name must be at least 2 characters.' }),
    first_name: z.string().min(2, { message: 'First name must be at least 2 characters.' }),
    middle_name: z.string().optional(),
    suffix: z.string().optional(),
    learner_reference_number: z.string().optional(),
    sex: z.string().min(1, { message: 'Gender is required.' }),
    citizenship: z.string().min(2, { message: 'Citizenship is required.' }),
    religion: z.string().min(1, { message: 'Religion is required.' }),
    date_of_birth: z.string().min(1, { message: 'Date of birth is required.' }),
    place_of_birth: z.string().optional(),
    has_sibling: z.boolean().default(false),
    email: z.string().email({ message: 'Please enter a valid email address.' }),
    verificationCode: z.string().length(6, { message: 'Verification code must be 6 digits.' }).optional().or(z.literal('')),
    altVerificationCode: z.string().length(6, { message: 'Verification code must be 6 digits.' }).optional().or(z.literal('')),
    alt_email: z.string().email({ message: 'Please enter a valid alternate email address.' }),
    mobile_number: z.string().regex(phoneRegex, { message: 'Please enter a valid mobile number.' }),
    present_street: z.string().optional(),
    present_brgy: z.string().min(1, { message: 'Barangay is required.' }),
    present_city: z.string().min(1, { message: 'City is required.' }),
    present_province: z.string().min(1, { message: 'Province is required.' }),
    present_zip: z.string().min(1, { message: 'ZIP code is required.' }),
    permanent_street: z.string().optional(),
    permanent_brgy: z.string().min(1, { message: 'Barangay is required.' }),
    permanent_city: z.string().min(1, { message: 'City is required.' }),
    permanent_province: z.string().min(1, { message: 'Province is required.' }),
    permanent_zip: z.string().min(1, { message: 'ZIP code is required.' }),
    stopped_studying: z.string().optional(),
    accelerated: z.string().optional(),
    health_conditions: z.union([z.string(), z.array(z.string())]).optional(),

    // Family info
    father_lname: z.string().min(2, { message: "Father's last name must be at least 2 characters." }),
    father_fname: z.string().min(2, { message: "Father's first name must be at least 2 characters." }),
    father_mname: z.string().min(2, { message: "Father's middle name must be at least 2 characters." }),
    father_living: z.string().min(1, { message: "Father's status is required." }),
    father_citizenship: z.string().optional(),
    father_religion: z.string().optional(),
    father_highest_educ: z.string().optional(),
    father_occupation: z.string().optional(),
    father_income: z.string().optional(),
    father_business_emp: z.string().optional(),
    father_business_address: z.string().optional(),
    father_contact_no: z.string().regex(phoneRegex, { message: 'Invalid phone number.' }).or(z.literal('')).optional(),
    father_email: z.string().email({ message: 'Please enter a valid email address.' }).or(z.literal('')).optional(),

    father_slu_employee: z.boolean().default(false),
    father_slu_dept: z.string().optional(),
    mother_lname: z.string().min(2, { message: "Mother's maiden last name must be at least 2 characters." }),
    mother_fname: z.string().min(2, { message: "Mother's first name must be at least 2 characters." }),
    mother_mname: z.string().min(2, { message: "Mother's middle name must be at least 2 characters." }),
    mother_living: z.string().min(1, { message: "Mother's status is required." }),
    mother_citizenship: z.string().optional(),
    mother_religion: z.string().optional(),
    mother_highest_educ: z.string().optional(),
    mother_occupation: z.string().optional(),
    mother_income: z.string().optional(),
    mother_business_emp: z.string().optional(),
    mother_business_address: z.string().optional(),
    mother_contact_no: z.string().regex(phoneRegex, { message: 'Invalid phone number.' }).or(z.literal('')).optional(),
    mother_email: z.string().email({ message: 'Please enter a valid email address.' }).or(z.literal('')).optional(),

    mother_slu_employee: z.boolean().default(false),
    mother_slu_dept: z.string().optional(),
    guardian_lname: z.string().min(2, { message: "Guardian's last name must be at least 2 characters." }),
    guardian_fname: z.string().min(2, { message: "Guardian's first name must be at least 2 characters." }),
    guardian_mname: z.string().min(2, { message: "Guardian's middle name must be at least 2 characters." }),
    guardian_relationship: z.string().optional(),
    guardian_citizenship: z.string().optional(),
    guardian_religion: z.string().optional(),
    guardian_highest_educ: z.string().optional(),
    guardian_occupation: z.string().optional(),
    guardian_income: z.string().optional(),
    guardian_business_emp: z.string().optional(),
    guardian_business_address: z.string().optional(),
    guardian_contact_no: z.string().regex(phoneRegex, { message: 'Please enter a valid mobile number.' }),
    guardian_email: z.string().email({ message: 'Please enter a valid email address.' }).or(z.literal('')).optional(),

    guardian_slu_employee: z.boolean().default(false),
    guardian_slu_dept: z.string().optional(),
    emergency_contact_name: z.string().min(2, { message: "Please enter emergency contact's name." }),
    emergency_relationship: z.string().min(1, { message: 'Relationship is required.' }),
    emergency_home_phone: z.string().regex(phoneRegex).or(z.literal('')).optional(),
    emergency_mobile_phone: z.string().regex(phoneRegex, { message: 'Please enter a valid mobile number.' }),
    emergency_email: z.string().email().or(z.literal('')).optional(),

    //Siblings Info
    siblings: z
        .array(
            z.object({
                sibling_full_name: z.string().min(2, "Please enter sibling's name."),
                sibling_grade_level: z.string().min(1, "Enter sibling's grade level."),
                sibling_id_number: z.string().min(1, "Enter sibling's ID number."),
            }),
        )
        .optional()
        .default([]),

    //Educ Background
    schools: z
        .array(
            z.object({
                school_name: z.string().min(2, { message: "Please enter school's name." }),
                school_address: z.string().min(2, { message: "Please enter school's address." }),
                from_grade: z.string().optional(),
                to_grade: z.string().optional(),
                from_year: z.string().optional(),
                to_year: z.string().optional(),
                honors_awards: z.string().optional(),
                general_average: z.string().optional(),
                class_rank: z.string().optional(),
                class_size: z.string().optional(),
            }),
        )
        .optional()
        .default([]),

    //Documents - Fix the file validation
    certificate_of_enrollment: z.any().refine((file) => file instanceof File && file.size > 0, { message: 'Certificate of Enrollment is required.' }),
    birth_certificate: z.any().refine((file) => file instanceof File && file.size > 0, { message: 'Birth Certificate is required.' }),
    latest_report_card_front: z.any().refine((file) => file instanceof File && file.size > 0, { message: 'Latest Report Card (Front) is required.' }),
    latest_report_card_back: z.any().refine((file) => file instanceof File && file.size > 0, { message: 'Latest Report Card (Back) is required.' }),
});

type ApplicantFormValues = z.infer<typeof applicantFormSchema>;

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
            const offset = 100;
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
        { id: 'application', label: 'Application Info', icon: '📋' },
        { id: 'personal', label: 'Personal Info', icon: '👤' },
        { id: 'family', label: 'Family Background', icon: '👨‍👩‍👧‍👦' },
        { id: 'siblings', label: 'Sibling Discount', icon: '👫' },
        { id: 'education', label: 'Education', icon: '🎓' },
        { id: 'documents', label: 'Documents', icon: '📄' },
    ];

    return (
        <div className="sticky top-0 z-50 mb-4 w-full rounded-lg bg-white shadow-md">
            <div className="flex items-center justify-between overflow-x-auto px-10 py-4">
                {navItems.map((item, index) => (
                    <div key={item.id} className="flex items-center">
                        {/* Step Circle */}
                        <button onClick={() => scrollToSection(item.id)} className={`flex flex-col items-center px-3 text-center transition-colors`}>
                            <div
                                className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${
                                    activeSection === item.id ? 'border-[#073066] bg-yellow-200 text-[#073066]' : 'border-gray-300 text-gray-500'
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
    const form = useForm<ApplicantFormValues>({
        resolver: zodResolver(applicantFormSchema) as any,
        mode: 'onChange',
        defaultValues: {
            //application info
            application_date: new Date().toISOString().split('T')[0],
            school_year: '',
            application_status: 'Pending',
            year_level: '',
            semester: '',
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
            sex: '',
            citizenship: '',
            religion: '',
            date_of_birth: '',
            place_of_birth: '',
            has_sibling: false,
            email: '',
            verificationCode: '',
            altVerificationCode: '',
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

    // --- NEW STATE for agreement checkbox ---
    const [hasAgreed, setHasAgreed] = React.useState(false);

    const applicationDate = form.watch('application_date');

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
                }
                // Handle health_conditions array
                else if (key === 'health_conditions') {
                    if (Array.isArray(value) && value.length > 0) {
                        formData.append(key, JSON.stringify(value));
                    } else if (typeof value === 'string' && value) {
                        formData.append(key, value);
                    }
                }
                // Handle file uploads
                else if (
                    key === 'certificate_of_enrollment' ||
                    key === 'birth_certificate' ||
                    key === 'latest_report_card_front' ||
                    key === 'latest_report_card_back'
                ) {
                    if (value instanceof File) {
                        formData.append(key, value);
                    }
                }
                // Handle boolean values
                else if (typeof value === 'boolean') {
                    formData.append(key, value ? '1' : '0');
                }
                // Handle all other fields
                else if (value !== null && value !== undefined && value !== '') {
                    formData.append(key, value.toString());
                }
            });

            // Submit form using Inertia
            router.post('/applications/apply-jhs', formData, {
                forceFormData: true,
                onSuccess: () => {
                    // Redirect to success page
                    router.visit('/applications/success', {
                        replace: true,
                    });
                },
                onError: (errors) => {
                    console.error('Submission errors:', errors);

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
        } catch (error) {
            console.error('Submission error:', error);
            toast.error('An unexpected error occurred. Please try again.');
        }
    }

    // Email verification states
    const [codeSent, setCodeSent] = useState(false);
    const [sendingCode, setSendingCode] = useState(false);
    const [verifyingCode, setVerifyingCode] = useState(false);
    const [emailVerified, setEmailVerified] = useState(false);

    // Alternate email verification states
    const [altCodeSent, setAltCodeSent] = useState(false);
    const [sendingAltCode, setSendingAltCode] = useState(false);
    const [verifyingAltCode, setVerifyingAltCode] = useState(false);
    const [altEmailVerified, setAltEmailVerified] = useState(false);

    // Function to send email verification code
    const sendVerificationCode = async () => {
        const email = form.getValues('email');

        if (!email) {
            form.setError('email', { message: 'Email is required' });
            return;
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            form.setError('email', { message: 'Please enter a valid email address' });
            return;
        }

        setSendingCode(true);

        try {
            const response = await fetch('http://localhost:8000/api/email/send-verification', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                setCodeSent(true);
                // Show success toast/notification
                console.log('✅ Verification code sent to your email!');
                // toast.success('Verification code sent to your email!');
            } else {
                form.setError('email', {
                    message: data.message || 'Failed to send verification code',
                });
            }
        } catch (err) {
            form.setError('email', {
                message: 'Network error. Please check your connection and try again.',
            });
        } finally {
            setSendingCode(false);
        }
    };

    // Function to verify code
    const verifyCode = async () => {
        const email = form.getValues('email');
        const code = form.getValues('verificationCode');

        if (!code || code.length !== 6) {
            form.setError('verificationCode', {
                message: 'Please enter a valid 6-digit code',
            });
            return;
        }

        setVerifyingCode(true);

        try {
            const response = await fetch('http://localhost:8000/api/email/verify', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
                body: JSON.stringify({ email, code }),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                setEmailVerified(true);
                // Show success message
                console.log('✅ Email verified successfully!');
                // toast.success('Email verified successfully!');

                // Clear any errors
                form.clearErrors('verificationCode');
            } else {
                form.setError('verificationCode', {
                    message: data.message || 'Invalid verification code',
                });
            }
        } catch (err) {
            form.setError('verificationCode', {
                message: 'Network error. Please try again.',
            });
        } finally {
            setVerifyingCode(false);
        }
    };

    // Function to send alternate email verification code
    const sendAltVerificationCode = async () => {
        const alt_email = form.getValues('alt_email');

        if (!alt_email) {
            form.setError('alt_email', { message: 'Email is required' });
            return;
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(alt_email)) {
            form.setError('alt_email', { message: 'Please enter a valid email address' });
            return;
        }

        setSendingAltCode(true);

        try {
            const response = await fetch('http://localhost:8000/api/email/send-altverification', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
                body: JSON.stringify({ alt_email }),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                setAltCodeSent(true);
                // Show success toast/notification
                console.log('✅ Verification code sent to your email!');
                // toast.success('Verification code sent to your email!');
            } else {
                form.setError('alt_email', {
                    message: data.message || 'Failed to send verification code',
                });
            }
        } catch (err) {
            form.setError('alt_email', {
                message: 'Network error. Please check your connection and try again.',
            });
        } finally {
            setSendingAltCode(false);
        }
    };

    // Function to verify code
    const verifyAltCode = async () => {
        const alt_email = form.getValues('alt_email');
        const code = form.getValues('altVerificationCode');

        if (!code || code.length !== 6) {
            form.setError('altVerificationCode', {
                message: 'Please enter a valid 6-digit code',
            });
            return;
        }

        setVerifyingAltCode(true);

        try {
            const response = await fetch('http://localhost:8000/api/email/altverify', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
                body: JSON.stringify({ alt_email, code }),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                setAltEmailVerified(true);
                // Show success message
                console.log('✅ Email verified successfully!');
                // toast.success('Email verified successfully!');

                // Clear any errors
                form.clearErrors('altVerificationCode');
            } else {
                form.setError('altVerificationCode', {
                    message: data.message || 'Invalid verification code',
                });
            }
        } catch (err) {
            form.setError('altVerificationCode', {
                message: 'Network error. Please try again.',
            });
        } finally {
            setVerifyingAltCode(false);
        }
    };

    return (
        <div className="bg-[#f5f5f5]">
            <div>
                <Toaster position="top-right" richColors />
            </div>
            <Head title="Application" />
            {/* Header */}
            <header className="bg-[#073066] text-white shadow-md">
                <div className="mx-auto flex max-w-[1800px] items-center justify-between px-10 py-6">
                    {/* Left Side: Logo + University Name */}
                    <div className="flex items-center gap-4">
                        <img src="/images/slu-logo2.png" alt="SLU Logo" className="h-30 w-30 object-contain" />

                        <div className="flex flex-col">
                            <h1 style={{ fontFamily: "'Spectral SC', serif" }} className="text-5xl text-white">
                                Saint Louis University
                            </h1>
                            <p className="mt-1 text-gray-200">Baguio City, Philippines</p>
                        </div>
                    </div>

                    {/* Rightmost Text */}
                    <p className="text-2xl whitespace-nowrap text-white">JHS Online Application</p>
                </div>
            </header>

            <div className="mx-auto w-full max-w-[1500px] rounded-lg p-10">
                {/* Option 2: Modern Card Style */}

                <div className="bg-linear-to-r text-[#073066]">
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-bold">Student Application</h1>
                    </div>
                </div>
                <div className="py-6">
                    <div className="flex items-start gap-4 rounded-lg bg-blue-50 p-4">
                        <Info className="mt-0.5 h-5 w-5 shrink-0 text-[#073066]" />
                        <div className="text-sm text-gray-700">
                            <p className="mb-1 font-medium text-[#073066]">Important Instructions:</p>
                            <ul className="list-inside list-disc space-y-1">
                                <li>All fields marked with asterisk (*) are required</li>
                                <li>Ensure all documents are in PDF, JPG, JPEG, or PNG format</li>
                                <li>Review your information carefully before submitting</li>
                            </ul>
                        </div>
                    </div>
                </div>

                <FormNavigation />

                <div className="flex gap-8">
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
                                            <div className="grid grid-cols-2 gap-6">
                                                <FormField
                                                    control={form.control}
                                                    name="application_date"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <LabelWithTooltip
                                                                label="Application Date *"
                                                                tooltip="Select the date of your application."
                                                            />
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
                                            </div>
                                            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                                                <FormField
                                                    control={form.control}
                                                    name="year_level"
                                                    render={({ field }) => {
                                                        return (
                                                            <FormItem>
                                                                <LabelWithTooltip label="Year Level *" tooltip="Choose your year level." />
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
                                                                            form.setValue('strand', 'Junior High School');
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
                                                                    <SelectItem value="1st Semester">1st Semester</SelectItem>
                                                                    <SelectItem value="2nd Semester">2nd Semester</SelectItem>
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
                                                                    tooltip="Select your preferred academic program or strand."
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
                                                                        <SelectItem value="Junior High School">Junior High School</SelectItem>

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
                                                            <LabelWithTooltip label="LRN" tooltip="Enter applicant's Learner Reference Number." />
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
                                                    name="sex"
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
                                                        <FormItem>
                                                            <LabelWithTooltip
                                                                label="Citizenship *"
                                                                tooltip="Enter applicant's citizenship (e.g., Filipino)."
                                                            />
                                                            <FormControl>
                                                                <Input placeholder="Filipino" {...field} />
                                                            </FormControl>
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
                                                {/* Primary Email Section */}
                                                <div className="space-y-4">
                                                    <FormField
                                                        control={form.control}
                                                        name="email"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <LabelWithTooltip label="Email Address *" tooltip="Enter your email address." />
                                                                <div className="flex gap-2">
                                                                    <FormControl>
                                                                        <Input
                                                                            type="email"
                                                                            placeholder="your.email@example.com"
                                                                            {...field}
                                                                            disabled={emailVerified}
                                                                            className={`flex-1 ${emailVerified ? 'border-green-500 bg-green-50' : ''}`}
                                                                        />
                                                                    </FormControl>
                                                                    <button
                                                                        type="button"
                                                                        onClick={sendVerificationCode}
                                                                        disabled={sendingCode || emailVerified}
                                                                        className={`rounded-md px-4 py-2 text-sm font-medium whitespace-nowrap text-white transition-colors ${
                                                                            emailVerified
                                                                                ? 'cursor-default bg-green-600'
                                                                                : 'bg-blue-600 hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400'
                                                                        }`}
                                                                    >
                                                                        {emailVerified
                                                                            ? '✓ Verified'
                                                                            : sendingCode
                                                                              ? 'Sending...'
                                                                              : codeSent
                                                                                ? 'Code Sent'
                                                                                : 'Verify Email'}
                                                                    </button>
                                                                </div>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />

                                                    {codeSent && !emailVerified && (
                                                        <FormField
                                                            control={form.control}
                                                            name="verificationCode"
                                                            render={({ field }) => (
                                                                <FormItem>
                                                                    <LabelWithTooltip
                                                                        label="Email Verification Code *"
                                                                        tooltip="Enter the 6-digit code sent to your email."
                                                                    />
                                                                    <div className="flex gap-2">
                                                                        <FormControl>
                                                                            <Input
                                                                                placeholder="000000"
                                                                                {...field}
                                                                                maxLength={6}
                                                                                onChange={(e) => {
                                                                                    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                                                                                    field.onChange(value);
                                                                                }}
                                                                                className="flex-1 text-center text-lg font-semibold tracking-widest uppercase"
                                                                            />
                                                                        </FormControl>
                                                                        <button
                                                                            type="button"
                                                                            onClick={verifyCode}
                                                                            disabled={verifyingCode || !field.value || field.value.length !== 6}
                                                                            className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium whitespace-nowrap text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-400"
                                                                        >
                                                                            {verifyingCode ? 'Verifying...' : 'Verify'}
                                                                        </button>
                                                                    </div>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />
                                                    )}

                                                    {emailVerified && (
                                                        <p className="text-sm font-medium text-green-600">Email successfully verified</p>
                                                    )}

                                                    {codeSent && !emailVerified && (
                                                        <div className="text-sm text-gray-600">
                                                            Didn't receive the code?{' '}
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setCodeSent(false);
                                                                    form.setValue('verificationCode', '');
                                                                    form.clearErrors('verificationCode');
                                                                }}
                                                                className="font-medium text-blue-600 hover:text-blue-700 hover:underline"
                                                            >
                                                                Change email or resend code
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Alternate Email Section */}
                                                <div className="space-y-4">
                                                    <FormField
                                                        control={form.control}
                                                        name="alt_email"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <LabelWithTooltip
                                                                    label="Alternate Email Address *"
                                                                    tooltip="Enter your alternate email address."
                                                                />
                                                                <div className="flex gap-2">
                                                                    <FormControl>
                                                                        <Input
                                                                            type="email"
                                                                            placeholder="your.email@example.com"
                                                                            {...field}
                                                                            disabled={altEmailVerified}
                                                                            className={`flex-1 ${altEmailVerified ? 'border-green-500 bg-green-50' : ''}`}
                                                                        />
                                                                    </FormControl>
                                                                    <button
                                                                        type="button"
                                                                        onClick={sendAltVerificationCode}
                                                                        disabled={sendingAltCode || altEmailVerified}
                                                                        className={`rounded-md px-4 py-2 text-sm font-medium whitespace-nowrap text-white transition-colors ${
                                                                            altEmailVerified
                                                                                ? 'cursor-default bg-green-600'
                                                                                : 'bg-blue-600 hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400'
                                                                        }`}
                                                                    >
                                                                        {altEmailVerified
                                                                            ? '✓ Verified'
                                                                            : sendingAltCode
                                                                              ? 'Sending...'
                                                                              : altCodeSent
                                                                                ? 'Code Sent'
                                                                                : 'Verify Email'}
                                                                    </button>
                                                                </div>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />

                                                    {altCodeSent && !altEmailVerified && (
                                                        <FormField
                                                            control={form.control}
                                                            name="altVerificationCode"
                                                            render={({ field }) => (
                                                                <FormItem>
                                                                    <LabelWithTooltip
                                                                        label="Alternate Email Verification Code *"
                                                                        tooltip="Enter the 6-digit code sent to your email."
                                                                    />
                                                                    <div className="flex gap-2">
                                                                        <FormControl>
                                                                            <Input
                                                                                placeholder="000000"
                                                                                {...field}
                                                                                maxLength={6}
                                                                                onChange={(e) => {
                                                                                    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                                                                                    field.onChange(value);
                                                                                }}
                                                                                className="flex-1 text-center text-lg font-semibold tracking-widest uppercase"
                                                                            />
                                                                        </FormControl>
                                                                        <button
                                                                            type="button"
                                                                            onClick={verifyAltCode}
                                                                            disabled={verifyingAltCode || !field.value || field.value.length !== 6}
                                                                            className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium whitespace-nowrap text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-400"
                                                                        >
                                                                            {verifyingAltCode ? 'Verifying...' : 'Verify'}
                                                                        </button>
                                                                    </div>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />
                                                    )}

                                                    {altEmailVerified && (
                                                        <p className="text-sm font-medium text-green-600">Email successfully verified</p>
                                                    )}

                                                    {altCodeSent && !altEmailVerified && (
                                                        <div className="text-sm text-gray-600">
                                                            Didn't receive the code?{' '}
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setAltCodeSent(false);
                                                                    form.setValue('altVerificationCode', '');
                                                                    form.clearErrors('altVerificationCode');
                                                                }}
                                                                className="font-medium text-blue-600 hover:text-blue-700 hover:underline"
                                                            >
                                                                Change email or resend code
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* --- Present Address Section --- */}
                                            <div className="mt-6">
                                                <h2 className="text-l font-bold text-gray-900">Present Address</h2>

                                                <div className="mt-4 grid grid-cols-1 gap-6 px-4 md:grid-cols-2">
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
                                                    <FormField
                                                        control={form.control}
                                                        name="present_brgy"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <LabelWithTooltip label="Barangay *" tooltip="Include barangay." />
                                                                <FormControl>
                                                                    <Input placeholder="Sample Barangay" {...field} />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                </div>

                                                <div className="mt-6 grid grid-cols-1 gap-6 px-4 md:grid-cols-3">
                                                    <FormField
                                                        control={form.control}
                                                        name="present_city"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <LabelWithTooltip
                                                                    label="City/Municipality *"
                                                                    tooltip="Enter city or municipality of residence."
                                                                />
                                                                <FormControl>
                                                                    <Input placeholder="Baguio City" {...field} />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField
                                                        control={form.control}
                                                        name="present_province"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <LabelWithTooltip label="Province/State *" tooltip="Specify province or state." />
                                                                <FormControl>
                                                                    <Input placeholder="Benguet" {...field} />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField
                                                        control={form.control}
                                                        name="present_zip"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <LabelWithTooltip
                                                                    label="ZIP Code *"
                                                                    tooltip="Enter your 4–6 digit postal ZIP code."
                                                                />
                                                                <FormControl>
                                                                    <Input type="text" inputMode="numeric" placeholder="2600" {...field} />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                </div>

                                                {/* ✅ Checkbox to copy address */}
                                                <div className="mt-4 flex items-center space-x-2 px-4">
                                                    <Checkbox
                                                        size="small"
                                                        onChange={(e) => {
                                                            const checked = e.target.checked;
                                                            if (checked) {
                                                                // Copy present → permanent
                                                                form.setValue('permanent_street', form.getValues('present_street'));
                                                                form.setValue('permanent_brgy', form.getValues('present_brgy'));
                                                                form.setValue('permanent_city', form.getValues('present_city'));
                                                                form.setValue('permanent_province', form.getValues('present_province'));
                                                                form.setValue('permanent_zip', form.getValues('present_zip'));
                                                            } else {
                                                                // Clear permanent fields when unchecked
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
                                                <div className="mt-4 grid grid-cols-1 gap-6 px-4 md:grid-cols-2">
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
                                                                    <Input placeholder="123 Main Street" {...field} />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField
                                                        control={form.control}
                                                        name="permanent_brgy"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <LabelWithTooltip label="Barangay *" tooltip="Include barangay." />
                                                                <FormControl>
                                                                    <Input placeholder="Sample Barangay" {...field} />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                </div>

                                                <div className="mt-6 grid grid-cols-1 gap-6 px-4 md:grid-cols-3">
                                                    <FormField
                                                        control={form.control}
                                                        name="permanent_city"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <LabelWithTooltip
                                                                    label="City/Municipality *"
                                                                    tooltip="Enter city or municipality of residence."
                                                                />
                                                                <FormControl>
                                                                    <Input placeholder="Baguio City" {...field} />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField
                                                        control={form.control}
                                                        name="permanent_province"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <LabelWithTooltip label="Province/State *" tooltip="Specify province or state." />
                                                                <FormControl>
                                                                    <Input placeholder="Benguet" {...field} />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField
                                                        control={form.control}
                                                        name="permanent_zip"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <LabelWithTooltip
                                                                    label="ZIP Code *"
                                                                    tooltip="Enter your 4–6 digit postal ZIP code."
                                                                />
                                                                <FormControl>
                                                                    <Input type="text" inputMode="numeric" placeholder="2600" {...field} />
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
                                                                <TextareaAutosize
                                                                    {...field}
                                                                    minRows={3}
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
                                                                <TextareaAutosize
                                                                    {...field}
                                                                    minRows={3}
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

                                                            <Box
                                                                sx={{
                                                                    display: 'grid',
                                                                    gridTemplateColumns: 'repeat(3, 1fr)',
                                                                    gap: 1,
                                                                    mt: 1,
                                                                }}
                                                            >
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
                                                                    <FormControlLabel
                                                                        key={option}
                                                                        control={
                                                                            <Checkbox
                                                                                size="small"
                                                                                checked={Array.isArray(field.value) && field.value.includes(option)}
                                                                                onChange={(e) => {
                                                                                    const checked = e.target.checked;
                                                                                    const currentValue = Array.isArray(field.value)
                                                                                        ? field.value
                                                                                        : [];

                                                                                    if (checked) {
                                                                                        field.onChange([...currentValue, option]);
                                                                                    } else {
                                                                                        field.onChange(
                                                                                            currentValue.filter((v: string) => v !== option),
                                                                                        );
                                                                                    }
                                                                                }}
                                                                            />
                                                                        }
                                                                        label={option}
                                                                        sx={{
                                                                            alignItems: 'center',
                                                                            '& .MuiFormControlLabel-label': {
                                                                                fontSize: '0.875rem', // 👈 adjust text size here
                                                                                color: '#374151', // Tailwind’s gray-700 equivalent
                                                                                lineHeight: 1.4,
                                                                            },
                                                                        }}
                                                                    />
                                                                ))}

                                                                {/* “Others” checkbox */}
                                                                <FormControlLabel
                                                                    control={
                                                                        <Checkbox
                                                                            size="small"
                                                                            checked={
                                                                                Array.isArray(field.value) &&
                                                                                field.value.some((v) => v.startsWith('Others'))
                                                                            }
                                                                            onChange={(e) => {
                                                                                const checked = e.target.checked;
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
                                                                    }
                                                                    label="Others (Please specify)"
                                                                    sx={{
                                                                        alignItems: 'center',
                                                                        '& .MuiFormControlLabel-label': {
                                                                            fontSize: '0.875rem',
                                                                            color: '#374151',
                                                                        },
                                                                    }}
                                                                />
                                                            </Box>

                                                            {/* “Others” text box */}
                                                            {Array.isArray(field.value) && field.value.some((v) => v.startsWith('Others')) && (
                                                                <TextareaAutosize
                                                                    minRows={2}
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

                                                                        // Always keep "Others:", even if empty
                                                                        field.onChange([...currentValue, `Others: ${otherValue}`]);
                                                                    }}
                                                                />
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
                                                                    <RadioGroup
                                                                        row
                                                                        sx={{ '& .MuiFormControlLabel-label': { fontSize: '0.80rem' } }}
                                                                        value={field.value || ''}
                                                                        onChange={(e) => field.onChange(e.target.value)}
                                                                    >
                                                                        <FormControlLabel value="Living" control={<Radio />} label="Living" />
                                                                        <FormControlLabel value="Deceased" control={<Radio />} label="Deceased" />
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
                                                                        <RadioGroup
                                                                            row
                                                                            sx={{ '& .MuiFormControlLabel-label': { fontSize: '0.80rem' } }}
                                                                            value={
                                                                                field.value === true ? 'true' : field.value === false ? 'false' : ''
                                                                            }
                                                                            onChange={(e) => {
                                                                                const boolValue = e.target.value === 'true';
                                                                                field.onChange(boolValue);
                                                                            }}
                                                                        >
                                                                            <FormControlLabel
                                                                                value="true"
                                                                                control={<Radio sx={{ transform: 'scale(0.9)' }} />}
                                                                                label="Yes"
                                                                            />
                                                                            <FormControlLabel
                                                                                value="false"
                                                                                control={<Radio sx={{ transform: 'scale(0.9)' }} />}
                                                                                label="No"
                                                                            />
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
                                                                    <RadioGroup
                                                                        row
                                                                        sx={{ '& .MuiFormControlLabel-label': { fontSize: '0.80rem' } }}
                                                                        value={field.value || ''}
                                                                        onChange={(e) => field.onChange(e.target.value)}
                                                                    >
                                                                        <FormControlLabel value="Living" control={<Radio />} label="Living" />
                                                                        <FormControlLabel value="Deceased" control={<Radio />} label="Deceased" />
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
                                                                        <RadioGroup
                                                                            row
                                                                            sx={{ '& .MuiFormControlLabel-label': { fontSize: '0.80rem' } }}
                                                                            value={
                                                                                field.value === true ? 'true' : field.value === false ? 'false' : ''
                                                                            }
                                                                            onChange={(e) => {
                                                                                const boolValue = e.target.value === 'true';
                                                                                field.onChange(boolValue);
                                                                            }}
                                                                        >
                                                                            <FormControlLabel
                                                                                value="true"
                                                                                control={<Radio sx={{ transform: 'scale(0.9)' }} />}
                                                                                label="Yes"
                                                                            />
                                                                            <FormControlLabel
                                                                                value="false"
                                                                                control={<Radio sx={{ transform: 'scale(0.9)' }} />}
                                                                                label="No"
                                                                            />
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
                                                            size="small"
                                                            onChange={(e) => {
                                                                if (e.target.checked) {
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
                                                            size="small"
                                                            onChange={(e) => {
                                                                if (e.target.checked) {
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
                                                                        <RadioGroup
                                                                            row
                                                                            sx={{ '& .MuiFormControlLabel-label': { fontSize: '0.80rem' } }}
                                                                            value={
                                                                                field.value === true ? 'true' : field.value === false ? 'false' : ''
                                                                            }
                                                                            onChange={(e) => {
                                                                                const boolValue = e.target.value === 'true';
                                                                                field.onChange(boolValue);
                                                                            }}
                                                                        >
                                                                            <FormControlLabel
                                                                                value="true"
                                                                                control={<Radio sx={{ transform: 'scale(0.9)' }} />}
                                                                                label="Yes"
                                                                            />
                                                                            <FormControlLabel
                                                                                value="false"
                                                                                control={<Radio sx={{ transform: 'scale(0.9)' }} />}
                                                                                label="No"
                                                                            />
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
                                                                        className="mt-2 pl-4"
                                                                        row
                                                                        sx={{ '& .MuiFormControlLabel-label': { fontSize: '0.80rem' } }}
                                                                        value={field.value === true ? 'true' : field.value === false ? 'false' : ''}
                                                                        onChange={(e) => {
                                                                            const val = e.target.value === 'true'; // convert to boolean
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
                                                                        <FormControlLabel
                                                                            value="true"
                                                                            control={<Radio sx={{ transform: 'scale(0.9)' }} />}
                                                                            label="Yes"
                                                                        />
                                                                        <FormControlLabel
                                                                            value="false"
                                                                            control={<Radio sx={{ transform: 'scale(0.9)' }} />}
                                                                            label="No"
                                                                        />
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
                                                    render={({ field }) => {
                                                        const [isDragging, setIsDragging] = React.useState(false);
                                                        const fileInputRef = React.useRef<HTMLInputElement>(null);

                                                        const handleDragOver = (e: React.DragEvent) => {
                                                            e.preventDefault();
                                                            setIsDragging(true);
                                                        };

                                                        const handleDragLeave = (e: React.DragEvent) => {
                                                            e.preventDefault();
                                                            setIsDragging(false);
                                                        };

                                                        const handleDrop = (e: React.DragEvent) => {
                                                            e.preventDefault();
                                                            setIsDragging(false);
                                                            const files = e.dataTransfer.files;
                                                            if (files.length > 0) {
                                                                field.onChange(files[0]);
                                                            }
                                                        };

                                                        const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
                                                            const files = e.target.files;
                                                            if (files && files.length > 0) {
                                                                field.onChange(files[0]);
                                                            }
                                                        };

                                                        return (
                                                            <FormItem>
                                                                <LabelWithTooltip
                                                                    label="Certificate of Enrollment"
                                                                    tooltip="Upload your official Certificate of Enrollment."
                                                                />
                                                                <FormControl>
                                                                    <div>
                                                                        <div
                                                                            onClick={() => fileInputRef.current?.click()}
                                                                            onDragOver={handleDragOver}
                                                                            onDragLeave={handleDragLeave}
                                                                            onDrop={handleDrop}
                                                                            className={`cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
                                                                                isDragging
                                                                                    ? 'border-blue-500 bg-blue-50'
                                                                                    : 'border-gray-300 hover:border-gray-400'
                                                                            }`}
                                                                        >
                                                                            {field.value ? (
                                                                                <div className="flex items-center justify-between">
                                                                                    <span className="truncate text-sm text-gray-700">
                                                                                        {field.value.name}
                                                                                    </span>
                                                                                    <Button
                                                                                        type="button"
                                                                                        variant="ghost"
                                                                                        size="sm"
                                                                                        onClick={(e) => {
                                                                                            e.stopPropagation();
                                                                                            field.onChange(null);
                                                                                            if (fileInputRef.current) {
                                                                                                fileInputRef.current.value = '';
                                                                                            }
                                                                                        }}
                                                                                        className="text-red-500 hover:text-red-700"
                                                                                    >
                                                                                        <Trash2 className="h-4 w-4" />
                                                                                    </Button>
                                                                                </div>
                                                                            ) : (
                                                                                <div className="flex flex-col items-center">
                                                                                    <svg
                                                                                        className="mb-3 h-12 w-12 text-gray-400"
                                                                                        stroke="currentColor"
                                                                                        fill="none"
                                                                                        viewBox="0 0 24 24"
                                                                                        aria-hidden="true"
                                                                                    >
                                                                                        <path
                                                                                            strokeLinecap="round"
                                                                                            strokeLinejoin="round"
                                                                                            strokeWidth={2}
                                                                                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                                                                                        />
                                                                                    </svg>
                                                                                    <p className="text-sm text-gray-600">
                                                                                        Click to upload or drag and drop
                                                                                    </p>
                                                                                    <p className="mt-1 text-xs text-gray-500">PDF, JPG, JPEG, PNG</p>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                        <input
                                                                            ref={fileInputRef}
                                                                            type="file"
                                                                            accept=".pdf,.jpg,.jpeg,.png"
                                                                            onChange={handleFileChange}
                                                                            className="hidden"
                                                                        />
                                                                    </div>
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        );
                                                    }}
                                                />

                                                {/* Birth Certificate */}
                                                <FormField
                                                    control={form.control}
                                                    name="birth_certificate"
                                                    render={({ field }) => {
                                                        const [isDragging, setIsDragging] = React.useState(false);
                                                        const fileInputRef = React.useRef<HTMLInputElement>(null);

                                                        const handleDragOver = (e: React.DragEvent) => {
                                                            e.preventDefault();
                                                            setIsDragging(true);
                                                        };

                                                        const handleDragLeave = (e: React.DragEvent) => {
                                                            e.preventDefault();
                                                            setIsDragging(false);
                                                        };

                                                        const handleDrop = (e: React.DragEvent) => {
                                                            e.preventDefault();
                                                            setIsDragging(false);
                                                            const files = e.dataTransfer.files;
                                                            if (files.length > 0) {
                                                                field.onChange(files[0]);
                                                            }
                                                        };

                                                        const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
                                                            const files = e.target.files;
                                                            if (files && files.length > 0) {
                                                                field.onChange(files[0]);
                                                            }
                                                        };

                                                        return (
                                                            <FormItem>
                                                                <LabelWithTooltip
                                                                    label="Birth Certificate"
                                                                    tooltip="Upload your PSA or NSO Birth Certificate."
                                                                />
                                                                <FormControl>
                                                                    <div>
                                                                        <div
                                                                            onClick={() => fileInputRef.current?.click()}
                                                                            onDragOver={handleDragOver}
                                                                            onDragLeave={handleDragLeave}
                                                                            onDrop={handleDrop}
                                                                            className={`cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
                                                                                isDragging
                                                                                    ? 'border-blue-500 bg-blue-50'
                                                                                    : 'border-gray-300 hover:border-gray-400'
                                                                            }`}
                                                                        >
                                                                            {field.value ? (
                                                                                <div className="flex items-center justify-between">
                                                                                    <span className="truncate text-sm text-gray-700">
                                                                                        {field.value.name}
                                                                                    </span>
                                                                                    <Button
                                                                                        type="button"
                                                                                        variant="ghost"
                                                                                        size="sm"
                                                                                        onClick={(e) => {
                                                                                            e.stopPropagation();
                                                                                            field.onChange(null);
                                                                                            if (fileInputRef.current) {
                                                                                                fileInputRef.current.value = '';
                                                                                            }
                                                                                        }}
                                                                                        className="text-red-500 hover:text-red-700"
                                                                                    >
                                                                                        <Trash2 className="h-4 w-4" />
                                                                                    </Button>
                                                                                </div>
                                                                            ) : (
                                                                                <div className="flex flex-col items-center">
                                                                                    <svg
                                                                                        className="mb-3 h-12 w-12 text-gray-400"
                                                                                        stroke="currentColor"
                                                                                        fill="none"
                                                                                        viewBox="0 0 24 24"
                                                                                        aria-hidden="true"
                                                                                    >
                                                                                        <path
                                                                                            strokeLinecap="round"
                                                                                            strokeLinejoin="round"
                                                                                            strokeWidth={2}
                                                                                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                                                                                        />
                                                                                    </svg>
                                                                                    <p className="text-sm text-gray-600">
                                                                                        Click to upload or drag and drop
                                                                                    </p>
                                                                                    <p className="mt-1 text-xs text-gray-500">PDF, JPG, JPEG, PNG</p>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                        <input
                                                                            ref={fileInputRef}
                                                                            type="file"
                                                                            accept=".pdf,.jpg,.jpeg,.png"
                                                                            onChange={handleFileChange}
                                                                            className="hidden"
                                                                        />
                                                                    </div>
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        );
                                                    }}
                                                />

                                                {/* Latest Report Card (Front) */}
                                                <FormField
                                                    control={form.control}
                                                    name="latest_report_card_front"
                                                    render={({ field }) => {
                                                        const [isDragging, setIsDragging] = React.useState(false);
                                                        const fileInputRef = React.useRef<HTMLInputElement>(null);

                                                        const handleDragOver = (e: React.DragEvent) => {
                                                            e.preventDefault();
                                                            setIsDragging(true);
                                                        };

                                                        const handleDragLeave = (e: React.DragEvent) => {
                                                            e.preventDefault();
                                                            setIsDragging(false);
                                                        };

                                                        const handleDrop = (e: React.DragEvent) => {
                                                            e.preventDefault();
                                                            setIsDragging(false);
                                                            const files = e.dataTransfer.files;
                                                            if (files.length > 0) {
                                                                field.onChange(files[0]);
                                                            }
                                                        };

                                                        const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
                                                            const files = e.target.files;
                                                            if (files && files.length > 0) {
                                                                field.onChange(files[0]);
                                                            }
                                                        };

                                                        return (
                                                            <FormItem>
                                                                <LabelWithTooltip
                                                                    label="Latest Report Card (Front)"
                                                                    tooltip="Upload the front side of your most recent report card."
                                                                />
                                                                <FormControl>
                                                                    <div>
                                                                        <div
                                                                            onClick={() => fileInputRef.current?.click()}
                                                                            onDragOver={handleDragOver}
                                                                            onDragLeave={handleDragLeave}
                                                                            onDrop={handleDrop}
                                                                            className={`cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
                                                                                isDragging
                                                                                    ? 'border-blue-500 bg-blue-50'
                                                                                    : 'border-gray-300 hover:border-gray-400'
                                                                            }`}
                                                                        >
                                                                            {field.value ? (
                                                                                <div className="flex items-center justify-between">
                                                                                    <span className="truncate text-sm text-gray-700">
                                                                                        {field.value.name}
                                                                                    </span>
                                                                                    <Button
                                                                                        type="button"
                                                                                        variant="ghost"
                                                                                        size="sm"
                                                                                        onClick={(e) => {
                                                                                            e.stopPropagation();
                                                                                            field.onChange(null);
                                                                                            if (fileInputRef.current) {
                                                                                                fileInputRef.current.value = '';
                                                                                            }
                                                                                        }}
                                                                                        className="text-red-500 hover:text-red-700"
                                                                                    >
                                                                                        <Trash2 className="h-4 w-4" />
                                                                                    </Button>
                                                                                </div>
                                                                            ) : (
                                                                                <div className="flex flex-col items-center">
                                                                                    <svg
                                                                                        className="mb-3 h-12 w-12 text-gray-400"
                                                                                        stroke="currentColor"
                                                                                        fill="none"
                                                                                        viewBox="0 0 24 24"
                                                                                        aria-hidden="true"
                                                                                    >
                                                                                        <path
                                                                                            strokeLinecap="round"
                                                                                            strokeLinejoin="round"
                                                                                            strokeWidth={2}
                                                                                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                                                                                        />
                                                                                    </svg>
                                                                                    <p className="text-sm text-gray-600">
                                                                                        Click to upload or drag and drop
                                                                                    </p>
                                                                                    <p className="mt-1 text-xs text-gray-500">PDF, JPG, JPEG, PNG</p>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                        <input
                                                                            ref={fileInputRef}
                                                                            type="file"
                                                                            accept=".pdf,.jpg,.jpeg,.png"
                                                                            onChange={handleFileChange}
                                                                            className="hidden"
                                                                        />
                                                                    </div>
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        );
                                                    }}
                                                />

                                                {/* Latest Report Card (Back) */}
                                                <FormField
                                                    control={form.control}
                                                    name="latest_report_card_back"
                                                    render={({ field }) => {
                                                        const [isDragging, setIsDragging] = React.useState(false);
                                                        const fileInputRef = React.useRef<HTMLInputElement>(null);

                                                        const handleDragOver = (e: React.DragEvent) => {
                                                            e.preventDefault();
                                                            setIsDragging(true);
                                                        };

                                                        const handleDragLeave = (e: React.DragEvent) => {
                                                            e.preventDefault();
                                                            setIsDragging(false);
                                                        };

                                                        const handleDrop = (e: React.DragEvent) => {
                                                            e.preventDefault();
                                                            setIsDragging(false);
                                                            const files = e.dataTransfer.files;
                                                            if (files.length > 0) {
                                                                field.onChange(files[0]);
                                                            }
                                                        };

                                                        const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
                                                            const files = e.target.files;
                                                            if (files && files.length > 0) {
                                                                field.onChange(files[0]);
                                                            }
                                                        };

                                                        return (
                                                            <FormItem>
                                                                <LabelWithTooltip
                                                                    label="Latest Report Card (Back)"
                                                                    tooltip="Upload the back side of your most recent report card."
                                                                />
                                                                <FormControl>
                                                                    <div>
                                                                        <div
                                                                            onClick={() => fileInputRef.current?.click()}
                                                                            onDragOver={handleDragOver}
                                                                            onDragLeave={handleDragLeave}
                                                                            onDrop={handleDrop}
                                                                            className={`cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
                                                                                isDragging
                                                                                    ? 'border-blue-500 bg-blue-50'
                                                                                    : 'border-gray-300 hover:border-gray-400'
                                                                            }`}
                                                                        >
                                                                            {field.value ? (
                                                                                <div className="flex items-center justify-between">
                                                                                    <span className="truncate text-sm text-gray-700">
                                                                                        {field.value.name}
                                                                                    </span>
                                                                                    <Button
                                                                                        type="button"
                                                                                        variant="ghost"
                                                                                        size="sm"
                                                                                        onClick={(e) => {
                                                                                            e.stopPropagation();
                                                                                            field.onChange(null);
                                                                                            if (fileInputRef.current) {
                                                                                                fileInputRef.current.value = '';
                                                                                            }
                                                                                        }}
                                                                                        className="text-red-500 hover:text-red-700"
                                                                                    >
                                                                                        <Trash2 className="h-4 w-4" />
                                                                                    </Button>
                                                                                </div>
                                                                            ) : (
                                                                                <div className="flex flex-col items-center">
                                                                                    <svg
                                                                                        className="mb-3 h-12 w-12 text-gray-400"
                                                                                        stroke="currentColor"
                                                                                        fill="none"
                                                                                        viewBox="0 0 24 24"
                                                                                        aria-hidden="true"
                                                                                    >
                                                                                        <path
                                                                                            strokeLinecap="round"
                                                                                            strokeLinejoin="round"
                                                                                            strokeWidth={2}
                                                                                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                                                                                        />
                                                                                    </svg>
                                                                                    <p className="text-sm text-gray-600">
                                                                                        Click to upload or drag and drop
                                                                                    </p>
                                                                                    <p className="mt-1 text-xs text-gray-500">PDF, JPG, JPEG, PNG</p>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                        <input
                                                                            ref={fileInputRef}
                                                                            type="file"
                                                                            accept=".pdf,.jpg,.jpeg,.png"
                                                                            onChange={handleFileChange}
                                                                            className="hidden"
                                                                        />
                                                                    </div>
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        );
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-10 border-b pb-6">
                                        <div className="space-y-6">
                                            <div className="grid grid-cols-2 gap-6">
                                                <FormField
                                                    control={form.control}
                                                    name="accomplished_by_name"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <LabelWithTooltip label="Name of person filling the application" tooltip="" />
                                                            <FormControl>
                                                                <Input placeholder="Enter full name" {...field} />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    {/* --- NEW: AGREEMENT SECTION --- */}
                                    <div className="mt-8">
                                        <h3 className="mb-2 text-base font-semibold text-gray-900">IMPORTANT: Read this portion very carefully.</h3>
                                        <div className="space-y-3 text-sm text-gray-700">
                                            <p>
                                                We hereby voluntarily apply for admission at Saint Louis University Laboratory High School - Senior
                                                High. By applying for admission, we undertake to abide by its rules and regulations and agree that any
                                                violation of the same on our part shall be sufficient ground for the school to revoke our admission.
                                            </p>
                                            <p>
                                                We certify that the herein stated information is true and correct to the best of our knowledge and we
                                                fully understand that any omission and/or falsification on our part shall be sufficient ground for the
                                                School to deny our application.
                                            </p>
                                            <p>
                                                Finally, we recognize the sole prerogative of the School to promulgate such reasonable rules and
                                                regulations it deems necessary for the effective implementation of its Philosophy, Vision-Mission and
                                                Objectives and programs of education.
                                            </p>
                                            <p className="font-medium">
                                                By clicking SUBMIT APPLICATION, you voluntarily agree to abide by the terms, conditions and policies
                                                set forth by Saint Louis University Laboratory High School - SENIOR HIGH. Information gathered herein
                                                will serve and solely be utilized for ADMISSION and ENROLMENT PURPOSES ONLY. Rest assured that the
                                                data will be treated with utmost confidentiality and professionalism in compliance with RA 10173 or
                                                the Data Privacy Law of 2012 and its implementing rules and regulations.
                                            </p>
                                        </div>
                                        <div className="mt-4">
                                            <FormControlLabel
                                                control={
                                                    <Checkbox
                                                        checked={hasAgreed}
                                                        onChange={(e) => setHasAgreed(e.target.checked)}
                                                        name="iAgree"
                                                        color="primary"
                                                    />
                                                }
                                                label="I Agree"
                                            />
                                        </div>
                                    </div>
                                    {/* --- END: AGREEMENT SECTION --- */}
                                    {/* Submit Buttons */}
                                    <div className="flex justify-end gap-2 pt-4">
                                        <Button type="button" variant="outline" onClick={() => form.reset()}>
                                            Discard
                                        </Button>
                                        <Button type="button" variant="outline" onClick={() => form.reset()}>
                                            Reset
                                        </Button>

                                        <Button
                                            type="submit"
                                            disabled={form.formState.isSubmitting || !hasAgreed} // --- DISABLE IF NOT AGREED ---
                                            className="bg-[#073066] text-white hover:bg-[#05509e]"
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
                                                'Submit Application'
                                            )}
                                        </Button>
                                    </div>
                                </form>
                            </TooltipProvider>
                        </Form>
                    </div>
                </div>
            </div>

            <footer className="mt-10 bg-white shadow-md">
                <div className="mx-auto flex max-w-[1200px] items-center justify-between px-10 py-15">
                    {/* Left group: Logo + Text */}
                    <div className="flex items-start gap-6">
                        <img src="/images/slu-logo.png" alt="SLU Logo" className="h-40 w-40 object-contain" />

                        <div className="flex flex-col gap-2">
                            <h1 style={{ fontFamily: "'Spectral SC', serif" }} className="text-4xl text-[#073066]">
                                Saint Louis University
                            </h1>

                            <p className="flex items-center text-[#073066]">
                                <MapPin className="mr-2 inline-block h-5 w-5" />
                                Upper Bonifacio, Baguio City, Benguet, Philippines 2600
                            </p>

                            <p className="flex items-center text-[#073066]">
                                <Mail className="mr-2 inline-block h-5 w-5" />
                                admissions@slu.edu.ph
                            </p>

                            <p className="flex items-center text-[#073066]">
                                <Phone className="mr-2 inline-block h-5 w-5" />
                                (74) 442 1234
                            </p>

                            <p className="flex items-center text-[#073066]">
                                <Facebook className="mr-2 inline-block h-5 w-5" />
                                @SaintLouisUniversity
                            </p>
                        </div>
                    </div>

                    {/* Right side: copyright (stacked) */}
                    <div className="flex flex-col items-end">
                        <p className="whitespace-nowrap text-[#073066]">Copyright © 2024 Saint Louis University</p>
                        <p className="whitespace-nowrap text-[#073066]">All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
