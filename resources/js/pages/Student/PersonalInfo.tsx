import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CARD, PAGE_TITLE, SECTION_HEADING } from '@/constants/ui';
import { useStudentPersonalInfo, type PersonalData } from '@/hooks/useStudentPersonalInfo';
import StudentLayout from '@/layouts/student-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { Edit2, Mail, MapPin, Save, User, Users, X } from 'lucide-react';

interface InfoRowProps {
    label: string;
    value: string | number | undefined | null;
    editable?: boolean;
    editComponent?: React.ReactNode;
}

interface Props {
    student: {
        id: number;
        username: string;
    };
    personalData: PersonalData | null;
    familyBackground: {
        father_fname: string | null;
        father_lname: string | null;
        father_occupation: string | null;
        father_contact_no: string | null;
        father_email: string | null;
        mother_fname: string | null;
        mother_lname: string | null;
        mother_occupation: string | null;
        mother_contact_no: string | null;
        mother_email: string | null;
        guardian_fname: string | null;
        guardian_lname: string | null;
        guardian_relationship: string | null;
        guardian_occupation: string | null;
        guardian_contact_no: string | null;
        guardian_email: string | null;
    } | null;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Personal Information',
        href: '/student/personal-info',
    },
];

const InfoRow = ({ label, value, editable, editComponent }: InfoRowProps) => (
    <div className="border-b border-gray-100 py-3 last:border-0">
        <div className="mb-1 text-sm text-gray-500">{label}</div>
        {editable && editComponent ? editComponent : <div className="text-base font-medium text-gray-900">{value || 'N/A'}</div>}
    </div>
);

