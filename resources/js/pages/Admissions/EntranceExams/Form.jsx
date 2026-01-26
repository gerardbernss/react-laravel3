import React, { useState } from 'react';
import { useForm } from '@inertiajs/react';
import Authenticated from '@/Layouts/AuthenticatedLayout';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';

export default function EntranceExamForm({ auth, exam = null, applicants = [] }) {
    const isEditing = !!exam;
    const { data, setData, post, put, processing, errors } = useForm({
        applicant_application_info_id: exam?.applicant_application_info_id || '',
        exam_scheduled_date: exam?.exam_scheduled_date || '',
        exam_time: exam?.exam_time || '08:00',
        exam_venue: exam?.exam_venue || '',
        room_number: exam?.room_number || '',
        seat_number: exam?.seat_number || '',
        passing_score: exam?.passing_score || 60,
        total_marks: exam?.total_marks || 100,
        instructions: exam?.instructions || '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (isEditing) {
            put(route('entrance-exams.update', exam.id));
        } else {
            post(route('entrance-exams.store'));
        }
    };

    const minDate = new Date().toISOString().split('T')[0];

    return (
        <Authenticated user={auth.user}>
            <div className="py-12">
                <div className="max-w-4xl mx-auto sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="mb-6">
                        <h1 className="text-3xl font-bold text-gray-900">
                            {isEditing ? 'Edit Entrance Exam' : 'Schedule Entrance Exam'}
                        </h1>
                        <p className="text-gray-600 mt-1">
                            {isEditing ? 'Update exam details' : 'Schedule a new entrance exam for an applicant'}
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

                            {/* Exam Date & Time */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <InputLabel htmlFor="exam_date" value="Exam Date" />
                                    <TextInput
                                        id="exam_date"
                                        type="date"
                                        value={data.exam_scheduled_date}
                                        onChange={(e) => setData('exam_scheduled_date', e.target.value)}
                                        min={minDate}
                                        required
                                        className="w-full"
                                    />
                                    <InputError message={errors.exam_scheduled_date} />
                                </div>

                                <div>
                                    <InputLabel htmlFor="exam_time" value="Exam Time" />
                                    <TextInput
                                        id="exam_time"
                                        type="time"
                                        value={data.exam_time}
                                        onChange={(e) => setData('exam_time', e.target.value)}
                                        required
                                        className="w-full"
                                    />
                                    <InputError message={errors.exam_time} />
                                </div>
                            </div>

                            {/* Venue & Seat Assignment */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                    <InputLabel htmlFor="venue" value="Exam Venue" />
                                    <TextInput
                                        id="venue"
                                        type="text"
                                        value={data.exam_venue}
                                        onChange={(e) => setData('exam_venue', e.target.value)}
                                        placeholder="e.g., Building A, Gymnasium"
                                        className="w-full"
                                    />
                                    <InputError message={errors.exam_venue} />
                                </div>

                                <div>
                                    <InputLabel htmlFor="room" value="Room Number" />
                                    <TextInput
                                        id="room"
                                        type="text"
                                        value={data.room_number}
                                        onChange={(e) => setData('room_number', e.target.value)}
                                        placeholder="e.g., 101"
                                        className="w-full"
                                    />
                                    <InputError message={errors.room_number} />
                                </div>

                                <div>
                                    <InputLabel htmlFor="seat" value="Seat Number" />
                                    <TextInput
                                        id="seat"
                                        type="text"
                                        value={data.seat_number}
                                        onChange={(e) => setData('seat_number', e.target.value)}
                                        placeholder="e.g., A-01"
                                        className="w-full"
                                    />
                                    <InputError message={errors.seat_number} />
                                </div>
                            </div>

                            {/* Scoring */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <InputLabel htmlFor="total_marks" value="Total Marks" />
                                    <TextInput
                                        id="total_marks"
                                        type="number"
                                        value={data.total_marks}
                                        onChange={(e) => setData('total_marks', e.target.value)}
                                        min="1"
                                        className="w-full"
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
                                        min="1"
                                        className="w-full"
                                    />
                                    <InputError message={errors.passing_score} />
                                </div>
                            </div>

                            {/* Instructions */}
                            <div>
                                <InputLabel htmlFor="instructions" value="Exam Instructions (Optional)" />
                                <textarea
                                    id="instructions"
                                    value={data.instructions}
                                    onChange={(e) => setData('instructions', e.target.value)}
                                    rows="4"
                                    placeholder="Enter any special instructions for the exam..."
                                    className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                />
                                <InputError message={errors.instructions} />
                            </div>

                            {/* Actions */}
                            <div className="flex justify-end space-x-3 pt-6 border-t">
                                <SecondaryButton onClick={() => window.history.back()}>
                                    Cancel
                                </SecondaryButton>
                                <PrimaryButton type="submit" disabled={processing}>
                                    {isEditing ? 'Update Exam' : 'Schedule Exam'}
                                </PrimaryButton>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </Authenticated>
    );
}
