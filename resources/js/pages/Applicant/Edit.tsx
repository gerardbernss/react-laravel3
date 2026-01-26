import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { Head, usePage, router } from '@inertiajs/react';
import { ArrowLeft, ClipboardList, GraduationCap, HelpCircle, School, Trash2, User, UserPlus, Users } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/applicant/dashboard' },
    { title: 'Edit Profile', href: '/applicant/profile/edit' },
];

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

const applicantFormSchema = z.object({
    school_year: z.string().optional(),
    year_level: z.string().optional(),
    semester: z.string().optional(),
    strand: z.string().optional(),
    classification: z.string().optional(),
    learning_mode: z.string().optional(),
    last_name: z.string().optional(),
    first_name: z.string().optional(),
    middle_name: z.string().optional(),
    suffix: z.string().optional(),
    learner_reference_number: z.string().optional(),
    gender: z.string().optional(),
    citizenship: z.string().optional(),
    religion: z.string().optional(),
    date_of_birth: z.string().optional(),
    place_of_birth: z.string().optional(),
    has_sibling: z.boolean().optional(),
    alt_email: z.string().optional(),
    mobile_number: z.string().optional(),
    present_street: z.string().optional(),
    present_brgy: z.string().optional(),
    present_city: z.string().optional(),
    present_province: z.string().optional(),
    present_zip: z.string().optional(),
    permanent_street: z.string().optional(),
    permanent_brgy: z.string().optional(),
    permanent_city: z.string().optional(),
    permanent_province: z.string().optional(),
    permanent_zip: z.string().optional(),
    stopped_studying: z.string().optional(),
    accelerated: z.string().optional(),
    health_conditions: z.union([z.string(), z.array(z.string())]).optional(),
    father_lname: z.string().optional(),
    father_fname: z.string().optional(),
    father_mname: z.string().optional(),
    father_living: z.string().optional(),
    father_citizenship: z.string().optional(),
    father_religion: z.string().optional(),
    father_highest_educ: z.string().optional(),
    father_occupation: z.string().optional(),
    father_income: z.string().optional(),
    father_business_emp: z.string().optional(),
    father_business_address: z.string().optional(),
    father_contact_no: z.string().optional(),
    father_email: z.string().optional(),
    father_slu_employee: z.boolean().optional(),
    father_slu_dept: z.string().optional(),
    mother_lname: z.string().optional(),
    mother_fname: z.string().optional(),
    mother_mname: z.string().optional(),
    mother_living: z.string().optional(),
    mother_citizenship: z.string().optional(),
    mother_religion: z.string().optional(),
    mother_highest_educ: z.string().optional(),
    mother_occupation: z.string().optional(),
    mother_income: z.string().optional(),
    mother_business_emp: z.string().optional(),
    mother_business_address: z.string().optional(),
    mother_contact_no: z.string().optional(),
    mother_email: z.string().optional(),
    mother_slu_employee: z.boolean().optional(),
    mother_slu_dept: z.string().optional(),
    guardian_lname: z.string().optional(),
    guardian_fname: z.string().optional(),
    guardian_mname: z.string().optional(),
    guardian_relationship: z.string().optional(),
    guardian_citizenship: z.string().optional(),
    guardian_religion: z.string().optional(),
    guardian_highest_educ: z.string().optional(),
    guardian_occupation: z.string().optional(),
    guardian_income: z.string().optional(),
    guardian_business_emp: z.string().optional(),
    guardian_business_address: z.string().optional(),
    guardian_contact_no: z.string().optional(),
    guardian_email: z.string().optional(),
    guardian_slu_employee: z.boolean().optional(),
    guardian_slu_dept: z.string().optional(),
    emergency_contact_name: z.string().optional(),
    emergency_relationship: z.string().optional(),
    emergency_home_phone: z.string().optional(),
    emergency_mobile_phone: z.string().optional(),
    emergency_email: z.string().optional(),
    siblings: z
        .array(
            z.object({
                sibling_full_name: z.string().optional(),
                sibling_grade_level: z.string().optional(),
                sibling_id_number: z.string().optional(),
            }),
        )
        .optional(),
    schools: z
        .array(
            z.object({
                school_name: z.string().optional(),
                school_address: z.string().optional(),
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
        .optional(),
});

type ApplicantFormValues = z.infer<typeof applicantFormSchema>;

const FormNavigation = () => {
    const [activeSection, setActiveSection] = React.useState('application');

    React.useEffect(() => {
        const handleScroll = () => {
            const sections = ['application', 'personal', 'family', 'siblings', 'education'];

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
            const offset = 190;
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
        { id: 'siblings', label: 'Siblings', icon: <UserPlus className="h-5 w-5" /> },
        { id: 'education', label: 'Education', icon: <GraduationCap className="h-5 w-5" /> },
    ];
    return (
        <div className="sticky top-0 z-50 mb-4 w-full rounded-lg bg-white shadow-md">
            <div className="flex items-center justify-between overflow-x-auto px-25 py-4">
                {navItems.map((item, index) => (
                    <div key={item.id} className="flex items-center">
                        <button
                            type="button"
                            onClick={() => scrollToSection(item.id)}
                            className={`flex flex-col items-center px-3 text-center transition-colors`}
                        >
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

                        {index < navItems.length - 1 && <div className="mx-2 h-0.5 w-31 bg-gray-300"></div>}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default function EditApplicant() {
    const { props } = usePage<{ applicant: any }>();
    const applicant = props.applicant;
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [pendingFormData, setPendingFormData] = useState<ApplicantFormValues | null>(null);

    const toBoolean = (value: any): boolean => {
        return value === true || value === 1 || value === '1';
    };

    const form = useForm<ApplicantFormValues>({
        resolver: zodResolver(applicantFormSchema),
        mode: 'onChange',
        defaultValues: applicant
            ? {
                  // Initialize with empty strings if null to avoid controlled/uncontrolled warnings
                  school_year: applicant.school_year || '',
                  year_level: applicant.year_level || '',
                  semester: applicant.semester || '',
                  strand: applicant.strand || '',
                  classification: applicant.classification || '',
                  learning_mode: applicant.learning_mode || '',

                  last_name: applicant.personal_data.last_name || '',
                  first_name: applicant.personal_data.first_name || '',
                  middle_name: applicant.personal_data.middle_name || '',
                  suffix: applicant.personal_data.suffix || '',
                  learner_reference_number: applicant.personal_data.learner_reference_number || '',
                  gender: applicant.personal_data.gender || '',
                  citizenship: applicant.personal_data.citizenship || '',
                  religion: applicant.personal_data.religion || '',
                  date_of_birth: applicant.personal_data.date_of_birth || '',
                  place_of_birth: applicant.personal_data.place_of_birth || '',
                  has_sibling: toBoolean(applicant.personal_data?.has_sibling) || false,
                  alt_email: applicant.personal_data.alt_email || '',
                  mobile_number: applicant.personal_data.mobile_number || '',
                  present_street: applicant.personal_data.present_street || '',
                  present_brgy: applicant.personal_data.present_brgy || '',
                  present_city: applicant.personal_data.present_city || '',
                  present_province: applicant.personal_data.present_province || '',
                  present_zip: applicant.personal_data.present_zip || '',
                  permanent_street: applicant.personal_data.permanent_street || '',
                  permanent_brgy: applicant.personal_data.permanent_brgy || '',
                  permanent_city: applicant.personal_data.permanent_city || '',
                  permanent_province: applicant.personal_data.permanent_province || '',
                  permanent_zip: applicant.personal_data.permanent_zip || '',
                  stopped_studying: applicant.personal_data.stopped_studying || '',
                  accelerated: applicant.personal_data.accelerated || '',
                  health_conditions: applicant.personal_data.health_conditions || [],

                  father_lname: applicant.personal_data.family_background?.father_lname || '',
                  father_fname: applicant.personal_data.family_background?.father_fname || '',
                  father_mname: applicant.personal_data.family_background?.father_mname || '',
                  father_living: applicant.personal_data.family_background?.father_living || '',
                  father_citizenship: applicant.personal_data.family_background?.father_citizenship || '',
                  father_religion: applicant.personal_data.family_background?.father_religion || '',
                  father_highest_educ: applicant.personal_data.family_background?.father_highest_educ || '',
                  father_occupation: applicant.personal_data.family_background?.father_occupation || '',
                  father_income: applicant.personal_data.family_background?.father_income || '',
                  father_business_emp: applicant.personal_data.family_background?.father_business_emp || '',
                  father_business_address: applicant.personal_data.family_background?.father_business_address || '',
                  father_contact_no: applicant.personal_data.family_background?.father_contact_no || '',
                  father_email: applicant.personal_data.family_background?.father_email || '',
                  father_slu_employee: toBoolean(applicant.personal_data.family_background?.father_slu_employee) || false,
                  father_slu_dept: applicant.personal_data.family_background?.father_slu_dept || '',

                  mother_lname: applicant.personal_data.family_background?.mother_lname || '',
                  mother_fname: applicant.personal_data.family_background?.mother_fname || '',
                  mother_mname: applicant.personal_data.family_background?.mother_mname || '',
                  mother_living: applicant.personal_data.family_background?.mother_living || '',
                  mother_citizenship: applicant.personal_data.family_background?.mother_citizenship || '',
                  mother_religion: applicant.personal_data.family_background?.mother_religion || '',
                  mother_highest_educ: applicant.personal_data.family_background?.mother_highest_educ || '',
                  mother_occupation: applicant.personal_data.family_background?.mother_occupation || '',
                  mother_income: applicant.personal_data.family_background?.mother_income || '',
                  mother_business_emp: applicant.personal_data.family_background?.mother_business_emp || '',
                  mother_business_address: applicant.personal_data.family_background?.mother_business_address || '',
                  mother_contact_no: applicant.personal_data.family_background?.mother_contact_no || '',
                  mother_email: applicant.personal_data.family_background?.mother_email || '',
                  mother_slu_employee: toBoolean(applicant.personal_data.family_background?.mother_slu_employee) || false,
                  mother_slu_dept: applicant.personal_data.family_background?.mother_slu_dept || '',

                  guardian_lname: applicant.personal_data.family_background?.guardian_lname || '',
                  guardian_fname: applicant.personal_data.family_background?.guardian_fname || '',
                  guardian_mname: applicant.personal_data.family_background?.guardian_mname || '',
                  guardian_relationship: applicant.personal_data.family_background?.guardian_relationship || '',
                  guardian_citizenship: applicant.personal_data.family_background?.guardian_citizenship || '',
                  guardian_religion: applicant.personal_data.family_background?.guardian_religion || '',
                  guardian_highest_educ: applicant.personal_data.family_background?.guardian_highest_educ || '',
                  guardian_occupation: applicant.personal_data.family_background?.guardian_occupation || '',
                  guardian_income: applicant.personal_data.family_background?.guardian_income || '',
                  guardian_business_emp: applicant.personal_data.family_background?.guardian_business_emp || '',
                  guardian_business_address: applicant.personal_data.family_background?.guardian_business_address || '',
                  guardian_contact_no: applicant.personal_data.family_background?.guardian_contact_no || '',
                  guardian_email: applicant.personal_data.family_background?.guardian_email || '',
                  guardian_slu_employee: toBoolean(applicant.personal_data.family_background?.guardian_slu_employee) || false,
                  guardian_slu_dept: applicant.personal_data.family_background?.guardian_slu_dept || '',

                  emergency_contact_name: applicant.personal_data.family_background?.emergency_contact_name || '',
                  emergency_relationship: applicant.personal_data.family_background?.emergency_relationship || '',
                  emergency_home_phone: applicant.personal_data.family_background?.emergency_home_phone || '',
                  emergency_mobile_phone: applicant.personal_data.family_background?.emergency_mobile_phone || '',
                  emergency_email: applicant.personal_data.family_background?.emergency_email || '',

                  siblings:
                      applicant.personal_data.siblings?.map((sib: any) => ({
                          sibling_full_name: sib.sibling_full_name || '',
                          sibling_grade_level: sib.sibling_grade_level || '',
                          sibling_id_number: sib.sibling_id_number || '',
                      })) || [],
                  schools:
                      applicant.educational_background?.map((school: any) => ({
                          school_name: school.school_name || '',
                          school_address: school.school_address || '',
                          from_grade: school.from_grade || '',
                          to_grade: school.to_grade || '',
                          from_year: school.from_year || '',
                          to_year: school.to_year || '',
                          honors_awards: school.honors_awards || '',
                          general_average: school.general_average || '',
                          class_rank: school.class_rank || '',
                          class_size: school.class_size || '',
                      })) || [],
              }
            : {},
    });

    useEffect(() => {
        if (applicant) {
            const formatDate = (date: string | null) => {
                if (!date) return '';
                const d = new Date(date);
                if (isNaN(d.getTime())) return '';
                return d.toISOString().split('T')[0];
            };
            // Ideally should reset here too, but for now trusting initial state from prop
        }
    }, [applicant]); // Removed form dependency to avoid loops

    function onSubmit(values: ApplicantFormValues) {
        setPendingFormData(values);
        setShowConfirmDialog(true);
    }

    function handleConfirmedSubmit() {
        if (!pendingFormData) return;

        router.put('/applicant/profile', pendingFormData, {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                setShowConfirmDialog(false);
                setPendingFormData(null);
                toast.success('Profile updated successfully!');
            },
            onError: (errors) => {
                console.error('Backend errors:', errors);
                toast.error('Failed to update profile. Please check the form.');
                setShowConfirmDialog(false);
                setPendingFormData(null);
            },
        });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Edit Profile" />

            <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirm Changes</DialogTitle>
                        <DialogDescription>Are you sure you want to save the changes to your information?</DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            className="mr-1 flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                            type="button"
                            variant="outline"
                            onClick={() => {
                                setShowConfirmDialog(false);
                                setPendingFormData(null);
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            className="flex items-center gap-2 rounded-lg bg-[#073066] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#05509e]"
                            type="button"
                            onClick={handleConfirmedSubmit}
                        >
                            Confirm
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Form {...form}>
                <TooltipProvider>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="min-h-screen bg-[#f5f5f5]">
                            <div className="sticky top-0 z-50 bg-white shadow-sm">
                                <div className="mx-auto max-w-[1500px] px-10 pt-8 pb-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <button
                                                type="button"
                                                className="rounded-full p-2 transition-colors hover:bg-blue-100"
                                                onClick={() => window.history.back()}
                                            >
                                                <ArrowLeft className="h-5 w-5" />
                                            </button>
                                            <div>
                                                <h1 className="text-3xl font-bold text-gray-900">Edit Profile</h1>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                type="button"
                                                onClick={() => {
                                                    if (!form.formState.isDirty) {
                                                        window.history.back();
                                                        return;
                                                    }
                                                    if (confirm('Are you sure you want to discard changes?')) {
                                                        window.history.back();
                                                    }
                                                }}
                                                className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                                            >
                                                Discard
                                            </Button>

                                            <Button
                                                type="submit"
                                                disabled={!form.formState.isDirty || form.formState.isSubmitting}
                                                className="flex items-center gap-2 rounded-lg bg-[#073066] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#05509e]"
                                            >
                                                Save Changes
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                                <FormNavigation />
                            </div>

                            <div className="mx-auto max-w-[1500px] px-10 py-8">
                                {/* Application Information */}
                                <div id="application" className="rounded-lg border pb-6 shadow-sm">
                                    <div className="mb-6 rounded-tl-lg rounded-tr-lg bg-[#004c88] p-4">
                                        <h2 className="text-xl font-bold text-white">Application Information</h2>
                                    </div>
                                    <div className="space-y-6 px-4">
                                        <div className="grid grid-cols-2 gap-6">
                                            <FormField
                                                control={form.control}
                                                name="school_year"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <LabelWithTooltip label="School Year" />
                                                        <FormControl>
                                                            <Input {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                        {/* Other app fields ... */}
                                    </div>
                                </div>
                                {/* Personal Information - including Health Conditions */}
                                <div id="personal" className="rounded-lg border pb-6 shadow-sm">
                                    <div className="mb-6 rounded-tl-lg rounded-tr-lg bg-[#004c88] p-4">
                                        <h2 className="text-xl font-bold text-white">Personal Information</h2>
                                    </div>
                                    <div className="px-4">
                                        <div className="grid grid-cols-3 gap-6">
                                            <FormField control={form.control} name="last_name" render={({ field }) => <FormItem><LabelWithTooltip label="Last Name *" /><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} />
                                            <FormField control={form.control} name="first_name" render={({ field }) => <FormItem><LabelWithTooltip label="First Name *" /><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} />
                                            <FormField control={form.control} name="middle_name" render={({ field }) => <FormItem><LabelWithTooltip label="Middle Name *" /><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} />
                                        </div>
                                        {/* Health Conditions Replacement */}
                                        <div className="mt-6">
                                            <FormField
                                                control={form.control}
                                                name="health_conditions"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Health Conditions</FormLabel>
                                                        <div className="grid grid-cols-3 gap-4 mt-2">
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
                                                                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                                                        {option}
                                                                    </label>
                                                                </div>
                                                            ))}
                                                        </div>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Family Background - Father's Details Example */}
                                <div id="family" className="rounded-lg border pb-6 shadow-sm">
                                    <div className="mb-6 rounded-tl-lg rounded-tr-lg bg-[#004c88] p-4">
                                        <h2 className="text-xl font-bold text-white">Family Background</h2>
                                    </div>
                                    <div className="px-4">
                                        <div className="grid grid-cols-3 gap-6">
                                            <FormField control={form.control} name="father_lname" render={({ field }) => <FormItem><LabelWithTooltip label="Father's Last Name" /><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} />
                                            {/* Father Living Radio Replacement */}
                                            <FormField
                                                control={form.control}
                                                name="father_living"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <LabelWithTooltip label="Father's Status" />
                                                        <FormControl>
                                                            <div className="flex gap-4">
                                                                <label className="flex items-center gap-2 text-sm">
                                                                    <input type="radio" value="Living" checked={field.value === 'Living'} onChange={() => field.onChange('Living')} className="accent-[#073066]" />
                                                                    Living
                                                                </label>
                                                                <label className="flex items-center gap-2 text-sm">
                                                                    <input type="radio" value="Deceased" checked={field.value === 'Deceased'} onChange={() => field.onChange('Deceased')} className="accent-[#073066]" />
                                                                    Deceased
                                                                </label>
                                                            </div>
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    </div>
                                </div>
                                {/* Siblings - Using Native Radio */}
                                <div id="siblings" className="rounded-lg border pb-6 shadow-sm">
                                    <div className="mb-6 rounded-tl-lg rounded-tr-lg bg-[#004c88] p-4">
                                        <h2 className="text-xl font-bold text-white">Siblings</h2>
                                    </div>
                                    <div className="px-4">
                                        <FormField
                                            control={form.control}
                                            name="has_sibling"
                                            render={({ field }) => {
                                                const hasSibling = field.value === true;
                                                const siblings = form.watch('siblings');
                                                return (
                                                    <FormItem>
                                                        <div className="flex items-center gap-4">
                                                            <LabelWithTooltip label="Has siblings in SLU?" />
                                                            <FormControl>
                                                                <div className="flex gap-4">
                                                                    <label className="flex items-center gap-2 text-sm">
                                                                        <input type="radio" value="true" checked={hasSibling === true} onChange={() => { field.onChange(true); if (!form.getValues('siblings')?.length) form.setValue('siblings', [{ sibling_full_name: '', sibling_grade_level: '', sibling_id_number: '' }]); }} className="accent-[#073066]" />
                                                                        Yes
                                                                    </label>
                                                                    <label className="flex items-center gap-2 text-sm">
                                                                        <input type="radio" value="false" checked={hasSibling === false} onChange={() => { field.onChange(false); form.setValue('siblings', undefined); }} className="accent-[#073066]" />
                                                                        No
                                                                    </label>
                                                                </div>
                                                            </FormControl>
                                                        </div>
                                                        {hasSibling && siblings && siblings.length > 0 && (
                                                            <div className="mt-4 space-y-2">
                                                                {siblings.map((sibling, index) => (
                                                                    <div key={index} className="grid grid-cols-3 gap-2">
                                                                        <Input placeholder="Name" {...form.register(`siblings.${index}.sibling_full_name`)} />
                                                                        <Input placeholder="Grade" {...form.register(`siblings.${index}.sibling_grade_level`)} />
                                                                        <Input placeholder="ID" {...form.register(`siblings.${index}.sibling_id_number`)} />
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </FormItem>
                                                )
                                            }}
                                        />
                                    </div>
                                </div>
                                {/* Education section remains largely same using Input/Button */}
                                <div id="education" className="rounded-lg border pb-6 shadow-sm">
                                    <div className="mb-6 rounded-tl-lg rounded-tr-lg bg-[#004c88] p-4">
                                        <h2 className="text-xl font-bold text-white">Education</h2>
                                    </div>
                                    <div className="px-4">
                                         <FormField control={form.control} name="schools" render={() => (
                                             <FormItem>
                                                 {form.watch('schools')?.map((school, index) => (
                                                     <div key={index} className="mb-4 border p-4 rounded">
                                                         <Input placeholder="School Name" {...form.register(`schools.${index}.school_name`)} className="mb-2" />
                                                         <Button type="button" variant="ghost" className="text-red-500" onClick={() => { const s = [...(form.getValues('schools')||[])]; s.splice(index, 1); form.setValue('schools', s); }}>Remove</Button>
                                                     </div>
                                                 ))}
                                                 <Button type="button" variant="outline" onClick={() => form.setValue('schools', [...(form.getValues('schools')||[]), { school_name: '' }])}>Add School</Button>
                                             </FormItem>
                                         )} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </form>
                </TooltipProvider>
            </Form>
        </AppLayout>
    );
}
