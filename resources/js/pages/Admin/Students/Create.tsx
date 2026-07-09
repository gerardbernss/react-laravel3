import { Button } from '@/components/ui/button';
import { LABEL_TEXT, PAGE_TITLE } from '@/constants/ui';
import { type SiblingEntry, useStudentCreate } from '@/hooks/useStudentCreate';
import { getSchoolYearOptions } from '@/lib/school-year';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { Plus, Trash2 } from 'lucide-react';
import { type ReactNode } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Students', href: '/admin/students' },
    { title: 'Add Student', href: '/admin/students/create' },
];

const gradeLevels = [
    'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6',
    'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12',
];

/** Admin student create form — personal data, address, family background, and dynamic sibling entries. */
export default function CreateStudent() {
    const { data, setData, processing, errors, handleSubmit, addSibling, removeSibling, updateSibling } = useStudentCreate();

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

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Add Student" />
            <form onSubmit={handleSubmit} className="space-y-6 p-4 md:p-6">
                <div className="flex items-center justify-between">
                    <h1 className={PAGE_TITLE}>Add Student</h1>
                    <Button type="submit" disabled={processing}>
                        {processing ? 'Saving…' : 'Save Student'}
                    </Button>
                </div>

                {section('Enrollment Information', (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {field('Student ID Number', 'student_id_number')}
                        {selectField('Year Level', 'current_year_level', gradeLevels, true)}
                        {selectField('School Year', 'current_school_year', getSchoolYearOptions(), true)}
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

                {section('Present Address', (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {field('Street', 'present_street')}
                        {field('Barangay', 'present_brgy', true)}
                        {field('City / Municipality', 'present_city', true)}
                        {field('Province', 'present_province', true)}
                        {field('ZIP Code', 'present_zip', true)}
                    </div>
                ))}

                {section('Permanent Address', (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {field('Street', 'permanent_street')}
                        {field('Barangay', 'permanent_brgy')}
                        {field('City / Municipality', 'permanent_city')}
                        {field('Province', 'permanent_province')}
                        {field('ZIP Code', 'permanent_zip')}
                    </div>
                ))}

                {section("Father's Information", (
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

                {section("Mother's Information", (
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
