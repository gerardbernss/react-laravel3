import React from 'react';
import { Link } from '@inertiajs/react';
import Authenticated from '@/Layouts/AuthenticatedLayout';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import { Badge, StatusBadge } from '@/Components/Badge';

export default function ShowAssessment({ auth, assessment }) {
    const percentage = assessment.score && assessment.total_score ? ((assessment.score / assessment.total_score) * 100).toFixed(1) : 0;
    const isPassed = percentage >= 60;

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed':
                return 'success';
            case 'pending':
                return 'warning';
            case 'failed':
                return 'danger';
            default:
                return 'secondary';
        }
    };

    return (
        <Authenticated user={auth.user}>
            <div className="py-12">
                <div className="max-w-4xl mx-auto sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="mb-6 flex justify-between items-start">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Assessment Details</h1>
                            <p className="text-gray-600 mt-1">Review assessment information and results</p>
                        </div>
                        <Link href={route('assessments.index')}>
                            <SecondaryButton>Back to Assessments</SecondaryButton>
                        </Link>
                    </div>

                    {/* Applicant Information */}
                    <div className="bg-white shadow rounded-lg p-6 mb-6">
                        <h2 className="text-lg font-semibold mb-4">Applicant Information</h2>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div>
                                <p className="text-sm text-gray-600">Full Name</p>
                                <p className="font-medium text-lg">
                                    {assessment.applicant_personal_data?.first_name} {assessment.applicant_personal_data?.last_name}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Email</p>
                                <p className="font-medium">{assessment.applicant_personal_data?.email_address}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Category</p>
                                <Badge variant="info">{assessment.applicant_application_info?.student_category}</Badge>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Status</p>
                                <StatusBadge status={assessment.assessment_status} colorMap={getStatusColor} />
                            </div>
                        </div>
                    </div>

                    {/* Assessment Details */}
                    <div className="bg-white shadow rounded-lg p-6 mb-6">
                        <h2 className="text-lg font-semibold mb-4">Assessment Details</h2>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div>
                                <p className="text-sm text-gray-600">Assessment Type</p>
                                <Badge variant="secondary">{assessment.assessment_type}</Badge>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Assessment Date</p>
                                <p className="font-medium">{new Date(assessment.assessment_date).toLocaleDateString()}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Assessed By</p>
                                <p className="font-medium">{assessment.assessed_by || 'Not recorded'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Score Results */}
                    <div className="bg-white shadow rounded-lg p-6 mb-6">
                        <h2 className="text-lg font-semibold mb-4">Score Results</h2>
                        {assessment.score !== null ? (
                            <div className="grid grid-cols-4 gap-4 text-center">
                                <div className="p-4 bg-gray-50 rounded">
                                    <p className="text-sm text-gray-600">Score</p>
                                    <p className="text-2xl font-bold">{assessment.score}</p>
                                </div>
                                <div className="p-4 bg-gray-50 rounded">
                                    <p className="text-sm text-gray-600">Total</p>
                                    <p className="text-2xl font-bold">{assessment.total_score}</p>
                                </div>
                                <div className="p-4 bg-indigo-50 rounded border border-indigo-200">
                                    <p className="text-sm text-gray-600">Percentage</p>
                                    <p className="text-2xl font-bold text-indigo-600">{percentage}%</p>
                                </div>
                                <div className={`p-4 rounded border-2 ${isPassed ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                                    <p className="text-sm text-gray-600">Result</p>
                                    <p className={`text-lg font-bold ${isPassed ? 'text-green-600' : 'text-red-600'}`}>
                                        {isPassed ? 'PASSED' : 'FAILED'}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <p className="text-gray-500">No score recorded yet</p>
                            </div>
                        )}
                    </div>

                    {/* Remarks */}
                    {assessment.remarks && (
                        <div className="bg-white shadow rounded-lg p-6 mb-6">
                            <h2 className="text-lg font-semibold mb-4">Remarks</h2>
                            <div className="p-4 bg-yellow-50 rounded border border-yellow-200">
                                <p className="text-gray-800 whitespace-pre-wrap">{assessment.remarks}</p>
                            </div>
                        </div>
                    )}

                    {/* Feedback */}
                    {assessment.feedback && (
                        <div className="bg-white shadow rounded-lg p-6 mb-6">
                            <h2 className="text-lg font-semibold mb-4">Feedback</h2>
                            <div className="p-4 bg-blue-50 rounded border border-blue-200">
                                <p className="text-gray-800 whitespace-pre-wrap">{assessment.feedback}</p>
                            </div>
                        </div>
                    )}

                    {/* Metadata */}
                    <div className="bg-white shadow rounded-lg p-6 mb-6">
                        <h2 className="text-lg font-semibold mb-4">Metadata</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                            <div>
                                <p className="text-gray-600">Created</p>
                                <p className="font-medium">{new Date(assessment.created_at).toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="text-gray-600">Last Updated</p>
                                <p className="font-medium">{new Date(assessment.updated_at).toLocaleString()}</p>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-between items-center pt-4">
                        <Link href={route('assessments.index')}>
                            <SecondaryButton>Back to List</SecondaryButton>
                        </Link>
                        <div className="space-x-3">
                            <Link href={route('assessments.edit', assessment.id)}>
                                <PrimaryButton>Edit Assessment</PrimaryButton>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </Authenticated>
    );
}
