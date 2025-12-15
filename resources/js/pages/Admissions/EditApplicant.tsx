import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { Head, router, usePage } from '@inertiajs/react';
import { HelpCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { HiArrowLeft } from 'react-icons/hi';
import { Toaster, toast } from 'sonner';
import { z } from 'zod';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Applicant List', href: '/admissions/applicants' },
    { title: 'Edit Applicant', href: '/admissions/applicants/${applicant.id}/edit' },
];

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

const applicantFormSchema = z.object({
    // Application info
    application_date: z.string().optional(),
    prio_no: z.string().optional(),
    business_unit: z.string().optional(),
    campus_site: z.string().optional(),
    entry_class: z.string().optional(),
    stud_batch: z.string().optional(),
    semester: z.string().optional(),
    schedule_pref: z.string().optional(),
    pchoice1: z.string().optional(),
    pchoice2: z.string().optional(),
    pchoice3: z.string().optional(),
    curr_code: z.string().optional(),
    year_level: z.string().optional(),
    // Personal info
    lrn: z.string().optional(),
    first_name: z.string().optional(),
    middle_name: z.string().optional(),
    last_name: z.string().optional(),
    suffix: z.string().optional(),
    gender: z.string().optional(),
    citizenship: z.string().optional(),
    religion: z.string().optional(),
    date_of_birth: z.string().optional(),
    place_of_birth: z.string().optional(),
    civil_status: z.string().optional(),
    birth_order: z.string().optional(),
    mother_tongue: z.string().optional(),
    ethnicity: z.string().optional(),

    // Contact info
    phone: z.string().optional(),
    email: z.string().optional(),
    street: z.string().optional(),
    brgy: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zip_code: z.string().optional(),
    father_name: z.string().optional(),
    father_number: z.string().optional(),

    mother_name: z.string().optional(),
    mother_number: z.string().optional(),
    emergency_contact_name: z.string().optional(),
    emergency_contact_number: z.string().optional(),

    // Other info
    financial_source: z.string().optional(),
    exam_schedule: z.string().optional(),
});

type ApplicantFormValues = z.infer<typeof applicantFormSchema>;

