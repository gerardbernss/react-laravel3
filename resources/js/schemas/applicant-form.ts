import { z } from 'zod';

const phoneRegex = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,4}[-\s\.]?[0-9]{1,9}$/;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_FILE_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];

// --- Sub-schemas ---

export const applicationInfoSchema = z.object({
    application_date: z.string().min(1, { message: 'Application date is required.' }),
    school_year: z.string().min(1, { message: 'School year is required.' }),
    application_number: z.string().optional(),
    application_status: z.string().min(1, { message: 'Application status is required.' }),
    year_level: z.string().min(1, { message: 'Please select year level.' }),
    semester: z.string().min(1, { message: 'Please select semester.' }),
    strand: z.string().min(1, { message: 'Please select strand.' }),
    classification: z.string().min(1, { message: 'Please select entry classification.' }),
    learning_mode: z.string().min(1, { message: 'Please select learning mode.' }),
    accomplished_by_name: z.string().optional(),
});

export const personalDataSchema = z.object({
    last_name: z.string().min(2, { message: 'Last name must be at least 2 characters.' }),
    first_name: z.string().min(2, { message: 'First name must be at least 2 characters.' }),
    middle_name: z.string().optional(),
    suffix: z.string().optional(),
    learner_reference_number: z.string().optional(),
    gender: z.string().min(1, { message: 'Gender is required.' }),
    citizenship: z.string().min(2, { message: 'Citizenship is required.' }),
    religion: z.string().min(1, { message: 'Religion is required.' }),
    date_of_birth: z.string().min(1, { message: 'Date of birth is required.' }),
    place_of_birth: z.string().optional(),
    has_sibling: z.boolean().default(false),
    email: z.string().email({ message: 'Please enter a valid email address.' }),
    alt_email: z.string().email({ message: 'Please enter a valid alternate email address.' }).or(z.literal('')).optional(),
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
    has_doctors_note: z.boolean().default(false),
    doctors_note_file: z
        .any()
        .refine((file) => !file || file instanceof File, { message: 'Must be a valid file.' })
        .refine((file) => !file || file.size <= MAX_FILE_SIZE, { message: 'Max file size is 5MB.' })
        .refine((file) => !file || ACCEPTED_FILE_TYPES.includes(file.type), {
            message: 'Only .jpg, .jpeg, .png and .pdf formats are supported.',
        })
        .optional(),
});

const parentSchema = z.object({
    lname: z.string().min(2, { message: 'Last name must be at least 2 characters.' }),
    fname: z.string().min(2, { message: 'First name must be at least 2 characters.' }),
    mname: z.string().min(2, { message: 'Middle name must be at least 2 characters.' }),
    living: z.string().min(1, { message: 'Status is required.' }),
    citizenship: z.string().optional(),
    religion: z.string().optional(),
    highest_educ: z.string().optional(),
    occupation: z.string().optional(),
    income: z.string().optional(),
    business_emp: z.string().optional(),
    business_address: z.string().optional(),
    contact_no: z.string().regex(phoneRegex, { message: 'Invalid phone number.' }).or(z.literal('')).optional(),
    email: z.string().email({ message: 'Please enter a valid email address.' }).or(z.literal('')).optional(),
    slu_employee: z.boolean().default(false),
    slu_dept: z.string().optional(),
});

