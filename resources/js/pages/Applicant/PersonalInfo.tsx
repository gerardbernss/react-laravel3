import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import StudentLayout from '@/layouts/student-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { ArrowLeft, Edit2, FileText, GraduationCap, Heart, Save, User, UserPlus, Users, X } from 'lucide-react';
import { type ChangeEvent, useEffect, useState } from 'react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Sibling { sibling_full_name: string; sibling_grade_level: string; sibling_id_number: string }
interface School  { school_name: string; school_address: string; from_grade: string; to_grade: string; from_year: string; to_year: string; honors_awards: string; general_average: string; class_rank: string; class_size: string }

interface Props {
    personalData: {
        first_name: string; last_name: string; middle_name: string | null; suffix: string | null;
        gender: string | null; citizenship: string | null; religion: string | null;
        date_of_birth: string | null; place_of_birth: string | null; learner_reference_number: string | null;
        email: string; alt_email: string | null; mobile_number: string | null;
        present_street: string | null; present_brgy: string | null; present_city: string | null;
        present_province: string | null; present_zip: string | null;
        permanent_street: string | null; permanent_brgy: string | null; permanent_city: string | null;
        permanent_province: string | null; permanent_zip: string | null;
        stopped_studying: string | null; accelerated: string | null;
        health_conditions: string[]; has_doctors_note: boolean | null; doctors_note_file: string | null;
    } | null;
    familyBackground: {
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
    } | null;
    siblings: Sibling[];
    educationalBackground: School[];
    documents: {
        certificate_of_enrollment: string | null; birth_certificate: string | null;
        latest_report_card_front: string | null; latest_report_card_back: string | null;
    } | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/applicant/dashboard' },
    { title: 'Application Information', href: '/applicant/personal-info' },
];

const HEALTH_OPTIONS = ['Asthma', 'Diabetes', 'Heart Disease', 'Epilepsy', 'Severe Allergies', 'Visual Impairment', 'Hearing Impairment', 'Others'];

