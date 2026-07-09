import { zodResolver } from '@hookform/resolvers/zod';
import { router } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

export const applicantFormSchema = z.object({
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
    financial_source: z.string().optional(),
    exam_schedule: z.string().optional(),
});

export type ApplicantFormValues = z.infer<typeof applicantFormSchema>;

function formatDate(date: string | null | undefined): string {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    return d.toISOString().split('T')[0];
}

function buildFormValues(applicant: any): ApplicantFormValues {
    return {
        application_date: formatDate(applicant.application_date),
        prio_no: applicant.prio_no ?? '',
        business_unit: applicant.business_unit ?? '',
        campus_site: applicant.campus_site ?? '',
        entry_class: applicant.entry_class ?? '',
        stud_batch: applicant.stud_batch ?? '',
        semester: applicant.semester ?? '',
        schedule_pref: applicant.schedule_pref ?? '',
        pchoice1: applicant.pchoice1 ?? '',
        pchoice2: applicant.pchoice2 ?? '',
        pchoice3: applicant.pchoice3 ?? '',
        curr_code: applicant.curr_code ?? '',
        year_level: applicant.year_level ?? '',
        lrn: applicant.lrn ?? '',
        first_name: applicant.first_name ?? '',
        middle_name: applicant.middle_name ?? '',
        last_name: applicant.last_name ?? '',
        suffix: applicant.suffix ?? '',
        gender: applicant.gender ?? '',
        citizenship: applicant.citizenship ?? '',
        religion: applicant.religion ?? '',
        date_of_birth: formatDate(applicant.date_of_birth),
        place_of_birth: applicant.place_of_birth ?? '',
        civil_status: applicant.civil_status ?? '',
        birth_order: applicant.birth_order ?? '',
        mother_tongue: applicant.mother_tongue ?? '',
        ethnicity: applicant.ethnicity ?? '',
        email: applicant.email ?? '',
        phone: applicant.phone ?? '',
        street: applicant.street ?? '',
        brgy: applicant.brgy ?? '',
        city: applicant.city ?? '',
        state: applicant.state ?? '',
        zip_code: applicant.zip_code ?? '',
        father_name: applicant.father_name ?? '',
        father_number: applicant.father_number ?? '',
        mother_name: applicant.mother_name ?? '',
        mother_number: applicant.mother_number ?? '',
        emergency_contact_name: applicant.emergency_contact_name ?? '',
        emergency_contact_number: applicant.emergency_contact_number ?? '',
        financial_source: applicant.financial_source ?? '',
        exam_schedule: formatDate(applicant.exam_schedule),
    };
}

interface Params {
    applicant: any;
}

export function useApplicantEdit({ applicant }: Params) {
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [pendingFormData, setPendingFormData] = useState<ApplicantFormValues | null>(null);
    const [showDiscardDialog, setShowDiscardDialog] = useState(false);
    const [showResetDialog, setShowResetDialog] = useState(false);

    const form = useForm<ApplicantFormValues>({
        resolver: zodResolver(applicantFormSchema),
        mode: 'onChange',
        defaultValues: applicant ? buildFormValues(applicant) : {},
    });

    useEffect(() => {
        if (applicant) {
            form.reset(buildFormValues(applicant));
        }
    }, [applicant, form]);

    function onSubmit(values: ApplicantFormValues) {
        setPendingFormData(values);
        setShowConfirmDialog(true);
    }

    function handleConfirmedSubmit() {
        if (!pendingFormData) return;

        router.put(`/admin/applicants/${applicant.id}`, pendingFormData, {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                toast.success('Applicant updated successfully!');
                setShowConfirmDialog(false);
                setPendingFormData(null);
            },
            onError: (errors) => {
                Object.keys(errors).forEach((key) => {
                    form.setError(key as any, { type: 'server', message: errors[key] });
                });
                toast.error('Failed to update. Please check the form.');
                setShowConfirmDialog(false);
                setPendingFormData(null);
            },
        });
    }

    function handleDiscardConfirm() {
        setShowDiscardDialog(false);
        window.history.back();
    }

    function handleResetConfirm() {
        form.reset();
        setShowResetDialog(false);
    }

    return {
        form,
        showConfirmDialog, setShowConfirmDialog,
        pendingFormData, setPendingFormData,
        showDiscardDialog, setShowDiscardDialog,
        showResetDialog, setShowResetDialog,
        onSubmit,
        handleConfirmedSubmit,
        handleDiscardConfirm,
        handleResetConfirm,
    };
}
