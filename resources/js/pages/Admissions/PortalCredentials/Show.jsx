import React from 'react';
import { Link, router } from '@inertiajs/react';
import Authenticated from '@/Layouts/AuthenticatedLayout';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import DangerButton from '@/Components/DangerButton';
import { Badge } from '@/Components/Badge';

export default function ShowPortalCredential({ auth, credential }) {
    const isSuspended = !!credential.access_suspended_at;
    const isActivated = credential.is_activated;

    const handleSendCredentials = () => {
        if (confirm('Send/Resend credentials to applicant?')) {
            router.post(route('portal-credentials.send', credential.id), {}, {
                onSuccess: () => alert('Credentials sent successfully')
            });
        }
    };

    const handleResetPassword = () => {
        if (confirm('Reset password? A new temporary password will be generated and sent to the applicant.')) {
            router.post(route('portal-credentials.resetPassword', credential.id), {}, {
                onSuccess: () => alert('Password reset successfully')
            });
        }
    };

    const handleSuspend = () => {
        if (confirm('Suspend this credential? The applicant will not be able to access the portal.')) {
            router.post(route('portal-credentials.suspend', credential.id), {}, {
                onSuccess: () => alert('Credential suspended successfully')
            });
        }
    };

    const handleReactivate = () => {
        if (confirm('Reactivate this credential?')) {
            router.post(route('portal-credentials.reactivate', credential.id), {}, {
                onSuccess: () => alert('Credential reactivated successfully')
            });
        }
    };

    return (
        <Authenticated user={auth.user}>
            <div className="py-12">
                <div className="max-w-4xl mx-auto sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="mb-6 flex justify-between items-start">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Portal Credential Details</h1>
                            <p className="text-gray-600 mt-1">Manage applicant portal access</p>
                        </div>
                        <Link href={route('portal-credentials.index')}>
                            <SecondaryButton>Back to Credentials</SecondaryButton>
                        </Link>
                    </div>

                    {/* Status Alert */}
                    {isSuspended && (
                        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                            <p className="text-red-800 font-medium">
                                ⚠️ This credential is currently suspended. The applicant cannot access the portal.
                            </p>
                            <p className="text-sm text-red-600 mt-1">
                                Suspended on: {new Date(credential.access_suspended_at).toLocaleString()}
                            </p>
                        </div>
                    )}

                    {/* Applicant Information */}
                    <div className="bg-white shadow rounded-lg p-6 mb-6">
                        <h2 className="text-lg font-semibold mb-4">Applicant Information</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <p className="text-sm text-gray-600">Full Name</p>
                                <p className="font-medium text-lg">
                                    {credential.applicant_personal_data?.first_name} {credential.applicant_personal_data?.last_name}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Email Address</p>
                                <p className="font-medium">{credential.applicant_personal_data?.email_address}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Contact Number</p>
                                <p className="font-medium">{credential.applicant_personal_data?.contact_number || 'Not provided'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Category</p>
                                <Badge variant="info">{credential.applicant_application_info?.student_category}</Badge>
                            </div>
                        </div>
                    </div>

                    {/* Portal Access Details */}
                    <div className="bg-white shadow rounded-lg p-6 mb-6">
                        <h2 className="text-lg font-semibold mb-4">Portal Access Details</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <p className="text-sm text-gray-600">Portal Username</p>
                                <p className="font-mono bg-gray-100 px-3 py-2 rounded">{credential.portal_username}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Access Status</p>
                                <div className="mt-1">
                                    {isSuspended ? (
                                        <Badge variant="danger">Suspended</Badge>
                                    ) : isActivated ? (
                                        <Badge variant="success">Active</Badge>
                                    ) : (
                                        <Badge variant="warning">Inactive</Badge>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Login Activity */}
                    <div className="bg-white shadow rounded-lg p-6 mb-6">
                        <h2 className="text-lg font-semibold mb-4">Login Activity</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <p className="text-sm text-gray-600">Last Login</p>
                                <p className="font-medium">
                                    {credential.last_login_at ? new Date(credential.last_login_at).toLocaleString() : 'Never'}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Failed Login Attempts</p>
                                <p className="font-medium text-lg">{credential.failed_login_attempts || 0}/3</p>
                                {credential.failed_login_attempts >= 3 && (
                                    <p className="text-xs text-red-600 mt-1">Account locked due to failed attempts</p>
                                )}
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Credentials Sent</p>
                                <p className="font-medium">
                                    {credential.credentials_sent_at ? (
                                        <>
                                            ✓ {new Date(credential.credentials_sent_at).toLocaleDateString()}
                                        </>
                                    ) : (
                                        <span className="text-red-600">Not sent</span>
                                    )}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Password Management */}
                    <div className="bg-white shadow rounded-lg p-6 mb-6">
                        <h2 className="text-lg font-semibold mb-4">Password Management</h2>
                        <p className="text-sm text-gray-600 mb-4">
                            Use the options below to manage the applicant's portal access credentials.
                        </p>
                        <div className="space-y-3">
                            <div className="p-4 bg-blue-50 border border-blue-200 rounded">
                                <p className="text-sm font-medium text-blue-900 mb-2">Reset Password</p>
                                <p className="text-sm text-blue-700 mb-3">Generate a new temporary password and send it to the applicant</p>
                                <button
                                    onClick={handleResetPassword}
                                    className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded hover:bg-blue-700"
                                >
                                    Reset Password
                                </button>
                            </div>

                            {!credential.credentials_sent_at && (
                                <div className="p-4 bg-green-50 border border-green-200 rounded">
                                    <p className="text-sm font-medium text-green-900 mb-2">Send Initial Credentials</p>
                                    <p className="text-sm text-green-700 mb-3">Send login credentials to the applicant for the first time</p>
                                    <button
                                        onClick={handleSendCredentials}
                                        className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded hover:bg-green-700"
                                    >
                                        Send Credentials
                                    </button>
                                </div>
                            )}

                            {credential.credentials_sent_at && (
                                <div className="p-4 bg-purple-50 border border-purple-200 rounded">
                                    <p className="text-sm font-medium text-purple-900 mb-2">Resend Credentials</p>
                                    <p className="text-sm text-purple-700 mb-3">Resend the current credentials to the applicant</p>
                                    <button
                                        onClick={handleSendCredentials}
                                        className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded hover:bg-purple-700"
                                    >
                                        Resend Credentials
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Access Control */}
                    <div className="bg-white shadow rounded-lg p-6 mb-6">
                        <h2 className="text-lg font-semibold mb-4">Access Control</h2>
                        <p className="text-sm text-gray-600 mb-4">
                            Control whether the applicant can access the portal.
                        </p>
                        {isSuspended ? (
                            <button
                                onClick={handleReactivate}
                                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded hover:bg-green-700"
                            >
                                Reactivate Access
                            </button>
                        ) : (
                            credential.credentials_sent_at && (
                                <button
                                    onClick={handleSuspend}
                                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded hover:bg-red-700"
                                >
                                    Suspend Access
                                </button>
                            )
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex justify-between items-center pt-4">
                        <Link href={route('portal-credentials.index')}>
                            <SecondaryButton>Back to List</SecondaryButton>
                        </Link>
                    </div>
                </div>
            </div>
        </Authenticated>
    );
}
