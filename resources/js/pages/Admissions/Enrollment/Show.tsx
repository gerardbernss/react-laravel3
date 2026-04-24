import { ConfirmDialog } from '@/components/confirm-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { ArrowLeft, CheckCircle, History, RotateCcw, User } from 'lucide-react';
import { useState } from 'react';

interface FamilyBackground {
    father_name: string | null;
    mother_name: string | null;
    guardian_name: string | null;
}

interface PersonalData {
    first_name: string;
    last_name: string;
    middle_name: string | null;
    email: string;
    mobile_number: string | null;
    gender: string | null;
    date_of_birth: string | null;
    citizenship: string | null;
    family_background: FamilyBackground | null;
}

interface AuditLog {
    id: number;
    action: string;
    performed_by: string | null;
    details: string | null;
    created_at: string;
}

interface Applicant {
    id: number;
    application_number: string;
    application_status: string;
    student_id_number: string | null;
    year_level: string | null;
    student_category: string | null;
    school_year: string | null;
    semester: string | null;
    strand: string | null;
    classification: string | null;
    application_date: string | null;
    personal_data: PersonalData | null;
    audit_logs: AuditLog[];
}

interface Props {
    applicant: Applicant;
}

export default function ShowEnrollment({ applicant }: Props) {
    const [showEnrollForm, setShowEnrollForm] = useState(false);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Enrollment Management', href: '/enrollment/dashboard' },
        {
            title: `${applicant.personal_data?.last_name}, ${applicant.personal_data?.first_name}`,
            href: `/enrollment/${applicant.id}`,
        },
    ];

    const enrollForm = useForm({
        student_id_number: '',
    });

    const handleEnroll = (e: React.FormEvent) => {
        e.preventDefault();
        enrollForm.post(`/enrollment/${applicant.id}/enroll`, {
            onSuccess: () => setShowEnrollForm(false),
        });
    };

    const [showRevertDialog, setShowRevertDialog] = useState(false);

    const handleRevertToPending = () => {
        setShowRevertDialog(true);
    };

    const confirmRevert = () => {
        router.post(`/enrollment/${applicant.id}/revert-to-pending`, {}, {
            onSuccess: () => setShowRevertDialog(false),
        });
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'Enrolled':
                return <Badge className="bg-green-100 text-green-800">Enrolled</Badge>;
            case 'Pending':
                return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Applicant Enrollment Details" />

            <div className="space-y-6 p-6 md:p-10">
                {/* Header */}
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Applicant Enrollment Details</h1>
                    </div>
                    <Link href="/enrollment/dashboard">
                        <Button variant="outline">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Dashboard
                        </Button>
                    </Link>
                </div>

                {/* Application Info */}
                <div className="rounded-lg border bg-white p-6 shadow-sm">
                    <h2 className="mb-4 text-lg font-semibold">Application Information</h2>
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
                        <div>
                            <p className="text-sm text-gray-600">Application Number</p>
                            <p className="font-mono font-medium">{applicant.application_number}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Status</p>
                            <div className="mt-1">{getStatusBadge(applicant.application_status)}</div>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Student ID</p>
                            <p className="font-medium">{applicant.student_id_number || 'Not assigned'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Date Applied</p>
                            <p className="font-medium">
                                {applicant.application_date ? new Date(applicant.application_date).toLocaleDateString() : 'N/A'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Personal Information */}
                <div className="rounded-lg border bg-white p-6 shadow-sm">
                    <div className="mb-4 flex items-center gap-2">
                        <User className="h-5 w-5 text-gray-600" />
                        <h2 className="text-lg font-semibold">Personal Information</h2>
                    </div>
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                        <div>
                            <p className="text-sm text-gray-600">Full Name</p>
                            <p className="text-lg font-medium">
                                {applicant.personal_data?.last_name}, {applicant.personal_data?.first_name}
                                {applicant.personal_data?.middle_name && ` ${applicant.personal_data.middle_name}`}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Email</p>
                            <p className="font-medium">{applicant.personal_data?.email}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Contact Number</p>
                            <p className="font-medium">{applicant.personal_data?.mobile_number || 'Not provided'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Gender</p>
                            <p className="font-medium">{applicant.personal_data?.gender || 'Not specified'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Date of Birth</p>
                            <p className="font-medium">
                                {applicant.personal_data?.date_of_birth
                                    ? new Date(applicant.personal_data.date_of_birth).toLocaleDateString()
                                    : 'Not provided'}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Citizenship</p>
                            <p className="font-medium">{applicant.personal_data?.citizenship || 'Not specified'}</p>
                        </div>
                    </div>
                </div>

                {/* Academic Information */}
                <div className="rounded-lg border bg-white p-6 shadow-sm">
                    <h2 className="mb-4 text-lg font-semibold">Academic Information</h2>
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
                        <div>
                            <p className="text-sm text-gray-600">Category</p>
                            <Badge variant="outline" className="mt-1">
                                {applicant.student_category || 'N/A'}
                            </Badge>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Grade Level Applied</p>
                            <p className="font-medium">{applicant.year_level || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">School Year</p>
                            <p className="font-medium">{applicant.school_year || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Semester</p>
                            <p className="font-medium">{applicant.semester || 'N/A'}</p>
                        </div>
                        {applicant.strand && (
                            <div>
                                <p className="text-sm text-gray-600">Strand</p>
                                <p className="font-medium">{applicant.strand}</p>
                            </div>
                        )}
                        {applicant.classification && (
                            <div>
                                <p className="text-sm text-gray-600">Classification</p>
                                <p className="font-medium">{applicant.classification}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="rounded-lg border bg-white p-6 shadow-sm">
                    <h2 className="mb-4 text-lg font-semibold">Enrollment Actions</h2>
                    <div className="space-y-4">
                        {applicant.application_status === 'Pending' && (
                            <div className="rounded border border-green-200 bg-green-50 p-4">
                                <p className="mb-2 text-sm font-medium text-green-900">Enroll Applicant</p>
                                <p className="mb-3 text-sm text-green-700">
                                    Assign a student ID and change status to Enrolled
                                </p>
                                {!showEnrollForm ? (
                                    <Button onClick={() => setShowEnrollForm(true)} className="bg-green-600 hover:bg-green-700">
                                        <CheckCircle className="mr-2 h-4 w-4" />
                                        Enroll Applicant
                                    </Button>
                                ) : (
                                    <form onSubmit={handleEnroll} className="space-y-4">
                                        <div>
                                            <Label htmlFor="student_id_number">Student ID Number</Label>
                                            <Input
                                                id="student_id_number"
                                                value={enrollForm.data.student_id_number}
                                                onChange={(e) => enrollForm.setData('student_id_number', e.target.value)}
                                                placeholder="Enter student ID number"
                                                className="mt-1"
                                            />
                                            {enrollForm.errors.student_id_number && (
                                                <p className="mt-1 text-sm text-red-600">{enrollForm.errors.student_id_number}</p>
                                            )}
                                        </div>
                                        <div className="flex gap-2">
                                            <Button type="submit" disabled={enrollForm.processing} className="bg-green-600 hover:bg-green-700">
                                                {enrollForm.processing ? 'Enrolling...' : 'Confirm Enrollment'}
                                            </Button>
                                            <Button type="button" variant="outline" onClick={() => setShowEnrollForm(false)}>
                                                Cancel
                                            </Button>
                                        </div>
                                    </form>
                                )}
                            </div>
                        )}

                        {applicant.application_status === 'Enrolled' && (
                            <div className="rounded border border-yellow-200 bg-yellow-50 p-4">
                                <p className="mb-2 text-sm font-medium text-yellow-900">Revert to Pending</p>
                                <p className="mb-3 text-sm text-yellow-700">
                                    Change status back to Pending and remove student ID assignment
                                </p>
                                <Button onClick={handleRevertToPending} variant="outline" className="border-yellow-600 text-yellow-600 hover:bg-yellow-100">
                                    <RotateCcw className="mr-2 h-4 w-4" />
                                    Revert to Pending
                                </Button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Audit Log */}
                {applicant.audit_logs && applicant.audit_logs.length > 0 && (
                    <div className="rounded-lg border bg-white p-6 shadow-sm">
                        <div className="mb-4 flex items-center gap-2">
                            <History className="h-5 w-5 text-gray-600" />
                            <h2 className="text-lg font-semibold">Recent Activity</h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Date</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Action</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                                            Performed By
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {applicant.audit_logs.slice(0, 5).map((log) => (
                                        <tr key={log.id}>
                                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                                                {new Date(log.created_at).toLocaleString()}
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4">
                                                <Badge className="bg-blue-100 text-blue-800">{log.action}</Badge>
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                                                {log.performed_by || 'System'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {applicant.audit_logs.length > 5 && (
                            <div className="mt-4 text-center">
                                <Link href={`/enrollment/${applicant.id}/audit-log`}>
                                    <Button variant="outline" size="sm">
                                        View Full Audit Log
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </div>
                )}

                {/* Navigation */}
                <div className="flex items-center justify-between pt-4">
                    <Link href="/enrollment/dashboard">
                        <Button variant="outline">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Dashboard
                        </Button>
                    </Link>
                    <Link href={`/enrollment/${applicant.id}/audit-log`}>
                        <Button variant="outline">
                            <History className="mr-2 h-4 w-4" />
                            View Full Audit Log
                        </Button>
                    </Link>
                </div>
            </div>
            <ConfirmDialog
                open={showRevertDialog}
                onClose={() => setShowRevertDialog(false)}
                onConfirm={confirmRevert}
                title="Revert to Pending"
                description="Are you sure you want to revert this applicant back to Pending status?"
                confirmLabel="Revert"
                processingLabel="Reverting..."
                variant="warning"
            />
        </AppLayout>
    );
}
