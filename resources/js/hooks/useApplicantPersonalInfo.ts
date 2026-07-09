import { router, usePage } from '@inertiajs/react';
import { type ChangeEvent, type FormEvent, useEffect, useState } from 'react';

export interface Sibling { sibling_full_name: string; sibling_grade_level: string; sibling_id_number: string }
export interface School  { school_name: string; school_address: string; from_grade: string; to_grade: string; from_year: string; to_year: string; honors_awards: string; general_average: string; class_rank: string; class_size: string }

interface PersonalData {
    email: string; alt_email: string | null; mobile_number: string | null;
    present_street: string | null; present_brgy: string | null; present_city: string | null;
    present_province: string | null; present_zip: string | null;
    permanent_street: string | null; permanent_brgy: string | null; permanent_city: string | null;
    permanent_province: string | null; permanent_zip: string | null;
    stopped_studying: string | null; accelerated: string | null;
    health_conditions: string[]; has_doctors_note: boolean | null;
}

interface FamilyBackground {
    father_lname: string | null; father_fname: string | null; father_mname: string | null; father_living: string | null;
    father_citizenship: string | null; father_religion: string | null; father_highest_educ: string | null;
    father_occupation: string | null; father_income: string | null; father_business_emp: string | null;
    father_business_address: string | null; father_contact_no: string | null; father_email: string | null;
    father_slu_employee: boolean | null; father_slu_dept: string | null;
    mother_lname: string | null; mother_fname: string | null; mother_mname: string | null; mother_living: string | null;
    mother_citizenship: string | null; mother_religion: string | null; mother_highest_educ: string | null;
    mother_occupation: string | null; mother_income: string | null; mother_business_emp: string | null;
    mother_business_address: string | null; mother_contact_no: string | null; mother_email: string | null;
    mother_slu_employee: boolean | null; mother_slu_dept: string | null;
    guardian_lname: string | null; guardian_fname: string | null; guardian_mname: string | null;
    guardian_relationship: string | null; guardian_citizenship: string | null; guardian_religion: string | null;
    guardian_highest_educ: string | null; guardian_occupation: string | null; guardian_income: string | null;
    guardian_business_emp: string | null; guardian_business_address: string | null;
    guardian_contact_no: string | null; guardian_email: string | null;
    guardian_slu_employee: boolean | null; guardian_slu_dept: string | null;
    emergency_contact_name: string | null; emergency_relationship: string | null;
    emergency_home_phone: string | null; emergency_mobile_phone: string | null; emergency_email: string | null;
}

interface Params {
    personalData: PersonalData | null;
    familyBackground: FamilyBackground | null;
    siblings: Sibling[];
    educationalBackground: School[];
}

const NAV_IDS = ['personal', 'health', 'family', 'siblings', 'education', 'documents'];

const s = (v: string | null | undefined) => v ?? '';
const b = (v: boolean | null | undefined) => v ? 'true' : 'false';

const blankSibling = (): Sibling => ({ sibling_full_name: '', sibling_grade_level: '', sibling_id_number: '' });
const blankSchool  = (): School  => ({ school_name: '', school_address: '', from_grade: '', to_grade: '', from_year: '', to_year: '', honors_awards: '', general_average: '', class_rank: '', class_size: '' });

