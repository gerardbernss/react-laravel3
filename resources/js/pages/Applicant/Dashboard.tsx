import { useApplicantDashboard } from '@/hooks/useApplicantDashboard';
import StudentLayout from '@/layouts/student-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { AlertCircle, CalendarCheck, CheckCircle2, ChevronDown, Clock, MapPin, Megaphone, XCircle } from 'lucide-react';

interface Props {
    student: {
        id: number;
        username: string;
        password_changed: boolean;
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
        date_applied: string;
        examination_date: string | null;
        remarks: string | null;
    } | null;
    announcements: {
        announcement_id: number;
        title: string;
        content: string;
        attachment: string | null;
        publish_start: string | null;
    }[];
    examSchedule: {
        name: string;
        exam_type: string | null;
        exam_date: string | null;
        start_time: string | null;
        end_time: string | null;
        instructions: string | null;
        room_name: string | null;
        room_building: string | null;
        room_floor: string | null;
        status: string;
    } | null;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/applicant/dashboard',
    },
];

export default function ApplicantDashboard({ student, personalData, application, announcements, examSchedule }: Props) {
    const {
        currentSemester,
        openIds,
        toggleAnnouncement,
        isForExam,
        isExamTaken,
        isExamPassed,
        isExamFailed,
        isForRevision,
        isRejected,
        isEnrolled,
        isPendingEnrollment,
        hasEvaluation,
        statusLabel,
    } = useApplicantDashboard({ application, examSchedule });

    const formatTime = (t: string | null) => {
        if (!t) return '';
        const [h, m] = t.split(':');
        const hour = parseInt(h);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        return `${hour % 12 || 12}:${m} ${ampm}`;
    };

    return (
        <StudentLayout breadcrumbs={breadcrumbs}>
            <Head title="Applicant Dashboard" />

            <div className="p-6 md:p-10">
                {/* Welcome Section */}
                <div className="mb-8 flex items-start justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Welcome, {personalData?.first_name || 'Applicant'}!</h1>
                        <p className="mt-2 text-gray-600">
                            Track your application status here. You'll be notified of any updates to your application.
                        </p>
                    </div>
                    {currentSemester?.name && (
                        <div className="inline-flex shrink-0 items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
                            <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
                            {currentSemester.name} · {currentSemester.school_year}
                        </div>
                    )}
                </div>

                {/* Application Period Status */}
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

                {/* Evaluation + Exam Schedule (merged card) */}
                {hasEvaluation && application && (
                    <div
                        className={`mb-6 rounded-lg border p-5 ${
                            isEnrolled
                                ? 'border-blue-200 bg-blue-50'
                                : isExamPassed
                                  ? 'border-emerald-200 bg-emerald-50'
                                  : isPendingEnrollment
                                    ? 'border-teal-200 bg-teal-50'
                                    : isExamFailed
                                      ? 'border-red-200 bg-red-50'
                                      : isExamTaken
                                        ? 'border-purple-200 bg-purple-50'
                                        : isForExam && examSchedule
                                          ? 'border-green-200 bg-green-50'
                                          : isForExam
                                            ? 'border-blue-200 bg-blue-50'
                                            : isForRevision
                                              ? 'border-yellow-200 bg-yellow-50'
                                              : 'border-red-200 bg-red-50'
                        }`}
                    >
                        <div className="flex items-start gap-4">
                            <div
                                className={`mt-0.5 rounded-full p-2 ${
                                    isEnrolled
                                        ? 'bg-blue-100'
                                        : isExamPassed
                                          ? 'bg-emerald-100'
                                          : isPendingEnrollment
                                            ? 'bg-teal-100'
                                            : isExamFailed
                                              ? 'bg-red-100'
                                              : isExamTaken
                                                ? 'bg-purple-100'
                                                : isForExam && examSchedule
                                                  ? 'bg-green-100'
                                                  : isForExam
                                                    ? 'bg-blue-100'
                                                    : isForRevision
                                                      ? 'bg-yellow-100'
                                                      : 'bg-red-100'
                                }`}
                            >
                                {isEnrolled && <CheckCircle2 className="h-5 w-5 text-blue-600" />}
                                {isExamPassed && <CheckCircle2 className="h-5 w-5 text-emerald-600" />}
                                {isPendingEnrollment && <CalendarCheck className="h-5 w-5 text-teal-600" />}
                                {isExamFailed && <XCircle className="h-5 w-5 text-red-600" />}
                                {isExamTaken && <CalendarCheck className="h-5 w-5 text-purple-600" />}
                                {isForExam && examSchedule && <CalendarCheck className="h-5 w-5 text-green-600" />}
                                {isForExam && !examSchedule && <CheckCircle2 className="h-5 w-5 text-blue-600" />}
                                {isForRevision && <AlertCircle className="h-5 w-5 text-yellow-600" />}
                                {isRejected && <XCircle className="h-5 w-5 text-red-600" />}
                            </div>
                            <div className="flex-1">
                                <h3
                                    className={`font-semibold ${
                                        isEnrolled
                                            ? 'text-blue-800'
                                            : isExamPassed
                                              ? 'text-emerald-800'
                                              : isPendingEnrollment
                                                ? 'text-teal-800'
                                                : isExamFailed
                                                  ? 'text-red-800'
                                                  : isExamTaken
                                                    ? 'text-purple-800'
                                                    : isForExam && examSchedule
                                                      ? 'text-green-800'
                                                      : isForExam
                                                        ? 'text-blue-800'
                                                        : isForRevision
                                                          ? 'text-yellow-800'
                                                          : 'text-red-800'
                                    }`}
                                >
                                    {isEnrolled && 'Enrolled'}
                                    {isExamPassed && 'Exam Passed — Await Enrollment Schedule'}
                                    {isPendingEnrollment && 'Enrollment Open — Action Required'}
                                    {isExamFailed && 'Exam Not Passed'}
                                    {isExamTaken && 'Exam Completed — Awaiting Results'}
                                    {isForExam && examSchedule && 'Application Approved — Exam Schedule Assigned'}
                                    {isForExam && !examSchedule && 'Application Approved'}
                                    {isForRevision && 'Revision Required'}
                                    {isRejected && 'Application Rejected'}
                                </h3>
                                <p
                                    className={`mt-0.5 text-sm ${
                                        isEnrolled
                                            ? 'text-blue-700'
                                            : isExamPassed
                                              ? 'text-emerald-700'
                                              : isPendingEnrollment
                                                ? 'text-teal-700'
                                                : isExamFailed
                                                  ? 'text-red-700'
                                                  : isExamTaken
                                                    ? 'text-purple-700'
                                                    : isForExam && examSchedule
                                                      ? 'text-green-700'
                                                      : isForExam
                                                        ? 'text-blue-700'
                                                        : isForRevision
                                                          ? 'text-yellow-700'
                                                          : 'text-red-700'
                                    }`}
                                >
                                    {isEnrolled && 'Your enrollment has been confirmed. Welcome to the school!'}
                                    {isExamPassed &&
                                        'Congratulations on passing the entrance examination! Please wait for further announcements regarding the enrollment schedule. You will be notified once the enrollment period opens.'}
                                    {isPendingEnrollment &&
                                        'Enrollment is now open! Please proceed to complete your enrollment and fees to secure your slot.'}
                                    {isExamFailed && 'You may reapply next school year. For concerns, please contact the admissions office.'}
                                    {isExamTaken && 'Your exam has been recorded. Please wait while the results are being processed.'}
                                    {isForExam && examSchedule && examSchedule.name}
                                    {isForExam &&
                                        !examSchedule &&
                                        'Your application has been reviewed and approved. Please wait for your examination schedule.'}
                                    {isForRevision && 'Your application needs changes before it can proceed.'}
                                    {isRejected && 'Your application was not accepted for this cycle.'}
                                </p>

                                {/* Exam schedule details — shown inline when approved + assigned */}
                                {isForExam && examSchedule && (
                                    <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                        {examSchedule.exam_date && (
                                            <div className="flex items-center gap-2 rounded-md border border-green-200 bg-white px-3 py-2">
                                                <CalendarCheck className="h-4 w-4 shrink-0 text-green-600" />
                                                <div>
                                                    <p className="text-xs text-gray-500">Date</p>
                                                    <p className="text-sm font-medium text-gray-900">
                                                        {new Date(examSchedule.exam_date).toLocaleDateString('en-PH', {
                                                            year: 'numeric',
                                                            month: 'long',
                                                            day: 'numeric',
                                                        })}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                        {(examSchedule.start_time || examSchedule.end_time) && (
                                            <div className="flex items-center gap-2 rounded-md border border-green-200 bg-white px-3 py-2">
                                                <Clock className="h-4 w-4 shrink-0 text-green-600" />
                                                <div>
                                                    <p className="text-xs text-gray-500">Time</p>
                                                    <p className="text-sm font-medium text-gray-900">
                                                        {formatTime(examSchedule.start_time)}
                                                        {examSchedule.end_time && ` – ${formatTime(examSchedule.end_time)}`}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                        {examSchedule.room_name && (
                                            <div className="flex items-center gap-2 rounded-md border border-green-200 bg-white px-3 py-2">
                                                <MapPin className="h-4 w-4 shrink-0 text-green-600" />
                                                <div>
                                                    <p className="text-xs text-gray-500">Room</p>
                                                    <p className="text-sm font-medium text-gray-900">
                                                        {examSchedule.room_name}
                                                        {examSchedule.room_floor && `, ${examSchedule.room_floor}`}
                                                        {examSchedule.room_building && ` — ${examSchedule.room_building}`}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                        {examSchedule.exam_type && (
                                            <div className="flex items-center gap-2 rounded-md border border-green-200 bg-white px-3 py-2">
                                                <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />
                                                <div>
                                                    <p className="text-xs text-gray-500">Type</p>
                                                    <p className="text-sm font-medium text-gray-900">{examSchedule.exam_type}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                                {isForExam && examSchedule?.instructions && (
                                    <div className="mt-3 rounded-md border border-green-200 bg-white p-3">
                                        <p className="mb-1 text-xs font-medium text-gray-500 uppercase">Instructions</p>
                                        <p className="text-sm whitespace-pre-line text-gray-700">{examSchedule.instructions}</p>
                                    </div>
                                )}

                                {application.remarks && (
                                    <p
                                        className={`mt-2 rounded-md border p-3 text-sm ${
                                            isForExam && examSchedule
                                                ? 'border-green-200 bg-green-100/50 text-green-800'
                                                : isForExam
                                                  ? 'border-blue-200 bg-blue-100/50 text-blue-800'
                                                  : isForRevision
                                                    ? 'border-yellow-200 bg-yellow-100/50 text-yellow-800'
                                                    : 'border-red-200 bg-red-100/50 text-red-800'
                                        }`}
                                    >
                                        {application.remarks}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* standalone exam schedule card when no evaluation state (edge case) */}
                {!hasEvaluation && examSchedule && (
                    <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-5">
                        <div className="flex items-start gap-4">
                            <div className="mt-0.5 rounded-full bg-green-100 p-2">
                                <CalendarCheck className="h-5 w-5 text-green-600" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold text-green-800">Examination Schedule Assigned</h3>
                                <p className="mt-0.5 text-sm text-green-700">{examSchedule.name}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Announcements (left) & Application Status (right) */}
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

                    {/* Application Status */}
                    <div className="rounded-lg border bg-white shadow-sm">
                        <div className="border-b bg-gray-50 px-6 py-4">
                            <div className="flex items-center gap-2">
                                <Clock className="h-5 w-5 text-gray-600" />
                                <h2 className="text-lg font-semibold text-gray-900">Application Status</h2>
                            </div>
                        </div>
                        <div className="p-6">
                            <div className="space-y-5">
                                <div
                                    className={`rounded-lg p-4 text-center ${
                                        isEnrolled
                                            ? 'border border-blue-200 bg-blue-50'
                                            : isExamPassed
                                              ? 'border border-emerald-200 bg-emerald-50'
                                              : isPendingEnrollment
                                                ? 'border border-teal-200 bg-teal-50'
                                                : isExamFailed || isRejected
                                                  ? 'border border-red-200 bg-red-50'
                                                  : isExamTaken
                                                    ? 'border border-purple-200 bg-purple-50'
                                                    : isForExam
                                                      ? 'border border-blue-200 bg-blue-50'
                                                      : isForRevision
                                                        ? 'border border-yellow-200 bg-yellow-50'
                                                        : 'border border-yellow-200 bg-yellow-50'
                                    }`}
                                >
                                    {isEnrolled && <CheckCircle2 className="mx-auto h-10 w-10 text-blue-600" />}
                                    {isExamPassed && <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" />}
                                    {isPendingEnrollment && <CalendarCheck className="mx-auto h-10 w-10 text-teal-600" />}
                                    {(isExamFailed || isRejected) && <XCircle className="mx-auto h-10 w-10 text-red-500" />}
                                    {isExamTaken && <CalendarCheck className="mx-auto h-10 w-10 text-purple-600" />}
                                    {isForExam && <CheckCircle2 className="mx-auto h-10 w-10 text-blue-600" />}
                                    {isForRevision && <AlertCircle className="mx-auto h-10 w-10 text-yellow-500" />}
                                    {!isEnrolled &&
                                        !isExamPassed &&
                                        !isPendingEnrollment &&
                                        !isExamFailed &&
                                        !isRejected &&
                                        !isExamTaken &&
                                        !isForExam &&
                                        !isForRevision && <Clock className="mx-auto h-10 w-10 text-yellow-500" />}
                                    <p
                                        className={`mt-2 text-lg font-bold ${
                                            isEnrolled
                                                ? 'text-blue-700'
                                                : isExamPassed
                                                  ? 'text-emerald-700'
                                                  : isPendingEnrollment
                                                    ? 'text-teal-700'
                                                    : isExamFailed || isRejected
                                                      ? 'text-red-700'
                                                      : isExamTaken
                                                        ? 'text-purple-700'
                                                        : isForExam
                                                          ? 'text-blue-700'
                                                          : 'text-yellow-700'
                                        }`}
                                    >
                                        {isPendingEnrollment ? 'Enrollment Open' : application?.application_status ?? 'Pending'}
                                    </p>
                                    <p
                                        className={`text-xs ${
                                            isEnrolled
                                                ? 'text-blue-600'
                                                : isExamPassed
                                                  ? 'text-emerald-600'
                                                  : isPendingEnrollment
                                                    ? 'text-teal-600'
                                                    : isExamFailed || isRejected
                                                      ? 'text-red-600'
                                                      : isExamTaken
                                                        ? 'text-purple-600'
                                                        : isForExam
                                                          ? 'text-blue-600'
                                                          : 'text-yellow-600'
                                        }`}
                                    >
                                        {statusLabel}
                                    </p>
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

                                {(examSchedule || application?.examination_date) && (
                                    <div>
                                        <p className="text-xs font-medium text-gray-500 uppercase">Examination Date</p>
                                        <p className="mt-1 font-medium text-gray-900">
                                            {new Date(examSchedule?.exam_date ?? application!.examination_date!).toLocaleDateString('en-PH', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                            })}
                                        </p>
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
