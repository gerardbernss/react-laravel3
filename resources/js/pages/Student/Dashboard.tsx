import StudentLayout from '@/layouts/student-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { AlertCircle, CheckCircle2, ChevronDown, GraduationCap, Megaphone, User } from 'lucide-react';
import { useState } from 'react';

interface Props {
    student: {
        id: number;
        username: string;
        password_changed: boolean;
        first_login_at: string | null;
        last_login_at: string | null;
    };
    personalData: {
        id: number;
        first_name: string;
        last_name: string;
        middle_name: string | null;
        suffix: string | null;
        email: string;
    } | null;
    application: {
        id: number;
        application_number: string | null;
        school_year: string;
        semester: string | null;
        grade_level: string;
        strand: string | null;
        student_category: string | null;
        application_status: string;
    } | null;
    studentRecord: {
        id: number;
        student_id_number: string | null;
        enrollment_status: string | null;
        enrollment_date: string | null;
    };
    announcements: {
        announcement_id: number;
        title: string;
        content: string;
        attachment: string | null;
        publish_start: string | null;
    }[];
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/student/dashboard',
    },
];

export default function Dashboard({ student, personalData, application, studentRecord, announcements }: Props) {
    const [openIds, setOpenIds] = useState<Set<number>>(new Set());

    const toggleAnnouncement = (id: number) => {
        setOpenIds((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return 'N/A';
        return new Date(dateStr).toLocaleDateString('en-PH', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    return (
        <StudentLayout breadcrumbs={breadcrumbs}>
            <Head title="Student Dashboard" />

            <div className="p-6 md:p-10">
                {/* Welcome Section */}
                <div className="mb-8 flex items-start justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Welcome, {personalData?.first_name || 'Student'}!</h1>
                        <p className="mt-2 text-gray-600">
                            Here's an overview of your student dashboard. Check back here for important updates, announcements, and quick access to
                            your enrollment and personal information.
                        </p>
                    </div>
                    {application?.school_year && (
                        <div className="shrink-0 px-6 py-4 text-center">
                            <p
                                className="text-2xl leading-tight font-bold text-gray-800 italic"
                                style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
                            >
                                {application.semester ? application.semester : 'Full Year'}
                            </p>
                            <div className="mt-1 h-0.5 bg-linear-to-r from-transparent via-blue-400 to-transparent" />
                            <p className="mt-1 text-2xl font-extrabold tracking-wider text-blue-600">{application.school_year}</p>
                        </div>
                    )}
                </div>

                {/* Password Change Warning */}
                {!student.password_changed && (
                    <div className="mb-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                        <div className="flex items-center gap-3">
                            <AlertCircle className="h-5 w-5 text-yellow-600" />
                            <div>
                                <h3 className="font-medium text-yellow-800">Password Change Required</h3>
                                <p className="text-sm text-yellow-700">
                                    For security, please change your temporary password.{' '}
                                    <a href="/student/change-password" className="font-medium underline">
                                        Change password now
                                    </a>
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Announcements (left) & Student Status (right) */}
                <div className="mb-8 grid gap-6 lg:grid-cols-3">
                    {/* Announcements Section */}
                    <div className="rounded-lg border bg-white shadow-sm lg:col-span-2">
                        <div className="border-b bg-gray-50 px-6 py-4">
                            <div className="flex items-center gap-2">
                                <Megaphone className="h-5 w-5 text-gray-600" />
                                <h2 className="text-lg font-semibold text-gray-900">Announcements</h2>
                                {announcements.length > 0 && (
                                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                                        {announcements.length}
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="max-h-96 divide-y overflow-y-auto">
                            {announcements.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-8 text-center">
                                    <Megaphone className="h-12 w-12 text-gray-300" />
                                    <p className="mt-3 text-sm text-gray-500">No announcements at this time.</p>
                                    <p className="text-xs text-gray-400">Check back later for updates and important notices.</p>
                                </div>
                            ) : (
                                announcements.map((a) => {
                                    const isOpen = openIds.has(a.announcement_id);
                                    return (
                                        <div key={a.announcement_id} className="border-b last:border-b-0">
                                            <button
                                                type="button"
                                                onClick={() => toggleAnnouncement(a.announcement_id)}
                                                className="w-full px-5 py-4 text-left transition-colors hover:bg-gray-50"
                                            >
                                                <div className="mb-1.5 flex items-start justify-between gap-3">
                                                    <p className="font-semibold text-gray-900">{a.title}</p>
                                                    <div className="flex shrink-0 items-center gap-1.5">
                                                        {a.publish_start && (
                                                            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                                                                {new Date(a.publish_start).toLocaleDateString('en-PH', {
                                                                    year: 'numeric',
                                                                    month: 'short',
                                                                    day: 'numeric',
                                                                })}
                                                            </span>
                                                        )}
                                                        <ChevronDown
                                                            className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                                                        />
                                                    </div>
                                                </div>
                                                <p className={`text-sm text-gray-600 ${isOpen ? 'whitespace-pre-line' : 'line-clamp-2'}`}>
                                                    {a.content}
                                                </p>
                                            </button>
                                            {isOpen && a.attachment && (
                                                <div className="px-5 pb-4">
                                                    <a
                                                        href={`/storage/${a.attachment}`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                                                    >
                                                        📎 View attachment
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* Student Status */}
                    <div className="rounded-lg border bg-white shadow-sm">
                        <div className="border-b bg-gray-50 px-6 py-4">
                            <div className="flex items-center gap-2">
                                <User className="h-5 w-5 text-gray-600" />
                                <h2 className="text-lg font-semibold text-gray-900">Student Status</h2>
                            </div>
                        </div>
                        <div className="p-6">
                            <div className="space-y-5">
                                {studentRecord.student_id_number && (
                                    <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 text-center">
                                        <GraduationCap className="mx-auto h-8 w-8 text-primary" />
                                        <p className="mt-2 text-xs font-medium text-gray-500 uppercase">Student ID</p>
                                        <p className="text-xl font-bold text-primary">{studentRecord.student_id_number}</p>
                                    </div>
                                )}

                                <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-center">
                                    <CheckCircle2 className="mx-auto h-10 w-10 text-green-600" />
                                    <p className="mt-2 text-lg font-bold text-green-700">Enrolled</p>
                                    <p className="text-xs text-green-600">You are officially enrolled this semester.</p>
                                </div>

                                {application?.grade_level && (
                                    <div>
                                        <p className="text-xs font-medium text-gray-500 uppercase">Grade Level</p>
                                        <p className="mt-1 font-medium text-gray-900">{application.grade_level}</p>
                                    </div>
                                )}

                                {application?.strand && (
                                    <div>
                                        <p className="text-xs font-medium text-gray-500 uppercase">Strand / Track</p>
                                        <p className="mt-1 font-medium text-gray-900">{application.strand}</p>
                                    </div>
                                )}

                                {application?.school_year && (
                                    <div>
                                        <p className="text-xs font-medium text-gray-500 uppercase">School Year</p>
                                        <p className="mt-1 font-medium text-gray-900">{application.school_year}</p>
                                    </div>
                                )}

                                {studentRecord.enrollment_date && (
                                    <div>
                                        <p className="text-xs font-medium text-gray-500 uppercase">Enrolled On</p>
                                        <p className="mt-1 font-medium text-gray-900">{formatDate(studentRecord.enrollment_date)}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </StudentLayout>
    );
}
