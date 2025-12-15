import { router } from '@inertiajs/react';
import { BookOpen, Facebook, GraduationCap, Mail, MapPin, Phone, Users } from 'lucide-react';
import { useState } from 'react';

export default function Start() {
    const [selectedType, setSelectedType] = useState('');

    const applicationTypes = [
        {
            id: 'les',
            title: 'LES',
            fullName: 'Laboratory Elementary School',
            description: 'For Kindergarten to Grade 6 applicants',
            icon: <BookOpen className="h-16 w-16" />,
            color: 'bg-blue-500',
            hoverColor: 'hover:bg-blue-600',
        },
        {
            id: 'jhs',
            title: 'JHS',
            fullName: 'Junior High School',
            description: 'For Grade 7 to Grade 10 applicants',
            icon: <Users className="h-16 w-16" />,
            color: 'bg-green-500',
            hoverColor: 'hover:bg-green-600',
        },
        {
            id: 'shs',
            title: 'SHS',
            fullName: 'Senior High School',
            description: 'For Grade 11 to Grade 12 applicants',
            icon: <GraduationCap className="h-16 w-16" />,
            color: 'bg-purple-500',
            hoverColor: 'hover:bg-purple-600',
        },
    ];

    const handleProceed = () => {
        if (selectedType) {
            router.visit(`/applications/apply-${selectedType}`);
        }
    };

    return (
        <div className="min-h-screen bg-[#f5f5f5]">
            {/* Header */}
            <header className="bg-[#073066] text-white shadow-md">
                <div className="mx-auto flex max-w-[1800px] items-center justify-between px-10 py-6">
                    {/* Left Side: Logo + University Name */}
                    <div className="flex items-center gap-4">
                        <img src="/images/slu-logo2.png" alt="SLU Logo" className="h-30 w-30 object-contain" />
                        <div className="flex flex-col">
                            <h1 style={{ fontFamily: "'Spectral SC', serif" }} className="text-5xl text-white">
                                Saint Louis University
                            </h1>
                            <p className="mt-1 text-gray-200">Baguio City, Philippines</p>
                        </div>
                    </div>

                    {/* Rightmost Text */}
                    <p className="text-2xl whitespace-nowrap text-white">Online Application</p>
                </div>
            </header>

            {/* Main Content */}
            <div className="mx-auto w-full max-w-[1400px] px-10 py-16">
                {/* Welcome Section */}
                <div className="mb-12 text-center">
                    <h1 className="mb-4 text-3xl font-bold text-[#073066]">Welcome to SLU Online Application</h1>
                    <p className="text-md text-gray-600">Please select the appropriate application type to begin your enrollment process</p>
                </div>

                {/* Selection Cards */}
                <div className="mb-16">
                    <h3 className="mb-6 text-center text-2xl font-semibold text-[#073066]">Apply as:</h3>

                    <div className="grid grid-cols-3 gap-8">
                        {applicationTypes.map((type) => (
                            <button
                                key={type.id}
                                onClick={() => setSelectedType(type.id)}
                                className={`group relative overflow-hidden rounded-lg border-4 p-8 shadow-lg transition-all duration-300 ${
                                    selectedType === type.id
                                        ? 'scale-105 border-[#073066] bg-[#073066] shadow-2xl'
                                        : 'bg-white hover:border-[#07306656] hover:shadow-xl'
                                }`}
                            >
                                {/* Selected Indicator */}
                                {selectedType === type.id && (
                                    <div className="absolute top-4 right-4">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white">
                                            <svg
                                                className="h-5 w-5 text-[#073066]"
                                                fill="none"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth="2"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                            >
                                                <path d="M5 13l4 4L19 7"></path>
                                            </svg>
                                        </div>
                                    </div>
                                )}

                                {/* Icon */}
                                <div
                                    className={`mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full transition-all ${
                                        selectedType === type.id ? 'bg-white text-[#073066]' : `${type.color} text-white group-hover:scale-110`
                                    }`}
                                >
                                    {type.icon}
                                </div>

                                {/* Title */}
                                <h3 className={`mb-2 text-3xl font-bold ${selectedType === type.id ? 'text-white' : 'text-[#073066]'}`}>
                                    {type.title}
                                </h3>

                                {/* Full Name */}
                                <p className={`mb-3 text-lg font-semibold ${selectedType === type.id ? 'text-gray-200' : 'text-gray-700'}`}>
                                    {type.fullName}
                                </p>

                                {/* Description */}
                                <p className={`text-sm ${selectedType === type.id ? 'text-gray-300' : 'text-gray-600'}`}>{type.description}</p>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Proceed Button */}
                <div className="mb-10 flex justify-center">
                    <button
                        onClick={handleProceed}
                        disabled={!selectedType}
                        className={`rounded-lg px-12 py-4 text-lg font-semibold text-white shadow-lg transition-all duration-300 ${
                            selectedType ? 'bg-[#073066] hover:bg-[#05509e] hover:shadow-xl' : 'cursor-not-allowed bg-gray-400'
                        }`}
                    >
                        {selectedType ? 'Proceed to Application Form' : 'Please Select Application Type'}
                    </button>
                </div>
            </div>

            {/* Footer */}
            <footer className="mt-12 bg-white shadow-md">
                <div className="mx-auto flex max-w-[1200px] items-center justify-between px-10 py-15">
                    {/* Left group: Logo + Text */}
                    <div className="flex items-start gap-6">
                        <img src="/images/slu-logo.png" alt="SLU Logo" className="h-40 w-40 object-contain" />

                        <div className="flex flex-col gap-2">
                            <h1 style={{ fontFamily: "'Spectral SC', serif" }} className="text-4xl text-[#073066]">
                                Saint Louis University
                            </h1>

                            <p className="flex items-center text-[#073066]">
                                <MapPin className="mr-2 inline-block h-5 w-5" />
                                Upper Bonifacio, Baguio City, Benguet, Philippines 2600
                            </p>

                            <p className="flex items-center text-[#073066]">
                                <Mail className="mr-2 inline-block h-5 w-5" />
                                admissions@slu.edu.ph
                            </p>

                            <p className="flex items-center text-[#073066]">
                                <Phone className="mr-2 inline-block h-5 w-5" />
                                (74) 442 1234
                            </p>

                            <p className="flex items-center text-[#073066]">
                                <Facebook className="mr-2 inline-block h-5 w-5" />
                                @SaintLouisUniversity
                            </p>
                        </div>
                    </div>

                    {/* Right side: copyright (stacked) */}
                    <div className="flex flex-col items-end">
                        <p className="whitespace-nowrap text-[#073066]">Copyright © 2024 Saint Louis University</p>
                        <p className="whitespace-nowrap text-[#073066]">All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
