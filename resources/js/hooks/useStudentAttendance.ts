import { router } from '@inertiajs/react';
import { useState } from 'react';

export interface AttendanceRecord {
    id: number;
    subject_code: string | null;
    subject_name: string | null;
    date: string;
    status: 'Absent' | 'Late';
    remarks: string | null;
    reason: string | null;
}

/** Manage inline editing of the attendance reason field for a student's absence or late record. */
export function useStudentAttendance() {
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editValue, setEditValue] = useState('');
    const [saving, setSaving] = useState(false);

    const startEdit = (record: AttendanceRecord) => {
        setEditingId(record.id);
        setEditValue(record.reason ?? '');
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditValue('');
    };

    const saveReason = (id: number) => {
        setSaving(true);
        router.patch(
            route('student.attendance.reason', { attendance: id }),
            { reason: editValue.trim() || null },
            {
                preserveScroll: true,
                onSuccess: () => { setEditingId(null); setEditValue(''); },
                onFinish: () => setSaving(false),
            },
        );
    };

    return { editingId, editValue, setEditValue, saving, startEdit, cancelEdit, saveReason };
}