export const familyBackgroundSchema = z.object({
    father_lname: parentSchema.shape.lname,
    father_fname: parentSchema.shape.fname,
    father_mname: parentSchema.shape.mname,
    father_living: parentSchema.shape.living,
    father_citizenship: parentSchema.shape.citizenship,
    father_religion: parentSchema.shape.religion,
    father_highest_educ: parentSchema.shape.highest_educ,
    father_occupation: parentSchema.shape.occupation,
    father_income: parentSchema.shape.income,
    father_business_emp: parentSchema.shape.business_emp,
    father_business_address: parentSchema.shape.business_address,
    father_contact_no: parentSchema.shape.contact_no,
    father_email: parentSchema.shape.email,
    father_slu_employee: parentSchema.shape.slu_employee,
    father_slu_dept: parentSchema.shape.slu_dept,

    mother_lname: parentSchema.shape.lname,
    mother_fname: parentSchema.shape.fname,
    mother_mname: parentSchema.shape.mname,
    mother_living: parentSchema.shape.living,
    mother_citizenship: parentSchema.shape.citizenship,
    mother_religion: parentSchema.shape.religion,
    mother_highest_educ: parentSchema.shape.highest_educ,
    mother_occupation: parentSchema.shape.occupation,
    mother_income: parentSchema.shape.income,
    mother_business_emp: parentSchema.shape.business_emp,
    mother_business_address: parentSchema.shape.business_address,
    mother_contact_no: parentSchema.shape.contact_no,
    mother_email: parentSchema.shape.email,
    mother_slu_employee: parentSchema.shape.slu_employee,
    mother_slu_dept: parentSchema.shape.slu_dept,

    guardian_lname: parentSchema.shape.lname,
    guardian_fname: parentSchema.shape.fname,
    guardian_mname: parentSchema.shape.mname,
    guardian_relationship: z.string().optional(),
    guardian_citizenship: parentSchema.shape.citizenship,
    guardian_religion: parentSchema.shape.religion,
    guardian_highest_educ: parentSchema.shape.highest_educ,
    guardian_occupation: parentSchema.shape.occupation,
    guardian_income: parentSchema.shape.income,
    guardian_business_emp: parentSchema.shape.business_emp,
    guardian_business_address: parentSchema.shape.business_address,
    guardian_contact_no: z.string().regex(phoneRegex, { message: 'Please enter a valid mobile number.' }),
    guardian_email: z.string().email({ message: 'Please enter a valid email address.' }).or(z.literal('')).optional(),
    guardian_slu_employee: parentSchema.shape.slu_employee,
    guardian_slu_dept: parentSchema.shape.slu_dept,

    emergency_contact_name: z.string().min(2, { message: "Please enter emergency contact's name." }),
    emergency_relationship: z.string().min(1, { message: 'Relationship is required.' }),
    emergency_home_phone: z.string().regex(phoneRegex).or(z.literal('')).optional(),
    emergency_mobile_phone: z.string().regex(phoneRegex, { message: 'Please enter a valid mobile number.' }),
    emergency_email: z.string().email().or(z.literal('')).optional(),
});

export const siblingSchema = z.object({
    sibling_full_name: z.string().min(2, "Please enter sibling's name."),
    sibling_grade_level: z.string().min(1, "Enter sibling's grade level."),
    sibling_id_number: z.string().min(1, "Enter sibling's ID number."),
});

export const siblingsSchema = z.object({
    siblings: z.array(siblingSchema).optional().default([]),
});

export const schoolSchema = z.object({
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
});

export const educationalBackgroundSchema = z.object({
    schools: z.array(schoolSchema).optional().default([]),
});

const fileSchema = (label: string) =>
    z
        .any()
        .refine((file) => !file || file instanceof File, { message: `${label} must be a valid file.` })
        .refine((file) => !file || file.size <= MAX_FILE_SIZE, { message: 'Max file size is 5MB.' })
        .refine((file) => !file || ACCEPTED_FILE_TYPES.includes(file.type), {
            message: 'Only .jpg, .jpeg, .png and .pdf formats are supported.',
        })
        .optional();

export const documentsSchema = z.object({
    certificate_of_enrollment: fileSchema('Certificate of Enrollment'),
    birth_certificate: fileSchema('Birth Certificate'),
    latest_report_card_front: fileSchema('Latest Report Card (Front)'),
    latest_report_card_back: fileSchema('Latest Report Card (Back)'),
});

// --- Composed schema ---

export const applicantFormSchema = applicationInfoSchema
    .merge(personalDataSchema)
    .merge(familyBackgroundSchema)
    .merge(siblingsSchema)
    .merge(educationalBackgroundSchema)
    .merge(documentsSchema)
    .superRefine((data, ctx) => {
        const hasHealthConditions = Array.isArray(data.health_conditions) && data.health_conditions.length > 0;

        if (hasHealthConditions && !data.doctors_note_file) {
            ctx.addIssue({
                path: ['doctors_note_file'],
                message: 'Doctors note file is required when health conditions are selected.',
                code: z.ZodIssueCode.custom,
            });
        }
        if (data.has_sibling && (!data.siblings || data.siblings.length === 0)) {
            ctx.addIssue({
                path: ['siblings'],
                message: 'Enter your sibling details.',
                code: z.ZodIssueCode.custom,
            });
        }
    });

export type ApplicantFormValues = z.infer<typeof applicantFormSchema>;