export default function PersonalInfo({ personalData, familyBackground }: Props) {
    const { isEditing, setIsEditing, data, setData, processing, errors, handleSubmit, handleCancel } =
        useStudentPersonalInfo(personalData);

    return (
        <StudentLayout breadcrumbs={breadcrumbs}>
            <Head title="Personal Information" />

            <div className="min-h-screen bg-[#f5f5f5]">

                <div className="sticky top-0 z-40 bg-white shadow-sm">
                    <div className="mx-auto max-w-[1500px] px-10 py-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className={PAGE_TITLE}>
                                    {personalData ? `${personalData.first_name} ${personalData.last_name}` : 'Personal Information'}
                                </h1>
                            </div>
                            <div className="flex gap-2">
                                {isEditing ? (
                                    <>
                                        <Button type="button" variant="outline" onClick={handleCancel}>
                                            <X className="mr-2 h-4 w-4" />
                                            Cancel
                                        </Button>
                                        <Button onClick={handleSubmit} disabled={processing}>
                                            <Save className="mr-2 h-4 w-4" />
                                            {processing ? 'Saving...' : 'Save Changes'}
                                        </Button>
                                    </>
                                ) : (
                                    personalData && (
                                        <Button onClick={() => setIsEditing(true)} variant="outline">
                                            <Edit2 className="mr-2 h-4 w-4" />
                                            Edit Information
                                        </Button>
                                    )
                                )}
                            </div>
                        </div>
                    </div>
                </div>


                <div className="mx-auto max-w-[1500px] px-10 py-8">
                    {personalData ? (
                        <form onSubmit={handleSubmit}>
                            <div className="space-y-6">

                                <div className={CARD}>
                                    <div className="rounded-t-lg bg-primary p-4">
                                        <h2 className="flex items-center gap-2 text-xl font-bold text-white">
                                            <User className="h-5 w-5" />
                                            Personal Information
                                        </h2>
                                    </div>
                                    <div className="p-6">
                                        <div className="mb-6">
                                            <h3 className={`mb-4 flex items-center gap-2 ${SECTION_HEADING}`}>
                                                <User className="h-5 w-5" />
                                                Basic Information
                                            </h3>
                                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                                                <InfoRow label="Last Name" value={personalData.last_name} />
                                                <InfoRow label="First Name" value={personalData.first_name} />
                                                <InfoRow label="Middle Name" value={personalData.middle_name} />
                                                <InfoRow label="Suffix" value={personalData.suffix} />
                                                <InfoRow label="Gender" value={personalData.gender} />
                                                <InfoRow label="Citizenship" value={personalData.citizenship} />
                                                <InfoRow label="Religion" value={personalData.religion} />
                                                <InfoRow
                                                    label="Date of Birth"
                                                    value={
                                                        personalData.date_of_birth ? new Date(personalData.date_of_birth).toLocaleDateString() : null
                                                    }
                                                />
                                                <InfoRow label="Place of Birth" value={personalData.place_of_birth} />
                                            </div>
                                        </div>

                                        <div className="mb-6">
                                            <h3 className={`mb-4 flex items-center gap-2 ${SECTION_HEADING}`}>
                                                <Mail className="h-5 w-5" />
                                                Contact Information
                                            </h3>
                                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                                                <div className="border-b border-gray-100 py-3 last:border-0">
                                                    <div className="mb-1 text-sm text-gray-500">Email Address</div>
                                                    <div className="text-base font-medium text-gray-900">{personalData.email}</div>
                                                    <div className="text-xs text-gray-400">Primary email cannot be changed</div>
                                                </div>
                                                <div className="border-b border-gray-100 py-3 last:border-0">
                                                    <div className="mb-1 text-sm text-gray-500">Alternate Email</div>
                                                    {isEditing ? (
                                                        <div>
                                                            <Input
                                                                type="email"
                                                                value={data.alt_email}
                                                                onChange={(e) => setData('alt_email', e.target.value)}
                                                                className="mt-1"
                                                            />
                                                            <InputError message={errors.alt_email} className="mt-1" />
                                                        </div>
                                                    ) : (
                                                        <div className="text-base font-medium text-gray-900">{personalData.alt_email || 'N/A'}</div>
                                                    )}
                                                </div>
                                                <div className="border-b border-gray-100 py-3 last:border-0">
                                                    <div className="mb-1 text-sm text-gray-500">Mobile Number</div>
                                                    {isEditing ? (
                                                        <div>
                                                            <Input
                                                                type="tel"
                                                                value={data.mobile_number}
                                                                onChange={(e) => setData('mobile_number', e.target.value)}
                                                                className="mt-1"
                                                            />
                                                            <InputError message={errors.mobile_number} className="mt-1" />
                                                        </div>
                                                    ) : (
                                                        <div className="text-base font-medium text-gray-900">
                                                            {personalData.mobile_number || 'N/A'}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mb-6">
                                            <h3 className={`mb-4 flex items-center gap-2 ${SECTION_HEADING}`}>
                                                <MapPin className="h-5 w-5" />
                                                Present Address
                                            </h3>
                                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                                                <div className="border-b border-gray-100 py-3 last:border-0">
                                                    <div className="mb-1 text-sm text-gray-500">Street Address</div>
                                                    {isEditing ? (
                                                        <div>
                                                            <Input
                                                                value={data.present_street}
                                                                onChange={(e) => setData('present_street', e.target.value)}
                                                                className="mt-1"
                                                            />
                                                            <InputError message={errors.present_street} className="mt-1" />
                                                        </div>
                                                    ) : (
                                                        <div className="text-base font-medium text-gray-900">
                                                            {personalData.present_street || 'N/A'}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="border-b border-gray-100 py-3 last:border-0">
                                                    <div className="mb-1 text-sm text-gray-500">Barangay</div>
                                                    {isEditing ? (
                                                        <div>
                                                            <Input
                                                                value={data.present_brgy}
                                                                onChange={(e) => setData('present_brgy', e.target.value)}
                                                                className="mt-1"
                                                            />
                                                            <InputError message={errors.present_brgy} className="mt-1" />
                                                        </div>
                                                    ) : (
                                                        <div className="text-base font-medium text-gray-900">
                                                            {personalData.present_brgy || 'N/A'}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="border-b border-gray-100 py-3 last:border-0">
                                                    <div className="mb-1 text-sm text-gray-500">City/Municipality</div>
                                                    {isEditing ? (
                                                        <div>
                                                            <Input
                                                                value={data.present_city}
                                                                onChange={(e) => setData('present_city', e.target.value)}
                                                                className="mt-1"
                                                            />
                                                            <InputError message={errors.present_city} className="mt-1" />
                                                        </div>
                                                    ) : (
                                                        <div className="text-base font-medium text-gray-900">
                                                            {personalData.present_city || 'N/A'}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="border-b border-gray-100 py-3 last:border-0">
                                                    <div className="mb-1 text-sm text-gray-500">Province</div>
                                                    {isEditing ? (
                                                        <div>
                                                            <Input
                                                                value={data.present_province}
                                                                onChange={(e) => setData('present_province', e.target.value)}
                                                                className="mt-1"
                                                            />
                                                            <InputError message={errors.present_province} className="mt-1" />
                                                        </div>
                                                    ) : (
                                                        <div className="text-base font-medium text-gray-900">
                                                            {personalData.present_province || 'N/A'}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="border-b border-gray-100 py-3 last:border-0">
                                                    <div className="mb-1 text-sm text-gray-500">ZIP Code</div>
                                                    {isEditing ? (
                                                        <div>
                                                            <Input
                                                                value={data.present_zip}
                                                                onChange={(e) => setData('present_zip', e.target.value)}
                                                                className="mt-1"
                                                            />
                                                            <InputError message={errors.present_zip} className="mt-1" />
                                                        </div>
                                                    ) : (
                                                        <div className="text-base font-medium text-gray-900">{personalData.present_zip || 'N/A'}</div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <h3 className={`mb-4 flex items-center gap-2 ${SECTION_HEADING}`}>
                                                <MapPin className="h-5 w-5" />
                                                Permanent Address
                                            </h3>
                                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                                                <div className="border-b border-gray-100 py-3 last:border-0">
                                                    <div className="mb-1 text-sm text-gray-500">Street Address</div>
                                                    {isEditing ? (
                                                        <div>
                                                            <Input
                                                                value={data.permanent_street}
                                                                onChange={(e) => setData('permanent_street', e.target.value)}
                                                                className="mt-1"
                                                            />
                                                            <InputError message={errors.permanent_street} className="mt-1" />
                                                        </div>
                                                    ) : (
                                                        <div className="text-base font-medium text-gray-900">
                                                            {personalData.permanent_street || 'N/A'}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="border-b border-gray-100 py-3 last:border-0">
                                                    <div className="mb-1 text-sm text-gray-500">Barangay</div>
                                                    {isEditing ? (
                                                        <div>
                                                            <Input
                                                                value={data.permanent_brgy}
                                                                onChange={(e) => setData('permanent_brgy', e.target.value)}
                                                                className="mt-1"
                                                            />
                                                            <InputError message={errors.permanent_brgy} className="mt-1" />
                                                        </div>
                                                    ) : (
                                                        <div className="text-base font-medium text-gray-900">
                                                            {personalData.permanent_brgy || 'N/A'}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="border-b border-gray-100 py-3 last:border-0">
                                                    <div className="mb-1 text-sm text-gray-500">City/Municipality</div>
                                                    {isEditing ? (
                                                        <div>
                                                            <Input
                                                                value={data.permanent_city}
                                                                onChange={(e) => setData('permanent_city', e.target.value)}
                                                                className="mt-1"
                                                            />
                                                            <InputError message={errors.permanent_city} className="mt-1" />
                                                        </div>
                                                    ) : (
                                                        <div className="text-base font-medium text-gray-900">
                                                            {personalData.permanent_city || 'N/A'}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="border-b border-gray-100 py-3 last:border-0">
                                                    <div className="mb-1 text-sm text-gray-500">Province</div>
                                                    {isEditing ? (
                                                        <div>
                                                            <Input
                                                                value={data.permanent_province}
                                                                onChange={(e) => setData('permanent_province', e.target.value)}
                                                                className="mt-1"
                                                            />
                                                            <InputError message={errors.permanent_province} className="mt-1" />
                                                        </div>
                                                    ) : (
                                                        <div className="text-base font-medium text-gray-900">
                                                            {personalData.permanent_province || 'N/A'}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="border-b border-gray-100 py-3 last:border-0">
                                                    <div className="mb-1 text-sm text-gray-500">ZIP Code</div>
                                                    {isEditing ? (
                                                        <div>
                                                            <Input
                                                                value={data.permanent_zip}
                                                                onChange={(e) => setData('permanent_zip', e.target.value)}
                                                                className="mt-1"
                                                            />
                                                            <InputError message={errors.permanent_zip} className="mt-1" />
                                                        </div>
                                                    ) : (
                                                        <div className="text-base font-medium text-gray-900">
                                                            {personalData.permanent_zip || 'N/A'}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>


                                {familyBackground && (
                                    <div className={CARD}>
                                        <div className="rounded-t-lg bg-primary p-4">
                                            <h2 className="flex items-center gap-2 text-xl font-bold text-white">
                                                <Users className="h-5 w-5" />
                                                Family Background
                                            </h2>
                                        </div>
                                        <div className="p-6">
                                            <div className="mb-6">
                                                <h3 className={`mb-4 ${SECTION_HEADING}`}>Father&apos;s Details</h3>
                                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                                                    <InfoRow
                                                        label="Full Name"
                                                        value={
                                                            familyBackground.father_fname || familyBackground.father_lname
                                                                ? `${familyBackground.father_fname || ''} ${familyBackground.father_lname || ''}`.trim()
                                                                : null
                                                        }
                                                    />
                                                    <InfoRow label="Occupation" value={familyBackground.father_occupation} />
                                                    <InfoRow label="Contact Number" value={familyBackground.father_contact_no} />
                                                    <InfoRow label="Email" value={familyBackground.father_email} />
                                                </div>
                                            </div>

                                            <div className="mb-6">
                                                <h3 className={`mb-4 ${SECTION_HEADING}`}>Mother&apos;s Details</h3>
                                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                                                    <InfoRow
                                                        label="Full Name"
                                                        value={
                                                            familyBackground.mother_fname || familyBackground.mother_lname
                                                                ? `${familyBackground.mother_fname || ''} ${familyBackground.mother_lname || ''}`.trim()
                                                                : null
                                                        }
                                                    />
                                                    <InfoRow label="Occupation" value={familyBackground.mother_occupation} />
                                                    <InfoRow label="Contact Number" value={familyBackground.mother_contact_no} />
                                                    <InfoRow label="Email" value={familyBackground.mother_email} />
                                                </div>
                                            </div>

                                            {(familyBackground.guardian_fname || familyBackground.guardian_lname) && (
                                                <div>
                                                    <h3 className={`mb-4 ${SECTION_HEADING}`}>Guardian&apos;s Details</h3>
                                                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                                                        <InfoRow
                                                            label="Full Name"
                                                            value={
                                                                familyBackground.guardian_fname || familyBackground.guardian_lname
                                                                    ? `${familyBackground.guardian_fname || ''} ${familyBackground.guardian_lname || ''}`.trim()
                                                                    : null
                                                            }
                                                        />
                                                        <InfoRow label="Relationship" value={familyBackground.guardian_relationship} />
                                                        <InfoRow label="Occupation" value={familyBackground.guardian_occupation} />
                                                        <InfoRow label="Contact Number" value={familyBackground.guardian_contact_no} />
                                                        <InfoRow label="Email" value={familyBackground.guardian_email} />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </form>
                    ) : (
                        <div className={`${CARD} p-8 text-center`}>
                            <User className="mx-auto h-12 w-12 text-gray-400" />
                            <h2 className="mt-4 text-lg font-semibold text-gray-900">No Personal Data Found</h2>
                            <p className="mt-2 text-gray-600">
                                We couldn&apos;t find your personal information. Please contact the admissions office.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </StudentLayout>
    );
}
