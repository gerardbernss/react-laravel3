import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import { Plus, Trash2 } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Students', href: '/students' },
    { title: 'Add Student', href: '/students/create' },
];

interface SiblingEntry {
    sibling_full_name: string;
    sibling_grade_level: string;
    sibling_id_number: string;
}

export default function CreateStudent() {
    const { data, setData, post, processing, errors } = useForm<{
        // Personal
        last_name: string; first_name: string; middle_name: string; suffix: string;
        learner_reference_number: string; gender: string; citizenship: string; religion: string;
        date_of_birth: string; place_of_birth: string;
        email: string; alt_email: string; mobile_number: string;
        present_street: string; present_brgy: string; present_city: string;
        present_province: string; present_zip: string;
        permanent_street: string; permanent_brgy: string; permanent_city: string;
        permanent_province: string; permanent_zip: string;
        stopped_studying: string; accelerated: string;
        // Student record
        student_id_number: string; current_year_level: string;
        current_school_year: string; current_semester: string; enrollment_status: string;
        // Family
        father_lname: string; father_fname: string; father_mname: string; father_living: string;
        father_contact_no: string; father_email: string; father_occupation: string;
        mother_lname: string; mother_fname: string; mother_mname: string; mother_living: string;
        mother_contact_no: string; mother_email: string; mother_occupation: string;
        guardian_lname: string; guardian_fname: string; guardian_mname: string;
        guardian_relationship: string; guardian_contact_no: string; guardian_email: string;
        emergency_contact_name: string; emergency_relationship: string;
        emergency_mobile_phone: string; emergency_home_phone: string; emergency_email: string;
        // Siblings
        siblings: SiblingEntry[];
    }>({
        last_name: '', first_name: '', middle_name: '', suffix: '',
        learner_reference_number: '', gender: '', citizenship: '', religion: '',
        date_of_birth: '', place_of_birth: '',
        email: '', alt_email: '', mobile_number: '',
        present_street: '', present_brgy: '', present_city: '', present_province: '', present_zip: '',
        permanent_street: '', permanent_brgy: '', permanent_city: '', permanent_province: '', permanent_zip: '',
        stopped_studying: '', accelerated: '',
        student_id_number: '', current_year_level: '', current_school_year: '',
        current_semester: '', enrollment_status: 'Active',
        father_lname: '', father_fname: '', father_mname: '', father_living: '',
        father_contact_no: '', father_email: '', father_occupation: '',
        mother_lname: '', mother_fname: '', mother_mname: '', mother_living: '',
        mother_contact_no: '', mother_email: '', mother_occupation: '',
        guardian_lname: '', guardian_fname: '', guardian_mname: '',
        guardian_relationship: '', guardian_contact_no: '', guardian_email: '',
        emergency_contact_name: '', emergency_relationship: '',
        emergency_mobile_phone: '', emergency_home_phone: '', emergency_email: '',
        siblings: [],
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/students');
    };

    const addSibling = () => setData('siblings', [...data.siblings, { sibling_full_name: '', sibling_grade_level: '', sibling_id_number: '' }]);
    const removeSibling = (i: number) => setData('siblings', data.siblings.filter((_, idx) => idx !== i));
    const updateSibling = (i: number, field: keyof SiblingEntry, value: string) => {
        const updated = [...data.siblings];
        updated[i] = { ...updated[i], [field]: value };
        setData('siblings', updated);
    };

    const field = (label: string, name: keyof typeof data, required = false, type = 'text') => (
        <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
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
            <label className="mb-1 block text-sm font-medium text-gray-700">
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

    const section = (title: string, children: React.ReactNode) => (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-base font-semibold text-gray-800">{title}</h2>
            {children}
        </div>
    );

    const gradeLevels = [
        'Grade 1','Grade 2','Grade 3','Grade 4','Grade 5','Grade 6',
        'Grade 7','Grade 8','Grade 9','Grade 10','Grade 11','Grade 12',
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Add Student" />
            <form onSubmit={handleSubmit} className="space-y-6 p-4 md:p-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-gray-900">Add Student</h1>
                    <Button type="submit" disabled={processing}>
                        {processing ? 'Saving…' : 'Save Student'}
                    </Button>
                </div>

                {/* Student Record */}
                {section('Enrollment Information', (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {field('Student ID Number', 'student_id_number')}
                        {selectField('Year Level', 'current_year_level', gradeLevels, true)}
                        {field('School Year (e.g. 2025-2026)', 'current_school_year', true)}
                        {selectField('Semester', 'current_semester', ['First Semester', 'Second Semester', 'Summer', 'Full Year'])}
                        {selectField('Enrollment Status', 'enrollment_status', ['Active', 'Pending', 'Inactive'], true)}
                    </div>
                ))}

                {/* Personal Info */}
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

                {/* Present Address */}
                {section('Present Address', (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {field('Street', 'present_street')}
                        {field('Barangay', 'present_brgy', true)}
                        {field('City / Municipality', 'present_city', true)}
                        {field('Province', 'present_province', true)}
                        {field('ZIP Code', 'present_zip', true)}
                    </div>
                ))}

                {/* Permanent Address */}
                {section('Permanent Address', (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {field('Street', 'permanent_street')}
                        {field('Barangay', 'permanent_brgy')}
                        {field('City / Municipality', 'permanent_city')}
                        {field('Province', 'permanent_province')}
                        {field('ZIP Code', 'permanent_zip')}
                    </div>
                ))}

                {/* Father */}
                {section('Father\'s Information', (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {field('Last Name', 'father_lname')}
                        {field('First Name', 'father_fname')}
                        {field('Middle Name', 'father_mname')}
                        {selectField('Living?', 'father_living', ['Living', 'Deceased', 'Unknown'])}
                        {field('Contact No.', 'father_contact_no')}
                        {field('Email', 'father_email', false, 'email')}
                        {field('Occupation', 'father_occupation')}
                    </div>
                ))}

                {/* Mother */}
                {section('Mother\'s Information', (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {field('Last Name', 'mother_lname')}
                        {field('First Name', 'mother_fname')}
                        {field('Middle Name', 'mother_mname')}
                        {selectField('Living?', 'mother_living', ['Living', 'Deceased', 'Unknown'])}
                        {field('Contact No.', 'mother_contact_no')}
                        {field('Email', 'mother_email', false, 'email')}
                        {field('Occupation', 'mother_occupation')}
                    </div>
                ))}

                {/* Guardian */}
                {section('Guardian / Emergency Contact', (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {field('Guardian Last Name', 'guardian_lname')}
                        {field('Guardian First Name', 'guardian_fname')}
                        {field('Guardian Middle Name', 'guardian_mname')}
                        {field('Relationship', 'guardian_relationship')}
                        {field('Guardian Contact No.', 'guardian_contact_no')}
                        {field('Guardian Email', 'guardian_email', false, 'email')}
                        {field('Emergency Contact Name', 'emergency_contact_name')}
                        {field('Emergency Relationship', 'emergency_relationship')}
                        {field('Emergency Mobile', 'emergency_mobile_phone')}
                        {field('Emergency Home Phone', 'emergency_home_phone')}
                        {field('Emergency Email', 'emergency_email', false, 'email')}
                    </div>
                ))}

                {/* Siblings */}
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

                <div className="flex justify-end">
                    <Button type="submit" disabled={processing}>
                        {processing ? 'Saving…' : 'Save Student'}
                    </Button>
                </div>
            </form>
        </AppLayout>
    );
}