export function useApplicantPersonalInfo({ personalData: pd, familyBackground: fb, siblings: initSiblings, educationalBackground: initSchools }: Params) {
    const { errors, applicationPeriodOpen } = usePage<{ errors: Record<string, string>; applicationPeriodOpen: boolean }>().props;

    const [isEditing, setIsEditing]       = useState(false);
    const [processing, setProcessing]     = useState(false);
    const [activeSection, setActiveSection] = useState('personal');

    const initForm = {
        email: s(pd?.email), alt_email: s(pd?.alt_email), mobile_number: s(pd?.mobile_number),
        present_street: s(pd?.present_street), present_brgy: s(pd?.present_brgy),
        present_city: s(pd?.present_city), present_province: s(pd?.present_province), present_zip: s(pd?.present_zip),
        permanent_street: s(pd?.permanent_street), permanent_brgy: s(pd?.permanent_brgy),
        permanent_city: s(pd?.permanent_city), permanent_province: s(pd?.permanent_province), permanent_zip: s(pd?.permanent_zip),
        stopped_studying: s(pd?.stopped_studying), accelerated: s(pd?.accelerated),
        health_conditions: Array.isArray(pd?.health_conditions) ? pd.health_conditions : [] as string[],
        has_doctors_note: b(pd?.has_doctors_note),
        father_lname: s(fb?.father_lname), father_fname: s(fb?.father_fname), father_mname: s(fb?.father_mname),
        father_living: s(fb?.father_living), father_citizenship: s(fb?.father_citizenship),
        father_religion: s(fb?.father_religion), father_highest_educ: s(fb?.father_highest_educ),
        father_occupation: s(fb?.father_occupation), father_income: s(fb?.father_income?.toString()),
        father_business_emp: s(fb?.father_business_emp), father_business_address: s(fb?.father_business_address),
        father_contact_no: s(fb?.father_contact_no), father_email: s(fb?.father_email),
        father_slu_employee: b(fb?.father_slu_employee), father_slu_dept: s(fb?.father_slu_dept),
        mother_lname: s(fb?.mother_lname), mother_fname: s(fb?.mother_fname), mother_mname: s(fb?.mother_mname),
        mother_living: s(fb?.mother_living), mother_citizenship: s(fb?.mother_citizenship),
        mother_religion: s(fb?.mother_religion), mother_highest_educ: s(fb?.mother_highest_educ),
        mother_occupation: s(fb?.mother_occupation), mother_income: s(fb?.mother_income?.toString()),
        mother_business_emp: s(fb?.mother_business_emp), mother_business_address: s(fb?.mother_business_address),
        mother_contact_no: s(fb?.mother_contact_no), mother_email: s(fb?.mother_email),
        mother_slu_employee: b(fb?.mother_slu_employee), mother_slu_dept: s(fb?.mother_slu_dept),
        guardian_lname: s(fb?.guardian_lname), guardian_fname: s(fb?.guardian_fname), guardian_mname: s(fb?.guardian_mname),
        guardian_relationship: s(fb?.guardian_relationship), guardian_citizenship: s(fb?.guardian_citizenship),
        guardian_religion: s(fb?.guardian_religion), guardian_highest_educ: s(fb?.guardian_highest_educ),
        guardian_occupation: s(fb?.guardian_occupation), guardian_income: s(fb?.guardian_income?.toString()),
        guardian_business_emp: s(fb?.guardian_business_emp), guardian_business_address: s(fb?.guardian_business_address),
        guardian_contact_no: s(fb?.guardian_contact_no), guardian_email: s(fb?.guardian_email),
        guardian_slu_employee: b(fb?.guardian_slu_employee), guardian_slu_dept: s(fb?.guardian_slu_dept),
        emergency_contact_name: s(fb?.emergency_contact_name), emergency_relationship: s(fb?.emergency_relationship),
        emergency_home_phone: s(fb?.emergency_home_phone), emergency_mobile_phone: s(fb?.emergency_mobile_phone),
        emergency_email: s(fb?.emergency_email),
    };

    const [form, setForm]         = useState(initForm);
    const [siblings, setSiblings] = useState<Sibling[]>(initSiblings.length ? initSiblings : []);
    const [schools, setSchools]   = useState<School[]>(initSchools.length ? initSchools : []);
    const [docFiles, setDocFiles] = useState<Record<string, File | null>>({
        certificate_of_enrollment: null, birth_certificate: null,
        latest_report_card_front: null, latest_report_card_back: null, doctors_note_file: null,
    });

    useEffect(() => {
        const onScroll = () => {
            for (const id of [...NAV_IDS].reverse()) {
                const el = document.getElementById(id);
                if (el && el.getBoundingClientRect().top <= 160) {
                    setActiveSection(id);
                    return;
                }
            }
            setActiveSection('personal');
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    const scrollToSection = (id: string) => {
        const el = document.getElementById(id);
        if (!el) return;
        const top = el.getBoundingClientRect().top + window.pageYOffset - 160;
        setActiveSection(id);
        window.scrollTo({ top, behavior: 'smooth' });
    };

    const handleBack = () => router.visit('/applicant/dashboard');

    const set = (key: string) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
        setForm(p => ({ ...p, [key]: e.target.value }));

    const toggleHealth = (option: string) =>
        setForm(p => ({
            ...p,
            health_conditions: p.health_conditions.includes(option)
                ? p.health_conditions.filter(h => h !== option)
                : [...p.health_conditions, option],
        }));

    const onFile = (key: string) => (e: ChangeEvent<HTMLInputElement>) =>
        setDocFiles(p => ({ ...p, [key]: e.target.files?.[0] ?? null }));

    const setSibling = (i: number, key: keyof Sibling, val: string) =>
        setSiblings(p => p.map((sib, idx) => idx === i ? { ...sib, [key]: val } : sib));

    const setSchool = (i: number, key: keyof School, val: string) =>
        setSchools(p => p.map((sc, idx) => idx === i ? { ...sc, [key]: val } : sc));

    const addSibling    = () => setSiblings(p => [...p, blankSibling()]);
    const removeSibling = (i: number) => setSiblings(p => p.filter((_, idx) => idx !== i));
    const addSchool     = () => setSchools(p => [...p, blankSchool()]);
    const removeSchool  = (i: number) => setSchools(p => p.filter((_, idx) => idx !== i));

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        router.put('/applicant/profile', {
            ...form,
            siblings,
            schools,
            ...docFiles,
        } as Record<string, unknown>, {
            onSuccess: () => { setIsEditing(false); setProcessing(false); },
            onFinish: () => setProcessing(false),
        });
    };

    const handleCancel = () => {
        setForm(initForm);
        setSiblings(initSiblings.length ? initSiblings : []);
        setSchools(initSchools.length ? initSchools : []);
        setDocFiles({ certificate_of_enrollment: null, birth_certificate: null, latest_report_card_front: null, latest_report_card_back: null, doctors_note_file: null });
        setIsEditing(false);
    };

    return {
        errors,
        applicationPeriodOpen,
        isEditing,
        setIsEditing,
        processing,
        activeSection,
        form,
        setForm,
        siblings,
        schools,
        docFiles,
        scrollToSection,
        handleBack,
        set,
        toggleHealth,
        onFile,
        setSibling,
        setSchool,
        addSibling,
        removeSibling,
        addSchool,
        removeSchool,
        handleSubmit,
        handleCancel,
    };
}
