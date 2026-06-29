import { CitizenshipSelect } from '@/components/citizenship-select';
import { FileUpload } from '@/components/file-upload';
import { getSchoolYearOptions } from '@/lib/school-year';
import { SearchableSelect } from '@/components/searchable-select';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Head } from '@inertiajs/react';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { useAddApplicantSHS } from '@/hooks/useAddApplicantSHS';
import { ClipboardList, Facebook, FileText, GraduationCap, HelpCircle, Info, Mail, MapPin, Phone, Trash2, User, UserPlus, Users } from 'lucide-react';

import { Label } from '@/components/ui/label';
import React from 'react';
import { Toaster } from 'sonner';

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
        { id: 'application', label: 'Application Info', icon: <ClipboardList className="h-5 w-5" /> },
        { id: 'personal', label: 'Personal Info', icon: <User className="h-5 w-5" /> },
        { id: 'family', label: 'Family Background', icon: <Users className="h-5 w-5" /> },
        { id: 'siblings', label: 'Sibling Discount', icon: <UserPlus className="h-5 w-5" /> },
        { id: 'education', label: 'Education', icon: <GraduationCap className="h-5 w-5" /> },
        { id: 'documents', label: 'Documents', icon: <FileText className="h-5 w-5" /> },
    ];

    return (
        <div className="sticky top-0 z-50 mb-4 w-full rounded-lg bg-white shadow-md">
            <div className="flex items-center justify-between overflow-x-auto px-10 py-4">
                {navItems.map((item, index) => (
                    <div key={item.id} className="flex items-center">
                        {/* Step Circle */}
                        <button onClick={() => scrollToSection(item.id)} className={`flex flex-col items-center px-3 text-center transition-colors`}>
                            <div
                                className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                                    activeSection === item.id
                                        ? 'border-[#073066] bg-[#073066] text-white shadow-md'
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
    const {
        form,
        guardianSource, setGuardianSource,
        isDuplicateDialogOpen, setIsDuplicateDialogOpen,
        hasAgreed, setHasAgreed,
        presentRegions, presentProvinces, presentCities, presentBarangays,
        selectedPresentRegion, setSelectedPresentRegion,
        selectedPresentProvince, setSelectedPresentProvince,
        selectedPresentCity, setSelectedPresentCity,
        permanentRegions, permanentProvinces, permanentCities, permanentBarangays,
        selectedPermanentRegion, setSelectedPermanentRegion,
        selectedPermanentProvince, setSelectedPermanentProvince,
        selectedPermanentCity, setSelectedPermanentCity,
        isSameAddress, setIsSameAddress,
        loadPermanentAddressData,
        codeSent, sendingCode, verifyingCode, emailVerified,
        altCodeSent, sendingAltCode, verifyingAltCode, altEmailVerified,
        checkEmailAvailability,
        sendVerificationCode, verifyCode,
        sendAltVerificationCode, verifyAltCode,
        onSubmit,
    } = useAddApplicantSHS();
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
                    <p className="text-2xl whitespace-nowrap text-white">SHS Online Application</p>
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
                                <li>All fields marked with asterisk (*) are required.</li>
                                <li>Ensure all documents are in JPG, JPEG, or PNG format</li>
                                <li>Review your information carefully before submitting.</li>
                            </ul>
                        </div>
                    </div>
                </div>

                <FormNavigation />

                <div className="flex gap-8">
                    <div className="flex-1">
                        <Form {...form}>
                            <TooltipProvider>
                                <form
                                    onSubmit={form.handleSubmit(onSubmit)}
                                    className="space-y-6"
                                >
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
                                                            <Select value={field.value} onValueChange={field.onChange}>
                                                                <FormControl>
                                                                    <SelectTrigger>
                                                                        <SelectValue placeholder="Select school year" />
                                                                    </SelectTrigger>
                                                                </FormControl>
                                                                <SelectContent>
                                                                    {(() => {
                                                                        const opts = getSchoolYearOptions();
                                                                        return (opts.includes(field.value) ? opts : [field.value, ...opts].filter(Boolean)).map((y) => (
                                                                            <SelectItem key={y} value={y}>{y}</SelectItem>
                                                                        ));
                                                                    })()}
                                                                </SelectContent>
                                                            </Select>
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
                                                                <LabelWithTooltip label="Grade Level *" tooltip="Choose your grade level." />
                                                                <Select
                                                                    onValueChange={(value) => {
                                                                        field.onChange(value);
                                                                    }}
                                                                    value={field.value}
                                                                >
                                                                    <FormControl>
                                                                        <SelectTrigger>
                                                                            <SelectValue placeholder="Select grade level" />
                                                                        </SelectTrigger>
                                                                    </FormControl>
                                                                    <SelectContent>
                                                                        <SelectGroup>
                                                                            <SelectLabel>Laboratory Senior High School (SHS)</SelectLabel>
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
                                                                    <SelectItem value="New Applicant">New Applicant</SelectItem>
                                                                    <SelectItem value="Transferee">Transferee</SelectItem>
                                                                    <SelectItem value="Returnee">Returnee</SelectItem>
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
                                                                <LabelWithTooltip label="Program *" tooltip="Select your academic program." />
                                                                <Select onValueChange={field.onChange} value={field.value}>
                                                                    <FormControl>
                                                                        <SelectTrigger>
                                                                            <SelectValue placeholder="Select a program" />
                                                                        </SelectTrigger>
                                                                    </FormControl>
                                                                    <SelectContent>
                                                                        <SelectItem value="Accountancy, Business and Management">
                                                                            Accountancy, Business and Management (ABM)
                                                                        </SelectItem>
                                                                        <SelectItem value="Humanities and Social Sciences">
                                                                            Humanities and Social Sciences (HUMSS)
                                                                        </SelectItem>
                                                                        <SelectItem value="Science, Technology, Engineering and Mathematics">
                                                                            Science, Technology, Engineering and Mathematics (STEM)
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
                                                                            onBlur={(e) => {
                                                                                field.onBlur();
                                                                                checkEmailAvailability(e.target.value, 'email');
                                                                            }}
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
                                                                                : 'bg-blue-500 hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400'
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
                                                                            onBlur={(e) => {
                                                                                field.onBlur();
                                                                                checkEmailAvailability(e.target.value, 'alt_email');
                                                                            }}
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
                                                                                : 'bg-blue-500 hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400'
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
                                            <div className="mt-6 mb-8">
                                                <h2 className="text-l font-bold text-gray-900">Present Address</h2>

                                                <div className="mt-4 grid grid-cols-1 gap-6 px-4 md:grid-cols-3">
                                                    {/* Region Dropdown */}
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <label className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                                                Region *
                                                            </label>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <HelpCircle
                                                                        size={16}
                                                                        className="cursor-pointer text-gray-500 hover:text-gray-700"
                                                                    />
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p className="max-w-xs text-sm">Select your region.</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </div>
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
                                                                    <Input placeholder="123 Main Street" {...field} autoComplete="address-line1" />
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
                                            {/* Permanent Address Section */}
                                            <div className="mt-4">
                                                <h2 className="text-l font-bold text-gray-900">Permanent Address</h2>

                                                {/* Checkbox to sync addresses */}
                                                <div className="mt-2 flex items-center space-x-2 px-4">
                                                    <Checkbox
                                                        id="same-as-present"
                                                        checked={isSameAddress}
                                                        onCheckedChange={(checked) => {
                                                            if (checked === true) {
                                                                // 1. 🚀 FORCE UPDATE: Copy arrays immediately
                                                                // This makes the dropdown options available BEFORE the component re-renders
                                                                setPermanentRegions(presentRegions);
                                                                setPermanentProvinces(presentProvinces);
                                                                setPermanentCities(presentCities);
                                                                setPermanentBarangays(presentBarangays);

                                                                // 2. 🚀 FORCE UPDATE: Copy selection IDs immediately
                                                                setSelectedPermanentRegion(selectedPresentRegion);
                                                                setSelectedPermanentProvince(selectedPresentProvince);
                                                                setSelectedPermanentCity(selectedPresentCity);

                                                                // 3. 🚀 FORCE UPDATE: Copy text fields immediately
                                                                const values = form.getValues();
                                                                form.setValue('permanent_street', values.present_street || '', {
                                                                    shouldValidate: false,
                                                                });
                                                                form.setValue('permanent_zip', values.present_zip || '', { shouldValidate: false });
                                                                form.setValue('permanent_province', values.present_province || '', {
                                                                    shouldValidate: false,
                                                                });
                                                                form.setValue('permanent_city', values.present_city || '', { shouldValidate: false });
                                                                form.setValue('permanent_brgy', values.present_brgy || '', { shouldValidate: false });

                                                                setIsSameAddress(true);

                                                                setTimeout(() => {
                                                                    form.clearErrors('permanent_street');
                                                                    form.clearErrors('permanent_brgy');
                                                                    form.clearErrors('permanent_city');
                                                                    form.clearErrors('permanent_province');
                                                                    form.clearErrors('permanent_zip');
                                                                }, 100);
                                                            } else {
                                                                setIsSameAddress(false);
                                                            }
                                                        }}
                                                        className="data-[state=checked]:border-blue-500 data-[state=checked]:bg-blue-500 data-[state=checked]:text-white"
                                                    />
                                                    <Label htmlFor="same-as-present" className="text-sm font-normal text-gray-700">
                                                        Same as present address
                                                    </Label>
                                                </div>

                                                <div className="mt-4 grid grid-cols-1 gap-6 px-4 md:grid-cols-3">
                                                    {/* Region Dropdown */}
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <label className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                                                Region *
                                                            </label>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <HelpCircle
                                                                        size={16}
                                                                        className="cursor-pointer text-gray-500 hover:text-gray-700"
                                                                    />
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p className="max-w-xs text-sm">Select your region.</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </div>
                                                        <div className="mt-2">
                                                            <SearchableSelect
                                                                value={selectedPermanentRegion}
                                                                onChange={(value) => setSelectedPermanentRegion(value)}
                                                                options={permanentRegions.map((r) => ({ label: r.name, value: r.code }))}
                                                                placeholder="Select Region"
                                                                searchPlaceholder="Search region..."
                                                                disabled={isSameAddress}
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Province/State */}
                                                    <FormField
                                                        control={form.control}
                                                        name="permanent_province"
                                                        render={({ field }) => (
                                                            <FormItem className="flex flex-col">
                                                                <LabelWithTooltip label="Province/State *" tooltip="Specify province or state." />
                                                                <SearchableSelect
                                                                    key={`prov_${isSameAddress}_${selectedPermanentProvince}`}
                                                                    value={selectedPermanentProvince}
                                                                    onChange={(value) => {
                                                                        setSelectedPermanentProvince(value);
                                                                        const selected = permanentProvinces.find((p) => p.code === value);
                                                                        field.onChange(selected?.name || '');
                                                                    }}
                                                                    options={permanentProvinces.map((p) => ({ label: p.name, value: p.code }))}
                                                                    placeholder="Select Province"
                                                                    searchPlaceholder="Search province..."
                                                                    disabled={!selectedPermanentRegion || isSameAddress}
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
                                                            <FormItem>
                                                                <LabelWithTooltip
                                                                    label="City/Municipality *"
                                                                    tooltip="Enter city or municipality of residence."
                                                                />
                                                                {/* ⬇️ FIX: Add 'key' to force re-render when syncing */}
                                                                <SearchableSelect
                                                                    key={`city_${isSameAddress}_${selectedPermanentCity}`}
                                                                    value={selectedPermanentCity}
                                                                    onChange={(value) => {
                                                                        setSelectedPermanentCity(value);
                                                                        const selected = permanentCities.find((c) => c.code === value);
                                                                        field.onChange(selected?.name || '');
                                                                    }}
                                                                    options={permanentCities.map((c) => ({ label: c.name, value: c.code }))}
                                                                    placeholder="Select City/Municipality"
                                                                    searchPlaceholder="Search city..."
                                                                    disabled={!selectedPermanentProvince || isSameAddress}
                                                                />
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />

                                                    {/* Barangay */}
                                                    <FormField
                                                        control={form.control}
                                                        name="permanent_brgy"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <LabelWithTooltip label="Barangay *" tooltip="Enter barangay." />
                                                                {/* ⬇️ FIX: Add 'key' to force re-render when syncing */}
                                                                <SearchableSelect
                                                                    key={`brgy_${isSameAddress}_${field.value}`}
                                                                    value={permanentBarangays.find((b) => b.name === field.value)?.code || ''}
                                                                    onChange={(value) => {
                                                                        const selected = permanentBarangays.find((b) => b.code === value);
                                                                        field.onChange(selected?.name || '');
                                                                    }}
                                                                    options={permanentBarangays.map((b) => ({ label: b.name, value: b.code }))}
                                                                    placeholder="Select Barangay"
                                                                    searchPlaceholder="Search barangay..."
                                                                    disabled={!selectedPermanentCity || isSameAddress}
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
                                                                    tooltip="Enter your 4–6 digit postal ZIP code."
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
                                                                    rows={3}
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
                                                                    rows={3}
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

                                                            <div className="mt-1 grid grid-cols-1 gap-1 sm:grid-cols-2 lg:grid-cols-3">
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
                                                                            id={option}
                                                                            checked={Array.isArray(field.value) && field.value.includes(option)}
                                                                            onCheckedChange={(checked) => {
                                                                                const currentValue = Array.isArray(field.value) ? field.value : [];

                                                                                if (checked === true) {
                                                                                    field.onChange([...currentValue, option]);
                                                                                } else {
                                                                                    field.onChange(currentValue.filter((v: string) => v !== option));
                                                                                }
                                                                            }}
                                                                            className="data-[state=checked]:border-blue-500 data-[state=checked]:bg-blue-500 data-[state=checked]:text-white"
                                                                        />
                                                                        <Label htmlFor={option} className="text-sm font-normal text-gray-700">
                                                                            {option}
                                                                        </Label>
                                                                    </div>
                                                                ))}

                                                                {/* “Others” checkbox */}
                                                                <div className="flex items-center space-x-2">
                                                                    <Checkbox
                                                                        id="Others"
                                                                        checked={
                                                                            Array.isArray(field.value) &&
                                                                            field.value.some((v) => v.startsWith('Others'))
                                                                        }
                                                                        onCheckedChange={(checked) => {
                                                                            const currentValue = Array.isArray(field.value) ? field.value : [];

                                                                            if (checked === true) {
                                                                                if (!currentValue.some((v) => v.startsWith('Others'))) {
                                                                                    field.onChange([...currentValue, 'Others:']);
                                                                                }
                                                                            } else {
                                                                                field.onChange(
                                                                                    currentValue.filter((v: string) => !v.startsWith('Others')),
                                                                                );
                                                                            }
                                                                        }}
                                                                        className="data-[state=checked]:border-blue-500 data-[state=checked]:bg-blue-500 data-[state=checked]:text-white"
                                                                    />
                                                                    <Label htmlFor="Others" className="text-sm font-normal text-gray-700">
                                                                        Others (Please specify)
                                                                    </Label>
                                                                </div>
                                                            </div>

                                                            {/* "Others" text box */}
                                                            {Array.isArray(field.value) && field.value.some((v) => v.startsWith('Others')) && (
                                                                <Textarea
                                                                    rows={2}
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
                                                                                            With a physician’s recommendation certifying that the
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
                                                                                            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
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
                                                                    <RadioGroup className="flex flex-row gap-4" value={field.value || ''} onValueChange={field.onChange}>
                                                                        <div className="flex items-center space-x-2">
                                                                            <RadioGroupItem value="Living" id={`${field.name}-living`} />
                                                                            <label htmlFor={`${field.name}-living`} className="text-sm">Living</label>
                                                                        </div>
                                                                        <div className="flex items-center space-x-2">
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
                                                                <LabelWithTooltip label="Highest Educational Attainment " />
                                                                <FormControl>
                                                                    <Select onValueChange={field.onChange} value={field.value}>
                                                                        <SelectTrigger>
                                                                            <SelectValue placeholder="Select " />
                                                                        </SelectTrigger>
                                                                        <SelectContent>
                                                                            <SelectItem value="Kindergarten">Kindergarten</SelectItem>
                                                                            <SelectItem value="Elementary">Elementary</SelectItem>
                                                                            <SelectItem value="Elementary Undergraduate">
                                                                                Elementary Undergraduate
                                                                            </SelectItem>
                                                                            <SelectItem value="High School">High School</SelectItem>
                                                                            <SelectItem value="High School Undergraduate">
                                                                                High School Undergraduate
                                                                            </SelectItem>
                                                                            <SelectItem value="Vocational/Trade">Vocational/Trade</SelectItem>
                                                                            <SelectItem value="Graduate">Graduate</SelectItem>
                                                                            <SelectItem value="College Undergraduate">
                                                                                College Undergraduate
                                                                            </SelectItem>
                                                                            <SelectItem value="Post Graduate (Masters)">
                                                                                Post Graduate (Masters)
                                                                            </SelectItem>
                                                                            <SelectItem value="Post Graduate (PhD)">Post Graduate (PhD)</SelectItem>
                                                                        </SelectContent>
                                                                    </Select>
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
                                                                    <Select onValueChange={field.onChange} value={field.value}>
                                                                        <SelectTrigger>
                                                                            <SelectValue placeholder="Select " />
                                                                        </SelectTrigger>
                                                                        <SelectContent>
                                                                            <SelectItem value="Below 10,000">Below 10,000</SelectItem>
                                                                            <SelectItem value="10,000 - 20,000">10,000 - 20,000</SelectItem>
                                                                            <SelectItem value="20,000 - 40,000">20,000 - 40,000</SelectItem>
                                                                            <SelectItem value="40,000 - 70,000">40,000 - 70,000</SelectItem>
                                                                            <SelectItem value="70,000 - 100,000">70,000 - 100,000</SelectItem>
                                                                            <SelectItem value="100,000 - 200,000">100,000 - 200,000</SelectItem>
                                                                            <SelectItem value="Above 200,000">Above 200,000</SelectItem>
                                                                        </SelectContent>
                                                                    </Select>
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
                                                                        <RadioGroup className="flex flex-row gap-4" value={field.value === true ? 'true' : field.value === false ? 'false' : ''} onValueChange={(val) => {
                                                                                const boolValue = val === 'true';
                                                                                field.onChange(boolValue);
                                                                            }}>
                                                                            <div className="flex items-center space-x-2">
                                                                                <RadioGroupItem value="true" id={`${field.name}-yes`} />
                                                                                <label htmlFor={`${field.name}-yes`} className="text-sm">Yes</label>
                                                                            </div>
                                                                            <div className="flex items-center space-x-2">
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
                                                                <LabelWithTooltip label="Mother's Maiden Last Name" tooltip="" />
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
                                                                <LabelWithTooltip label="Mother's Maiden Middle Name" tooltip="" />
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
                                                                    <RadioGroup className="flex flex-row gap-4" value={field.value || ''} onValueChange={field.onChange}>
                                                                        <div className="flex items-center space-x-2">
                                                                            <RadioGroupItem value="Living" id={`${field.name}-living`} />
                                                                            <label htmlFor={`${field.name}-living`} className="text-sm">Living</label>
                                                                        </div>
                                                                        <div className="flex items-center space-x-2">
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
                                                                    <Select onValueChange={field.onChange} value={field.value}>
                                                                        <SelectTrigger>
                                                                            <SelectValue placeholder="Select " />
                                                                        </SelectTrigger>
                                                                        <SelectContent>
                                                                            <SelectItem value="Kindergarten">Kindergarten</SelectItem>
                                                                            <SelectItem value="Elementary">Elementary</SelectItem>
                                                                            <SelectItem value="Elementary Undergraduate">
                                                                                Elementary Undergraduate
                                                                            </SelectItem>
                                                                            <SelectItem value="High School">High School</SelectItem>
                                                                            <SelectItem value="High School Undergraduate">
                                                                                High School Undergraduate
                                                                            </SelectItem>
                                                                            <SelectItem value="Vocational/Trade">Vocational/Trade</SelectItem>
                                                                            <SelectItem value="Graduate">Graduate</SelectItem>
                                                                            <SelectItem value="College Undergraduate">
                                                                                College Undergraduate
                                                                            </SelectItem>
                                                                            <SelectItem value="Post Graduate (Masters)">
                                                                                Post Graduate (Masters)
                                                                            </SelectItem>
                                                                            <SelectItem value="Post Graduate (PhD)">Post Graduate (PhD)</SelectItem>
                                                                        </SelectContent>
                                                                    </Select>
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
                                                                    <Select onValueChange={field.onChange} value={field.value}>
                                                                        <SelectTrigger>
                                                                            <SelectValue placeholder="Select " />
                                                                        </SelectTrigger>
                                                                        <SelectContent>
                                                                            <SelectItem value="Below 10,000">Below 10,000</SelectItem>
                                                                            <SelectItem value="10,000 - 20,000">10,000 - 20,000</SelectItem>
                                                                            <SelectItem value="20,000 - 40,000">20,000 - 40,000</SelectItem>
                                                                            <SelectItem value="40,000 - 70,000">40,000 - 70,000</SelectItem>
                                                                            <SelectItem value="70,000 - 100,000">70,000 - 100,000</SelectItem>
                                                                            <SelectItem value="100,000 - 200,000">100,000 - 200,000</SelectItem>
                                                                            <SelectItem value="Above 200,000">Above 200,000</SelectItem>
                                                                        </SelectContent>
                                                                    </Select>
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
                                                                        <RadioGroup className="flex flex-row gap-4" value={field.value === true ? 'true' : field.value === false ? 'false' : ''} onValueChange={(val) => {
                                                                                const boolValue = val === 'true';
                                                                                field.onChange(boolValue);
                                                                            }}>
                                                                            <div className="flex items-center space-x-2">
                                                                                <RadioGroupItem value="true" id={`${field.name}-yes`} />
                                                                                <label htmlFor={`${field.name}-yes`} className="text-sm">Yes</label>
                                                                            </div>
                                                                            <div className="flex items-center space-x-2">
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
                                                            id="father-as-guardian"
                                                            checked={guardianSource === 'father'}
                                                            onCheckedChange={(checked) => {
                                                                if (checked === true) {
                                                                    setGuardianSource('father');
                                                                } else {
                                                                    setGuardianSource(null);
                                                                }
                                                            }}
                                                            className="data-[state=checked]:border-blue-500 data-[state=checked]:bg-blue-500 data-[state=checked]:text-white"
                                                        />
                                                        <Label htmlFor="father-as-guardian" className="text-sm font-normal text-gray-700">
                                                            Choose Father as Guardian
                                                        </Label>
                                                    </div>

                                                    <div className="flex items-center space-x-2">
                                                        <Checkbox
                                                            id="mother-as-guardian"
                                                            checked={guardianSource === 'mother'}
                                                            onCheckedChange={(checked) => {
                                                                if (checked === true) {
                                                                    setGuardianSource('mother');
                                                                } else {
                                                                    setGuardianSource(null);
                                                                }
                                                            }}
                                                            className="data-[state=checked]:border-blue-500 data-[state=checked]:bg-blue-500 data-[state=checked]:text-white"
                                                        />
                                                        <Label htmlFor="mother-as-guardian" className="text-sm font-normal text-gray-700">
                                                            Choose Mother as Guardian
                                                        </Label>
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
                                                                    <Input placeholder="" disabled={guardianSource !== null} {...field} />
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
                                                                    <Input placeholder="" disabled={guardianSource !== null} {...field} />
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
                                                                    <Input placeholder="" disabled={guardianSource !== null} {...field} />
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
                                                                    <Input placeholder="" disabled={guardianSource !== null} {...field} />
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
                                                            <FormItem className="flex flex-col">
                                                                <LabelWithTooltip
                                                                    label="Citizenship *"
                                                                    tooltip="Enter applicant's citizenship (e.g., Filipino)."
                                                                />
                                                                <CitizenshipSelect
                                                                    value={field.value}
                                                                    onChange={field.onChange}
                                                                    placeholder="Select citizenship"
                                                                    disabled={guardianSource !== null}
                                                                />
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
                                                                    <Input placeholder="" disabled={guardianSource !== null} {...field} />
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
                                                                    <Select
                                                                        onValueChange={field.onChange}
                                                                        value={field.value}
                                                                        disabled={guardianSource !== null}
                                                                    >
                                                                        <SelectTrigger>
                                                                            <SelectValue placeholder="Select " />
                                                                        </SelectTrigger>
                                                                        <SelectContent>
                                                                            <SelectItem value="Kindergarten">Kindergarten</SelectItem>
                                                                            <SelectItem value="Elementary">Elementary</SelectItem>
                                                                            <SelectItem value="Elementary Undergraduate">
                                                                                Elementary Undergraduate
                                                                            </SelectItem>
                                                                            <SelectItem value="High School">High School</SelectItem>
                                                                            <SelectItem value="High School Undergraduate">
                                                                                High School Undergraduate
                                                                            </SelectItem>
                                                                            <SelectItem value="Vocational/Trade">Vocational/Trade</SelectItem>
                                                                            <SelectItem value="Graduate">Graduate</SelectItem>
                                                                            <SelectItem value="College Undergraduate">
                                                                                College Undergraduate
                                                                            </SelectItem>
                                                                            <SelectItem value="Post Graduate (Masters)">
                                                                                Post Graduate (Masters)
                                                                            </SelectItem>
                                                                            <SelectItem value="Post Graduate (PhD)">Post Graduate (PhD)</SelectItem>
                                                                        </SelectContent>
                                                                    </Select>
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
                                                                    <Input placeholder="" disabled={guardianSource !== null} {...field} />
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
                                                                    <Select
                                                                        onValueChange={field.onChange}
                                                                        value={field.value}
                                                                        disabled={guardianSource !== null}
                                                                    >
                                                                        <SelectTrigger>
                                                                            <SelectValue placeholder="Select " />
                                                                        </SelectTrigger>
                                                                        <SelectContent>
                                                                            <SelectItem value="Below 10,000">Below 10,000</SelectItem>
                                                                            <SelectItem value="10,000 - 20,000">10,000 - 20,000</SelectItem>
                                                                            <SelectItem value="20,000 - 40,000">20,000 - 40,000</SelectItem>
                                                                            <SelectItem value="40,000 - 70,000">40,000 - 70,000</SelectItem>
                                                                            <SelectItem value="70,000 - 100,000">70,000 - 100,000</SelectItem>
                                                                            <SelectItem value="100,000 - 200,000">100,000 - 200,000</SelectItem>
                                                                            <SelectItem value="Above 200,000">Above 200,000</SelectItem>
                                                                        </SelectContent>
                                                                    </Select>
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
                                                                    <Input placeholder="" disabled={guardianSource !== null} {...field} />
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
                                                                    <Input placeholder="" disabled={guardianSource !== null} {...field} />
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
                                                                    <Input placeholder="" disabled={guardianSource !== null} {...field} />
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
                                                                    <Input placeholder="" disabled={guardianSource !== null} {...field} />
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
                                                                        <RadioGroup className="flex flex-row gap-4" value={field.value === true ? 'true' : field.value === false ? 'false' : ''} onValueChange={(val) => {
                                                                                const boolValue = val === 'true';
                                                                                field.onChange(boolValue);
                                                                            }}>
                                                                            <div className="flex items-center space-x-2">
                                                                                <RadioGroupItem value="true" id={`${field.name}-yes`} disabled={guardianSource !== null} />
                                                                                <label htmlFor={`${field.name}-yes`} className="text-sm">Yes</label>
                                                                            </div>
                                                                            <div className="flex items-center space-x-2">
                                                                                <RadioGroupItem value="false" id={`${field.name}-no`} disabled={guardianSource !== null} />
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
                                                                                disabled={guardianSource !== null}
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
                                                                    <RadioGroup className="mt-2 flex flex-row gap-4 pl-4" value={field.value === true ? 'true' : field.value === false ? 'false' : ''} onValueChange={(val) => {
                                                                            const boolVal = val === 'true';
                                                                            field.onChange(boolVal);

                                                                            const siblings = form.getValues('siblings') ?? [];

                                                                            if (boolVal && siblings.length === 0) {
                                                                                form.setValue('siblings', [
                                                                                    {
                                                                                        sibling_full_name: '',
                                                                                        sibling_grade_level: '',
                                                                                        sibling_id_number: '',
                                                                                    },
                                                                                ]);
                                                                            } else if (!boolVal) {
                                                                                form.setValue('siblings', []);
                                                                            }
                                                                        }}>
                                                                        <div className="flex items-center space-x-2">
                                                                            <RadioGroupItem value="true" id={`${field.name}-yes`} />
                                                                            <label htmlFor={`${field.name}-yes`} className="text-sm">Yes</label>
                                                                        </div>
                                                                        <div className="flex items-center space-x-2">
                                                                            <RadioGroupItem value="false" id={`${field.name}-no`} />
                                                                            <label htmlFor={`${field.name}-no`} className="text-sm">No</label>
                                                                        </div>
                                                                    </RadioGroup>
                                                                </FormControl>
                                                            </div>

                                                            {/* Dynamic Siblings Table */}
                                                            {field.value === true && (
                                                                <FormField
                                                                    control={form.control}
                                                                    name="siblings"
                                                                    render={({ field: siblingsField }) => (
                                                                        <FormItem>
                                                                            <div
                                                                                className={`mt-4 rounded-lg border p-4 shadow-sm ${form.formState.errors.siblings ? 'border-red-500' : ''}`}
                                                                            >
                                                                                <LabelWithTooltip
                                                                                    label="Siblings Currently Enrolled or Will Enroll"
                                                                                    tooltip="Provide the details of each sibling."
                                                                                />

                                                                                <div className="mt-3">
                                                                                    {siblingsField.value?.map((sibling, index) => (
                                                                                        <div
                                                                                            key={index}
                                                                                            className="mb-2 grid grid-cols-[1fr_1fr_1fr_auto] items-center gap-3"
                                                                                        >
                                                                                            {/* Grade Level */}
                                                                                            <FormField
                                                                                                control={form.control}
                                                                                                name={`siblings.${index}.sibling_grade_level`}
                                                                                                render={({ field }) => (
                                                                                                    <FormItem>
                                                                                                        <FormControl>
                                                                                                            <Input
                                                                                                                placeholder="Grade Level"
                                                                                                                {...field}
                                                                                                            />
                                                                                                        </FormControl>
                                                                                                        <FormMessage />
                                                                                                    </FormItem>
                                                                                                )}
                                                                                            />

                                                                                            {/* Full Name */}
                                                                                            <FormField
                                                                                                control={form.control}
                                                                                                name={`siblings.${index}.sibling_full_name`}
                                                                                                render={({ field }) => (
                                                                                                    <FormItem>
                                                                                                        <FormControl>
                                                                                                            <Input
                                                                                                                placeholder="Full Name"
                                                                                                                {...field}
                                                                                                            />
                                                                                                        </FormControl>
                                                                                                        <FormMessage />
                                                                                                    </FormItem>
                                                                                                )}
                                                                                            />

                                                                                            {/* ID Number */}
                                                                                            <FormField
                                                                                                control={form.control}
                                                                                                name={`siblings.${index}.sibling_id_number`}
                                                                                                render={({ field }) => (
                                                                                                    <FormItem>
                                                                                                        <FormControl>
                                                                                                            <Input
                                                                                                                placeholder="ID Number"
                                                                                                                {...field}
                                                                                                            />
                                                                                                        </FormControl>
                                                                                                        <FormMessage />
                                                                                                    </FormItem>
                                                                                                )}
                                                                                            />

                                                                                            {/* Remove Button */}
                                                                                            <Button
                                                                                                type="button"
                                                                                                variant="ghost"
                                                                                                size="icon"
                                                                                                onClick={() => {
                                                                                                    const updated = [...(siblingsField.value ?? [])];
                                                                                                    updated.splice(index, 1);
                                                                                                    siblingsField.onChange(updated);
                                                                                                }}
                                                                                                className="text-red-500 hover:text-red-700"
                                                                                            >
                                                                                                <Trash2 className="h-4 w-4" />
                                                                                            </Button>
                                                                                        </div>
                                                                                    ))}
                                                                                    <FormMessage />

                                                                                    {/* Add Sibling Button */}
                                                                                    <Button
                                                                                        type="button"
                                                                                        variant="outline"
                                                                                        size="sm"
                                                                                        onClick={() =>
                                                                                            siblingsField.onChange([
                                                                                                ...(siblingsField.value || []),
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
                                                                        </FormItem>
                                                                    )}
                                                                />
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
                                                                            <FormField
                                                                                control={form.control}
                                                                                name={`schools.${index}.school_name`}
                                                                                render={({ field }) => (
                                                                                    <FormItem>
                                                                                        <FormControl>
                                                                                            <Input placeholder="School Name" {...field} />
                                                                                        </FormControl>
                                                                                        <FormMessage />
                                                                                    </FormItem>
                                                                                )}
                                                                            />
                                                                            <FormField
                                                                                control={form.control}
                                                                                name={`schools.${index}.school_address`}
                                                                                render={({ field }) => (
                                                                                    <FormItem>
                                                                                        <FormControl>
                                                                                            <Input placeholder="School Address" {...field} />
                                                                                        </FormControl>
                                                                                        <FormMessage />
                                                                                    </FormItem>
                                                                                )}
                                                                            />
                                                                        </div>

                                                                        {/* Row 2: From Grade, To Grade, From Year, To Year */}
                                                                        <div className="mt-3 grid grid-cols-4 gap-3">
                                                                            <FormField
                                                                                control={form.control}
                                                                                name={`schools.${index}.from_grade`}
                                                                                render={({ field }) => (
                                                                                    <FormItem>
                                                                                        <FormControl>
                                                                                            <Input placeholder="From Grade" {...field} />
                                                                                        </FormControl>
                                                                                        <FormMessage />
                                                                                    </FormItem>
                                                                                )}
                                                                            />
                                                                            <FormField
                                                                                control={form.control}
                                                                                name={`schools.${index}.to_grade`}
                                                                                render={({ field }) => (
                                                                                    <FormItem>
                                                                                        <FormControl>
                                                                                            <Input placeholder="To Grade" {...field} />
                                                                                        </FormControl>
                                                                                        <FormMessage />
                                                                                    </FormItem>
                                                                                )}
                                                                            />
                                                                            <FormField
                                                                                control={form.control}
                                                                                name={`schools.${index}.from_year`}
                                                                                render={({ field }) => (
                                                                                    <FormItem>
                                                                                        <FormControl>
                                                                                            <Input placeholder="From Year" {...field} />
                                                                                        </FormControl>
                                                                                        <FormMessage />
                                                                                    </FormItem>
                                                                                )}
                                                                            />
                                                                            <FormField
                                                                                control={form.control}
                                                                                name={`schools.${index}.to_year`}
                                                                                render={({ field }) => (
                                                                                    <FormItem>
                                                                                        <FormControl>
                                                                                            <Input placeholder="To Year" {...field} />
                                                                                        </FormControl>
                                                                                        <FormMessage />
                                                                                    </FormItem>
                                                                                )}
                                                                            />
                                                                        </div>

                                                                        {/* Row 3: Honors, Average, Rank, Size */}
                                                                        <div className="mt-3 grid grid-cols-4 gap-3">
                                                                            <FormField
                                                                                control={form.control}
                                                                                name={`schools.${index}.honors_awards`}
                                                                                render={({ field }) => (
                                                                                    <FormItem>
                                                                                        <FormControl>
                                                                                            <Input placeholder="Honors and Awards" {...field} />
                                                                                        </FormControl>
                                                                                        <FormMessage />
                                                                                    </FormItem>
                                                                                )}
                                                                            />
                                                                            <FormField
                                                                                control={form.control}
                                                                                name={`schools.${index}.general_average`}
                                                                                render={({ field }) => (
                                                                                    <FormItem>
                                                                                        <FormControl>
                                                                                            <Input placeholder="General Average" {...field} />
                                                                                        </FormControl>
                                                                                        <FormMessage />
                                                                                    </FormItem>
                                                                                )}
                                                                            />
                                                                            <FormField
                                                                                control={form.control}
                                                                                name={`schools.${index}.class_rank`}
                                                                                render={({ field }) => (
                                                                                    <FormItem>
                                                                                        <FormControl>
                                                                                            <Input placeholder="Class Rank" {...field} />
                                                                                        </FormControl>
                                                                                        <FormMessage />
                                                                                    </FormItem>
                                                                                )}
                                                                            />
                                                                            <FormField
                                                                                control={form.control}
                                                                                name={`schools.${index}.class_size`}
                                                                                render={({ field }) => (
                                                                                    <FormItem>
                                                                                        <FormControl>
                                                                                            <Input placeholder="Class Size" {...field} />
                                                                                        </FormControl>
                                                                                        <FormMessage />
                                                                                    </FormItem>
                                                                                )}
                                                                            />
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
                                                                <FormMessage />

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
                                            <div className="mt-4 flex items-center space-x-2">
                                                <Checkbox
                                                    id="agreement"
                                                    checked={hasAgreed}
                                                    onCheckedChange={(checked) => setHasAgreed(checked === true)}
                                                    name="iAgree"
                                                    className="data-[state=checked]:border-blue-500 data-[state=checked]:bg-blue-500 data-[state=checked]:text-white"
                                                />
                                                <Label htmlFor="agreement">I Agree</Label>
                                            </div>
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
                <AlertDialog open={isDuplicateDialogOpen} onOpenChange={setIsDuplicateDialogOpen}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Duplicate Application</AlertDialogTitle>
                            <AlertDialogDescription>You have already submitted an application.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogAction onClick={() => setIsDuplicateDialogOpen(false)}>OK</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
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
