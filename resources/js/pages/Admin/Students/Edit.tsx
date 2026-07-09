import { FileUpload } from '@/components/file-upload';
import { SearchableSelect } from '@/components/searchable-select';
import { Button } from '@/components/ui/button';
import { LABEL_TEXT, PAGE_TITLE } from '@/constants/ui';
import { type Documents, type PersonalData, type Sibling, type StudentRecord, useStudentEdit } from '@/hooks/useStudentEdit';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Plus, Trash2 } from 'lucide-react';
import { type ReactNode } from 'react';

interface Props {
    student: StudentRecord;
    personalData: PersonalData | null;
    siblings: Sibling[];
    documents: Documents | null;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Students', href: '/admin/students' },
    { title: 'Edit Student', href: '#' },
];

const HEALTH_CONDITIONS = [
    'Sensory Difficulties',
    'Intellectual Difficulties',
    'Communication Difficulties',
    'Autism Spectrum',
    'ADHD',
    'Physical And Motor Difficulties',
    'Medical Conditions',
    'Major Psychological Disorders',
    'Others',
];

const GRADE_LEVELS = [
    'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6',
    'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12',
];

export default function EditStudent({ student, personalData, siblings: initialSiblings, documents }: Props) {
    const {
        data, setData, processing, errors,
        handleSubmit, toggleCondition,
        addSibling, removeSibling, updateSibling,
        hasAnyCondition, schoolYearOptions,
        presentRegionCode, setPresentRegionCode,
        presentProvinceCode, setPresentProvinceCode,
        presentCityCode, setPresentCityCode,
        permRegionCode, setPermRegionCode,
        permProvinceCode, setPermProvinceCode,
        permCityCode, setPermCityCode,
        regions,
        presentProvinces, presentCities, presentBarangays,
        permProvinces, permCities, permBarangays,
    } = useStudentEdit({ student, personalData, initialSiblings });

    const field = (label: string, name: keyof typeof data, required = false, type = 'text') => (
        <div>
            <label className={`mb-1 block ${LABEL_TEXT}`}>
                {label}{required && <span className="ml-1 text-red-500">*</span>}
            </label>
            <input
                type={type}
                value={data[name] as string}
                onChange={(e) => setData(name, e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            {errors[name] && <p className="mt-1 text-xs text-red-500">{errors[name]}</p>}
        </div>
    );

    const selectField = (label: string, name: keyof typeof data, options: string[], required = false) => (
        <div>
            <label className={`mb-1 block ${LABEL_TEXT}`}>
                {label}{required && <span className="ml-1 text-red-500">*</span>}
            </label>
            <select
                value={data[name] as string}
                onChange={(e) => setData(name, e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
                <option value="">Select…</option>
                {options.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
            {errors[name] && <p className="mt-1 text-xs text-red-500">{errors[name]}</p>}
        </div>
    );

    const section = (title: string, children: ReactNode) => (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-base font-semibold text-gray-800">{title}</h2>
            {children}
        </div>
    );

    const addressSection = (
        prefix: 'present' | 'permanent',
        regionCode: string, setRegionCode: (c: string) => void,
        provinceCode: string, setProvinceCode: (c: string) => void,
        cityCode: string, setCityCode: (c: string) => void,
        provinces: { value: string; label: string; code: string }[],
        cities: { value: string; label: string; code: string }[],
        barangays: { value: string; label: string; code: string }[],
    ) => {
        const brgyKey     = `${prefix}_brgy`     as keyof typeof data;
        const cityKey     = `${prefix}_city`     as keyof typeof data;
        const provinceKey = `${prefix}_province` as keyof typeof data;
        const zipKey      = `${prefix}_zip`      as keyof typeof data;
        const streetKey   = `${prefix}_street`   as keyof typeof data;

        return (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                    <label className={`mb-1 block ${LABEL_TEXT}`}>Region</label>
                    <SearchableSelect
                        value={regionCode}
                        onChange={(val) => {
                            const opt = regions.find((r) => r.value === val);
                            setRegionCode(opt?.code ?? '');
                            setProvinceCode('');
                            setCityCode('');
                            setData(provinceKey, '');
                            setData(cityKey, '');
                            setData(brgyKey, '');
                        }}
                        options={regions}
                        placeholder="Select region…"
                        searchPlaceholder="Search region…"
                    />
                </div>
                <div>
                    <label className={`mb-1 block ${LABEL_TEXT}`}>Province <span className="ml-1 text-red-500">*</span></label>
                    <SearchableSelect
                        value={data[provinceKey] as string}
                        onChange={(val) => {
                            const opt = provinces.find((p) => p.value === val);
                            setProvinceCode(opt?.code ?? '');
                            setCityCode('');
                            setData(cityKey, '');
                            setData(brgyKey, '');
                            setData(provinceKey, val);
                        }}
                        options={provinces}
                        placeholder={data[provinceKey] as string || 'Select province…'}
                        searchPlaceholder="Search province…"
                        disabled={!regionCode}
                    />
                    {errors[provinceKey] && <p className="mt-1 text-xs text-red-500">{errors[provinceKey]}</p>}
                </div>
                <div>
                    <label className={`mb-1 block ${LABEL_TEXT}`}>City / Municipality <span className="ml-1 text-red-500">*</span></label>
                    <SearchableSelect
                        value={data[cityKey] as string}
                        onChange={(val) => {
                            const opt = cities.find((c) => c.value === val);
                            setCityCode(opt?.code ?? '');
                            setData(brgyKey, '');
                            setData(cityKey, val);
                        }}
                        options={cities}
                        placeholder={data[cityKey] as string || 'Select city…'}
                        searchPlaceholder="Search city…"
                        disabled={!provinceCode}
                    />
                    {errors[cityKey] && <p className="mt-1 text-xs text-red-500">{errors[cityKey]}</p>}
                </div>
                <div>
                    <label className={`mb-1 block ${LABEL_TEXT}`}>Barangay <span className="ml-1 text-red-500">*</span></label>
                    <SearchableSelect
                        value={data[brgyKey] as string}
                        onChange={(val) => setData(brgyKey, val)}
                        options={barangays}
                        placeholder={data[brgyKey] as string || 'Select barangay…'}
                        searchPlaceholder="Search barangay…"
                        disabled={!cityCode}
                    />
                    {errors[brgyKey] && <p className="mt-1 text-xs text-red-500">{errors[brgyKey]}</p>}
                </div>
                <div>
                    <label className={`mb-1 block ${LABEL_TEXT}`}>Street</label>
                    <input
                        type="text"
                        value={data[streetKey] as string}
                        onChange={(e) => setData(streetKey, e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                </div>
                <div>
                    <label className={`mb-1 block ${LABEL_TEXT}`}>ZIP Code <span className="ml-1 text-red-500">*</span></label>
                    <input
                        type="text"
                        value={data[zipKey] as string}
                        onChange={(e) => setData(zipKey, e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                    {errors[zipKey] && <p className="mt-1 text-xs text-red-500">{errors[zipKey]}</p>}
                </div>
            </div>
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Edit Student" />
            <form onSubmit={handleSubmit} className="space-y-6 p-4 md:p-6">
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <h1 className={PAGE_TITLE}>Edit Student</h1>
                        {student.student_id_number && (
                            <p className="mt-0.5 font-mono text-sm text-gray-500">{student.student_id_number}</p>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <Link href={`/admin/students/${student.id}`}>
                            <Button type="button" variant="outline">Cancel</Button>
                        </Link>
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Saving…' : 'Save Changes'}
                        </Button>
                    </div>
                </div>

                {section('Enrollment Information', (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {selectField('Year Level', 'current_year_level', GRADE_LEVELS, true)}
                        {selectField('School Year', 'current_school_year', schoolYearOptions, true)}
                        {selectField('Semester', 'current_semester', ['First Semester', 'Second Semester', 'Summer', 'Full Year'])}
                        {selectField('Enrollment Status', 'enrollment_status', ['Active', 'Pending', 'Inactive'], true)}
                    </div>
                ))}

                {section('Personal Information', (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {field('Last Name', 'last_name', true)}
                        {field('First Name', 'first_name', true)}
                        {field('Middle Name', 'middle_name')}
                        {field('Suffix', 'suffix')}
                        {field('Learner Reference Number (LRN)', 'learner_reference_number')}
                        {selectField('Gender', 'gender', ['Male', 'Female', 'Other'], true)}
                        {field('Citizenship', 'citizenship', true)}
                        {field('Religion', 'religion', true)}
                        {field('Date of Birth', 'date_of_birth', true, 'date')}
                        {field('Place of Birth', 'place_of_birth')}
                        {field('Email', 'email', true, 'email')}
                        {field('Alternate Email', 'alt_email', false, 'email')}
                        {field('Mobile Number', 'mobile_number', true)}
                    </div>
                ))}

                {section('Present Address', addressSection(
                    'present',
                    presentRegionCode,   setPresentRegionCode,
                    presentProvinceCode, setPresentProvinceCode,
                    presentCityCode,     setPresentCityCode,
                    presentProvinces, presentCities, presentBarangays,
                ))}

                {section('Permanent Address', addressSection(
                    'permanent',
                    permRegionCode,   setPermRegionCode,
                    permProvinceCode, setPermProvinceCode,
                    permCityCode,     setPermCityCode,
                    permProvinces, permCities, permBarangays,
                ))}

                {section('Health Conditions', (
                    <div className="space-y-3">
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                            {HEALTH_CONDITIONS.map((condition) => (
                                <label key={condition} className="flex cursor-pointer items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={data.health_conditions.includes(condition)}
                                        onChange={() => toggleCondition(condition)}
                                        className="h-4 w-4 rounded border-gray-300 text-primary"
                                    />
                                    <span className="text-sm text-gray-700">{condition}</span>
                                </label>
                            ))}
                        </div>

                        {hasAnyCondition && (
                            <div className="mt-3 rounded-lg border border-amber-100 bg-amber-50 p-4">
                                <label className="flex cursor-pointer items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={data.has_doctors_note}
                                        onChange={(e) => setData('has_doctors_note', e.target.checked)}
                                        className="h-4 w-4 rounded border-gray-300 text-primary"
                                    />
                                    <span className="text-sm font-medium text-amber-800">
                                        With a physician's recommendation / doctor's note
                                    </span>
                                </label>

                                {data.has_doctors_note && (
                                    <div className="mt-3">
                                        <label className={`mb-1 block ${LABEL_TEXT}`}>
                                            Upload Doctor's Note
                                        </label>
                                        <FileUpload
                                            value={data.doctors_note_file}
                                            onChange={(file) => setData('doctors_note_file', file)}
                                            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                            description="PDF, JPG, PNG, DOC"
                                        />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ))}

                {section('Siblings', (
                    <div className="space-y-3">
                        {data.siblings.map((sib, i) => (
                            <div key={i} className="grid grid-cols-1 gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3 sm:grid-cols-3">
                                <div>
                                    <label className="mb-1 block text-xs font-medium text-gray-600">Full Name</label>
                                    <input
                                        type="text"
                                        value={sib.sibling_full_name}
                                        onChange={(e) => updateSibling(i, 'sibling_full_name', e.target.value)}
                                        className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1 block text-xs font-medium text-gray-600">Grade Level</label>
                                    <input
                                        type="text"
                                        value={sib.sibling_grade_level}
                                        onChange={(e) => updateSibling(i, 'sibling_grade_level', e.target.value)}
                                        className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
                                    />
                                </div>
                                <div className="flex items-end gap-2">
                                    <div className="flex-1">
                                        <label className="mb-1 block text-xs font-medium text-gray-600">ID Number</label>
                                        <input
                                            type="text"
                                            value={sib.sibling_id_number}
                                            onChange={(e) => updateSibling(i, 'sibling_id_number', e.target.value)}
                                            className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
                                        />
                                    </div>
                                    <button type="button" onClick={() => removeSibling(i)} className="mb-0.5 text-red-500 hover:text-red-700">
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                        <Button type="button" variant="outline" size="sm" onClick={addSibling}>
                            <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Sibling
                        </Button>
                    </div>
                ))}

                {section('Documents', (
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        {([
                            ['certificate_of_enrollment', 'Certificate of Enrollment'],
                            ['birth_certificate',         'Birth Certificate'],
                            ['latest_report_card_front',  'Report Card (Front)'],
                            ['latest_report_card_back',   'Report Card (Back)'],
                        ] as const).map(([key, label]) => (
                            <div key={key}>
                                <label className={`mb-1 block ${LABEL_TEXT}`}>{label}</label>
                                {documents?.[key] && !data[key] && (
                                    <p className="mb-1 text-xs text-gray-500">
                                        Current: <span className="font-mono">{documents[key]!.split('/').pop()}</span>
                                    </p>
                                )}
                                <FileUpload
                                    value={data[key]}
                                    onChange={(file) => setData(key, file)}
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    description="PDF, JPG, PNG"
                                />
                                {errors[key] && <p className="mt-1 text-xs text-red-500">{errors[key]}</p>}
                            </div>
                        ))}
                    </div>
                ))}

                <div className="flex justify-end gap-2">
                    <Link href={`/admin/students/${student.id}`}>
                        <Button type="button" variant="outline">Cancel</Button>
                    </Link>
                    <Button type="submit" disabled={processing}>
                        {processing ? 'Saving…' : 'Save Changes'}
                    </Button>
                </div>
            </form>
        </AppLayout>
    );
}
