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
            hoverColor: 'hover:bg-blue-700',
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
                <div className="mx-auto flex max-w-[1800px] flex-col items-center justify-between gap-4 px-4 py-6 md:flex-row md:px-10">
                    {/* Left Side: Logo + University Name */}
                    <div className="flex flex-col items-center gap-4 text-center md:flex-row md:text-left">
                        <img src="/images/slu-logo2.png" alt="SLU Logo" className="h-20 w-20 object-contain md:h-30 md:w-30" />
                        <div className="flex flex-col">
                            <h1 style={{ fontFamily: "'Spectral SC', serif" }} className="text-3xl text-white md:text-5xl">
                                Saint Louis University
                            </h1>
                            <p className="mt-1 text-sm text-gray-200 md:text-base">Baguio City, Philippines</p>
                        </div>
                    </div>

                    {/* Rightmost Text */}
                    <p className="text-xl font-semibold text-white md:text-2xl">Online Application</p>
                </div>
            </header>

            {/* Main Content */}
            <div className="mx-auto w-full max-w-[1400px] px-4 py-8 md:px-10 md:py-16">
                {/* Welcome Section */}
                <div className="mb-12 text-center">
                    <h1 className="mb-4 text-2xl font-bold text-[#073066] md:text-3xl">Welcome to SLU Online Application</h1>
                    <p className="text-sm text-gray-600 md:text-base">
                        Please select the appropriate application type to begin your enrollment process
                    </p>
                </div>

                {/* Selection Cards */}
                <div className="mb-16">
                    <h3 className="mb-6 text-center text-xl font-semibold text-[#073066] md:text-2xl">Apply as:</h3>

                    <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
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
                <div className="mx-auto flex max-w-[1200px] flex-col items-center justify-between gap-8 px-4 py-10 md:flex-row md:items-start md:px-10">
                    {/* Left group: Logo + Text */}
                    <div className="flex flex-col items-center gap-6 text-center md:flex-row md:items-start md:text-left">
                        <img src="/images/slu-logo.png" alt="SLU Logo" className="h-32 w-32 object-contain md:h-40 md:w-40" />

                        <div className="flex flex-col gap-2">
                            <h1 style={{ fontFamily: "'Spectral SC', serif" }} className="text-2xl text-[#073066] md:text-4xl">
                                Saint Louis University
                            </h1>

                            <p className="flex items-center justify-center text-[#073066] md:justify-start">
                                <MapPin className="mr-2 inline-block h-5 w-5 shrink-0" />
                                Upper Bonifacio, Baguio City, Benguet, Philippines 2600
                            </p>

                            <p className="flex items-center justify-center text-[#073066] md:justify-start">
                                <Mail className="mr-2 inline-block h-5 w-5 shrink-0" />
                                admissions@slu.edu.ph
                            </p>

                            <p className="flex items-center justify-center text-[#073066] md:justify-start">
                                <Phone className="mr-2 inline-block h-5 w-5 shrink-0" />
                                (74) 442 1234
                            </p>

                            <p className="flex items-center justify-center text-[#073066] md:justify-start">
                                <Facebook className="mr-2 inline-block h-5 w-5 shrink-0" />
                                @SaintLouisUniversity
                            </p>
                        </div>
                    </div>

                    {/* Right side: copyright (stacked) */}
                    <div className="flex flex-col items-center text-center md:items-end md:text-right">
                        <p className="text-[#073066]">Copyright © 2024 Saint Louis University</p>
                        <p className="text-[#073066]">All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
