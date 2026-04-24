import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowLeft,
    ClipboardCheck,
    ClipboardList,
    Download,
    Edit,
    FileCheck,
    FileText,
    GraduationCap,
    Key,
    Loader,
    Mail,
    MapPin,
    User,
    UserPlus,
    Users,
} from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'sonner';

interface InfoRowProps {
    label: string;
    value: string | number | undefined;
}

interface StatusBadgeProps {
    status: string;
}

export default function ViewProfile({ applicant }: { applicant: any }) {
    const [activeSection, setActiveSection] = useState('application');
    const [open, setOpen] = useState(false);
    const [sendingEmail, setSendingEmail] = useState<string | null>(null);
    const [evaluateOpen, setEvaluateOpen] = useState(false);
    const [evaluating, setEvaluating] = useState(false);
    const [evalOutcome, setEvalOutcome] = useState<'approve' | 'revise' | 'reject' | ''>('');
    const [evalRemarks, setEvalRemarks] = useState<string>(applicant.remarks ?? '');

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Applicant List', href: '/admissions/applicants' },
        {
            title: `${applicant.personal_data.first_name ?? ''} ${applicant.personal_data.last_name ?? ''}`,
            href: `/admissions/applicants/${applicant.id}/show`,
        },
    ];

    const sendEmail = async (type: 'final-result' | 'confirmation-email' | 'portal-password') => {
        setSendingEmail(type);

        try {
            const csrfToken = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content;
            const response = await fetch(`/admissions/applicants/${applicant.id}/send-${type}`, {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken || '',
                },
            });

            const data = await response.json();

            if (response.ok) {
                toast.success(data.message || 'Email sent successfully!');
            } else {
                toast.error(data.message || 'Failed to send email');
            }
        } catch (error) {
            toast.error('An error occurred while sending the email. Please try again.');
        } finally {
            setSendingEmail(null);
        }
    };

    const handleFinalResult = () => sendEmail('final-result');
    const handleConfirmationEmail = () => sendEmail('confirmation-email');
    const handlePortalPassword = () => sendEmail('portal-password');

    const handleEvaluate = async () => {
        if (!evalOutcome) {
            toast.warning('Please select an evaluation outcome.');
            return;
        }
        if (evalOutcome === 'revise' && !evalRemarks.trim()) {
            toast.warning('Please describe what needs to be revised.');
            return;
        }
        setEvaluating(true);
        try {
            const csrfToken = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content;
            const response = await fetch(`/admissions/applicants/${applicant.id}/evaluate`, {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken || '',
                },
                body: JSON.stringify({ evaluation: evalOutcome, remarks: evalRemarks }),
            });
            const data = await response.json();
            if (response.ok) {
                toast.success(data.message || 'Application evaluated successfully.');
                setEvaluateOpen(false);
                router.reload({ only: ['applicant'] });
            } else {
                toast.error(data.message || 'Failed to evaluate application.');
            }
        } catch {
            toast.error('An error occurred. Please try again.');
        } finally {
            setEvaluating(false);
        }
    };

    const FormNavigation = () => {
        const [activeSection, setActiveSection] = React.useState('application');

        React.useEffect(() => {
            const handleScroll = () => {
                const sections = ['application', 'personal', 'family', 'siblings', 'education', 'documents'];

                let currentSection = 'application';

                for (const section of sections) {
                    const element = document.getElementById(section);
                    if (element) {
                        const rect = element.getBoundingClientRect();
                        if (rect.top <= 250) {
                            currentSection = section;
                        }
                    }
                }

                setActiveSection(currentSection);
            };

            window.addEventListener('scroll', handleScroll);
            return () => window.removeEventListener('scroll', handleScroll);
        }, []);

        const scrollToSection = (sectionId: string) => {
            const element = document.getElementById(sectionId);
            if (element) {
                const offset = 210;
                const elementPosition = element.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - offset;

                setActiveSection(sectionId);

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth',
                });
            }
        };

        const navItems = [
            { id: 'application', label: 'Application Info', icon: <ClipboardList className="h-5 w-5" /> },
            { id: 'personal', label: 'Personal Info', icon: <User className="h-5 w-5" /> },
            { id: 'family', label: 'Family Background', icon: <Users className="h-5 w-5" /> },
            { id: 'siblings', label: 'Siblings', icon: <UserPlus className="h-5 w-5" /> },
            { id: 'education', label: 'Education', icon: <GraduationCap className="h-5 w-5" /> },
            { id: 'documents', label: 'Documents', icon: <FileText className="h-5 w-5" /> },
        ];

        return (
            <div className="sticky top-0 z-50 mb-4 w-full rounded-lg bg-white shadow-md">
                <div className="flex items-center justify-between overflow-x-auto px-25 py-4">
                    {navItems.map((item, index) => (
                        <div key={item.id} className="flex items-center">
                            {/* Step Circle */}
                            <button
                                onClick={() => scrollToSection(item.id)}
                                className={`flex flex-col items-center px-3 text-center transition-colors`}
                            >
                                <div
                                    className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                                        activeSection === item.id
                                            ? 'border-[#073066] bg-primary text-white shadow-md'
                                            : 'border-gray-200 bg-white text-gray-400 hover:border-gray-300 hover:text-gray-500'
                                    } `}
                                >
                                    {item.icon}
                                </div>
                                <span
                                    className={`mt-2 text-xs whitespace-nowrap ${
                                        activeSection === item.id ? 'font-semibold text-[#073066]' : 'text-gray-600'
                                    }`}
                                >
                                    {item.label}
                                </span>
                            </button>

                            {/* Line Between Steps (except last) */}
                            {index < navItems.length - 1 && <div className="mx-2 h-0.5 w-31 bg-gray-300"></div>}
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const InfoRow = ({ label, value }: InfoRowProps) => (
        <div className="border-b border-gray-100 py-3 last:border-0">
            <div className="mb-1 text-sm text-gray-500">{label}</div>
            <div className="text-base font-medium text-gray-900">{value || 'N/A'}</div>
        </div>
    );

    const StatusBadge = ({ status }: StatusBadgeProps) => {
        const colors: Record<string, string> = {
            Enrolled: 'bg-green-100 text-green-800',
            Pending: 'bg-yellow-100 text-yellow-800',
            'For Exam': 'bg-blue-100 text-blue-800',
            'For Revision': 'bg-orange-100 text-orange-800',
            Rejected: 'bg-red-100 text-red-800',
            Approved: 'bg-indigo-100 text-indigo-800',
            ExamTaken: 'bg-blue-100 text-blue-800',
        };
        return <span className={`rounded-full px-3 py-1 text-sm font-medium ${colors[status] || 'bg-gray-100 text-gray-800'}`}>{status}</span>;
    };

    const documentLabels: Record<string, string> = {
        certificate_of_enrollment: 'Certificate of Enrollment',
        birth_certificate: 'Birth Certificate',
        latest_report_card_front: 'Report Card - Front',
        latest_report_card_back: 'Report Card - Back',
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title=" Applicant" />
            <div className="min-h-screen bg-[#f5f5f5]">
                {/* Header */}
                <div className="sticky top-0 z-50 bg-white shadow-sm">
                    <div className="mx-auto max-w-[1500px] px-10 pt-8 pb-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <button className="rounded-full p-2 transition-colors hover:bg-blue-100" onClick={() => window.history.back()}>
                                    <ArrowLeft className="h-5 w-5" />
                                </button>
                                <div>
                                    <h1 className="text-3xl font-bold text-gray-900">
                                        {applicant.personal_data.first_name} {applicant.personal_data.last_name}
                                    </h1>
                                    <p className="mt-1 text-sm text-gray-500">Application No: {applicant.application_number}</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => {
                                        setEvalRemarks(applicant.remarks ?? '');
                                        setEvalOutcome('');
                                        setEvaluateOpen(true);
                                    }}
                                    className="flex cursor-pointer items-center gap-2 rounded-lg bg-[#073066] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#052550]"
                                >
                                    <ClipboardCheck className="h-4 w-4" />
                                    Evaluate
                                </button>
                                <button
                                    onClick={handleFinalResult}
                                    disabled={sendingEmail !== null}
                                    className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {sendingEmail === 'final-result' ? (
                                        <Loader className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <FileCheck className="h-4 w-4" />
                                    )}
                                    {sendingEmail === 'final-result' ? 'Sending...' : 'Final Result'}
                                </button>
                                <button
                                    onClick={handleConfirmationEmail}
                                    disabled={sendingEmail !== null}
                                    className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {sendingEmail === 'confirmation-email' ? (
                                        <Loader className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Mail className="h-4 w-4" />
                                    )}
                                    {sendingEmail === 'confirmation-email' ? 'Sending...' : 'Confirmation Email'}
                                </button>
                                <button
                                    onClick={handlePortalPassword}
                                    disabled={sendingEmail !== null}
                                    className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {sendingEmail === 'portal-password' ? <Loader className="h-4 w-4 animate-spin" /> : <Key className="h-4 w-4" />}
                                    {sendingEmail === 'portal-password' ? 'Sending...' : 'Send Portal Password'}
                                </button>
                                <button className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50">
                                    <Download className="h-4 w-4" />
                                    Download Form
                                </button>
                                <Link
                                    href={`/admissions/applicants/${applicant.id}/edit`}
                                    className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                                >
                                    <Edit className="h-4 w-4" />
                                    Edit Profile
                                </Link>
                            </div>
                        </div>
                    </div>
                    <FormNavigation />
                </div>

                {/* Content */}
                <div className="mx-auto max-w-[1500px] px-10 py-8">
                    <div className="space-y-6">
                        {/* Application Information */}
                        <div id="application" className="rounded-lg border bg-white shadow-sm">
                            <div className="rounded-t-lg bg-[#004c88] p-4">
                                <h2 className="text-xl font-bold text-white">Application Information</h2>
                            </div>
                            <div className="p-6">
                                <div className="grid grid-cols-3 gap-6">
                                    <InfoRow label="Application Date" value={new Date(applicant.application_date).toLocaleDateString()} />
                                    <InfoRow label="School Year" value={applicant.school_year} />
                                    <InfoRow label="Application Number" value={applicant.application_number} />
                                </div>
                                <div className="mt-4 grid grid-cols-3 gap-6">
                                    <div className="py-3">
                                        <div className="mb-1 text-sm text-gray-500">Application Status</div>
                                        <StatusBadge status={applicant.application_status} />
                                    </div>
                                    <InfoRow label="Year Level" value={applicant.year_level} />
                                    <InfoRow label="Semester" value={applicant.semester} />
                                </div>
                                <div className="mt-4 grid grid-cols-3 gap-6">
                                    <InfoRow label="Entry Classification" value={applicant.classification} />
                                    <InfoRow label="Program/Strand" value={applicant.strand} />
                                    <InfoRow label="Learning Mode" value={applicant.learning_mode} />
                                </div>
                            </div>
                        </div>

                        {/* Personal Information */}
                        <div id="personal" className="rounded-lg border bg-white shadow-sm">
                            <div className="rounded-t-lg bg-[#004c88] p-4">
                                <h2 className="text-xl font-bold text-white">Personal Information</h2>
                            </div>
                            <div className="p-6">
                                <div className="mb-6">
                                    <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
                                        <User className="h-5 w-5" />
                                        Basic Information
                                    </h3>
                                    <div className="grid grid-cols-3 gap-6">
                                        <InfoRow label="Last Name" value={applicant.personal_data.last_name} />
                                        <InfoRow label="First Name" value={applicant.personal_data.first_name} />
                                        <InfoRow label="Middle Name" value={applicant.personal_data.middle_name} />
                                        <InfoRow label="LRN" value={applicant.personal_data.learner_reference_number} />
                                        <InfoRow label="Gender" value={applicant.personal_data.gender} />
                                        <InfoRow label="Citizenship" value={applicant.personal_data.citizenship} />
                                        <InfoRow label="Religion" value={applicant.personal_data.religion} />
                                        <InfoRow label="Date of Birth" value={new Date(applicant.personal_data.date_of_birth).toLocaleDateString()} />
                                        <InfoRow label="Place of Birth" value={applicant.personal_data.place_of_birth} />
                                    </div>
                                </div>

                                <div className="mb-6">
                                    <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
                                        <Mail className="h-5 w-5" />
                                        Contact Information
                                    </h3>
                                    <div className="grid grid-cols-3 gap-6">
                                        <InfoRow label="Email Address" value={applicant.personal_data.email} />
                                        <InfoRow label="Alternate Email" value={applicant.personal_data.alt_email} />
                                        <InfoRow label="Mobile Number" value={applicant.personal_data.mobile_number} />
                                    </div>
                                </div>

                                <div className="mb-6">
                                    <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
                                        <MapPin className="h-5 w-5" />
                                        Present Address
                                    </h3>
                                    <div className="grid grid-cols-3 gap-6">
                                        <InfoRow label="Street Address" value={applicant.personal_data.present_street} />
                                        <InfoRow label="Barangay" value={applicant.personal_data.present_brgy} />
                                        <InfoRow label="City/Municipality" value={applicant.personal_data.present_city} />
                                        <InfoRow label="Province" value={applicant.personal_data.present_province} />
                                        <InfoRow label="ZIP Code" value={applicant.personal_data.present_zip} />
                                    </div>
                                </div>

                                <div>
                                    <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
                                        <MapPin className="h-5 w-5" />
                                        Permanent Address
                                    </h3>
                                    <div className="grid grid-cols-3 gap-6">
                                        <InfoRow label="Street Address" value={applicant.personal_data.permanent_street} />
                                        <InfoRow label="Barangay" value={applicant.personal_data.permanent_brgy} />
                                        <InfoRow label="City/Municipality" value={applicant.personal_data.permanent_city} />
                                        <InfoRow label="Province" value={applicant.personal_data.permanent_province} />
                                        <InfoRow label="ZIP Code" value={applicant.personal_data.permanent_zip} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Family Background */}
                        <div id="family" className="rounded-lg border bg-white shadow-sm">
                            <div className="rounded-t-lg bg-[#004c88] p-4">
                                <h2 className="text-xl font-bold text-white">Family Background</h2>
                            </div>
                            <div className="p-6">
                                {applicant.personal_data.family_background ? (
                                    <>
                                        <div className="mb-6">
                                            <h3 className="mb-4 text-lg font-semibold text-gray-900">Father's Details</h3>
                                            <div className="grid grid-cols-3 gap-6">
                                                <InfoRow
                                                    label="Full Name"
                                                    value={`${applicant.personal_data.family_background.father_fname || ''} ${applicant.personal_data.family_background.father_lname || ''}`}
                                                />
                                                <InfoRow label="Citizenship" value={applicant.personal_data.family_background.father_citizenship} />
                                                <InfoRow label="Religion" value={applicant.personal_data.family_background.father_religion} />
                                                <InfoRow label="Education" value={applicant.personal_data.family_background.father_highest_educ} />
                                                <InfoRow label="Occupation" value={applicant.personal_data.family_background.father_occupation} />
                                                <InfoRow label="Monthly Income" value={applicant.personal_data.family_background.father_income} />
                                                <InfoRow label="Contact Number" value={applicant.personal_data.family_background.father_contact_no} />
                                                <InfoRow label="Email" value={applicant.personal_data.family_background.father_email} />
                                            </div>
                                        </div>

                                        <div className="mb-6">
                                            <h3 className="mb-4 text-lg font-semibold text-gray-900">Mother's Details</h3>
                                            <div className="grid grid-cols-3 gap-6">
                                                <InfoRow
                                                    label="Full Name"
                                                    value={`${applicant.personal_data.family_background.mother_fname || ''} ${applicant.personal_data.family_background.mother_lname || ''}`}
                                                />
                                                <InfoRow label="Citizenship" value={applicant.personal_data.family_background.mother_citizenship} />
                                                <InfoRow label="Religion" value={applicant.personal_data.family_background.mother_religion} />
                                                <InfoRow label="Education" value={applicant.personal_data.family_background.mother_highest_educ} />
                                                <InfoRow label="Occupation" value={applicant.personal_data.family_background.mother_occupation} />
                                                <InfoRow label="Monthly Income" value={applicant.personal_data.family_background.mother_income} />
                                                <InfoRow label="Contact Number" value={applicant.personal_data.family_background.mother_contact_no} />
                                                <InfoRow label="Email" value={applicant.personal_data.family_background.mother_email} />
                                            </div>
                                        </div>

                                        <div className="mb-6">
                                            <h3 className="mb-4 text-lg font-semibold text-gray-900">Guardian's Details</h3>
                                            <div className="grid grid-cols-3 gap-6">
                                                <InfoRow
                                                    label="Full Name"
                                                    value={`${applicant.personal_data.family_background.guardian_fname || ''} ${applicant.personal_data.family_background.guardian_lname || ''}`}
                                                />
                                                <InfoRow label="Relationship" value={applicant.personal_data.family_background.guardian_relationship} />
                                                <InfoRow label="Citizenship" value={applicant.personal_data.family_background.guardian_citizenship} />
                                                <InfoRow label="Religion" value={applicant.personal_data.family_background.guardian_religion} />
                                                <InfoRow label="Education" value={applicant.personal_data.family_background.guardian_highest_educ} />
                                                <InfoRow label="Occupation" value={applicant.personal_data.family_background.guardian_occupation} />
                                                <InfoRow label="Monthly Income" value={applicant.personal_data.family_background.guardian_income} />
                                                <InfoRow label="Contact Number" value={applicant.personal_data.family_background.guardian_contact_no} />
                                                <InfoRow label="Email" value={applicant.personal_data.family_background.guardian_email} />
                                            </div>
                                        </div>

                                        <div>
                                            <h3 className="mb-4 text-lg font-semibold text-gray-900">Emergency Contact</h3>
                                            <div className="grid grid-cols-3 gap-6">
                                                <InfoRow label="Contact Person" value={applicant.personal_data.family_background.emergency_contact_name} />
                                                <InfoRow label="Relationship" value={applicant.personal_data.family_background.emergency_relationship} />
                                                <InfoRow label="Mobile Phone" value={applicant.personal_data.family_background.emergency_mobile_phone} />
                                                <InfoRow label="Email" value={applicant.personal_data.family_background.emergency_email} />
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <p className="py-4 text-sm text-gray-500">No family background information submitted.</p>
                                )}
                            </div>
                        </div>

                        {/* Siblings */}
                        <div id="siblings" className="rounded-lg border bg-white shadow-sm">
                            <div className="rounded-t-lg bg-[#004c88] p-4">
                                <h2 className="text-xl font-bold text-white">Siblings (Discount)</h2>
                            </div>
                            <div className="p-6">
                                {applicant.personal_data.siblings.length > 0 ? (
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="border-b bg-gray-50">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Full Name</th>
                                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Grade Level</th>
                                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">ID Number</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200">
                                                {applicant.personal_data.siblings.map((sibling: any, index: number) => (
                                                    <tr key={index} className="hover:bg-gray-50">
                                                        <td className="px-4 py-3 text-sm text-gray-900">{sibling.sibling_full_name}</td>
                                                        <td className="px-4 py-3 text-sm text-gray-900">{sibling.sibling_grade_level}</td>
                                                        <td className="px-4 py-3 text-sm text-gray-900">{sibling.sibling_id_number}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <p className="py-8 text-center text-gray-500">No siblings enrolled</p>
                                )}
                            </div>
                        </div>

                        {/* Educational Background */}
                        <div id="education" className="rounded-lg border bg-white shadow-sm">
                            <div className="rounded-t-lg bg-[#004c88] p-4">
                                <h2 className="text-xl font-bold text-white">Educational Background</h2>
                            </div>
                            <div className="p-6">
                                <div className="space-y-6">
                                    {applicant.educational_background.map((school: any, index: number) => (
                                        <div key={index} className="rounded-lg border bg-gray-50 p-4">
                                            <h3 className="mb-3 flex items-center gap-2 font-semibold text-gray-900">
                                                <GraduationCap className="h-5 w-5" />
                                                {school.school_name}
                                            </h3>
                                            <div className="grid grid-cols-3 gap-4">
                                                <InfoRow label="Address" value={school.school_address} />
                                                <InfoRow label="Grade Level" value={`${school.from_grade} - ${school.to_grade}`} />
                                                <InfoRow label="Year" value={`${school.from_year ?? 'N/A'} - ${school.to_year ?? 'N/A'}`} />
                                                <InfoRow label="Honors & Awards" value={school.honors_awards} />
                                                <InfoRow label="General Average" value={school.general_average} />
                                                <InfoRow
                                                    label="Class Rank"
                                                    value={
                                                        school.class_rank
                                                            ? school.class_size
                                                                ? `${school.class_rank} of ${school.class_size}`
                                                                : `${school.class_rank}`
                                                            : school.class_size
                                                              ? `N of ${school.class_size}`
                                                              : 'N/A'
                                                    }
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Documents */}
                        <div id="documents" className="rounded-lg border bg-white shadow-sm">
                            <div className="rounded-t-lg bg-[#004c88] p-4">
                                <h2 className="text-xl font-bold text-white">Dcouments</h2>
                            </div>
                            <div className="p-6">
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="border-b bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Document Name</th>
                                                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Upload Date</th>
                                                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {(() => {
                                                try {
                                                    // documents is an object, not an array
                                                    const doc = applicant?.documents;

                                                    if (!doc || typeof doc !== 'object') {
                                                        return (
                                                            <tr>
                                                                <td colSpan={3} className="px-4 py-8 text-center text-sm text-gray-500">
                                                                    No documents available
                                                                </td>
                                                            </tr>
                                                        );
                                                    }

                                                    // Map over the documentLabels and check if each field exists
                                                    const rows = Object.entries(documentLabels)
                                                        .filter(([key]) => doc[key]) // only show rows where the document exists
                                                        .map(([key, label]) => (
                                                            <tr key={key} className="hover:bg-gray-50">
                                                                <td className="px-4 py-3">
                                                                    <div className="flex items-center gap-2">
                                                                        <FileCheck className="h-5 w-5 text-gray-400" />
                                                                        <span className="text-sm text-gray-900">{label}</span>
                                                                    </div>
                                                                </td>

                                                                <td className="px-4 py-3 text-sm text-gray-900">
                                                                    {doc.updated_at ? new Date(doc.updated_at).toLocaleDateString() : 'N/A'}
                                                                </td>

                                                                <td className="px-4 py-3">
                                                                    <button
                                                                        onClick={() => {
                                                                            // Encode the path to safely pass it in URL
                                                                            const encodedPath = btoa(doc[key]); // base64 encode
                                                                            window.open(`/view-document/${encodedPath}`, '_blank');
                                                                        }}
                                                                        className="text-sm font-medium text-blue-600 hover:text-blue-800"
                                                                    >
                                                                        View
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        ));

                                                    if (rows.length === 0) {
                                                        return (
                                                            <tr>
                                                                <td colSpan={3} className="px-4 py-8 text-center text-sm text-gray-500">
                                                                    No documents found
                                                                </td>
                                                            </tr>
                                                        );
                                                    }

                                                    return rows;
                                                } catch {
                                                    return (
                                                        <tr>
                                                            <td colSpan={3} className="px-4 py-8 text-center text-sm text-red-500">
                                                                Error loading documents
                                                            </td>
                                                        </tr>
                                                    );
                                                }
                                            })()}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* Evaluation Dialog */}
            <Dialog open={evaluateOpen} onOpenChange={setEvaluateOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Evaluate Application</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        <div>
                            <p className="mb-2 text-sm font-medium text-gray-700">Evaluation Outcome</p>
                            <div className="flex gap-2">
                                {(
                                    [
                                        { key: 'approve', label: 'Approve', active: 'border-green-600 bg-green-50 text-green-700', inactive: '' },
                                        { key: 'revise', label: 'For Revision', active: 'border-yellow-500 bg-yellow-50 text-yellow-700', inactive: '' },
                                        { key: 'reject', label: 'Reject', active: 'border-red-600 bg-red-50 text-red-700', inactive: '' },
                                    ] as const
                                ).map(({ key, label, active }) => (
                                    <button
                                        key={key}
                                        onClick={() => setEvalOutcome(key)}
                                        className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                                            evalOutcome === key ? active : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                                        }`}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                Feedback / Remarks
                                {evalOutcome === 'revise' && <span className="ml-1 text-red-500">*</span>}
                            </label>
                            <Textarea
                                value={evalRemarks}
                                onChange={(e) => setEvalRemarks(e.target.value)}
                                placeholder={
                                    evalOutcome === 'revise'
                                        ? 'Describe what the applicant needs to fix (e.g., "Please reupload a clearer photo of your birth certificate").'
                                        : 'Optional message to the student...'
                                }
                                rows={4}
                                className="resize-none"
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <button
                            onClick={() => setEvaluateOpen(false)}
                            className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleEvaluate}
                            disabled={evaluating || !evalOutcome}
                            className="flex items-center gap-2 rounded-lg bg-[#073066] px-4 py-2 text-sm font-medium text-white hover:bg-[#052550] disabled:opacity-50"
                        >
                            {evaluating && <Loader className="h-4 w-4 animate-spin" />}
                            {evaluating ? 'Saving...' : 'Submit Evaluation'}
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
