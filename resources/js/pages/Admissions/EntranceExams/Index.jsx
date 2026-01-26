import React, { useState } from 'react';
import { Link, router } from '@inertiajs/react';
import Authenticated from '@/Layouts/AuthenticatedLayout';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import DangerButton from '@/Components/DangerButton';
import InputGroup from '@/Components/InputGroup';
import { Badge, StatusBadge } from '@/Components/Badge';
import Table from '@/Components/Table';
import Pagination from '@/Components/Pagination';
import Modal from '@/Components/Modal';

export default function EntranceExamsIndex({ auth, exams, filters = {} }) {
    const [search, setSearch] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || '');
    const [categoryFilter, setCategoryFilter] = useState(filters.category || '');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [examToDelete, setExamToDelete] = useState(null);

    const handleSearch = (e) => {
        e.preventDefault();
        router.get(route('entrance-exams.index'), {
            search,
            status: statusFilter,
            category: categoryFilter,
        }, { preserveScroll: true });
    };

    const handleDelete = (examId) => {
        router.delete(route('entrance-exams.destroy', examId), {
            onSuccess: () => {
                setShowDeleteModal(false);
                setExamToDelete(null);
            }
        });
    };

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

    const getResultStatus = (result) => {
        if (!result) return 'pending';
        return result.passed ? 'passed' : 'failed';
    };

    return (
        <Authenticated user={auth.user}>
            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="mb-6 flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Entrance Exams Management</h1>
                            <p className="text-gray-600 mt-1">Schedule, administer, and track entrance exam results</p>
                        </div>
                        <Link href={route('entrance-exams.create')}>
                            <PrimaryButton>Create New Exam</PrimaryButton>
                        </Link>
                    </div>

                    {/* Filters */}
                    <div className="bg-white shadow rounded-lg p-6 mb-6">
                        <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <InputGroup>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Search Applicant</label>
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Name or email..."
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </InputGroup>

                            <InputGroup>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                >
                                    <option value="">All Statuses</option>
                                    <option value="scheduled">Scheduled</option>
                                    <option value="in-progress">In Progress</option>
                                    <option value="completed">Completed</option>
                                    <option value="cancelled">Cancelled</option>
                                </select>
                            </InputGroup>

                            <InputGroup>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                <select
                                    value={categoryFilter}
                                    onChange={(e) => setCategoryFilter(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                >
                                    <option value="">All Categories</option>
                                    <option value="SHS">Senior High School</option>
                                    <option value="JHS">Junior High School</option>
                                    <option value="LES">Lifelong Education Services</option>
                                </select>
                            </InputGroup>

                            <InputGroup>
                                <label className="block text-sm font-medium text-gray-700 mb-1">&nbsp;</label>
                                <button
                                    type="submit"
                                    className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition"
                                >
                                    Search
                                </button>
                            </InputGroup>
                        </form>
                    </div>

                    {/* Table */}
                    <div className="bg-white shadow rounded-lg overflow-hidden">
                        <Table>
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applicant</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Exam Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Result</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {exams.data && exams.data.length > 0 ? (
                                    exams.data.map((exam) => (
                                        <tr key={exam.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {exam.applicant_personal_data?.first_name} {exam.applicant_personal_data?.last_name}
                                                </div>
                                                <div className="text-sm text-gray-500">{exam.applicant_personal_data?.email_address}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <Badge variant="info">{exam.applicant_application_info?.student_category}</Badge>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                {new Date(exam.exam_scheduled_date).toLocaleDateString()}
                                                <br />
                                                <span className="text-xs text-gray-500">{exam.exam_time}</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <StatusBadge status={exam.exam_status} colorMap={getStatusColor} />
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {exam.exam_result ? (
                                                    <StatusBadge
                                                        status={getResultStatus(exam.exam_result)}
                                                        colorMap={(s) => s === 'passed' ? 'success' : 'danger'}
                                                    />
                                                ) : (
                                                    <span className="text-xs text-gray-500">Pending</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                {exam.exam_result ? (
                                                    <>
                                                        {exam.exam_result.raw_score}/{exam.exam_result.total_marks}
                                                        <br />
                                                        <span className="text-xs text-gray-500">{exam.exam_result.percentage}%</span>
                                                    </>
                                                ) : (
                                                    <span className="text-gray-400">-</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                                                <Link href={route('entrance-exams.show', exam.id)}>
                                                    <SecondaryButton size="sm">View</SecondaryButton>
                                                </Link>
                                                {exam.exam_status !== 'completed' && !exam.exam_result && (
                                                    <Link href={route('entrance-exams.recordResults', exam.id)}>
                                                        <PrimaryButton size="sm">Record Results</PrimaryButton>
                                                    </Link>
                                                )}
                                                {exam.exam_status === 'scheduled' && (
                                                    <Link href={route('entrance-exams.edit', exam.id)}>
                                                        <SecondaryButton size="sm">Edit</SecondaryButton>
                                                    </Link>
                                                )}
                                                {exam.exam_status !== 'completed' && (
                                                    <button
                                                        onClick={() => {
                                                            setExamToDelete(exam.id);
                                                            setShowDeleteModal(true);
                                                        }}
                                                        className="text-red-600 hover:text-red-900 text-sm font-medium"
                                                    >
                                                        Cancel
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                                            No entrance exams found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    {exams.links && exams.links.length > 0 && (
                        <Pagination links={exams.links} />
                    )}

                    {/* Delete Modal */}
                    <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)}>
                        <div className="p-6">
                            <h2 className="text-xl font-bold mb-4">Cancel Entrance Exam</h2>
                            <p className="text-gray-600 mb-6">Are you sure you want to cancel this entrance exam? This action cannot be undone.</p>
                            <div className="flex justify-end space-x-3">
                                <SecondaryButton onClick={() => setShowDeleteModal(false)}>
                                    Keep Exam
                                </SecondaryButton>
                                <DangerButton onClick={() => handleDelete(examToDelete)}>
                                    Cancel Exam
                                </DangerButton>
                            </div>
                        </div>
                    </Modal>
                </div>
            </div>
        </Authenticated>
    );
}
