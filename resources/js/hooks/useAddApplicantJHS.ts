import { router, usePage } from '@inertiajs/react';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const phoneRegex = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,4}[-\s\.]?[0-9]{1,9}$/;
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_FILE_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];

export const applicantFormSchema = z
    .object({
        application_date: z.string().min(1, { message: 'Application date is required.' }),
        school_year: z.string().min(1, { message: 'Application date is required.' }),
        application_status: z.string().min(1, { message: 'Application status is required.' }),
        year_level: z.string().min(1, { message: 'Please select year level.' }),
        semester: z.string().min(1, { message: 'Please select semester.' }),
        strand: z.string().min(1, { message: 'Please select strand.' }),
        classification: z.string().min(1, { message: 'Please select entry classification.' }),
        learning_mode: z.string().min(1, { message: 'Please select learning mode.' }),
        accomplished_by_name: z.string().optional(),
        last_name: z.string().min(2, { message: 'Last name must be at least 2 characters.' }),
        first_name: z.string().min(2, { message: 'First name must be at least 2 characters.' }),
        middle_name: z.string().min(2, { message: 'Middle name must be at least 2 characters.' }),
        suffix: z.string().optional(),
        learner_reference_number: z.string().optional(),
        gender: z.string().min(1, { message: 'Gender is required.' }),
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
        has_doctors_note: z.boolean().default(false),
        doctors_note_file: z
            .any()
            .refine((file) => !file || file instanceof File, { message: 'Must be a valid file.' })
            .refine((file) => !file || file.size <= MAX_FILE_SIZE, { message: 'Max file size is 5MB.' })
            .refine((file) => !file || ACCEPTED_FILE_TYPES.includes(file.type), { message: 'Only .jpg, .jpeg, .png and .pdf formats are supported.' })
            .optional(),
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
            .array(z.object({
                sibling_full_name: z.string().min(2, "Please enter sibling's name."),
                sibling_grade_level: z.string().min(1, "Enter sibling's grade level."),
                sibling_id_number: z.string().min(1, "Enter sibling's ID number."),
            }))
            .optional()
            .default([]),
        schools: z
            .array(z.object({
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
            }))
            .optional()
            .default([])
            .refine((schools) => schools.every((s) => s.school_name.trim() !== '' || s.school_address.trim() !== ''), {
                message: 'Please complete or remove empty school entries.',
            }),
        certificate_of_enrollment: z
            .any()
            .refine((file) => file instanceof File, { message: 'Certificate of Enrollment is required.' })
            .refine((file) => !file || file.size <= MAX_FILE_SIZE, { message: 'Max file size is 5MB.' })
            .refine((file) => !file || ACCEPTED_FILE_TYPES.includes(file.type), { message: 'Only .jpg, .jpeg, .png and .pdf formats are supported.' }),
        birth_certificate: z
            .any()
            .refine((file) => file instanceof File, { message: 'Birth Certificate is required.' })
            .refine((file) => !file || file.size <= MAX_FILE_SIZE, { message: 'Max file size is 5MB.' })
            .refine((file) => !file || ACCEPTED_FILE_TYPES.includes(file.type), { message: 'Only .jpg, .jpeg, .png and .pdf formats are supported.' }),
        latest_report_card_front: z
            .any()
            .refine((file) => file instanceof File, { message: 'Latest Report Card (Front) is required.' })
            .refine((file) => !file || file.size <= MAX_FILE_SIZE, { message: 'Max file size is 5MB.' })
            .refine((file) => !file || ACCEPTED_FILE_TYPES.includes(file.type), { message: 'Only .jpg, .jpeg, .png and .pdf formats are supported.' }),
        latest_report_card_back: z
            .any()
            .refine((file) => file instanceof File, { message: 'Latest Report Card (Back) is required.' })
            .refine((file) => !file || file.size <= MAX_FILE_SIZE, { message: 'Max file size is 5MB.' })
            .refine((file) => !file || ACCEPTED_FILE_TYPES.includes(file.type), { message: 'Only .jpg, .jpeg, .png and .pdf formats are supported.' }),
    })
    .superRefine((data, ctx) => {
        const hasHealthConditions = Array.isArray(data.health_conditions) && data.health_conditions.length > 0;
        if (hasHealthConditions && !data.doctors_note_file) {
            ctx.addIssue({ path: ['doctors_note_file'], message: 'Doctors note file is required when health conditions are selected.', code: z.ZodIssueCode.custom });
        }
        if (data.has_sibling && (!data.siblings || data.siblings.length === 0)) {
            ctx.addIssue({ path: ['siblings'], message: 'Enter your sibling details.', code: z.ZodIssueCode.custom });
        }
    });

