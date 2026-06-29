import { usePage } from '@inertiajs/react';
import { useState } from 'react';

interface Application {
    application_status: string;
}

interface ExamSchedule {
    exam_date: string | null;
    status: string;
}

interface Params {
    application: Application | null;
    examSchedule: ExamSchedule | null;
}

export function useApplicantDashboard({ application, examSchedule }: Params) {
    const { currentSemester } = usePage<{
        currentSemester?: { name: string | null; school_year: string | null };
    }>().props;

    const [openIds, setOpenIds] = useState<Set<number>>(new Set());

    const toggleAnnouncement = (id: number) => {
        setOpenIds((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const isForExam = application?.application_status === 'For Exam';
    const isExamTaken = application?.application_status === 'Exam Taken';
    const isExamPassed = application?.application_status === 'Exam Passed';
    const isExamFailed = application?.application_status === 'Exam Failed';
    const isForRevision = application?.application_status === 'For Revision';
    const isRejected = application?.application_status === 'Rejected';
    const isEnrolled = application?.application_status === 'Enrolled';
    const isPendingEnrollment = application?.application_status === 'Pending Enrollment';
    const hasEvaluation =
        isForExam || isExamTaken || isExamPassed || isExamFailed || isForRevision || isRejected || isEnrolled || isPendingEnrollment;

    const statusLabel = (() => {
        if (isForExam) return examSchedule ? 'Approved — your exam schedule has been set.' : 'Approved — awaiting exam schedule.';
        if (isExamTaken) return 'Exam completed — awaiting results.';
        if (isExamPassed) return 'Congratulations on passing the exam. Please wait for the enrollment schedule.';
        if (isPendingEnrollment) return 'Enrollment is open — please proceed with your enrollment.';
        if (isExamFailed) return 'Unfortunately, you did not pass the exam this cycle.';
        if (isForRevision) return 'Please review the feedback above.';
        if (isRejected) return 'Application not accepted this cycle.';
        if (isEnrolled) return 'You are officially enrolled!';
        return 'Your application is under review.';
    })();

    return {
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
    };
}
