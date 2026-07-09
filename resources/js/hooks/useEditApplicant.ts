import { zodResolver } from '@hookform/resolvers/zod';
import { router } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

export const applicantFormSchema = z.object({
    application_date: z.string().optional(),
    school_year: z.string().optional(),
    application_number: z.string().optional(),
    application_status: z.string().optional(),
    year_level: z.string().optional(),
    semester: z.string().optional(),
    strand: z.string().optional(),
    classification: z.string().optional(),
    learning_mode: z.string().optional(),
    accomplished_by_name: z.string().optional(),
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
    email: z.string().optional(),
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

export type ApplicantFormValues = z.infer<typeof applicantFormSchema>;

function toBoolean(value: any): boolean {
    return value === true || value === 1 || value === '1';
}

function normalizeHealthConditions(value: any): string[] {
    if (Array.isArray(value)) {
        return value.filter((item) => item && item !== 'None');
    }
    if (typeof value === 'string' && value !== '' && value !== 'None') {
        try {
            const parsed = JSON.parse(value);
            if (Array.isArray(parsed)) {
                return parsed.filter((item) => item && item !== 'None');
            }
        } catch {
            return [value];
        }
    }
    return [];
}

function formatDate(date: string | null): string {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    return d.toISOString().split('T')[0];
}

function buildFormValues(applicant: any): ApplicantFormValues {
    return {
        application_date: formatDate(applicant.application_date) || '',
        school_year: applicant.school_year || '',
        application_number: applicant.application_number || '',
        application_status: applicant.application_status || '',
        year_level: applicant.year_level || '',
        semester: applicant.semester || '',
        strand: applicant.strand || '',
        classification: applicant.classification || '',
        learning_mode: applicant.learning_mode || '',
        accomplished_by_name: applicant.accomplished_by_name || '',
        last_name: applicant.personal_data.last_name || '',
        first_name: applicant.personal_data.first_name || '',
        middle_name: applicant.personal_data.middle_name || '',
        suffix: applicant.personal_data.suffix || '',
        learner_reference_number: applicant.personal_data.learner_reference_number || '',
        gender: applicant.personal_data.gender || '',
        citizenship: applicant.personal_data.citizenship || '',
        religion: applicant.personal_data.religion || '',
        date_of_birth: formatDate(applicant.personal_data.date_of_birth) || '',
        place_of_birth: applicant.personal_data.place_of_birth || '',
        has_sibling: toBoolean(applicant.personal_data?.has_sibling) || false,
        email: applicant.personal_data.email || '',
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
        health_conditions: normalizeHealthConditions(applicant.personal_data?.health_conditions),
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
        siblings: applicant.personal_data.siblings?.map((sib: any) => ({
            sibling_full_name: sib.sibling_full_name || '',
            sibling_grade_level: sib.sibling_grade_level || '',
            sibling_id_number: sib.sibling_id_number || '',
        })) || [],
        schools: applicant.educational_background?.map((school: any) => ({
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
    };
}

interface Params {
    applicant: any;
}

export function useEditApplicant({ applicant }: Params) {
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
                setShowConfirmDialog(false);
                setPendingFormData(null);
            },
            onError: (errors) => {
                toast.error('Failed to update applicant. Please check the form.', {
                    duration: 4000,
                    position: 'top-right',
                });
                Object.keys(errors).forEach((key) => {
                    form.setError(key as any, { type: 'server', message: errors[key] });
                });
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
