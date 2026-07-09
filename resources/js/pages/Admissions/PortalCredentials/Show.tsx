import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BODY_TEXT, CARD, PAGE_PADDING, PAGE_TITLE, SECTION_HEADING } from '@/constants/ui';
import { usePortalCredentialShow } from '@/hooks/usePortalCredentialShow';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Calendar, Key, Mail, RefreshCw, Shield, User } from 'lucide-react';

interface PersonalData {
    id: number;
    first_name: string;
    last_name: string;
    middle_name: string | null;
    email: string;
}

interface Application {
    id: number;
    application_number: string;
    application_status: string;
}

interface Credential {
    id: number;
    username: string;
    access_status: string;
    password_changed: boolean;
    credentials_sent_at: string | null;
    credentials_generated_at: string | null;
    sent_via: string | null;
    first_login_at: string | null;
    last_login_at: string | null;
    login_attempts: number;
    remarks: string | null;
    created_at: string;
    personal_data: PersonalData;
    application: Application | null;
}

interface Props {
    credential: Credential;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Portal Credentials', href: '/admin/portal-credentials' },
    { title: 'Details', href: '#' },
];

export default function Show({ credential }: Props) {
    const { handleResend, handleSuspend, handleReactivate, handleSend } = usePortalCredentialShow({ credentialId: credential.id });

const getStatusBadge = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'active':
                return <Badge className="bg-green-100 text-green-800">Active</Badge>;
            case 'suspended':
                return <Badge variant="destructive">Suspended</Badge>;
            case 'inactive':
                return <Badge variant="secondary">Inactive</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return '—';
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Portal Credential Details" />

            <div className={`space-y-6 ${PAGE_PADDING}`}>
                {/* Header */}
                <div className="mb-6">
                    <Link href="/admin/portal-credentials" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900">
                        <ArrowLeft className="mr-1 h-4 w-4" />
                        Back to Portal Credentials
                    </Link>

                    <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className={PAGE_TITLE}>
                                    {credential.personal_data?.first_name} {credential.personal_data?.last_name}
                                </h1>
                                {getStatusBadge(credential.access_status)}
                            </div>
                            <p className={`mt-1 ${BODY_TEXT}`}>{credential.username}</p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {/* Resend Credentials Dialog */}
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="outline">
                                        <RefreshCw className="mr-2 h-4 w-4" />
                                        Resend Credentials
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Resend Portal Credentials</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            A new password will be generated and sent to <strong>{credential.personal_data?.email}</strong>.
                                            The previous password will no longer work.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleResend}>
                                            Resend Credentials
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>


