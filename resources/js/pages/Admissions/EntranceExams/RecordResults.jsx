import React, { useState } from 'react';
import { useForm } from '@inertiajs/react';
import Authenticated from '@/Layouts/AuthenticatedLayout';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import { Badge } from '@/Components/Badge';

export default function RecordExamResults({ auth, exam }) {
    const { data, setData, post, processing, errors } = useForm({
        raw_score: exam.exam_result?.raw_score || '',
        total_marks: exam.exam_result?.total_marks || exam.total_marks || 100,
        passing_score: exam.exam_result?.passing_score || exam.passing_score || 60,
        invigilator_name: exam.exam_result?.invigilator_name || '',
        invigilator_signature: exam.exam_result?.invigilator_signature || '',
        remarks: exam.exam_result?.remarks || '',
        section_scores: exam.exam_result?.section_scores || {},
        subject_scores: exam.exam_result?.subject_scores || {},
    });

    const [sectionCount, setSectionCount] = useState(Object.keys(data.section_scores).length || 0);
    const [subjectCount, setSubjectCount] = useState(Object.keys(data.subject_scores).length || 0);

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('entrance-exams.recordResults', exam.id));
    };

    const handleAddSection = () => {
        setSectionCount(sectionCount + 1);
        setData('section_scores', {
            ...data.section_scores,
            [`section_${sectionCount + 1}`]: {
                name: '',
                score: '',
                total: '',
            }
        });
    };

    const handleAddSubject = () => {
        setSubjectCount(subjectCount + 1);
        setData('subject_scores', {
            ...data.subject_scores,
            [`subject_${subjectCount + 1}`]: {
                name: '',
                score: '',
                total: '',
            }
        });
    };

    const percentage = data.raw_score && data.total_marks ? ((data.raw_score / data.total_marks) * 100).toFixed(2) : 0;
    const isPassed = percentage >= (data.passing_score || 60);

    return (
        <Authenticated user={auth.user}>
            <div className="py-12">
                <div className="max-w-4xl mx-auto sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="mb-6">
                        <h1 className="text-3xl font-bold text-gray-900">Record Exam Results</h1>
                        <div className="mt-2 flex items-center space-x-4">
                            <div>
                                <p className="text-sm text-gray-600">Applicant</p>
                                <p className="text-lg font-medium">
                                    {exam.applicant_personal_data?.first_name} {exam.applicant_personal_data?.last_name}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Category</p>
                                <Badge variant="info">{exam.applicant_application_info?.student_category}</Badge>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Exam Date</p>
                                <p className="font-medium">{new Date(exam.exam_scheduled_date).toLocaleDateString()}</p>
                            </div>
                        </div>
                    </div>

                    {/* Form */}
                    <div className="bg-white shadow rounded-lg">
                        <form onSubmit={handleSubmit} className="p-6 space-y-8">
                            {/* Overall Score */}
                            <div className="bg-gray-50 p-6 rounded-lg">
                                <h2 className="text-lg font-semibold mb-4">Overall Score</h2>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div>
                                        <InputLabel htmlFor="raw_score" value="Raw Score" />
                                        <TextInput
                                            id="raw_score"
                                            type="number"
                                            step="0.01"
                                            value={data.raw_score}
                                            onChange={(e) => setData('raw_score', e.target.value)}
                                            className="w-full"
                                            required
                                        />
                                        <InputError message={errors.raw_score} />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="total_marks" value="Total Marks" />
                                        <TextInput
                                            id="total_marks"
                                            type="number"
                                            value={data.total_marks}
                                            onChange={(e) => setData('total_marks', e.target.value)}
                                            className="w-full"
                                            disabled
                                        />
                                        <InputError message={errors.total_marks} />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="passing_score" value="Passing Score" />
                                        <TextInput
                                            id="passing_score"
                                            type="number"
                                            value={data.passing_score}
                                            onChange={(e) => setData('passing_score', e.target.value)}
                                            className="w-full"
                                        />
                                        <InputError message={errors.passing_score} />
                                    </div>
                                </div>

                                {/* Result Preview */}
                                <div className="mt-6 p-4 bg-white rounded border-2 border-gray-200">
                                    <div className="grid grid-cols-3 gap-4 text-center">
                                        <div>
                                            <p className="text-sm text-gray-600">Percentage</p>
                                            <p className="text-2xl font-bold text-indigo-600">{percentage}%</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600">Status</p>
                                            <p className={`text-lg font-bold ${isPassed ? 'text-green-600' : 'text-red-600'}`}>
                                                {isPassed ? 'PASSED' : 'FAILED'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600">Score</p>
                                            <p className="text-2xl font-bold">{data.raw_score}/{data.total_marks}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Section Scores */}
                            <div className="border-t pt-6">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-lg font-semibold">Section Scores</h2>
                                    <button
                                        type="button"
                                        onClick={handleAddSection}
                                        className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                                    >
                                        + Add Section
                                    </button>
                                </div>

                                {Object.entries(data.section_scores).map(([key, section], idx) => (
                                    <div key={key} className="mb-4 p-4 border rounded-lg">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div>
                                                <InputLabel value="Section Name" />
                                                <TextInput
                                                    type="text"
                                                    value={section.name}
                                                    onChange={(e) => setData('section_scores', {
                                                        ...data.section_scores,
                                                        [key]: { ...section, name: e.target.value }
                                                    })}
                                                    placeholder="e.g., English, Mathematics"
                                                    className="w-full"
                                                />
                                            </div>
                                            <div>
                                                <InputLabel value="Score" />
                                                <TextInput
                                                    type="number"
                                                    step="0.01"
                                                    value={section.score}
                                                    onChange={(e) => setData('section_scores', {
                                                        ...data.section_scores,
                                                        [key]: { ...section, score: e.target.value }
                                                    })}
                                                    className="w-full"
                                                />
                                            </div>
                                            <div>
                                                <InputLabel value="Total" />
                                                <TextInput
                                                    type="number"
                                                    value={section.total}
                                                    onChange={(e) => setData('section_scores', {
                                                        ...data.section_scores,
                                                        [key]: { ...section, total: e.target.value }
                                                    })}
                                                    className="w-full"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {sectionCount === 0 && (
                                    <p className="text-sm text-gray-500">No sections added yet</p>
                                )}
                            </div>

                            {/* Subject Scores */}
                            <div className="border-t pt-6">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-lg font-semibold">Subject Scores</h2>
                                    <button
                                        type="button"
                                        onClick={handleAddSubject}
                                        className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                                    >
                                        + Add Subject
                                    </button>
                                </div>

                                {Object.entries(data.subject_scores).map(([key, subject], idx) => (
                                    <div key={key} className="mb-4 p-4 border rounded-lg">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div>
                                                <InputLabel value="Subject Name" />
                                                <TextInput
                                                    type="text"
                                                    value={subject.name}
                                                    onChange={(e) => setData('subject_scores', {
                                                        ...data.subject_scores,
                                                        [key]: { ...subject, name: e.target.value }
                                                    })}
                                                    placeholder="e.g., Filipino, Science"
                                                    className="w-full"
                                                />
                                            </div>
                                            <div>
                                                <InputLabel value="Score" />
                                                <TextInput
                                                    type="number"
                                                    step="0.01"
                                                    value={subject.score}
                                                    onChange={(e) => setData('subject_scores', {
                                                        ...data.subject_scores,
                                                        [key]: { ...subject, score: e.target.value }
                                                    })}
                                                    className="w-full"
                                                />
                                            </div>
                                            <div>
                                                <InputLabel value="Total" />
                                                <TextInput
                                                    type="number"
                                                    value={subject.total}
                                                    onChange={(e) => setData('subject_scores', {
                                                        ...data.subject_scores,
                                                        [key]: { ...subject, total: e.target.value }
                                                    })}
                                                    className="w-full"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {subjectCount === 0 && (
                                    <p className="text-sm text-gray-500">No subjects added yet</p>
                                )}
                            </div>

                            {/* Invigilator Details */}
                            <div className="border-t pt-6">
                                <h2 className="text-lg font-semibold mb-4">Invigilator Details</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <InputLabel htmlFor="invigilator_name" value="Invigilator Name" />
                                        <TextInput
                                            id="invigilator_name"
                                            type="text"
                                            value={data.invigilator_name}
                                            onChange={(e) => setData('invigilator_name', e.target.value)}
                                            className="w-full"
                                        />
                                        <InputError message={errors.invigilator_name} />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="invigilator_signature" value="Invigilator Signature" />
                                        <TextInput
                                            id="invigilator_signature"
                                            type="text"
                                            value={data.invigilator_signature}
                                            onChange={(e) => setData('invigilator_signature', e.target.value)}
                                            className="w-full"
                                        />
                                        <InputError message={errors.invigilator_signature} />
                                    </div>
                                </div>
                            </div>

                            {/* Remarks */}
                            <div className="border-t pt-6">
                                <InputLabel htmlFor="remarks" value="Remarks (Optional)" />
                                <textarea
                                    id="remarks"
                                    value={data.remarks}
                                    onChange={(e) => setData('remarks', e.target.value)}
                                    rows="4"
                                    placeholder="Any additional remarks about the exam..."
                                    className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                />
                                <InputError message={errors.remarks} />
                            </div>

                            {/* Actions */}
                            <div className="flex justify-end space-x-3 pt-6 border-t">
                                <SecondaryButton onClick={() => window.history.back()}>
                                    Cancel
                                </SecondaryButton>
                                <PrimaryButton type="submit" disabled={processing}>
                                    Save Results
                                </PrimaryButton>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </Authenticated>
    );
}
