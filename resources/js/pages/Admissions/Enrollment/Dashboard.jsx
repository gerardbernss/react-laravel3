import React, { useState } from 'react';
import { Link, router } from '@inertiajs/react';
import Authenticated from '@/Layouts/AuthenticatedLayout';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import { Badge, StatusBadge } from '@/Components/Badge';
import Table from '@/Components/Table';
import Pagination from '@/Components/Pagination';

export default function EnrollmentDashboard({ auth, students, filters = {} }) {
    const [search, setSearch] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || '');

    const handleSearch = (e) => {
        e.preventDefault();
        router.get(route('enrollment.dashboard'), {
            search,
            status: statusFilter,
        }, { preserveScroll: true });
    };

    const getTotalEnrolledCount = () => {
        return students.data?.filter(s => s.enrollment_status === 'enrolled').length || 0;
    };

    const getPendingCount = () => {
        return students.data?.filter(s => s.enrollment_status === 'pending').length || 0;
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'enrolled':
                return 'success';
            case 'pending':
                return 'warning';
            case 'rejected':
                return 'danger';
            default:
                return 'secondary';
        }
    };

    return (
        <Authenticated user={auth.user}>
            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="mb-6">
                        <h1 className="text-3xl font-bold text-gray-900">Enrollment Management</h1>
                        <p className="text-gray-600 mt-1">Track and manage student enrollment through the portal</p>
                    </div>

                    {/* Statistics Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                        <div className="bg-white shadow rounded-lg p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">Total Students</p>
                                    <p className="text-3xl font-bold text-gray-900">{students.data?.length || 0}</p>
                                </div>
                                <div className="text-3xl text-indigo-600">👥</div>
                            </div>
                        </div>

                        <div className="bg-white shadow rounded-lg p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">Enrolled</p>
                                    <p className="text-3xl font-bold text-green-600">{getTotalEnrolledCount()}</p>
                                </div>
                                <div className="text-3xl text-green-600">✓</div>
                            </div>
                        </div>

                        <div className="bg-white shadow rounded-lg p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">Pending</p>
                                    <p className="text-3xl font-bold text-yellow-600">{getPendingCount()}</p>
                                </div>
                                <div className="text-3xl text-yellow-600">⏳</div>
                            </div>
                        </div>

                        <div className="bg-white shadow rounded-lg p-6">
                            <Link href={route('enrollment.report')}>
                                <button className="w-full text-center text-indigo-600 hover:text-indigo-700 font-medium">
                                    View Reports →
                                </button>
                            </Link>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="bg-white shadow rounded-lg p-6 mb-6">
                        <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Search Student</label>
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Name or email..."
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Enrollment Status</label>
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                >
                                    <option value="">All Statuses</option>
                                    <option value="enrolled">Enrolled</option>
                                    <option value="pending">Pending</option>
                                    <option value="rejected">Rejected</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">&nbsp;</label>
                                <button
                                    type="submit"
                                    className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition"
                                >
                                    Search
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Table */}
                    <div className="bg-white shadow rounded-lg overflow-hidden">
                        <Table>
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Portal Username</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Enrollment Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Enrollment Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Portal Access</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {students.data && students.data.length > 0 ? (
                                    students.data.map((student) => (
                                        <tr key={student.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {student.applicant_personal_data?.first_name} {student.applicant_personal_data?.last_name}
                                                </div>
                                                <div className="text-sm text-gray-500">{student.applicant_personal_data?.email_address}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                {student.portal_username}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <Badge variant="info">{student.applicant_application_info?.student_category}</Badge>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <StatusBadge status={student.enrollment_status} colorMap={getStatusColor} />
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                {student.portal_enrollment_date ? new Date(student.portal_enrollment_date).toLocaleDateString() : 'Not enrolled'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {student.portal_access_active ? (
                                                    <Badge variant="success">Active</Badge>
                                                ) : (
                                                    <Badge variant="warning">Inactive</Badge>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                                                <Link href={route('enrollment.show', student.id)}>
                                                    <SecondaryButton size="sm">View</SecondaryButton>
                                                </Link>
                                                {student.enrollment_status === 'pending' && (
                                                    <button
                                                        onClick={() => {
                                                            if (confirm('Complete enrollment for this student?')) {
                                                                router.post(route('enrollment.complete', student.id), {}, {
                                                                    onSuccess: () => alert('Enrollment completed')
                                                                });
                                                            }
                                                        }}
                                                        className="text-green-600 hover:text-green-900 text-sm font-medium"
                                                    >
                                                        Complete
                                                    </button>
                                                )}
                                                {student.portal_access_active && (
                                                    <button
                                                        onClick={() => {
                                                            if (confirm('Deactivate portal access for this student?')) {
                                                                router.post(route('enrollment.deactivatePortal', student.id));
                                                            }
                                                        }}
                                                        className="text-red-600 hover:text-red-900 text-sm font-medium"
                                                    >
                                                        Deactivate
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                                            No students found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    {students.links && students.links.length > 0 && (
                        <Pagination links={students.links} />
                    )}
                </div>
            </div>
        </Authenticated>
    );
}