export default function EditApplicant() {
    const { props } = usePage<{ applicant: any }>();
    const applicant = props.applicant;
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [pendingFormData, setPendingFormData] = useState<ApplicantFormValues | null>(null);

    const form = useForm<ApplicantFormValues>({
        resolver: zodResolver(applicantFormSchema),
        mode: 'onChange',
        defaultValues: applicant
            ? {
                  application_date: applicant.application_date || '',
                  prio_no: applicant.prio_no || '',
                  business_unit: applicant.business_unit || '',
                  campus_site: applicant.campus_site || '',
                  entry_class: applicant.entry_class || '',
                  stud_batch: applicant.stud_batch || '',
                  semester: applicant.semester || '',
                  schedule_pref: applicant.schedule_pref || '',
                  pchoice1: applicant.pchoice1 || '',
                  pchoice2: applicant.pchoice2 || '',
                  pchoice3: applicant.pchoice3 || '',
                  curr_code: applicant.curr_code || '',
                  year_level: applicant.year_level || '',

                  lrn: applicant.lrn || '',
                  first_name: applicant.first_name || '',
                  middle_name: applicant.middle_name || '',
                  last_name: applicant.last_name || '',
                  suffix: applicant.suffix || '',
                  gender: applicant.gender || '',
                  citizenship: applicant.citizenship || '',
                  religion: applicant.religion || '',
                  date_of_birth: applicant.date_of_birth || '',
                  place_of_birth: applicant.place_of_birth || '',
                  civil_status: applicant.civil_status || '',
                  birth_order: applicant.birth_order || '',
                  mother_tongue: applicant.mother_tongue || '',
                  ethnicity: applicant.ethnicity || '',

                  email: applicant.email || '',
                  phone: applicant.phone || '',
                  street: applicant.street || '',
                  brgy: applicant.brgy || '',
                  city: applicant.city || '',
                  state: applicant.state || '',
                  zip_code: applicant.zip_code || '',
                  father_name: applicant.father_name || '',
                  father_number: applicant.father_number || '',
                  mother_name: applicant.mother_name || '',
                  mother_number: applicant.mother_number || '',
                  emergency_contact_name: applicant.emergency_contact_name || '',
                  emergency_contact_number: applicant.emergency_contact_number || '',

                  financial_source: applicant.financial_source || '',
                  exam_schedule: applicant.exam_schedule || '',
              }
            : {},
    });

    // Check if form has been modified
    const isDirty = form.formState.isDirty;

    useEffect(() => {
        if (applicant) {
            const formatDate = (date: string | null) => {
                if (!date) return '';
                const d = new Date(date);
                if (isNaN(d.getTime())) return '';
                return d.toISOString().split('T')[0];
            };

            form.reset({
                //application info
                application_date: formatDate(applicant.application_date) || '',
                prio_no: applicant.prio_no || '',
                business_unit: applicant.business_unit || '',
                campus_site: applicant.campus_site || '',
                entry_class: applicant.entry_class || '',
                stud_batch: applicant.stud_batch || '',
                semester: applicant.semester || '',
                schedule_pref: applicant.schedule_pref || '',
                pchoice1: applicant.pchoice1 || '',
                pchoice2: applicant.pchoice2 || '',
                pchoice3: applicant.pchoice3 || '',
                curr_code: applicant.curr_code || '',
                year_level: applicant.year_level || '',

                //personal
                lrn: applicant.lrn || '',
                first_name: applicant.first_name || '',
                middle_name: applicant.middle_name || '',
                last_name: applicant.last_name || '',
                suffix: applicant.suffix || '',
                gender: applicant.gender || '',
                citizenship: applicant.citizenship || '',
                religion: applicant.religion || '',
                date_of_birth: formatDate(applicant.date_of_birth) || '',
                place_of_birth: applicant.place_of_birth || '',
                civil_status: applicant.civil_status || '',
                birth_order: applicant.birth_order || '',
                mother_tongue: applicant.mother_tongue || '',
                ethnicity: applicant.ethnicity || '',

                //contact info
                email: applicant.email || '',
                phone: applicant.phone || '',
                street: applicant.street || '',
                brgy: applicant.brgy || '',
                city: applicant.city || '',
                state: applicant.state || '',
                zip_code: applicant.zip_code || '',
                father_name: applicant.father_name || '',
                father_number: applicant.father_number || '',
                mother_name: applicant.mother_name || '',
                mother_number: applicant.mother_number || '',
                emergency_contact_name: applicant.emergency_contact_name || '',
                emergency_contact_number: applicant.emergency_contact_number || '',
                financial_source: applicant.financial_source || '',
                exam_schedule: formatDate(applicant.exam_schedule) || '',
            });
        }
    }, [applicant, form]);

    // Handle form submission - show confirmation dialog first
    function onSubmit(values: ApplicantFormValues) {
        setPendingFormData(values);
        setShowConfirmDialog(true);
    }

    // Handle confirmed submission
    function handleConfirmedSubmit() {
        if (!pendingFormData) return;

        console.log('=== FORM SUBMISSION DEBUG ===');
        console.log('Form Values:', pendingFormData);
        console.log('Applicant ID:', applicant.id);

        router.put(`/admissions/applicants/${applicant.id}`, pendingFormData, {
            preserveScroll: true, // Stay at current scroll position
            preserveState: true, // Preserve current component state
            onSuccess: () => {
                console.log('Applicant updated successfully!');
                toast.success('Applicant updated successfully!');
                setShowConfirmDialog(false);
                setPendingFormData(null);
            },
            onError: (errors) => {
                console.error('Backend errors:', errors);
                Object.keys(errors).forEach((key) => {
                    form.setError(key as any, {
                        type: 'server',
                        message: errors[key],
                    });
                });
                toast.error('Failed to update. Please check the form.');
                setShowConfirmDialog(false);
                setPendingFormData(null);
            },
        });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div>
                <Toaster position="top-right" richColors />
            </div>
            <Head title="Edit Applicant" />

            {/* Confirmation Dialog */}
            <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirm Changes</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to save the changes to this applicant's information? This action will update the existing record.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            className="mr-2"
                            type="button"
                            variant="outline"
                            onClick={() => {
                                setShowConfirmDialog(false);
                                setPendingFormData(null);
                            }}
                        >
                            Cancel
                        </Button>
                        <Button type="button" onClick={handleConfirmedSubmit}>
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <div className="mx-auto mt-8 w-full max-w-[1200px] rounded-lg p-10">
                <div className="mb-8">
                    {/* Back link */}
                    <Button
                        variant={'outline'}
                        onClick={() => {
                            window.history.back();
                            setTimeout(() => window.location.reload(), 100);
                        }}
                        className="mb-6 flex items-center gap-1 text-gray-600 hover:text-gray-900"
                    >
                        <HiArrowLeft size={18} />
                        Back
                    </Button>
                    <h1 className="mb-2 text-3xl font-bold text-gray-900">
                        Edit Applicant -- {applicant.personal_data.first_name} {applicant.personal_data.last_name}
                    </h1>
                </div>

                <Form {...form}>
                    <TooltipProvider>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            {/* Application Information */}
                            <div className="border-b pb-6">
                                <div className="mb-6 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 p-4">
                                    <h2 className="text-xl font-bold text-gray-900">Application Information</h2>
                                </div>
                                <div className="space-y-6 pl-6">
                                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                        <FormField
                                            control={form.control}
                                            name="application_date"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <LabelWithTooltip label="Application Date *" tooltip="Select the date of your application." />
                                                    <FormControl>
                                                        <Input
                                                            type="date"
                                                            {...field}
                                                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="prio_no"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <LabelWithTooltip label="Application Priority No." tooltip="Choose applicant's priority no." />
                                                    <FormControl>
                                                        <Input placeholder="Prio No." {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                                        <FormField
                                            control={form.control}
                                            name="business_unit"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <LabelWithTooltip label="Business Unit" tooltip="Select the business unit." />
                                                    <Select onValueChange={field.onChange} value={field.value || ''}>
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="Laboratory Elementary School">Laboratory Elementary School</SelectItem>
                                                            <SelectItem value="Laboratory High School">Laboratory High School</SelectItem>
                                                            <SelectItem value="Saint Louis University">Saint Louis University</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="campus_site"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <LabelWithTooltip label="Campus Site *" tooltip="Select applicant's campus site." />
                                                    <Select onValueChange={field.onChange} value={field.value || ''}>
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select a campus site" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="Laboratory Elementary School">Laboratory Elementary School</SelectItem>
                                                            <SelectItem value="Laboratory High School - JHS">Laboratory High School - JHS</SelectItem>
                                                            <SelectItem value="Laboratory High School - SHS">Laboratory High School - SHS</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="entry_class"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <LabelWithTooltip
                                                        label="Entry Classification *"
                                                        tooltip="Choose applicant's entry classification."
                                                    />
                                                    <Select onValueChange={field.onChange} value={field.value || ''}>
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="Freshman">Freshman</SelectItem>
                                                            <SelectItem value="Transferee">Transferee</SelectItem>
                                                            <SelectItem value="Cross-Enrollee">Cross-Enrollee</SelectItem>
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
                                    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                                        <FormField
                                            control={form.control}
                                            name="stud_batch"
                                            render={({ field }) => {
                                                const currentYear = new Date().getFullYear();
                                                const years = Array.from({ length: 20 }, (_, i) => currentYear + i);

                                                return (
                                                    <FormItem>
                                                        <LabelWithTooltip label="Student Batch *" tooltip="Select your batch year." />
                                                        <Select onValueChange={field.onChange} value={field.value || ''}>
                                                            <FormControl>
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder="Select year" />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                {years.map((year) => (
                                                                    <SelectItem key={year} value={String(year)}>
                                                                        {year}
                                                                    </SelectItem>
                                                                ))}
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
                                                    <LabelWithTooltip label="Semester *" tooltip="Select semester." />
                                                    <Select onValueChange={field.onChange} value={field.value || ''}>
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="1st Semester">1st Semester</SelectItem>
                                                            <SelectItem value="2nd Semester">2nd Semester</SelectItem>
                                                            <SelectItem value="Summer">Summer</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="schedule_pref"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <LabelWithTooltip
                                                        label="Schedule Preference *"
                                                        tooltip="Choose applicant's schedule preference."
                                                    />
                                                    <Select onValueChange={field.onChange} value={field.value || ''}>
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="AM Session">AM Session</SelectItem>
                                                            <SelectItem value="NN Session">NN Session</SelectItem>
                                                            <SelectItem value="PM Session">PM Session</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 gap-6 md:grid-cols-1">
                                        <FormField
                                            control={form.control}
                                            name="pchoice1"
                                            render={({ field }) => {
                                                const campusSite = useWatch({
                                                    control: form.control,
                                                    name: 'campus_site',
                                                });

                                                const disableProgs =
                                                    campusSite === 'Laboratory Elementary School' || campusSite === 'Laboratory High School - JHS';

                                                return (
                                                    <FormItem>
                                                        <LabelWithTooltip
                                                            label="Course/Program (1st Choice)"
                                                            tooltip="Select the academic program or strand the applicant is applying for."
                                                        />
                                                        <Select onValueChange={field.onChange} value={field.value || ''} disabled={disableProgs}>
                                                            <FormControl>
                                                                <SelectTrigger className={disableProgs ? 'cursor-not-allowed bg-muted' : ''}>
                                                                    <SelectValue placeholder="Select a program" />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                <SelectItem value="ABM">ABM - Accountancy, Business, and Management</SelectItem>
                                                                <SelectItem value="HUMSS">HUMSS - Humanities and Social Sciences</SelectItem>
                                                                <SelectItem value="STEM">
                                                                    STEM - Science, Technology, Engineering, and Mathematics
                                                                </SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                        <FormMessage />
                                                    </FormItem>
                                                );
                                            }}
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 gap-6 md:grid-cols-1">
                                        <FormField
                                            control={form.control}
                                            name="pchoice2"
                                            render={({ field }) => {
                                                const campusSite = useWatch({
                                                    control: form.control,
                                                    name: 'campus_site',
                                                });

                                                const disableProgs =
                                                    campusSite === 'Laboratory Elementary School' || campusSite === 'Laboratory High School - JHS';

                                                return (
                                                    <FormItem>
                                                        <LabelWithTooltip
                                                            label="Course/Program (2nd Choice)"
                                                            tooltip="Select the academic program or strand the applicant is applying for."
                                                        />
                                                        <Select onValueChange={field.onChange} value={field.value || ''} disabled={disableProgs}>
                                                            <FormControl>
                                                                <SelectTrigger className={disableProgs ? 'cursor-not-allowed bg-muted' : ''}>
                                                                    <SelectValue placeholder="Select a program" />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                <SelectItem value="ABM">ABM - Accountancy, Business, and Management</SelectItem>
                                                                <SelectItem value="HUMSS">HUMSS - Humanities and Social Sciences</SelectItem>
                                                                <SelectItem value="STEM">
                                                                    STEM - Science, Technology, Engineering, and Mathematics
                                                                </SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                        <FormMessage />
                                                    </FormItem>
                                                );
                                            }}
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 gap-6 md:grid-cols-1">
                                        <FormField
                                            control={form.control}
                                            name="pchoice3"
                                            render={({ field }) => {
                                                const campusSite = useWatch({
                                                    control: form.control,
                                                    name: 'campus_site',
                                                });

                                                const disableProgs =
                                                    campusSite === 'Laboratory Elementary School' || campusSite === 'Laboratory High School - JHS';

                                                return (
                                                    <FormItem>
                                                        <LabelWithTooltip
                                                            label="Course/Program (3rd Choice)"
                                                            tooltip="Select the academic program or strand the applicant is applying for."
                                                        />
                                                        <Select onValueChange={field.onChange} value={field.value || ''} disabled={disableProgs}>
                                                            <FormControl>
                                                                <SelectTrigger className={disableProgs ? 'cursor-not-allowed bg-muted' : ''}>
                                                                    <SelectValue placeholder="Select a program" />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                <SelectItem value="ABM">ABM - Accountancy, Business, and Management</SelectItem>
                                                                <SelectItem value="HUMSS">HUMSS - Humanities and Social Sciences</SelectItem>
                                                                <SelectItem value="STEM">
                                                                    STEM - Science, Technology, Engineering, and Mathematics
                                                                </SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                        <FormMessage />
                                                    </FormItem>
                                                );
                                            }}
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                        <FormField
                                            control={form.control}
                                            name="curr_code"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <LabelWithTooltip label="Curriculum Code *" tooltip="Select curriculum code." />
                                                    <Select onValueChange={field.onChange} value={field.value || ''}>
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="91248234895">91248234895</SelectItem>
                                                            <SelectItem value="2583459827">2583459827</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="year_level"
                                            render={({ field }) => {
                                                const campusSite = useWatch({
                                                    control: form.control,
                                                    name: 'campus_site',
                                                });

                                                return (
                                                    <FormItem>
                                                        <LabelWithTooltip label="Year Level *" tooltip="Choose applicant's year level." />
                                                        <Select onValueChange={field.onChange} value={field.value || ''}>
                                                            <FormControl>
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder="Select year level" />
                                                                </SelectTrigger>
                                                            </FormControl>

                                                            <SelectContent>
                                                                {campusSite === 'Laboratory Elementary School' ? (
                                                                    <SelectGroup>
                                                                        <SelectLabel>Elementary (LES)</SelectLabel>
                                                                        <SelectItem value="1">Grade 1</SelectItem>
                                                                        <SelectItem value="2">Grade 2</SelectItem>
                                                                        <SelectItem value="3">Grade 3</SelectItem>
                                                                        <SelectItem value="4">Grade 4</SelectItem>
                                                                        <SelectItem value="5">Grade 5</SelectItem>
                                                                        <SelectItem value="6">Grade 6</SelectItem>
                                                                    </SelectGroup>
                                                                ) : campusSite === 'Laboratory High School - JHS' ? (
                                                                    <SelectGroup>
                                                                        <SelectLabel>Junior High School</SelectLabel>
                                                                        <SelectItem value="7">Grade 7</SelectItem>
                                                                        <SelectItem value="8">Grade 8</SelectItem>
                                                                        <SelectItem value="9">Grade 9</SelectItem>
                                                                        <SelectItem value="10">Grade 10</SelectItem>
                                                                    </SelectGroup>
                                                                ) : campusSite === 'Laboratory High School - SHS' ? (
                                                                    <SelectGroup>
                                                                        <SelectLabel>Senior High School</SelectLabel>
                                                                        <SelectItem value="11">Grade 11</SelectItem>
                                                                        <SelectItem value="12">Grade 12</SelectItem>
                                                                    </SelectGroup>
                                                                ) : (
                                                                    <SelectGroup>
                                                                        <SelectLabel>Please select a campus first</SelectLabel>
                                                                    </SelectGroup>
                                                                )}
                                                            </SelectContent>
                                                        </Select>
                                                        <FormMessage />
                                                    </FormItem>
                                                );
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Personal Information */}
                            <div className="border-b pb-6">
                                <div className="mb-6 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 p-4">
                                    <h2 className="text-xl font-bold text-gray-900">Personal Information</h2>
                                </div>
                                <div className="pl-6">
                                    <div className="mt-6 grid grid-cols-1 gap-6">
                                        <FormField
                                            control={form.control}
                                            name="lrn"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <LabelWithTooltip label="LRN *" tooltip="Enter applicant's Learner Reference Number." />
                                                    <FormControl>
                                                        <Input placeholder="Learner Reference Number" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-[1fr_1fr_1fr_auto]">
                                        <FormField
                                            control={form.control}
                                            name="first_name"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <LabelWithTooltip label="First Name *" />
                                                    <FormControl>
                                                        <Input placeholder="John" {...field} />
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
                                                        <Input placeholder="Michael" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="last_name"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <LabelWithTooltip label="Last Name *" />
                                                    <FormControl>
                                                        <Input placeholder="Doe" {...field} />
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
                                    <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
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
                                                            className="w-full rounded-md border border-input bg-background px-3 py-[0.375rem] text-sm"
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
                                    </div>
                                    <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-4">
                                        <FormField
                                            control={form.control}
                                            name="civil_status"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <LabelWithTooltip label="Civil Status *" />
                                                    <FormControl>
                                                        <Select onValueChange={field.onChange} value={field.value}>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select civil status" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="Single">Single</SelectItem>
                                                                <SelectItem value="Married">Married</SelectItem>
                                                                <SelectItem value="Divorced">Divorced</SelectItem>
                                                                <SelectItem value="Legally Separated">Legally Separated</SelectItem>
                                                                <SelectItem value="Widowed">Widowed</SelectItem>
                                                                <SelectItem value="Religious/Clergy">Religious/Clergy</SelectItem>
                                                                <SelectItem value="Marriage Annulled">Marriage Annulled</SelectItem>
                                                                <SelectItem value="Separated Unofficial">Separated Unofficial</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="birth_order"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <LabelWithTooltip label="Birth Order" tooltip="Enter birth order." />
                                                    <FormControl>
                                                        <Select onValueChange={field.onChange} value={field.value}>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select birth order" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="1st">1st</SelectItem>
                                                                <SelectItem value="2nd">2nd</SelectItem>
                                                                <SelectItem value="3rd">3rd</SelectItem>
                                                                <SelectItem value="4th">4th</SelectItem>
                                                                <SelectItem value="5th">5th</SelectItem>
                                                                <SelectItem value="6th">6th</SelectItem>
                                                                <SelectItem value="7th">7th</SelectItem>
                                                                <SelectItem value="8th">8th</SelectItem>
                                                                <SelectItem value="9th">9th</SelectItem>
                                                                <SelectItem value="10th">10th</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="mother_tongue"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <LabelWithTooltip label="Mother Tongue" tooltip="Enter applicant's mother tongue." />
                                                    <FormControl>
                                                        <Input placeholder="e.g. Tagalog, Ilocano" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="ethnicity"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <LabelWithTooltip label="Ethnicity" tooltip="Enter applicant's ethnicity." />
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

                            {/* Contact Section */}
                            <div className="border-b pb-6">
                                <div className="mb-6 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 p-4">
                                    <h2 className="text-xl font-bold text-gray-900">Contact Information</h2>
                                </div>

                                <div className="pl-6">
                                    <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
                                        <FormField
                                            control={form.control}
                                            name="email"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <LabelWithTooltip label="Email Address *" tooltip="Enter applicant's email." />
                                                    <FormControl>
                                                        <Input placeholder="" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="phone"
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
                                            name="street"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <LabelWithTooltip label="Street Address" tooltip="Include house number, street name." />
                                                    <FormControl>
                                                        <Input placeholder="123 Main Street" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="brgy"
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

                                    <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
                                        <FormField
                                            control={form.control}
                                            name="city"
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
                                            name="state"
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
                                            name="zip_code"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <LabelWithTooltip label="ZIP Code *" tooltip="Enter your 4–6 digit postal ZIP code." />
                                                    <FormControl>
                                                        <Input type="text" inputMode="numeric" placeholder="2600" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
                                        <FormField
                                            control={form.control}
                                            name="father_name"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <LabelWithTooltip label="Father's Name *" />
                                                    <FormControl>
                                                        <Input placeholder="" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="father_number"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <LabelWithTooltip label="Father's Contact Number *" />
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
                                            name="mother_name"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <LabelWithTooltip label="Mother's Name *" />
                                                    <FormControl>
                                                        <Input placeholder="" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="mother_number"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <LabelWithTooltip label="Mother's Contact Number *" />
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
                                            name="emergency_contact_name"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <LabelWithTooltip
                                                        label="Emergency Contact Name *"
                                                        tooltip="Enter the name of a person we can contact in case of emergency."
                                                    />
                                                    <FormControl>
                                                        <Input placeholder="Jane Doe" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="emergency_contact_number"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <LabelWithTooltip
                                                        label="Emergency Contact Number *"
                                                        tooltip="Provide an active phone number for your emergency contact."
                                                    />
                                                    <FormControl>
                                                        <Input placeholder="+639123456789" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Other Information */}
                            <div className="border-b pb-6">
                                <div className="mb-6 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 p-4">
                                    <h2 className="text-xl font-bold text-gray-900">Other Information</h2>
                                </div>
                                <div className="pl-6">
                                    <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
                                        <FormField
                                            control={form.control}
                                            name="financial_source"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <LabelWithTooltip
                                                        label="Financial Source"
                                                        tooltip="Identify applicant's source of financial support."
                                                    />
                                                    <FormControl>
                                                        <Select onValueChange={field.onChange} value={field.value}>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select source" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="Parents">Parents</SelectItem>
                                                                <SelectItem value="DAR">DAR</SelectItem>
                                                                <SelectItem value="Mother">Mother</SelectItem>
                                                                <SelectItem value="Father">Father</SelectItem>
                                                                <SelectItem value="Auntie">Auntie</SelectItem>
                                                                <SelectItem value="Uncle">Uncle</SelectItem>
                                                                <SelectItem value="Grandparents">Grandparents</SelectItem>
                                                                <SelectItem value="Remittance">Remittance</SelectItem>
                                                                <SelectItem value="Others">Others</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="exam_schedule"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <LabelWithTooltip label="Exam Schedule *" tooltip="Select exam date for the applicant." />
                                                    <FormControl>
                                                        <input
                                                            type="date"
                                                            {...field}
                                                            className="w-full rounded-md border border-input bg-background px-3 py-[0.375rem] text-sm"
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Submit Buttons */}
                            <div className="flex justify-end gap-2 pt-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        if (confirm('Are you sure you want to discard changes? All unsaved changes will be lost.')) {
                                            window.history.back();
                                        }
                                    }}
                                >
                                    Back
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        if (confirm('Are you sure you want to reset the form? All unsaved changes will be lost.')) {
                                            form.reset();
                                        }
                                    }}
                                >
                                    Reset
                                </Button>
                                <Button type="submit" disabled={!form.formState.isDirty || form.formState.isSubmitting}>
                                    {form.formState.isSubmitting ? 'Submitting...' : 'Save Changes'}
                                </Button>
                            </div>
                        </form>
                    </TooltipProvider>
                </Form>
            </div>
        </AppLayout>
    );
}
