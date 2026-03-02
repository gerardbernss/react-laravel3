import StudentLayout from '@/layouts/student-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { AlertCircle, CheckCircle2, Clock, FileText, GraduationCap, Megaphone, User } from 'lucide-react';

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
        gender: string | null;
        date_of_birth: string | null;
        place_of_birth: string | null;
        citizenship: string | null;
        religion: string | null;
        mobile_number: string | null;
        present_address: string | null;
    } | null;
    application: {
        id: number;
        application_number: string | null;
        school_year: string;
        semester: string | null;
        grade_level: string;
        strand: string | null;
        student_category: string | null;
        classification: string | null;
        learning_mode: string | null;
        application_status: string;
        date_applied: string;
        examination_date: string | null;
    } | null;
    studentRecord: {
        id: number;
        student_id_number: string | null;
        enrollment_status: string | null;
        enrollment_date: string | null;
    } | null;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/student/dashboard',
    },
];

export default function Dashboard({ student, personalData, application, studentRecord }: Props) {
    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return 'N/A';
        return new Date(dateStr).toLocaleDateString('en-PH', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const isEnrolled = studentRecord?.enrollment_status === 'enrolled';

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
                    {/* Announcements Section - takes 2 columns */}
                    <div className="rounded-lg border bg-white shadow-sm lg:col-span-2">
                        <div className="border-b bg-gray-50 px-6 py-4">
                            <div className="flex items-center gap-2">
                                <Megaphone className="h-5 w-5 text-gray-600" />
                                <h2 className="text-lg font-semibold text-gray-900">Announcements</h2>
                            </div>
                        </div>
                        <div className="p-6">
                            <div className="flex flex-col items-center justify-center py-8 text-center">
                                <Megaphone className="h-12 w-12 text-gray-300" />
                                <p className="mt-3 text-sm text-gray-500">No announcements at this time.</p>
                                <p className="text-xs text-gray-400">Check back later for updates and important notices.</p>
                            </div>
                        </div>
                    </div>

                    {/* Student Status Section - takes 1 column */}
                    <div className="rounded-lg border bg-white shadow-sm">
                        <div className="border-b bg-gray-50 px-6 py-4">
                            <div className="flex items-center gap-2">
                                <User className="h-5 w-5 text-gray-600" />
                                <h2 className="text-lg font-semibold text-gray-900">Student Status</h2>
                            </div>
                        </div>
                        <div className="p-6">
                            <div className="space-y-5">
                                {/* Student ID */}
                                {studentRecord?.student_id_number && (
                                    <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 text-center">
                                        <GraduationCap className="mx-auto h-8 w-8 text-primary" />
                                        <p className="mt-2 text-xs font-medium text-gray-500 uppercase">Student ID</p>
                                        <p className="text-xl font-bold text-primary">{studentRecord.student_id_number}</p>
                                    </div>
                                )}

                                {/* Enrollment Status Banner */}
                                <div
                                    className={`rounded-lg p-4 text-center ${
                                        isEnrolled ? 'border border-green-200 bg-green-50' : 'border border-yellow-200 bg-yellow-50'
                                    }`}
                                >
                                    {isEnrolled ? (
                                        <CheckCircle2 className="mx-auto h-10 w-10 text-green-600" />
                                    ) : (
                                        <Clock className="mx-auto h-10 w-10 text-yellow-500" />
                                    )}
                                    <p className={`mt-2 text-lg font-bold ${isEnrolled ? 'text-green-700' : 'text-yellow-700'}`}>
                                        {isEnrolled ? 'Enrolled' : 'Pending Enrollment'}
                                    </p>
                                    <p className={`text-xs ${isEnrolled ? 'text-green-600' : 'text-yellow-600'}`}>
                                        {isEnrolled ? 'You are officially enrolled this semester.' : 'Please complete the enrollment process.'}
                                    </p>
                                </div>

                                {/* Grade Level */}
                                {application?.grade_level && (
                                    <div>
                                        <p className="text-xs font-medium text-gray-500 uppercase">Grade Level</p>
                                        <p className="mt-1 font-medium text-gray-900">{application.grade_level}</p>
                                    </div>
                                )}

                                {/* Strand / Track */}
                                {application?.strand && (
                                    <div>
                                        <p className="text-xs font-medium text-gray-500 uppercase">Strand / Track</p>
                                        <p className="mt-1 font-medium text-gray-900">{application.strand}</p>
                                    </div>
                                )}

                                {/* School Year */}
                                {application?.school_year && (
                                    <div>
                                        <p className="text-xs font-medium text-gray-500 uppercase">School Year</p>
                                        <p className="mt-1 font-medium text-gray-900">{application.school_year}</p>
                                    </div>
                                )}

                                {/* Enrollment Date */}
                                {studentRecord?.enrollment_date && (
                                    <div>
                                        <p className="text-xs font-medium text-gray-500 uppercase">Enrolled On</p>
                                        <p className="mt-1 font-medium text-gray-900">{formatDate(studentRecord.enrollment_date)}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Links */}
                <div>
                    <h2 className="mb-4 text-lg font-semibold text-gray-900">Quick Links</h2>
                    <div className="grid gap-4 md:grid-cols-3">
                        <a
                            href="/student/enrollment"
                            className="flex items-center gap-3 rounded-lg border bg-white p-4 shadow-sm transition-all duration-200 hover:border-primary/30 hover:bg-primary/5 hover:shadow-md"
                        >
                            <div className="rounded-lg bg-blue-100 p-2">
                                <FileText className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="font-medium text-gray-900">Enrollment</p>
                                <p className="text-sm text-gray-500">Proceed with enrollment</p>
                            </div>
                        </a>

                        <a
                            href="/student/personal-info"
                            className="flex items-center gap-3 rounded-lg border bg-white p-4 shadow-sm transition-all duration-200 hover:border-primary/30 hover:bg-primary/5 hover:shadow-md"
                        >
                            <div className="rounded-lg bg-green-100 p-2">
                                <User className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                                <p className="font-medium text-gray-900">Personal Information</p>
                                <p className="text-sm text-gray-500">View and update your info</p>
                            </div>
                        </a>

                        <a
                            href="/student/change-password"
                            className="flex items-center gap-3 rounded-lg border bg-white p-4 shadow-sm transition-all duration-200 hover:border-primary/30 hover:bg-primary/5 hover:shadow-md"
                        >
                            <div className="rounded-lg bg-purple-100 p-2">
                                <Clock className="h-5 w-5 text-purple-600" />
                            </div>
                            <div>
                                <p className="font-medium text-gray-900">Change Password</p>
                                <p className="text-sm text-gray-500">Update your login credentials</p>
                            </div>
                        </a>
                    </div>
                </div>
            </div>
        </StudentLayout>
    );
}
