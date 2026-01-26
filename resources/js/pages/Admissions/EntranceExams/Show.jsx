import React from 'react';
import { Link } from '@inertiajs/react';
import Authenticated from '@/Layouts/AuthenticatedLayout';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import { Badge, StatusBadge } from '@/Components/Badge';

export default function ShowEntranceExam({ auth, exam }) {
    const getStatusColor = (status) => {
        switch (status) {
            case 'scheduled':
                return 'info';
            case 'in-progress':
                return 'warning';
            case 'completed':
                return 'success';
            case 'cancelled':
                return 'danger';
            default:
                return 'secondary';
        }
    };

    const percentage = exam.exam_result ? ((exam.exam_result.raw_score / exam.exam_result.total_marks) * 100).toFixed(2) : 0;
    const isPassed = exam.exam_result ? percentage >= exam.exam_result.passing_score : false;

    return (
        <Authenticated user={auth.user}>
            <div className="py-12">
                <div className="max-w-4xl mx-auto sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="mb-6 flex justify-between items-start">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Entrance Exam Details</h1>
                            <p className="text-gray-600 mt-1">View and manage exam information</p>
                        </div>
                        <Link href={route('entrance-exams.index')}>
                            <SecondaryButton>Back to Exams</SecondaryButton>
                        </Link>
                    </div>

                    {/* Applicant Info */}
                    <div className="bg-white shadow rounded-lg p-6 mb-6">
                        <h2 className="text-lg font-semibold mb-4">Applicant Information</h2>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div>
                                <p className="text-sm text-gray-600">Full Name</p>
                                <p className="font-medium text-lg">
                                    {exam.applicant_personal_data?.first_name} {exam.applicant_personal_data?.last_name}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Email</p>
                                <p className="font-medium">{exam.applicant_personal_data?.email_address}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Category</p>
                                <Badge variant="info">{exam.applicant_application_info?.student_category}</Badge>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Status</p>
                                <StatusBadge status={exam.exam_status} colorMap={getStatusColor} />
                            </div>
                        </div>
                    </div>

                    {/* Exam Schedule */}
                    <div className="bg-white shadow rounded-lg p-6 mb-6">
                        <h2 className="text-lg font-semibold mb-4">Exam Schedule</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <p className="text-sm text-gray-600">Date</p>
                                <p className="font-medium text-lg">{new Date(exam.exam_scheduled_date).toLocaleDateString()}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Time</p>
                                <p className="font-medium text-lg">{exam.exam_time}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Venue</p>
                                <p className="font-medium">{exam.exam_venue || 'Not specified'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Room</p>
                                <p className="font-medium">{exam.room_number || 'Not assigned'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Seat</p>
                                <p className="font-medium">{exam.seat_number || 'Not assigned'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Exam Results */}
                    {exam.exam_result ? (
                        <div className="bg-white shadow rounded-lg p-6 mb-6">
                            <h2 className="text-lg font-semibold mb-4">Exam Results</h2>

                            {/* Overall Score */}
                            <div className="mb-6 p-4 bg-linear-to-r from-indigo-50 to-blue-50 rounded-lg border border-indigo-200">
                                <div className="grid grid-cols-4 gap-4 text-center">
                                    <div>
                                        <p className="text-sm text-gray-600">Raw Score</p>
                                        <p className="text-2xl font-bold text-gray-900">{exam.exam_result.raw_score}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Total Marks</p>
                                        <p className="text-2xl font-bold text-gray-900">{exam.exam_result.total_marks}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Percentage</p>
                                        <p className="text-2xl font-bold text-indigo-600">{percentage}%</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Result</p>
                                        <Badge variant={isPassed ? 'success' : 'danger'}>
                                            {isPassed ? 'PASSED' : 'FAILED'}
                                        </Badge>
                                    </div>
                                </div>
                            </div>

                            {/* Section Scores */}
                            {exam.exam_result.section_scores && Object.keys(exam.exam_result.section_scores).length > 0 && (
                                <div className="mb-6">
                                    <h3 className="font-semibold mb-3">Section Scores</h3>
                                    <div className="space-y-2">
                                        {Object.entries(exam.exam_result.section_scores).map(([key, section]) => (
                                            <div key={key} className="flex justify-between p-3 bg-gray-50 rounded border border-gray-200">
                                                <span className="font-medium">{section.name}</span>
                                                <span className="text-gray-600">{section.score}/{section.total}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Subject Scores */}
                            {exam.exam_result.subject_scores && Object.keys(exam.exam_result.subject_scores).length > 0 && (
                                <div className="mb-6">
                                    <h3 className="font-semibold mb-3">Subject Scores</h3>
                                    <div className="space-y-2">
                                        {Object.entries(exam.exam_result.subject_scores).map(([key, subject]) => (
                                            <div key={key} className="flex justify-between p-3 bg-gray-50 rounded border border-gray-200">
                                                <span className="font-medium">{subject.name}</span>
                                                <span className="text-gray-600">{subject.score}/{subject.total}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Invigilator Details */}
                            <div className="border-t pt-4">
                                <h3 className="font-semibold mb-3">Invigilator Details</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-600">Invigilator Name</p>
                                        <p className="font-medium">{exam.exam_result.invigilator_name || 'Not recorded'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Signature</p>
                                        <p className="font-medium">{exam.exam_result.invigilator_signature || 'Not recorded'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Remarks */}
                            {exam.exam_result.remarks && (
                                <div className="mt-4 p-4 bg-yellow-50 rounded border border-yellow-200">
                                    <p className="text-sm text-gray-600 mb-2">Remarks</p>
                                    <p className="text-gray-800">{exam.exam_result.remarks}</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="bg-white shadow rounded-lg p-6 mb-6">
                            <div className="text-center py-8">
                                <p className="text-gray-500">No results recorded yet</p>
                                <p className="text-sm text-gray-400 mt-1">Results will appear here once the exam is completed and graded.</p>
                            </div>
                        </div>
                    )}

                    {/* Exam Configuration */}
                    <div className="bg-white shadow rounded-lg p-6 mb-6">
                        <h2 className="text-lg font-semibold mb-4">Exam Configuration</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <p className="text-sm text-gray-600">Total Marks</p>
                                <p className="font-medium text-lg">{exam.total_marks}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Passing Score</p>
                                <p className="font-medium text-lg">{exam.passing_score}</p>
                            </div>
                        </div>
                        {exam.instructions && (
                            <div className="mt-4">
                                <p className="text-sm text-gray-600">Instructions</p>
                                <p className="mt-1 text-gray-800 whitespace-pre-wrap">{exam.instructions}</p>
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex justify-between items-center pt-4">
                        <Link href={route('entrance-exams.index')}>
                            <SecondaryButton>Back to List</SecondaryButton>
                        </Link>
                        <div className="space-x-3">
                            {exam.exam_status === 'scheduled' && (
                                <Link href={route('entrance-exams.edit', exam.id)}>
                                    <PrimaryButton>Edit Exam</PrimaryButton>
                                </Link>
                            )}
                            {!exam.exam_result && exam.exam_status !== 'completed' && (
                                <Link href={route('entrance-exams.recordResults', exam.id)}>
                                    <PrimaryButton>Record Results</PrimaryButton>
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </Authenticated>
    );
}
