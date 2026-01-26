import React, { useState } from 'react';
import { useForm } from '@inertiajs/react';
import Authenticated from '@/Layouts/AuthenticatedLayout';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';

export default function CreatePortalCredential({ auth, applicants = [] }) {
    const { data, setData, post, processing, errors } = useForm({
        applicant_personal_data_id: '',
        applicant_application_info_id: '',
        portal_username: '',
    });

    const [selectedApplicant, setSelectedApplicant] = useState(null);

    const handleApplicantChange = (e) => {
        const applicantId = e.target.value;
        const applicant = applicants.find(a => a.id === parseInt(applicantId));
        setSelectedApplicant(applicant);
        setData('applicant_personal_data_id', applicant?.applicant_personal_data?.id || '');
        setData('applicant_application_info_id', applicantId);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('portal-credentials.store'));
    };

    const generateUsername = () => {
        if (selectedApplicant) {
            const firstName = selectedApplicant.applicant_personal_data?.first_name?.toLowerCase() || '';
            const lastName = selectedApplicant.applicant_personal_data?.last_name?.toLowerCase() || '';
            const randomNum = Math.floor(Math.random() * 1000);
            const username = `${firstName}.${lastName}${randomNum}`;
            setData('portal_username', username);
        }
    };

    return (
        <Authenticated user={auth.user}>
            <div className="py-12">
                <div className="max-w-4xl mx-auto sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="mb-6">
                        <h1 className="text-3xl font-bold text-gray-900">Create Portal Credentials</h1>
                        <p className="text-gray-600 mt-1">Set up portal access for an applicant</p>
                    </div>

                    {/* Form */}
                    <div className="bg-white shadow rounded-lg">
                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            {/* Applicant Selection */}
                            <div>
                                <InputLabel htmlFor="applicant" value="Select Applicant" />
                                <select
                                    id="applicant"
                                    value={data.applicant_application_info_id}
                                    onChange={handleApplicantChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                    required
                                >
                                    <option value="">Choose an applicant...</option>
                                    {applicants.map((applicant) => (
                                        <option key={applicant.id} value={applicant.id}>
                                            {applicant.applicant_personal_data?.first_name} {applicant.applicant_personal_data?.last_name} - {applicant.student_category}
                                        </option>
                                    ))}
                                </select>
                                <InputError message={errors.applicant_application_info_id} />
                            </div>

                            {/* Applicant Summary */}
                            {selectedApplicant && (
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <h3 className="font-semibold text-blue-900 mb-2">Applicant Summary</h3>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <span className="text-blue-700">Email:</span>
                                            <p className="font-medium">{selectedApplicant.applicant_personal_data?.email_address}</p>
                                        </div>
                                        <div>
                                            <span className="text-blue-700">Category:</span>
                                            <p className="font-medium">{selectedApplicant.student_category}</p>
                                        </div>
                                        <div>
                                            <span className="text-blue-700">Phone:</span>
                                            <p className="font-medium">{selectedApplicant.applicant_personal_data?.contact_number || 'Not provided'}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Portal Username */}
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <InputLabel htmlFor="username" value="Portal Username" />
                                    <button
                                        type="button"
                                        onClick={generateUsername}
                                        disabled={!selectedApplicant}
                                        className="text-sm text-indigo-600 hover:text-indigo-700 font-medium disabled:text-gray-400"
                                    >
                                        Auto-generate
                                    </button>
                                </div>
                                <TextInput
                                    id="username"
                                    type="text"
                                    value={data.portal_username}
                                    onChange={(e) => setData('portal_username', e.target.value)}
                                    placeholder="e.g., john.doe123"
                                    className="w-full"
                                    required
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Usernames must be unique and contain only alphanumeric characters and dots.
                                </p>
                                <InputError message={errors.portal_username} />
                            </div>

                            {/* Information Box */}
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                <h3 className="font-semibold text-yellow-900 mb-2">Important Information</h3>
                                <ul className="text-sm text-yellow-800 space-y-1">
                                    <li>• A temporary password will be generated automatically</li>
                                    <li>• The applicant will receive login credentials via email</li>
                                    <li>• They can change their password on first login</li>
                                    <li>• Access can be suspended if needed</li>
                                </ul>
                            </div>

                            {/* Actions */}
                            <div className="flex justify-end space-x-3 pt-6 border-t">
                                <SecondaryButton onClick={() => window.history.back()}>
                                    Cancel
                                </SecondaryButton>
                                <PrimaryButton type="submit" disabled={processing || !selectedApplicant}>
                                    Create Credentials
                                </PrimaryButton>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </Authenticated>
    );
}