const NAV_ITEMS = [
    { id: 'personal',   label: 'Personal Info',       icon: <User className="h-5 w-5" /> },
    { id: 'health',     label: 'Health Info',          icon: <Heart className="h-5 w-5" /> },
    { id: 'family',     label: 'Family Background',    icon: <Users className="h-5 w-5" /> },
    { id: 'siblings',   label: 'Sibling Discount',     icon: <UserPlus className="h-5 w-5" /> },
    { id: 'education',  label: 'Education',            icon: <GraduationCap className="h-5 w-5" /> },
    { id: 'documents',  label: 'Documents',            icon: <FileText className="h-5 w-5" /> },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const s = (v: string | null | undefined) => v ?? '';
const b = (v: boolean | null | undefined) => v ? 'true' : 'false';
const blankSibling = (): Sibling => ({ sibling_full_name: '', sibling_grade_level: '', sibling_id_number: '' });
const blankSchool  = (): School  => ({ school_name: '', school_address: '', from_grade: '', to_grade: '', from_year: '', to_year: '', honors_awards: '', general_average: '', class_rank: '', class_size: '' });

// ─── Field wrapper ────────────────────────────────────────────────────────────

const Field = ({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) => (
    <div className="space-y-1">
        <Label className="text-sm font-medium text-gray-700">{label}</Label>
        {children}
        {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
);

const ReadValue = ({ value }: { value?: string | number | null }) => (
    <p className="mt-1 text-sm text-gray-900">{value || <span className="text-gray-400">—</span>}</p>
);

// ─── Main component ───────────────────────────────────────────────────────────

export default function ApplicantPersonalInfo({
    personalData: pd,
    familyBackground: fb,
    siblings: initSiblings,
    educationalBackground: initSchools,
    documents: initDocs,
}: Props) {
    const { errors } = usePage<{ errors: Record<string, string> }>().props;

    const [isEditing, setIsEditing]   = useState(false);
    const [processing, setProcessing] = useState(false);
    const [activeSection, setActiveSection] = useState('personal');

    // ── Form state ─────────────────────────────────────────────────────────
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

    const [form, setForm]     = useState(initForm);
    const [siblings, setSiblings] = useState<Sibling[]>(initSiblings.length ? initSiblings : []);
    const [schools, setSchools]   = useState<School[]>(initSchools.length ? initSchools : []);
    const [docFiles, setDocFiles] = useState<Record<string, File | null>>({
        certificate_of_enrollment: null, birth_certificate: null,
        latest_report_card_front: null, latest_report_card_back: null, doctors_note_file: null,
    });

    // ── Scrollspy ──────────────────────────────────────────────────────────
    useEffect(() => {
        const onScroll = () => {
            for (const item of [...NAV_ITEMS].reverse()) {
                const el = document.getElementById(item.id);
                if (el && el.getBoundingClientRect().top <= 160) {
                    setActiveSection(item.id);
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
        const offset = 160;
        const top = el.getBoundingClientRect().top + window.pageYOffset - offset;
        setActiveSection(id);
        window.scrollTo({ top, behavior: 'smooth' });
    };

    // ── Handlers ───────────────────────────────────────────────────────────
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
        setSiblings(p => p.map((s, idx) => idx === i ? { ...s, [key]: val } : s));

    const setSchool = (i: number, key: keyof School, val: string) =>
        setSchools(p => p.map((sc, idx) => idx === i ? { ...sc, [key]: val } : sc));

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        router.post('/applicant/personal-info', {
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

    if (!pd) {
        return (
            <StudentLayout breadcrumbs={breadcrumbs}>
                <Head title="Application Information" />
                <div className="rounded-lg border bg-white p-8 text-center shadow-sm">
                    <User className="mx-auto h-12 w-12 text-gray-400" />
                    <h2 className="mt-4 text-lg font-semibold text-gray-900">No Personal Data Found</h2>
                    <p className="mt-2 text-gray-600">We couldn&apos;t find your personal information. Please contact the admissions office.</p>
                </div>
            </StudentLayout>
        );
    }

    return (
        <StudentLayout breadcrumbs={breadcrumbs}>
            <Head title="Application Information" />

            <div className="min-h-screen bg-[#f5f5f5]">

                {/* Sticky header: title row + step navigation (one block, same as Edit.tsx) */}
                <div className="sticky top-0 z-50 bg-white shadow-sm">
                    <div className="mx-auto max-w-[1500px] px-10 pt-8 pb-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <button type="button" className="rounded-full p-2 transition-colors hover:bg-blue-100"
                                    onClick={() => router.visit('/applicant/dashboard')}>
                                    <ArrowLeft className="h-5 w-5" />
                                </button>
                                <h1 className="text-3xl font-bold text-gray-900">
                                    {pd.first_name} {pd.last_name}
                                </h1>
                            </div>
                            <div className="flex gap-2">
                                {isEditing ? (
                                    <>
                                        <Button type="button" onClick={handleCancel}
                                            className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50">
                                            Cancel
                                        </Button>
                                        <Button type="button" onClick={handleSubmit} disabled={processing}
                                            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#05509e]">
                                            {processing ? 'Saving...' : 'Save Changes'}
                                        </Button>
                                    </>
                                ) : (
                                    <Button type="button" onClick={() => setIsEditing(true)}
                                        className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50">
                                        <Edit2 className="h-4 w-4" /> Edit Information
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Step navigation — inside sticky header, same as Edit.tsx */}
                    <div className="w-full bg-white">
                        <div className="flex items-center justify-between overflow-x-auto px-25 py-4">
                            {NAV_ITEMS.map((item, index) => (
                                <div key={item.id} className="flex items-center">
                                    <button type="button" onClick={() => scrollToSection(item.id)}
                                        className="flex flex-col items-center px-3 text-center transition-colors">
                                        <div className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                                            activeSection === item.id
                                                ? 'border-[#073066] bg-primary text-white shadow-md'
                                                : 'border-gray-200 bg-white text-gray-400 hover:border-gray-300 hover:text-gray-500'
                                        }`}>
                                            {item.icon}
                                        </div>
                                        <span className={`mt-2 text-xs whitespace-nowrap ${activeSection === item.id ? 'font-semibold text-[#073066]' : 'text-gray-600'}`}>
                                            {item.label}
                                        </span>
                                    </button>
                                    {index < NAV_ITEMS.length - 1 && <div className="mx-2 h-0.5 w-31 bg-gray-300" />}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="mx-auto max-w-[1500px] px-10 py-8">
                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* ── 1. Personal Information ──────────────────────────────── */}
                    <div id="personal" className="scroll-mt-40 rounded-lg border pb-6 shadow-sm">
                        <div className="mb-6 rounded-tl-lg rounded-tr-lg bg-[#004c88] p-4">
                            <h2 className="text-xl font-bold text-white">Personal Information</h2>
                        </div>
                        <div className="space-y-6 px-4">

                            <div>
                                <h3 className="mb-4 font-semibold text-gray-800">Basic Information</h3>
                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                                    <Field label="Last Name"><ReadValue value={pd.last_name} /></Field>
                                    <Field label="First Name"><ReadValue value={pd.first_name} /></Field>
                                    <Field label="Middle Name"><ReadValue value={pd.middle_name} /></Field>
                                    <Field label="Suffix"><ReadValue value={pd.suffix} /></Field>
                                    <Field label="Gender"><ReadValue value={pd.gender} /></Field>
                                    <Field label="Date of Birth"><ReadValue value={pd.date_of_birth ? new Date(pd.date_of_birth).toLocaleDateString() : null} /></Field>
                                    <Field label="Place of Birth"><ReadValue value={pd.place_of_birth} /></Field>
                                    <Field label="Citizenship"><ReadValue value={pd.citizenship} /></Field>
                                    <Field label="Religion"><ReadValue value={pd.religion} /></Field>
                                    <Field label="Learner Reference Number (LRN)"><ReadValue value={pd.learner_reference_number} /></Field>
                                    <Field label="Stopped Studying">
                                        {isEditing
                                            ? <><Input value={form.stopped_studying} onChange={set('stopped_studying')} className="mt-1" /><InputError message={errors.stopped_studying} /></>
                                            : <ReadValue value={pd.stopped_studying} />}
                                    </Field>
                                    <Field label="Accelerated">
                                        {isEditing
                                            ? <><Input value={form.accelerated} onChange={set('accelerated')} className="mt-1" /><InputError message={errors.accelerated} /></>
                                            : <ReadValue value={pd.accelerated} />}
                                    </Field>
                                </div>
                            </div>

                            <div>
                                <h3 className="mb-4 font-semibold text-gray-800">Contact Information</h3>
                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                                    <Field label="Email Address" error={errors.email}>
                                        {isEditing
                                            ? <Input type="email" value={form.email} onChange={set('email')} className="mt-1" />
                                            : <ReadValue value={pd.email} />}
                                    </Field>
                                    <Field label="Alternate Email" error={errors.alt_email}>
                                        {isEditing
                                            ? <Input type="email" value={form.alt_email} onChange={set('alt_email')} className="mt-1" />
                                            : <ReadValue value={pd.alt_email} />}
                                    </Field>
                                    <Field label="Mobile Number" error={errors.mobile_number}>
                                        {isEditing
                                            ? <Input type="tel" value={form.mobile_number} onChange={set('mobile_number')} className="mt-1" />
                                            : <ReadValue value={pd.mobile_number} />}
                                    </Field>
                                </div>
                            </div>

                            <div>
                                <h3 className="mb-4 font-semibold text-gray-800">Present Address</h3>
                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                                    {([
                                        ['present_street','Street Address', pd.present_street],
                                        ['present_brgy','Barangay', pd.present_brgy],
                                        ['present_city','City / Municipality', pd.present_city],
                                        ['present_province','Province', pd.present_province],
                                        ['present_zip','ZIP Code', pd.present_zip],
                                    ] as [string,string,string|null][]).map(([k,l,v]) => (
                                        <Field key={k} label={l} error={errors[k]}>
                                            {isEditing
                                                ? <Input value={form[k as keyof typeof form] as string} onChange={set(k)} className="mt-1" />
                                                : <ReadValue value={v} />}
                                        </Field>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <h3 className="mb-4 font-semibold text-gray-800">Permanent Address</h3>
                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                                    {([
                                        ['permanent_street','Street Address', pd.permanent_street],
                                        ['permanent_brgy','Barangay', pd.permanent_brgy],
                                        ['permanent_city','City / Municipality', pd.permanent_city],
                                        ['permanent_province','Province', pd.permanent_province],
                                        ['permanent_zip','ZIP Code', pd.permanent_zip],
                                    ] as [string,string,string|null][]).map(([k,l,v]) => (
                                        <Field key={k} label={l} error={errors[k]}>
                                            {isEditing
                                                ? <Input value={form[k as keyof typeof form] as string} onChange={set(k)} className="mt-1" />
                                                : <ReadValue value={v} />}
                                        </Field>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── 2. Health Information ────────────────────────────────── */}
                    <div id="health" className="scroll-mt-40 rounded-lg border pb-6 shadow-sm">
                        <div className="mb-6 rounded-tl-lg rounded-tr-lg bg-[#004c88] p-4">
                            <h2 className="text-xl font-bold text-white">Health Information</h2>
                        </div>
                        <div className="space-y-6 px-4">
                            <div>
                                <Label className="text-sm font-medium text-gray-700">Health Conditions</Label>
                                {isEditing ? (
                                    <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                                        {HEALTH_OPTIONS.map(opt => (
                                            <label key={opt} className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                                                <input type="checkbox" checked={form.health_conditions.includes(opt)}
                                                    onChange={() => toggleHealth(opt)} className="accent-[#073066]" />
                                                {opt}
                                            </label>
                                        ))}
                                    </div>
                                ) : (
                                    <ReadValue value={Array.isArray(pd.health_conditions) && pd.health_conditions.length ? pd.health_conditions.join(', ') : 'None'} />
                                )}
                            </div>

                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                <Field label="Has Doctor's Note?">
                                    {isEditing ? (
                                        <div className="mt-1 flex gap-4">
                                            {['true','false'].map(v => (
                                                <label key={v} className="flex items-center gap-1.5 cursor-pointer text-sm text-gray-700">
                                                    <input type="radio" value={v} checked={form.has_doctors_note === v}
                                                        onChange={() => setForm(p => ({ ...p, has_doctors_note: v }))}
                                                        className="accent-[#073066]" />
                                                    {v === 'true' ? 'Yes' : 'No'}
                                                </label>
                                            ))}
                                        </div>
                                    ) : (
                                        <ReadValue value={pd.has_doctors_note ? 'Yes' : 'No'} />
                                    )}
                                </Field>

                                <Field label="Doctor's Note File" error={errors.doctors_note_file}>
                                    {pd.doctors_note_file && (
                                        <a href={`/storage/${pd.doctors_note_file}`} target="_blank" rel="noreferrer"
                                            className="text-sm text-blue-600 hover:underline block mt-1">
                                            {pd.doctors_note_file.split('/').pop()}
                                        </a>
                                    )}
                                    {isEditing && (
                                        <div className="mt-1">
                                            <input type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={onFile('doctors_note_file')}
                                                className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-md file:border-0 file:bg-[#073066]/10 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-[#073066] hover:file:bg-[#073066]/20" />
                                            {docFiles.doctors_note_file && <p className="mt-1 text-xs text-green-600">Selected: {docFiles.doctors_note_file.name}</p>}
                                        </div>
                                    )}
                                    {!pd.doctors_note_file && !isEditing && <ReadValue value={null} />}
                                </Field>
                            </div>
                        </div>
                    </div>

                    {/* ── 3. Family Background ─────────────────────────────────── */}
                    <div id="family" className="scroll-mt-40 rounded-lg border pb-6 shadow-sm">
                        <div className="mb-6 rounded-tl-lg rounded-tr-lg bg-[#004c88] p-4">
                            <h2 className="text-xl font-bold text-white">Family Background</h2>
                        </div>
                        <div className="space-y-8 px-6">

                            {/* Father */}
                            <div>
                                <h3 className="mb-4 font-semibold text-gray-800">Father&apos;s Details</h3>
                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                                    {isEditing ? (
                                        <>
                                            {([['father_lname','Last Name'],['father_fname','First Name'],['father_mname','Middle Name']] as [string,string][]).map(([k,l]) => (
                                                <Field key={k} label={l} error={errors[k]}>
                                                    <Input value={form[k as keyof typeof form] as string} onChange={set(k)} className="mt-1" />
                                                </Field>
                                            ))}
                                            <Field label="Living / Deceased">
                                                <div className="mt-1 flex gap-4">
                                                    {['Living','Deceased'].map(v => (
                                                        <label key={v} className="flex items-center gap-1.5 cursor-pointer text-sm text-gray-700">
                                                            <input type="radio" value={v} checked={form.father_living === v}
                                                                onChange={() => setForm(p => ({ ...p, father_living: v }))} className="accent-[#073066]" />
                                                            {v}
                                                        </label>
                                                    ))}
                                                </div>
                                            </Field>
                                            {([['father_citizenship','Citizenship'],['father_religion','Religion'],['father_highest_educ','Highest Education'],['father_occupation','Occupation'],['father_income','Monthly Income'],['father_business_emp','Employer / Business'],['father_business_address','Business Address'],['father_contact_no','Contact Number'],['father_email','Email']] as [string,string][]).map(([k,l]) => (
                                                <Field key={k} label={l} error={errors[k]}>
                                                    <Input value={form[k as keyof typeof form] as string} onChange={set(k)} className="mt-1" />
                                                </Field>
                                            ))}
                                            <Field label="SLU Employee?">
                                                <div className="mt-1 flex gap-4">
                                                    {['true','false'].map(v => (
                                                        <label key={v} className="flex items-center gap-1.5 cursor-pointer text-sm text-gray-700">
                                                            <input type="radio" value={v} checked={form.father_slu_employee === v}
                                                                onChange={() => setForm(p => ({ ...p, father_slu_employee: v }))} className="accent-[#073066]" />
                                                            {v === 'true' ? 'Yes' : 'No'}
                                                        </label>
                                                    ))}
                                                </div>
                                            </Field>
                                            {form.father_slu_employee === 'true' && (
                                                <Field label="SLU Department" error={errors.father_slu_dept}>
                                                    <Input value={form.father_slu_dept} onChange={set('father_slu_dept')} className="mt-1" />
                                                </Field>
                                            )}
                                        </>
                                    ) : (
                                        <>
                                            <Field label="Full Name"><ReadValue value={[fb?.father_fname, fb?.father_lname].filter(Boolean).join(' ') || null} /></Field>
                                            <Field label="Living / Deceased"><ReadValue value={fb?.father_living} /></Field>
                                            <Field label="Citizenship"><ReadValue value={fb?.father_citizenship} /></Field>
                                            <Field label="Religion"><ReadValue value={fb?.father_religion} /></Field>
                                            <Field label="Highest Education"><ReadValue value={fb?.father_highest_educ} /></Field>
                                            <Field label="Occupation"><ReadValue value={fb?.father_occupation} /></Field>
                                            <Field label="Monthly Income"><ReadValue value={fb?.father_income} /></Field>
                                            <Field label="Employer / Business"><ReadValue value={fb?.father_business_emp} /></Field>
                                            <Field label="Business Address"><ReadValue value={fb?.father_business_address} /></Field>
                                            <Field label="Contact Number"><ReadValue value={fb?.father_contact_no} /></Field>
                                            <Field label="Email"><ReadValue value={fb?.father_email} /></Field>
                                            <Field label="SLU Employee"><ReadValue value={fb?.father_slu_employee ? 'Yes' : 'No'} /></Field>
                                            {fb?.father_slu_employee && <Field label="SLU Department"><ReadValue value={fb?.father_slu_dept} /></Field>}
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Mother */}
                            <div>
                                <h3 className="mb-4 font-semibold text-gray-800">Mother&apos;s Details</h3>
                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                                    {isEditing ? (
                                        <>
                                            {([['mother_lname','Last Name'],['mother_fname','First Name'],['mother_mname','Middle Name']] as [string,string][]).map(([k,l]) => (
                                                <Field key={k} label={l} error={errors[k]}>
                                                    <Input value={form[k as keyof typeof form] as string} onChange={set(k)} className="mt-1" />
                                                </Field>
                                            ))}
                                            <Field label="Living / Deceased">
                                                <div className="mt-1 flex gap-4">
                                                    {['Living','Deceased'].map(v => (
                                                        <label key={v} className="flex items-center gap-1.5 cursor-pointer text-sm text-gray-700">
                                                            <input type="radio" value={v} checked={form.mother_living === v}
                                                                onChange={() => setForm(p => ({ ...p, mother_living: v }))} className="accent-[#073066]" />
                                                            {v}
                                                        </label>
                                                    ))}
                                                </div>
                                            </Field>
                                            {([['mother_citizenship','Citizenship'],['mother_religion','Religion'],['mother_highest_educ','Highest Education'],['mother_occupation','Occupation'],['mother_income','Monthly Income'],['mother_business_emp','Employer / Business'],['mother_business_address','Business Address'],['mother_contact_no','Contact Number'],['mother_email','Email']] as [string,string][]).map(([k,l]) => (
                                                <Field key={k} label={l} error={errors[k]}>
                                                    <Input value={form[k as keyof typeof form] as string} onChange={set(k)} className="mt-1" />
                                                </Field>
                                            ))}
                                            <Field label="SLU Employee?">
                                                <div className="mt-1 flex gap-4">
                                                    {['true','false'].map(v => (
                                                        <label key={v} className="flex items-center gap-1.5 cursor-pointer text-sm text-gray-700">
                                                            <input type="radio" value={v} checked={form.mother_slu_employee === v}
                                                                onChange={() => setForm(p => ({ ...p, mother_slu_employee: v }))} className="accent-[#073066]" />
                                                            {v === 'true' ? 'Yes' : 'No'}
                                                        </label>
                                                    ))}
                                                </div>
                                            </Field>
                                            {form.mother_slu_employee === 'true' && (
                                                <Field label="SLU Department" error={errors.mother_slu_dept}>
                                                    <Input value={form.mother_slu_dept} onChange={set('mother_slu_dept')} className="mt-1" />
                                                </Field>
                                            )}
                                        </>
                                    ) : (
                                        <>
                                            <Field label="Full Name"><ReadValue value={[fb?.mother_fname, fb?.mother_lname].filter(Boolean).join(' ') || null} /></Field>
                                            <Field label="Living / Deceased"><ReadValue value={fb?.mother_living} /></Field>
                                            <Field label="Citizenship"><ReadValue value={fb?.mother_citizenship} /></Field>
                                            <Field label="Religion"><ReadValue value={fb?.mother_religion} /></Field>
                                            <Field label="Highest Education"><ReadValue value={fb?.mother_highest_educ} /></Field>
                                            <Field label="Occupation"><ReadValue value={fb?.mother_occupation} /></Field>
                                            <Field label="Monthly Income"><ReadValue value={fb?.mother_income} /></Field>
                                            <Field label="Employer / Business"><ReadValue value={fb?.mother_business_emp} /></Field>
                                            <Field label="Business Address"><ReadValue value={fb?.mother_business_address} /></Field>
                                            <Field label="Contact Number"><ReadValue value={fb?.mother_contact_no} /></Field>
                                            <Field label="Email"><ReadValue value={fb?.mother_email} /></Field>
                                            <Field label="SLU Employee"><ReadValue value={fb?.mother_slu_employee ? 'Yes' : 'No'} /></Field>
                                            {fb?.mother_slu_employee && <Field label="SLU Department"><ReadValue value={fb?.mother_slu_dept} /></Field>}
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Guardian */}
                            <div>
                                <h3 className="mb-4 font-semibold text-gray-800">Guardian&apos;s Details</h3>
                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                                    {isEditing ? (
                                        <>
                                            {([['guardian_lname','Last Name'],['guardian_fname','First Name'],['guardian_mname','Middle Name'],['guardian_relationship','Relationship'],['guardian_citizenship','Citizenship'],['guardian_religion','Religion'],['guardian_highest_educ','Highest Education'],['guardian_occupation','Occupation'],['guardian_income','Monthly Income'],['guardian_business_emp','Employer / Business'],['guardian_business_address','Business Address'],['guardian_contact_no','Contact Number'],['guardian_email','Email']] as [string,string][]).map(([k,l]) => (
                                                <Field key={k} label={l} error={errors[k]}>
                                                    <Input value={form[k as keyof typeof form] as string} onChange={set(k)} className="mt-1" />
                                                </Field>
                                            ))}
                                            <Field label="SLU Employee?">
                                                <div className="mt-1 flex gap-4">
                                                    {['true','false'].map(v => (
                                                        <label key={v} className="flex items-center gap-1.5 cursor-pointer text-sm text-gray-700">
                                                            <input type="radio" value={v} checked={form.guardian_slu_employee === v}
                                                                onChange={() => setForm(p => ({ ...p, guardian_slu_employee: v }))} className="accent-[#073066]" />
                                                            {v === 'true' ? 'Yes' : 'No'}
                                                        </label>
                                                    ))}
                                                </div>
                                            </Field>
                                            {form.guardian_slu_employee === 'true' && (
                                                <Field label="SLU Department" error={errors.guardian_slu_dept}>
                                                    <Input value={form.guardian_slu_dept} onChange={set('guardian_slu_dept')} className="mt-1" />
                                                </Field>
                                            )}
                                        </>
                                    ) : (
                                        <>
                                            <Field label="Full Name"><ReadValue value={[fb?.guardian_fname, fb?.guardian_lname].filter(Boolean).join(' ') || null} /></Field>
                                            <Field label="Relationship"><ReadValue value={fb?.guardian_relationship} /></Field>
                                            <Field label="Citizenship"><ReadValue value={fb?.guardian_citizenship} /></Field>
                                            <Field label="Religion"><ReadValue value={fb?.guardian_religion} /></Field>
                                            <Field label="Highest Education"><ReadValue value={fb?.guardian_highest_educ} /></Field>
                                            <Field label="Occupation"><ReadValue value={fb?.guardian_occupation} /></Field>
                                            <Field label="Monthly Income"><ReadValue value={fb?.guardian_income} /></Field>
                                            <Field label="Employer / Business"><ReadValue value={fb?.guardian_business_emp} /></Field>
                                            <Field label="Business Address"><ReadValue value={fb?.guardian_business_address} /></Field>
                                            <Field label="Contact Number"><ReadValue value={fb?.guardian_contact_no} /></Field>
                                            <Field label="Email"><ReadValue value={fb?.guardian_email} /></Field>
                                            <Field label="SLU Employee"><ReadValue value={fb?.guardian_slu_employee ? 'Yes' : 'No'} /></Field>
                                            {fb?.guardian_slu_employee && <Field label="SLU Department"><ReadValue value={fb?.guardian_slu_dept} /></Field>}
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Emergency Contact */}
                            <div>
                                <h3 className="mb-4 font-semibold text-gray-800">Emergency Contact</h3>
                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                                    {([
                                        ['emergency_contact_name','Full Name', fb?.emergency_contact_name],
                                        ['emergency_relationship','Relationship', fb?.emergency_relationship],
                                        ['emergency_home_phone','Home Phone', fb?.emergency_home_phone],
                                        ['emergency_mobile_phone','Mobile Phone', fb?.emergency_mobile_phone],
                                        ['emergency_email','Email', fb?.emergency_email],
                                    ] as [string,string,string|null|undefined][]).map(([k,l,v]) => (
                                        <Field key={k} label={l} error={errors[k]}>
                                            {isEditing
                                                ? <Input value={form[k as keyof typeof form] as string} onChange={set(k)} className="mt-1" />
                                                : <ReadValue value={v} />}
                                        </Field>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── 4. Siblings ──────────────────────────────────────────── */}
                    <div id="siblings" className="scroll-mt-40 rounded-lg border pb-6 shadow-sm">
                        <div className="mb-6 rounded-tl-lg rounded-tr-lg bg-[#004c88] p-4">
                            <h2 className="text-xl font-bold text-white">Sibling Discount</h2>
                        </div>
                        <div className="px-4">
                            {siblings.length === 0 && !isEditing && (
                                <p className="text-sm text-gray-500">No siblings recorded.</p>
                            )}
                            {(siblings.length > 0 || isEditing) && (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-gray-200">
                                                <th className="py-2 pr-4 text-left text-xs font-semibold text-gray-600">Full Name</th>
                                                <th className="py-2 pr-4 text-left text-xs font-semibold text-gray-600">Grade Level</th>
                                                <th className="py-2 pr-4 text-left text-xs font-semibold text-gray-600">Student ID</th>
                                                {isEditing && <th className="py-2" />}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {siblings.map((sib, i) => (
                                                <tr key={i}>
                                                    <td className="py-2 pr-4">
                                                        {isEditing
                                                            ? <Input value={sib.sibling_full_name} onChange={e => setSibling(i, 'sibling_full_name', e.target.value)} />
                                                            : <span className="text-gray-900">{sib.sibling_full_name || '—'}</span>}
                                                    </td>
                                                    <td className="py-2 pr-4">
                                                        {isEditing
                                                            ? <Input value={sib.sibling_grade_level} onChange={e => setSibling(i, 'sibling_grade_level', e.target.value)} />
                                                            : <span className="text-gray-700">{sib.sibling_grade_level || '—'}</span>}
                                                    </td>
                                                    <td className="py-2 pr-4">
                                                        {isEditing
                                                            ? <Input value={sib.sibling_id_number} onChange={e => setSibling(i, 'sibling_id_number', e.target.value)} />
                                                            : <span className="text-gray-700">{sib.sibling_id_number || '—'}</span>}
                                                    </td>
                                                    {isEditing && (
                                                        <td className="py-2">
                                                            <button type="button" onClick={() => setSiblings(p => p.filter((_, idx) => idx !== i))}
                                                                className="text-red-500 hover:text-red-700">
                                                                <X className="h-4 w-4" />
                                                            </button>
                                                        </td>
                                                    )}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                            {isEditing && (
                                <Button type="button" variant="outline" size="sm" className="mt-4"
                                    onClick={() => setSiblings(p => [...p, blankSibling()])}>
                                    + Add Sibling
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* ── 5. Educational Background ────────────────────────────── */}
                    <div id="education" className="scroll-mt-40 rounded-lg border pb-6 shadow-sm">
                        <div className="mb-6 rounded-tl-lg rounded-tr-lg bg-[#004c88] p-4">
                            <h2 className="text-xl font-bold text-white">Educational Background</h2>
                        </div>
                        <div className="px-4">
                            {schools.length === 0 && !isEditing && (
                                <p className="text-sm text-gray-500">No educational background recorded.</p>
                            )}
                            <div className="space-y-4">
                                {schools.map((sc, i) => (
                                    <div key={i} className="rounded-lg border border-gray-200 p-4">
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-sm font-semibold text-gray-700">School {i + 1}</span>
                                            {isEditing && (
                                                <button type="button" onClick={() => setSchools(p => p.filter((_, idx) => idx !== i))}
                                                    className="text-red-500 hover:text-red-700">
                                                    <X className="h-4 w-4" />
                                                </button>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                                            {([
                                                ['school_name','School Name'],['school_address','School Address'],
                                                ['from_grade','From Grade'],['to_grade','To Grade'],
                                                ['from_year','From Year'],['to_year','To Year'],
                                                ['honors_awards','Honors / Awards'],['general_average','General Average'],
                                                ['class_rank','Class Rank'],['class_size','Class Size'],
                                            ] as [keyof School, string][]).map(([k, l]) => (
                                                <Field key={k} label={l}>
                                                    {isEditing
                                                        ? <Input value={sc[k]} onChange={e => setSchool(i, k, e.target.value)} className="mt-1" />
                                                        : <ReadValue value={sc[k]} />}
                                                </Field>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {isEditing && (
                                <Button type="button" variant="outline" size="sm" className="mt-4"
                                    onClick={() => setSchools(p => [...p, blankSchool()])}>
                                    + Add School
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* ── 6. Documents ─────────────────────────────────────────── */}
                    <div id="documents" className="scroll-mt-40 rounded-lg border pb-6 shadow-sm">
                        <div className="mb-6 rounded-tl-lg rounded-tr-lg bg-[#004c88] p-4">
                            <h2 className="text-xl font-bold text-white">Documents</h2>
                        </div>
                        <div className="px-4">
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                {([
                                    ['certificate_of_enrollment','Certificate of Enrollment', initDocs?.certificate_of_enrollment],
                                    ['birth_certificate','Birth Certificate', initDocs?.birth_certificate],
                                    ['latest_report_card_front','Latest Report Card (Front)', initDocs?.latest_report_card_front],
                                    ['latest_report_card_back','Latest Report Card (Back)', initDocs?.latest_report_card_back],
                                ] as [string,string,string|null|undefined][]).map(([key, label, currentPath]) => (
                                    <div key={key} className="rounded-lg border border-gray-200 p-4">
                                        <Label className="text-sm font-medium text-gray-700">{label}</Label>
                                        {currentPath ? (
                                            <a href={`/storage/${currentPath}`} target="_blank" rel="noreferrer"
                                                className="mt-1 block text-sm text-blue-600 hover:underline break-all">
                                                {currentPath.split('/').pop()}
                                            </a>
                                        ) : (
                                            !isEditing && <p className="mt-1 text-sm text-gray-400">—</p>
                                        )}
                                        {isEditing && (
                                            <div className="mt-2">
                                                <input type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={onFile(key)}
                                                    className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-md file:border-0 file:bg-[#073066]/10 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-[#073066] hover:file:bg-[#073066]/20" />
                                                {docFiles[key] && <p className="mt-1 text-xs text-green-600">Selected: {(docFiles[key] as File).name}</p>}
                                                <InputError message={errors[key]} className="mt-1" />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                </form>
                </div>{/* end mx-auto content */}
            </div>{/* end min-h-screen */}
        </StudentLayout>
    );
}
