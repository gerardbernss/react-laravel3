import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';
import { HiArrowLeft, HiPencil, HiTrash } from 'react-icons/hi';

export default function Show({ applicant }: { applicant: any }) {
    const [open, setOpen] = useState(false);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Applicant List', href: '/admissions/applicants' },
        { title: `${applicant.first_name ?? ''} ${applicant.last_name ?? ''}`, href: `/admissions/applicants/${applicant.id}/show` },
    ];

    // Helper function to safely format date
    const formatDate = (date?: string) => (date ? new Date(date).toLocaleDateString('en-US') : '-');

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${applicant.first_name ?? ''} ${applicant.last_name ?? ''}`} />

            <div className="min-h-screen bg-gray-50 px-6 py-10">
                <div className="mx-auto max-w-5xl space-y-8">
                    {/* Back button */}
                    <Button
                        variant="outline"
                        onClick={() => {
                            window.history.back();
                            setTimeout(() => window.location.reload(), 100);
                        }}
                        className="mb-6 flex items-center gap-1 text-gray-600 hover:text-gray-900"
                    >
                        <HiArrowLeft size={18} />
                        Back
                    </Button>

                    {/* Header Card */}
                    <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-linear-to-br from-blue-500 to-blue-700 text-2xl font-semibold text-white shadow">
                                    {applicant.personal_data.first_name?.[0] ?? ''}
                                    {applicant.personal_data.last_name?.[0] ?? ''}
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900">
                                        {applicant.personal_data.first_name ?? ''} {applicant.personal_data.last_name ?? ''}
                                    </h1>
                                    <p className="text-sm text-gray-500">{applicant.personal_data.email ?? '-'}</p>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <Link
                                    href={`/admissions/applicants/${applicant.id}/edit`}
                                    className="flex items-center justify-center rounded-lg bg-green-500 p-2 text-white transition hover:bg-green-600"
                                    title="Edit"
                                >
                                    <HiPencil size={18} />
                                </Link>

                                {/* Delete Button */}
                                <AlertDialog open={open} onOpenChange={setOpen}>
                                    <AlertDialogTrigger asChild>
                                        <button
                                            className="flex items-center justify-center rounded-lg bg-red-500 p-2 text-white transition hover:bg-red-600"
                                            title="Delete"
                                        >
                                            <HiTrash size={18} />
                                        </button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Are you sure you want to delete this applicant? This action cannot be undone.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        </div>
                    </div>

                    {/* Personal Details */}
                    <Card title="Personal Details">
                        <TwoColumnDetails
                            details={[
                                {
                                    label: 'Full Name',
                                    value: `${applicant.personal_data.first_name} ${applicant.personal_data.middle_name} ${applicant.personal_data.last_name}`,
                                },
                                { label: 'Suffix', value: applicant.personal_data.suffix ?? '-' },
                                { label: 'Date of Birth', value: formatDate(applicant.personal_data.date_of_birth) },
                                { label: 'Place of Birth', value: applicant.personal_data.place_of_birth ?? '-' },
                                { label: 'Gender', value: applicant.personal_data.sex ?? '-' },
                                { label: 'Citizenship', value: applicant.personal_data.citizenship ?? '-' },
                                { label: 'Civil Status', value: applicant.personalData?.civil_status ?? '-' },
                                { label: 'Religion', value: applicant.personal_data.religion ?? '-' },
                                { label: 'Learner Reference Number', value: applicant.personal_data.learner_reference_number ?? '-' },
                                { label: 'Ethnicity', value: applicant.personalData?.ethnicity ?? '-' },
                            ]}
                        />
                    </Card>

                    {/* Application Details */}
                    <Card title="Application Details">
                        <TwoColumnDetails
                            details={[
                                { label: 'Application Date', value: formatDate(applicant.application_date) },
                                { label: 'Application Number', value: applicant.application_number ?? '-' },
                                { label: 'School Year', value: applicant.school_year },
                                { label: 'Campus Site', value: applicant.campus_site ?? '-' },
                                { label: 'Entry Classification', value: applicant.classification ?? '-' },
                                { label: 'Student Batch', value: applicant.stud_batch ?? '-' },
                                { label: '1st Choice Program', value: applicant.pchoice1 ?? '-' },
                                { label: '2nd Choice Program', value: applicant.pchoice2 ?? '-' },
                                { label: '3rd Choice Program', value: applicant.pchoice3 ?? '-' },
                                { label: 'Schedule Preference', value: applicant.schedule_pref ?? '-' },
                                { label: 'Curriculum Code', value: applicant.curr_code ?? '-' },
                                { label: 'Year Level', value: applicant.year_level ?? '-' },
                            ]}
                        />
                    </Card>

                    {/* Contact Details */}
                    <Card title="Contact Details">
                        <TwoColumnDetails
                            details={[
                                { label: 'Email', value: applicant.personal_data.email ?? '-' },
                                { label: 'Phone Number', value: applicant.personal_data.mobile_number ?? '-' },
                                {
                                    label: 'Address',
                                    value: `${applicant.personalData?.street ?? ''} ${applicant.personalData?.brgy ?? ''}, ${applicant.personalData?.city ?? ''}, ${applicant.personalData?.state ?? ''} ${applicant.personalData?.zip_code ?? ''}`,
                                },
                                { label: "Father's Name", value: applicant.personal_data.family_background.father_lname ?? '-' },
                                { label: "Father's Contact No.", value: applicant.personalData?.father_number ?? '-' },
                                { label: "Mother's Name", value: applicant.personalData?.mother_name ?? '-' },
                                { label: "Mother's Contact No.", value: applicant.personalData?.mother_number ?? '-' },
                                { label: 'Emergency Contact Name', value: applicant.personalData?.emergency_contact_name ?? '-' },
                                { label: 'Emergency Contact No.', value: applicant.personalData?.emergency_contact_number ?? '-' },
                            ]}
                        />
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}

/* --- Subcomponents --- */
function Card({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 bg-gray-50 px-6 py-3">
                <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            </div>
            <div className="p-6">{children}</div>
        </div>
    );
}

function TwoColumnDetails({ details }: { details: { label: string; value: string }[] }) {
    return (
        <dl className="grid grid-cols-1 gap-x-12 gap-y-4 sm:grid-cols-2">
            {details.map((item, index) => (
                <div key={index} className="flex justify-between border-b border-gray-100 pb-2">
                    <dt className="text-sm font-medium text-gray-500">{item.label}</dt>
                    <dd className="text-right text-sm font-semibold text-gray-900">{item.value}</dd>
                </div>
            ))}
        </dl>
    );
}
