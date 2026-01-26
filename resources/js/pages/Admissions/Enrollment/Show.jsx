import React from 'react';
import { Link, router } from '@inertiajs/react';
import Authenticated from '@/Layouts/AuthenticatedLayout';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import { Badge, StatusBadge } from '@/Components/Badge';
import Table from '@/Components/Table';

export default function ShowEnrollment({ auth, student, auditLogs = [] }) {
    const handleCompleteEnrollment = () => {
        if (confirm('Complete enrollment for this student?')) {
            router.post(route('enrollment.complete', student.id), {}, {
                onSuccess: () => alert('Enrollment completed successfully')
            });
        }
    };

    const handleActivatePortal = () => {
        if (confirm('Activate portal access for this student?')) {
            router.post(route('enrollment.activatePortal', student.id), {}, {
                onSuccess: () => alert('Portal access activated')
            });
        }
    };

    const handleDeactivatePortal = () => {
        if (confirm('Deactivate portal access for this student?')) {
            router.post(route('enrollment.deactivatePortal', student.id), {}, {
                onSuccess: () => alert('Portal access deactivated')
            });
        }
    };

    return (
        <Authenticated user={auth.user}>
            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="mb-6 flex justify-between items-start">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Student Enrollment Details</h1>
                            <p className="text-gray-600 mt-1">Manage student enrollment and portal access</p>
                        </div>
                        <Link href={route('enrollment.dashboard')}>
                            <SecondaryButton>Back to Dashboard</SecondaryButton>
                        </Link>
                    </div>

                    {/* Personal Information */}
                    <div className="bg-white shadow rounded-lg p-6 mb-6">
                        <h2 className="text-lg font-semibold mb-4">Student Information</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <p className="text-sm text-gray-600">Full Name</p>
                                <p className="font-medium text-lg">
                                    {student.applicant_personal_data?.first_name} {student.applicant_personal_data?.last_name}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Email</p>
                                <p className="font-medium">{student.applicant_personal_data?.email_address}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Contact</p>
                                <p className="font-medium">{student.applicant_personal_data?.contact_number || 'Not provided'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Enrollment Status */}
                    <div className="bg-white shadow rounded-lg p-6 mb-6">
                        <h2 className="text-lg font-semibold mb-4">Enrollment Status</h2>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div>
                                <p className="text-sm text-gray-600">Status</p>
                                <StatusBadge
                                    status={student.enrollment_status}
                                    colorMap={(s) => {
                                        switch(s) {
                                            case 'enrolled': return 'success';
                                            case 'pending': return 'warning';
                                            case 'rejected': return 'danger';
                                            default: return 'secondary';
                                        }
                                    }}
                                />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Category</p>
                                <Badge variant="info">{student.applicant_application_info?.student_category}</Badge>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Enrollment Date</p>
                                <p className="font-medium">
                                    {student.portal_enrollment_date ? new Date(student.portal_enrollment_date).toLocaleDateString() : 'Not enrolled'}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Current Year Level</p>
                                <p className="font-medium">{student.current_year_level || 'Not assigned'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Portal Access */}
                    <div className="bg-white shadow rounded-lg p-6 mb-6">
                        <h2 className="text-lg font-semibold mb-4">Portal Access Details</h2>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div>
                                <p className="text-sm text-gray-600">Portal Username</p>
                                <p className="font-mono bg-gray-100 px-3 py-2 rounded">{student.portal_username || 'Not assigned'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Access Status</p>
                                {student.portal_access_active ? (
                                    <Badge variant="success">Active</Badge>
                                ) : (
                                    <Badge variant="warning">Inactive</Badge>
                                )}
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Portal Enrollment Date</p>
                                <p className="font-medium">
                                    {student.portal_enrollment_date ? new Date(student.portal_enrollment_date).toLocaleDateString() : 'Not enrolled'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Academic Information */}
                    <div className="bg-white shadow rounded-lg p-6 mb-6">
                        <h2 className="text-lg font-semibold mb-4">Academic Information</h2>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div>
                                <p className="text-sm text-gray-600">Current School Year</p>
                                <p className="font-medium">{student.current_school_year || 'Not assigned'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Current Semester</p>
                                <p className="font-medium">{student.current_semester || 'Not assigned'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Year Level</p>
                                <p className="font-medium">{student.current_year_level || 'Not assigned'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="bg-white shadow rounded-lg p-6 mb-6">
                        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
                        <div className="space-y-3">
                            {student.enrollment_status === 'pending' && (
                                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
                                    <p className="text-sm font-medium text-yellow-900 mb-2">Complete Enrollment</p>
                                    <p className="text-sm text-yellow-700 mb-3">Finalize the enrollment process for this student</p>
                                    <button
                                        onClick={handleCompleteEnrollment}
                                        className="px-4 py-2 text-sm font-medium text-white bg-yellow-600 rounded hover:bg-yellow-700"
                                    >
                                        Complete Enrollment
                                    </button>
                                </div>
                            )}

                            {!student.portal_access_active && student.enrollment_status === 'enrolled' && (
                                <div className="p-4 bg-green-50 border border-green-200 rounded">
                                    <p className="text-sm font-medium text-green-900 mb-2">Activate Portal Access</p>
                                    <p className="text-sm text-green-700 mb-3">Enable this student to access their portal</p>
                                    <button
                                        onClick={handleActivatePortal}
                                        className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded hover:bg-green-700"
                                    >
                                        Activate Portal
                                    </button>
                                </div>
                            )}

                            {student.portal_access_active && (
                                <div className="p-4 bg-red-50 border border-red-200 rounded">
                                    <p className="text-sm font-medium text-red-900 mb-2">Deactivate Portal Access</p>
                                    <p className="text-sm text-red-700 mb-3">Prevent this student from accessing their portal</p>
                                    <button
                                        onClick={handleDeactivatePortal}
                                        className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded hover:bg-red-700"
                                    >
                                        Deactivate Portal
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Audit Log */}
                    {auditLogs && auditLogs.length > 0 && (
                        <div className="bg-white shadow rounded-lg p-6 mb-6">
                            <h2 className="text-lg font-semibold mb-4">Enrollment History</h2>
                            <div className="overflow-x-auto">
                                <Table>
                                    <thead className="bg-gray-50 border-b border-gray-200">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Performed By</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Details</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {auditLogs.map((log) => (
                                            <tr key={log.id}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                    {new Date(log.created_at).toLocaleString()}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <Badge variant={log.action === 'enrollment_completed' ? 'success' : 'info'}>
                                                        {log.action.replace(/_/g, ' ')}
                                                    </Badge>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                    {log.performed_by || 'System'}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-600">
                                                    {log.details && (
                                                        <details className="cursor-pointer">
                                                            <summary>View</summary>
                                                            <pre className="text-xs bg-gray-100 p-2 rounded mt-2">
                                                                {JSON.stringify(JSON.parse(log.details), null, 2)}
                                                            </pre>
                                                        </details>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            </div>
                        </div>
                    )}

                    {/* Navigation */}
                    <div className="flex justify-between items-center pt-4">
                        <Link href={route('enrollment.dashboard')}>
                            <SecondaryButton>Back to Dashboard</SecondaryButton>
                        </Link>
                        <Link href={route('enrollment.auditLog', student.id)}>
                            <PrimaryButton>View Full Audit Log</PrimaryButton>
                        </Link>
                    </div>
                </div>
            </div>
        </Authenticated>
    );
}
