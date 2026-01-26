import React, { useState } from 'react';
import { useForm } from '@inertiajs/react';
import Authenticated from '@/Layouts/AuthenticatedLayout';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';

export default function AssessmentForm({ auth, assessment = null, applicants = [] }) {
    const isEditing = !!assessment;
    const { data, setData, post, put, processing, errors } = useForm({
        applicant_application_info_id: assessment?.applicant_application_info_id || '',
        assessment_type: assessment?.assessment_type || 'interview',
        assessment_date: assessment?.assessment_date || '',
        score: assessment?.score || '',
        total_score: assessment?.total_score || 100,
        assessed_by: assessment?.assessed_by || '',
        remarks: assessment?.remarks || '',
        feedback: assessment?.feedback || '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (isEditing) {
            put(route('assessments.update', assessment.id));
        } else {
            post(route('assessments.store'));
        }
    };

    const maxDate = new Date().toISOString().split('T')[0];

    return (
        <Authenticated user={auth.user}>
            <div className="py-12">
                <div className="max-w-4xl mx-auto sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="mb-6">
                        <h1 className="text-3xl font-bold text-gray-900">
                            {isEditing ? 'Edit Assessment' : 'Create Assessment'}
                        </h1>
                        <p className="text-gray-600 mt-1">
                            {isEditing ? 'Update assessment details' : 'Record a new assessment for an applicant'}
                        </p>
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
                                    onChange={(e) => setData('applicant_application_info_id', e.target.value)}
                                    disabled={isEditing}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                    required
                                >
                                    <option value="">Choose an applicant...</option>
                                    {applicants.map((applicant) => (
                                        <option key={applicant.id} value={applicant.id}>
                                            {applicant.applicant_personal_data.first_name} {applicant.applicant_personal_data.last_name} - {applicant.student_category}
                                        </option>
                                    ))}
                                </select>
                                <InputError message={errors.applicant_application_info_id} />
                            </div>

                            {/* Assessment Type */}
                            <div>
                                <InputLabel htmlFor="type" value="Assessment Type" />
                                <select
                                    id="type"
                                    value={data.assessment_type}
                                    onChange={(e) => setData('assessment_type', e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                    required
                                >
                                    <option value="interview">Interview</option>
                                    <option value="practical">Practical Test</option>
                                    <option value="written">Written Test</option>
                                    <option value="performance">Performance Test</option>
                                    <option value="other">Other</option>
                                </select>
                                <InputError message={errors.assessment_type} />
                            </div>

                            {/* Assessment Date */}
                            <div>
                                <InputLabel htmlFor="date" value="Assessment Date" />
                                <TextInput
                                    id="date"
                                    type="date"
                                    value={data.assessment_date}
                                    onChange={(e) => setData('assessment_date', e.target.value)}
                                    max={maxDate}
                                    required
                                    className="w-full"
                                />
                                <InputError message={errors.assessment_date} />
                            </div>

                            {/* Score */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <InputLabel htmlFor="score" value="Score" />
                                    <TextInput
                                        id="score"
                                        type="number"
                                        step="0.01"
                                        value={data.score}
                                        onChange={(e) => setData('score', e.target.value)}
                                        className="w-full"
                                    />
                                    <InputError message={errors.score} />
                                </div>

                                <div>
                                    <InputLabel htmlFor="total_score" value="Total Score" />
                                    <TextInput
                                        id="total_score"
                                        type="number"
                                        step="0.01"
                                        value={data.total_score}
                                        onChange={(e) => setData('total_score', e.target.value)}
                                        className="w-full"
                                    />
                                    <InputError message={errors.total_score} />
                                </div>
                            </div>

                            {/* Score Preview */}
                            {data.score && data.total_score && (
                                <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                                    <p className="text-sm text-indigo-600">
                                        Score: {data.score}/{data.total_score}
                                        ({((data.score / data.total_score) * 100).toFixed(1)}%)
                                    </p>
                                </div>
                            )}

                            {/* Assessed By */}
                            <div>
                                <InputLabel htmlFor="assessed_by" value="Assessed By" />
                                <TextInput
                                    id="assessed_by"
                                    type="text"
                                    value={data.assessed_by}
                                    onChange={(e) => setData('assessed_by', e.target.value)}
                                    placeholder="Name of assessor"
                                    className="w-full"
                                />
                                <InputError message={errors.assessed_by} />
                            </div>

                            {/* Remarks */}
                            <div>
                                <InputLabel htmlFor="remarks" value="Remarks" />
                                <textarea
                                    id="remarks"
                                    value={data.remarks}
                                    onChange={(e) => setData('remarks', e.target.value)}
                                    rows="3"
                                    placeholder="Any remarks about the assessment..."
                                    className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                />
                                <InputError message={errors.remarks} />
                            </div>

                            {/* Feedback */}
                            <div>
                                <InputLabel htmlFor="feedback" value="Feedback" />
                                <textarea
                                    id="feedback"
                                    value={data.feedback}
                                    onChange={(e) => setData('feedback', e.target.value)}
                                    rows="3"
                                    placeholder="Detailed feedback for the applicant..."
                                    className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                />
                                <InputError message={errors.feedback} />
                            </div>

                            {/* Actions */}
                            <div className="flex justify-end space-x-3 pt-6 border-t">
                                <SecondaryButton onClick={() => window.history.back()}>
                                    Cancel
                                </SecondaryButton>
                                <PrimaryButton type="submit" disabled={processing}>
                                    {isEditing ? 'Update Assessment' : 'Create Assessment'}
                                </PrimaryButton>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </Authenticated>
    );
}