{/* Suspend/Reactivate */}
                            {credential.access_status?.toLowerCase() === 'suspended' ? (
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button>
                                            <Shield className="mr-2 h-4 w-4" />
                                            Reactivate Access
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Reactivate Access</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                This will restore portal access for this user. They will be able to log in again.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={handleReactivate}>
                                                Reactivate
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            ) : (
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="destructive">
                                            <Shield className="mr-2 h-4 w-4" />
                                            Suspend Access
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Suspend Access</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                This will temporarily disable portal access for this user. They will not be able to log in until reactivated.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={handleSuspend} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                                Suspend Access
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            )}
                        </div>
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Personal Information */}
                    <div className={`${CARD} p-6`}>
                        <h2 className={`mb-4 flex items-center gap-2 ${SECTION_HEADING}`}>
                            <User className="h-5 w-5" />
                            Personal Information
                        </h2>

                        <dl className="space-y-4">
                            <div className="grid grid-cols-2 gap-2">
                                <dt className="text-sm text-gray-500">Full Name</dt>
                                <dd className="text-sm font-medium text-gray-900">
                                    {credential.personal_data?.first_name} {credential.personal_data?.middle_name} {credential.personal_data?.last_name}
                                </dd>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <dt className="text-sm text-gray-500">Email</dt>
                                <dd className="text-sm font-medium text-gray-900">{credential.personal_data?.email}</dd>
                            </div>
                            {credential.application && (
                                <div className="grid grid-cols-2 gap-2">
                                    <dt className="text-sm text-gray-500">Application Number</dt>
                                    <dd className="text-sm font-medium text-gray-900">{credential.application.application_number}</dd>
                                </div>
                            )}
                        </dl>
                    </div>

                    {/* Credential Details */}
                    <div className={`${CARD} p-6`}>
                        <h2 className={`mb-4 flex items-center gap-2 ${SECTION_HEADING}`}>
                            <Key className="h-5 w-5" />
                            Credential Details
                        </h2>

                        <dl className="space-y-4">
                            <div className="grid grid-cols-2 gap-2">
                                <dt className="text-sm text-gray-500">Username</dt>
                                <dd className="text-sm font-mono font-medium text-gray-900">{credential.username}</dd>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <dt className="text-sm text-gray-500">Status</dt>
                                <dd className="text-sm">{getStatusBadge(credential.access_status)}</dd>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <dt className="text-sm text-gray-500">Password Changed</dt>
                                <dd className="text-sm font-medium text-gray-900">
                                    {credential.password_changed ? (
                                        <Badge className="bg-green-100 text-green-800">Yes</Badge>
                                    ) : (
                                        <Badge variant="secondary">No</Badge>
                                    )}
                                </dd>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <dt className="text-sm text-gray-500">Login Attempts</dt>
                                <dd className="text-sm font-medium text-gray-900">{credential.login_attempts || 0} / 5</dd>
                            </div>
                        </dl>
                    </div>

                    {/* Activity Information */}
                    <div className={`${CARD} p-6`}>
                        <h2 className={`mb-4 flex items-center gap-2 ${SECTION_HEADING}`}>
                            <Calendar className="h-5 w-5" />
                            Activity Information
                        </h2>

                        <dl className="space-y-4">
                            <div className="grid grid-cols-2 gap-2">
                                <dt className="text-sm text-gray-500">Credentials Generated</dt>
                                <dd className="text-sm font-medium text-gray-900">{formatDate(credential.credentials_generated_at)}</dd>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <dt className="text-sm text-gray-500">Credentials Sent</dt>
                                <dd className="text-sm font-medium text-gray-900">
                                    {credential.credentials_sent_at ? (
                                        <span>
                                            {formatDate(credential.credentials_sent_at)}
                                            {credential.sent_via && <span className="text-gray-500"> via {credential.sent_via}</span>}
                                        </span>
                                    ) : (
                                        <Badge variant="secondary">Not Sent</Badge>
                                    )}
                                </dd>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <dt className="text-sm text-gray-500">First Login</dt>
                                <dd className="text-sm font-medium text-gray-900">{formatDate(credential.first_login_at)}</dd>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <dt className="text-sm text-gray-500">Last Login</dt>
                                <dd className="text-sm font-medium text-gray-900">{formatDate(credential.last_login_at)}</dd>
                            </div>
                        </dl>
                    </div>

                    {/* Email Actions */}
                    <div className={`${CARD} p-6`}>
                        <h2 className={`mb-4 flex items-center gap-2 ${SECTION_HEADING}`}>
                            <Mail className="h-5 w-5" />
                            Email Actions
                        </h2>

                        <div className="space-y-3">
                            {!credential.credentials_sent_at && (
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button className="w-full">
                                            <Mail className="mr-2 h-4 w-4" />
                                            Send Initial Credentials
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Send Portal Credentials</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Login credentials will be sent to <strong>{credential.personal_data?.email}</strong>.
                                                The applicant will use these to access their portal.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={handleSend}>
                                                Send Credentials
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            )}

                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="outline" className="w-full">
                                        <RefreshCw className="mr-2 h-4 w-4" />
                                        Resend with New Password
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Resend Portal Credentials</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            A new password will be generated and sent to <strong>{credential.personal_data?.email}</strong>.
                                            The previous password will no longer work.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleResend}>
                                            Resend Credentials
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>

                        {credential.remarks && (
                            <div className="mt-4 border-t pt-4">
                                <h3 className="text-sm font-medium text-gray-500">Remarks</h3>
                                <p className="mt-1 text-sm text-gray-700">{credential.remarks}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
