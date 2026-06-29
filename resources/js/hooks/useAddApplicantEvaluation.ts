import { zodResolver } from '@hookform/resolvers/zod';
import { router } from '@inertiajs/react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

const phoneRegex = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,4}[-\s\.]?[0-9]{1,9}$/;

export const applicantFormSchema = z.object({
    application_date: z.string().min(1, { message: 'Application date is required.' }),
    year_level: z.string().min(1, { message: 'Please select year level.' }),
    strand: z.string().min(1, { message: 'Please select strand.' }),
    classification: z.string().min(1, { message: 'Please select entry classification.' }),
    learning_mode: z.string().min(1, { message: 'Please select learning mode.' }),
    accomplished_by_name: z.string().optional(),

    last_name: z.string().min(2, { message: 'Last name must be at least 2 characters.' }),
    first_name: z.string().min(2, { message: 'First name must be at least 2 characters.' }),
    middle_name: z.string().optional(),
    suffix: z.string().optional(),
    learner_reference_number: z.string().optional(),
    sex: z.string().min(1, { message: 'Gender is required.' }),
    citizenship: z.string().min(2, { message: 'Citizenship is required.' }),
    religion: z.string().min(1, { message: 'Religion is required.' }),
    date_of_birth: z.string().min(1, { message: 'Date of birth is required.' }),
    place_of_birth: z.string().min(1, { message: 'Place of birth is required.' }),
    has_sibling: z.boolean().default(false),
    email: z.string().email({ message: 'Please enter a valid email address.' }),
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

    certificate_of_enrollment: z.any().refine((file) => file instanceof File && file.size > 0, { message: 'Certificate of Enrollment is required.' }),
    birth_certificate: z.any().refine((file) => file instanceof File && file.size > 0, { message: 'Birth Certificate is required.' }),
    latest_report_card_front: z.any().refine((file) => file instanceof File && file.size > 0, { message: 'Latest Report Card (Front) is required.' }),
    latest_report_card_back: z.any().refine((file) => file instanceof File && file.size > 0, { message: 'Latest Report Card (Back) is required.' }),
});

export type ApplicantFormValues = z.infer<typeof applicantFormSchema>;

export function useAddApplicantEvaluation() {
    const form = useForm<ApplicantFormValues>({
        resolver: zodResolver(applicantFormSchema) as any,
        mode: 'onChange',
        defaultValues: {
            application_date: new Date().toISOString().split('T')[0],
            year_level: '',
            strand: '',
            classification: '',
            learning_mode: '',
            accomplished_by_name: '',
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

    const [hasAgreed, setHasAgreed] = useState(false);

    async function onSubmit(values: ApplicantFormValues) {
        try {
            const formData = new FormData();

            Object.entries(values).forEach(([key, value]) => {
                if (key === 'siblings' || key === 'schools') {
                    if (Array.isArray(value) && value.length > 0) {
                        formData.append(key, JSON.stringify(value));
                    }
                } else if (key === 'health_conditions') {
                    if (Array.isArray(value) && value.length > 0) {
                        formData.append(key, JSON.stringify(value));
                    } else if (typeof value === 'string' && value) {
                        formData.append(key, value);
                    }
                } else if (
                    key === 'certificate_of_enrollment' ||
                    key === 'birth_certificate' ||
                    key === 'latest_report_card_front' ||
                    key === 'latest_report_card_back'
                ) {
                    if (value instanceof File) {
                        formData.append(key, value);
                    }
                } else if (typeof value === 'boolean') {
                    formData.append(key, value ? '1' : '0');
                } else if (value !== null && value !== undefined && value !== '') {
                    formData.append(key, value.toString());
                }
            });

            router.post('/applications/applicants', formData, {
                forceFormData: true,
                onSuccess: () => {
                    router.visit('/applications/success', { replace: true });
                },
                onError: (errors) => {
                    console.error('Submission errors:', errors);
                    const firstError = Object.values(errors)[0];
                    toast.error(firstError || 'Failed to submit application. Please check the form.');
                    Object.keys(errors).forEach((key) => {
                        form.setError(key as any, { type: 'manual', message: errors[key] });
                    });
                },
            });
        } catch (error) {
            console.error('Submission error:', error);
            toast.error('An unexpected error occurred. Please try again.');
        }
    }

    return { form, hasAgreed, setHasAgreed, onSubmit };
}
