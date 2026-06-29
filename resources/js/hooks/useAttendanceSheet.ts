import { type BreadcrumbItem } from '@/types';
import { router } from '@inertiajs/react';
import { useCallback, useMemo, useState } from 'react';

export interface StudentRow {
    enrollment_id: number;
    student_id: number;
    student_id_number: string;
    last_name: string;
    first_name: string;
    middle_name: string | null;
    status: string | null;
    remarks: string;
    attendance_id: number | null;
}

export interface SubjectOption {
    id: number;
    code: string;
    name: string;
}

export interface BlockSection {
    id: number;
    code: string;
    name: string;
    grade_level: string | null;
    strand: string | null;
    school_year: string | null;
    semester: string | null;
    adviser: string | null;
}

export type AttendanceChange = {
    student_enrollment_id: number;
    status: string;
    remarks: string;
};

interface Params {
    blockSection: BlockSection;
    students: StudentRow[];
    selectedDate: string;
    selectedSubjectId: number;
}

export function useAttendanceSheet({ blockSection, students, selectedDate, selectedSubjectId }: Params) {
    const [changes, setChanges] = useState<Map<number, AttendanceChange>>(new Map());
    const [saving, setSaving] = useState(false);
    const [missedOpen, setMissedOpen] = useState(false);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Attendance', href: '/attendance' },
        { title: blockSection.code, href: `/attendance/${blockSection.id}` },
    ];

    const getCurrentValue = useCallback(
        (student: StudentRow): { status: string | null; remarks: string } => {
            const change = changes.get(student.enrollment_id);
            if (change) return { status: change.status, remarks: change.remarks };
            return { status: student.status, remarks: student.remarks };
        },
        [changes],
    );

    const handleStatusChange = useCallback((enrollmentId: number, student: StudentRow, status: string) => {
        setChanges((prev) => {
            const next = new Map(prev);
            const existing = next.get(enrollmentId);
            next.set(enrollmentId, {
                student_enrollment_id: enrollmentId,
                status,
                remarks: existing?.remarks ?? student.remarks ?? '',
            });
            return next;
        });
    }, []);

    const handleRemarksChange = useCallback((enrollmentId: number, student: StudentRow, remarks: string) => {
        setChanges((prev) => {
            const next = new Map(prev);
            const existing = next.get(enrollmentId);
            next.set(enrollmentId, {
                student_enrollment_id: enrollmentId,
                status: existing?.status ?? student.status ?? 'Present',
                remarks,
            });
            return next;
        });
    }, []);

    const markAllAs = useCallback(
        (status: string) => {
            setChanges((prev) => {
                const next = new Map(prev);
                for (const student of students) {
                    const existing = next.get(student.enrollment_id);
                    next.set(student.enrollment_id, {
                        student_enrollment_id: student.enrollment_id,
                        status,
                        remarks: existing?.remarks ?? student.remarks ?? '',
                    });
                }
                return next;
            });
        },
        [students],
    );

    const liveStats = useMemo(() => {
        let present = 0, absent = 0, late = 0, excused = 0, marked = 0;
        for (const student of students) {
            const { status } = getCurrentValue(student);
            if (status) {
                marked++;
                if (status === 'Present') present++;
                else if (status === 'Absent') absent++;
                else if (status === 'Late') late++;
                else if (status === 'Excused') excused++;
            }
        }
        return {
            total_students: students.length,
            marked_count: marked,
            present_count: present,
            absent_count: absent,
            late_count: late,
            excused_count: excused,
            attendance_rate: marked > 0 ? Math.round(((present + late) / marked) * 1000) / 10 : null,
        };
    }, [students, getCurrentValue]);

    const hasChanges = changes.size > 0;

    const handleSubjectChange = (subjectId: string) => {
        router.get(`/attendance/${blockSection.id}`, { date: selectedDate, subject_id: subjectId }, { preserveState: false });
    };

    const handleDateChange = (date: string) => {
        router.get(`/attendance/${blockSection.id}`, { date, subject_id: selectedSubjectId }, { preserveState: false });
    };

    const handleSave = () => {
        if (!hasChanges) return;
        setSaving(true);
        router.post(
            `/attendance/${blockSection.id}`,
            { date: selectedDate, subject_id: selectedSubjectId, attendance: Array.from(changes.values()) },
            {
                preserveScroll: true,
                onFinish: () => {
                    setSaving(false);
                    setChanges(new Map());
                },
            },
        );
    };

    const discardChanges = () => setChanges(new Map());

    return {
        changes,
        saving,
        missedOpen,
        setMissedOpen,
        breadcrumbs,
        getCurrentValue,
        handleStatusChange,
        handleRemarksChange,
        markAllAs,
        liveStats,
        hasChanges,
        handleSubjectChange,
        handleDateChange,
        handleSave,
        discardChanges,
    };
}