export type ApplicantFormValues = z.infer<typeof applicantFormSchema>;

type PsgcItem = { code: string; name: string };

/**
 * Manage the JHS/SHS/LES applicant intake form using react-hook-form with Zod validation,
 * including cascading PSGC address dropdowns for present and permanent addresses, same-address sync,
 * guardian auto-fill from father/mother, email verification OTP flow, and multipart FormData submission to /applications/apply-les.
 */
export function useAddApplicantJHS() {
    const currentSemester = usePage().props.currentSemester as { name: string | null; school_year: string | null } | null;

    const [guardianSource, setGuardianSource] = useState<'father' | 'mother' | null>(null);
    const [isDuplicateDialogOpen, setIsDuplicateDialogOpen] = useState(false);
    const [hasAgreed, setHasAgreed] = useState(false);

    const form = useForm<ApplicantFormValues>({
        resolver: zodResolver(applicantFormSchema) as any,
        mode: 'onChange',
        defaultValues: {
            application_date: new Date().toISOString().split('T')[0],
            school_year: currentSemester?.school_year ?? '',
            application_status: 'Pending',
            year_level: '', semester: currentSemester?.name ?? '',
            strand: '', classification: '', learning_mode: '', accomplished_by_name: '',
            last_name: '', first_name: '', middle_name: '', suffix: '',
            learner_reference_number: '', gender: '', citizenship: '', religion: '',
            date_of_birth: '', place_of_birth: '', has_sibling: false,
            email: '', verificationCode: '', altVerificationCode: '', alt_email: '',
            mobile_number: '', present_street: '', present_brgy: '', present_city: '',
            present_province: '', present_zip: '', permanent_street: '', permanent_brgy: '',
            permanent_city: '', permanent_province: '', permanent_zip: '',
            stopped_studying: '', accelerated: '', health_conditions: [],
            has_doctors_note: false, doctors_note_file: null,
            father_lname: '', father_fname: '', father_mname: '', father_living: '',
            father_citizenship: '', father_religion: '', father_highest_educ: '',
            father_occupation: '', father_income: '', father_business_emp: '',
            father_business_address: '', father_contact_no: '', father_email: '',
            father_slu_employee: false, father_slu_dept: '',
            mother_lname: '', mother_fname: '', mother_mname: '', mother_living: '',
            mother_citizenship: '', mother_religion: '', mother_highest_educ: '',
            mother_occupation: '', mother_income: '', mother_business_emp: '',
            mother_business_address: '', mother_contact_no: '', mother_email: '',
            mother_slu_employee: false, mother_slu_dept: '',
            guardian_lname: '', guardian_fname: '', guardian_mname: '',
            guardian_relationship: '', guardian_citizenship: '', guardian_religion: '',
            guardian_highest_educ: '', guardian_occupation: '', guardian_income: '',
            guardian_business_emp: '', guardian_business_address: '',
            guardian_contact_no: '', guardian_email: '',
            guardian_slu_employee: false, guardian_slu_dept: '',
            emergency_contact_name: '', emergency_relationship: '',
            emergency_home_phone: '', emergency_mobile_phone: '', emergency_email: '',
            siblings: [], schools: [],
            certificate_of_enrollment: null, birth_certificate: null,
            latest_report_card_front: null, latest_report_card_back: null,
        },
    });

    const fatherValues = form.watch([
        'father_lname', 'father_fname', 'father_mname', 'father_citizenship',
        'father_religion', 'father_highest_educ', 'father_occupation', 'father_income',
        'father_business_emp', 'father_business_address', 'father_contact_no',
        'father_email', 'father_slu_employee', 'father_slu_dept',
    ]);

    const motherValues = form.watch([
        'mother_lname', 'mother_fname', 'mother_mname', 'mother_citizenship',
        'mother_religion', 'mother_highest_educ', 'mother_occupation', 'mother_income',
        'mother_business_emp', 'mother_business_address', 'mother_contact_no',
        'mother_email', 'mother_slu_employee', 'mother_slu_dept',
    ]);

    useEffect(() => {
        if (guardianSource === 'father') {
            const [lname, fname, mname, citizenship, religion, educ, occupation, income, businessEmp, businessAddr, contact, email, sluEmployee, sluDept] = fatherValues;
            form.setValue('guardian_lname', lname || '');
            form.setValue('guardian_fname', fname || '');
            form.setValue('guardian_mname', mname || '');
            form.setValue('guardian_citizenship', citizenship || '');
            form.setValue('guardian_religion', religion || '');
            form.setValue('guardian_highest_educ', educ || '');
            form.setValue('guardian_occupation', occupation || '');
            form.setValue('guardian_income', income || '');
            form.setValue('guardian_business_emp', businessEmp || '');
            form.setValue('guardian_business_address', businessAddr || '');
            form.setValue('guardian_contact_no', contact || '');
            form.setValue('guardian_email', email || '');
            form.setValue('guardian_slu_employee', sluEmployee || false);
            form.setValue('guardian_slu_dept', sluDept || '');
            form.setValue('guardian_relationship', 'Father');
        } else if (guardianSource === 'mother') {
            const [lname, fname, mname, citizenship, religion, educ, occupation, income, businessEmp, businessAddr, contact, email, sluEmployee, sluDept] = motherValues;
            form.setValue('guardian_lname', lname || '');
            form.setValue('guardian_fname', fname || '');
            form.setValue('guardian_mname', mname || '');
            form.setValue('guardian_citizenship', citizenship || '');
            form.setValue('guardian_religion', religion || '');
            form.setValue('guardian_highest_educ', educ || '');
            form.setValue('guardian_occupation', occupation || '');
            form.setValue('guardian_income', income || '');
            form.setValue('guardian_business_emp', businessEmp || '');
            form.setValue('guardian_business_address', businessAddr || '');
            form.setValue('guardian_contact_no', contact || '');
            form.setValue('guardian_email', email || '');
            form.setValue('guardian_slu_employee', sluEmployee || false);
            form.setValue('guardian_slu_dept', sluDept || '');
            form.setValue('guardian_relationship', 'Mother');
        }
    }, [guardianSource, fatherValues, motherValues, form]);

    // PSGC address states
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

    const loadPermanentAddressData = async () => {
        if (!selectedPresentRegion) return;
        try {
            const provincesRes = await axios.get<PsgcItem[]>(`https://psgc.gitlab.io/api/regions/${selectedPresentRegion}/provinces`);
            setPermanentProvinces(provincesRes.data);
            setSelectedPermanentRegion(selectedPresentRegion);
            if (selectedPresentProvince) {
                const citiesRes = await axios.get<PsgcItem[]>(`https://psgc.gitlab.io/api/provinces/${selectedPresentProvince}/cities-municipalities`);
                setPermanentCities(citiesRes.data);
                setSelectedPermanentProvince(selectedPresentProvince);
                if (selectedPresentCity) {
                    const barangaysRes = await axios.get<PsgcItem[]>(`https://psgc.gitlab.io/api/cities-municipalities/${selectedPresentCity}/barangays`);
                    setPermanentBarangays(barangaysRes.data);
                    setSelectedPermanentCity(selectedPresentCity);
                }
            }
        } catch (error) {
            console.error('Error loading address data:', error);
        }
    };

    useEffect(() => {
        const fetchRegions = async () => {
            try {
                const res = await axios.get<PsgcItem[]>('https://psgc.gitlab.io/api/regions');
                setPresentRegions(res.data);
                setPermanentRegions(res.data);
            } catch (error) {
                console.error('Failed to fetch regions:', error);
            }
        };
        fetchRegions();
    }, []);

    useEffect(() => {
        if (!selectedPresentRegion) return;
        setPresentCities([]); setPresentBarangays([]);
        setSelectedPresentProvince(''); setSelectedPresentCity('');
        form.setValue('present_province', ''); form.setValue('present_city', ''); form.setValue('present_brgy', '');
        const fetchProvinces = async () => {
            try {
                const res = await axios.get<PsgcItem[]>(`https://psgc.gitlab.io/api/regions/${selectedPresentRegion}/provinces`);
                setPresentProvinces(res.data);
            } catch (error) {
                console.error('Failed to fetch provinces:', error);
            }
        };
        fetchProvinces();
    }, [selectedPresentRegion]);

    useEffect(() => {
        if (!selectedPresentProvince) return;
        setPresentBarangays([]); setSelectedPresentCity('');
        form.setValue('present_city', ''); form.setValue('present_brgy', '');
        const fetchCities = async () => {
            try {
                const res = await axios.get<PsgcItem[]>(`https://psgc.gitlab.io/api/provinces/${selectedPresentProvince}/cities-municipalities`);
                setPresentCities(res.data);
            } catch (error) {
                console.error('Failed to fetch cities:', error);
            }
        };
        fetchCities();
    }, [selectedPresentProvince]);

    useEffect(() => {
        if (!selectedPresentCity) return;
        form.setValue('present_brgy', '');
        const fetchBarangays = async () => {
            try {
                const res = await axios.get<PsgcItem[]>(`https://psgc.gitlab.io/api/cities-municipalities/${selectedPresentCity}/barangays`);
                setPresentBarangays(res.data);
            } catch (error) {
                console.error('Failed to fetch barangays:', error);
            }
        };
        fetchBarangays();
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
        selectedPresentRegion, selectedPresentProvince, selectedPresentCity,
        form.watch('present_street'), form.watch('present_zip'),
        form.watch('present_province'), form.watch('present_city'), form.watch('present_brgy'),
        presentRegions, presentProvinces, presentCities, presentBarangays,
    ]);

    useEffect(() => {
        if (isSameAddress || !selectedPermanentRegion) return;
        setPermanentCities([]); setPermanentBarangays([]);
        setSelectedPermanentProvince(''); setSelectedPermanentCity('');
        form.setValue('permanent_province', ''); form.setValue('permanent_city', ''); form.setValue('permanent_brgy', '');
        const fetchProvinces = async () => {
            try {
                const res = await axios.get<PsgcItem[]>(`https://psgc.gitlab.io/api/regions/${selectedPermanentRegion}/provinces`);
                setPermanentProvinces(res.data);
            } catch (error) {
                console.error('Failed to fetch provinces:', error);
            }
        };
        fetchProvinces();
    }, [selectedPermanentRegion, isSameAddress]);

    useEffect(() => {
        if (isSameAddress || !selectedPermanentProvince) return;
        setPermanentBarangays([]); setSelectedPermanentCity('');
        form.setValue('permanent_city', ''); form.setValue('permanent_brgy', '');
        const fetchCities = async () => {
            try {
                const res = await axios.get<PsgcItem[]>(`https://psgc.gitlab.io/api/provinces/${selectedPermanentProvince}/cities-municipalities`);
                setPermanentCities(res.data);
            } catch (error) {
                console.error('Failed to fetch cities:', error);
            }
        };
        fetchCities();
    }, [selectedPermanentProvince, isSameAddress]);

    useEffect(() => {
        if (isSameAddress || !selectedPermanentCity) return;
        form.setValue('permanent_brgy', '');
        const fetchBarangays = async () => {
            try {
                const res = await axios.get<PsgcItem[]>(`https://psgc.gitlab.io/api/cities-municipalities/${selectedPermanentCity}/barangays`);
                setPermanentBarangays(res.data);
            } catch (error) {
                console.error('Failed to fetch barangays:', error);
            }
        };
        fetchBarangays();
    }, [selectedPermanentCity, isSameAddress]);

    // Email verification
    const [codeSent, setCodeSent] = useState(false);
    const [sendingCode, setSendingCode] = useState(false);
    const [verifyingCode, setVerifyingCode] = useState(false);
    const [emailVerified, setEmailVerified] = useState(false);
    const [altCodeSent, setAltCodeSent] = useState(false);
    const [sendingAltCode, setSendingAltCode] = useState(false);
    const [verifyingAltCode, setVerifyingAltCode] = useState(false);
    const [altEmailVerified, setAltEmailVerified] = useState(false);

    const checkEmailAvailability = async (email: string, fieldName: 'email' | 'alt_email') => {
        if (!email) return;
        try {
            const response = await axios.post('/applications/check-email', { email });
            if (response.data.exists) {
                form.setError(fieldName, { type: 'manual', message: response.data.message });
            } else {
                form.clearErrors(fieldName);
            }
        } catch (error) {
            console.error('Error checking email:', error);
        }
    };

    const sendVerificationCode = async () => {
        const email = form.getValues('email');
        if (!email) { form.setError('email', { message: 'Email is required' }); return; }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) { form.setError('email', { message: 'Please enter a valid email address' }); return; }
        setSendingCode(true);
        try {
            const response = await fetch('http://localhost:8000/api/email/send-verification', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                body: JSON.stringify({ email }),
            });
            const data = await response.json();
            if (response.ok && data.success) { setCodeSent(true); }
            else { form.setError('email', { message: data.message || 'Failed to send verification code' }); }
        } catch { form.setError('email', { message: 'Network error. Please check your connection and try again.' }); }
        finally { setSendingCode(false); }
    };

    const verifyCode = async () => {
        const email = form.getValues('email');
        const code = form.getValues('verificationCode');
        if (!code || code.length !== 6) { form.setError('verificationCode', { message: 'Please enter a valid 6-digit code' }); return; }
        setVerifyingCode(true);
        try {
            const response = await fetch('http://localhost:8000/api/email/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                body: JSON.stringify({ email, code }),
            });
            const data = await response.json();
            if (response.ok && data.success) { setEmailVerified(true); form.clearErrors('verificationCode'); }
            else { form.setError('verificationCode', { message: data.message || 'Invalid verification code' }); }
        } catch { form.setError('verificationCode', { message: 'Network error. Please try again.' }); }
        finally { setVerifyingCode(false); }
    };

    const sendAltVerificationCode = async () => {
        const alt_email = form.getValues('alt_email');
        if (!alt_email) { form.setError('alt_email', { message: 'Email is required' }); return; }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(alt_email)) { form.setError('alt_email', { message: 'Please enter a valid email address' }); return; }
        setSendingAltCode(true);
        try {
            const response = await fetch('http://localhost:8000/api/email/send-altverification', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                body: JSON.stringify({ alt_email }),
            });
            const data = await response.json();
            if (response.ok && data.success) { setAltCodeSent(true); }
            else { form.setError('alt_email', { message: data.message || 'Failed to send verification code' }); }
        } catch { form.setError('alt_email', { message: 'Network error. Please check your connection and try again.' }); }
        finally { setSendingAltCode(false); }
    };

    const verifyAltCode = async () => {
        const alt_email = form.getValues('alt_email');
        const code = form.getValues('altVerificationCode');
        if (!code || code.length !== 6) { form.setError('altVerificationCode', { message: 'Please enter a valid 6-digit code' }); return; }
        setVerifyingAltCode(true);
        try {
            const response = await fetch('http://localhost:8000/api/email/altverify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                body: JSON.stringify({ alt_email, code }),
            });
            const data = await response.json();
            if (response.ok && data.success) { setAltEmailVerified(true); form.clearErrors('altVerificationCode'); }
            else { form.setError('altVerificationCode', { message: data.message || 'Invalid verification code' }); }
        } catch { form.setError('altVerificationCode', { message: 'Network error. Please try again.' }); }
        finally { setVerifyingAltCode(false); }
    };

    const onSubmit = async (values: ApplicantFormValues) => {
        try {
            const formData = new FormData();
            Object.entries(values).forEach(([key, value]) => {
                if (key === 'siblings' || key === 'schools') {
                    if (Array.isArray(value) && value.length > 0) formData.append(key, JSON.stringify(value));
                    return;
                }
                if (key === 'doctors_note_file' && value instanceof File) {
                    formData.append('doctors_note_file', value);
                } else if (key === 'health_conditions') {
                    if (Array.isArray(value) && value.length > 0) formData.append(key, JSON.stringify(value));
                    else if (typeof value === 'string' && value) formData.append(key, value);
                } else if (['certificate_of_enrollment', 'birth_certificate', 'latest_report_card_front', 'latest_report_card_back', 'doctors_note_file'].includes(key)) {
                    if (value instanceof File) formData.append(key, value);
                } else if (typeof value === 'boolean') {
                    formData.append(key, value ? '1' : '0');
                } else if (value !== null && value !== undefined && value !== '') {
                    formData.append(key, value.toString());
                }
            });
            router.post('/applications/apply-les', formData, {
                forceFormData: true,
                onSuccess: () => { router.visit('/applications/success', { replace: true }); },
                onError: (errors) => {
                    console.error('Submission errors:', errors);
                    if (errors.duplicate_application) setIsDuplicateDialogOpen(true);
                    const firstError = Object.values(errors)[0];
                    toast.error(firstError || 'Failed to submit application.');
                    Object.keys(errors).forEach((key) => {
                        form.setError(key as any, { type: 'manual', message: errors[key] });
                    });
                },
            });
        } catch (error) {
            console.error('Submission error:', error);
            toast.error('An unexpected error occurred. Please try again.');
        }
    };

    return {
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
    };
}
