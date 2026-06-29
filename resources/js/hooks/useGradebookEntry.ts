import { router } from '@inertiajs/react';
import { useCallback, useMemo, useState } from 'react';

export interface GradeComponent {
    id: number;
    name: string;
    hps: number;
    weight: number;
    order: number;
}

export interface StudentRow {
    enrollment_id: number;
    enrollment_subject_id: number;
    student_id_number: string | null;
    last_name: string | null;
    first_name: string | null;
    middle_name: string | null;
    grade: number | null;
    grade_status: string | null;
    scores: Record<number, number | null>;
    absences: number;
    tardies: number;
}

export interface BlockSectionData {
    id: number;
    code: string;
    name: string;
    school_year: string | null;
}

export interface SubjectData {
    id: number;
    code: string;
    name: string;
}

interface Params {
    blockSection: BlockSectionData;
    subject: SubjectData;
    quarter: string;
    components: GradeComponent[];
    students: StudentRow[];
    weightTotal: number;
    validationStatus: 'draft' | 'submitted' | 'finalized';
    validationId: number | null;
}

function computeGrade(scores: Record<number, string>, components: GradeComponent[], weightTotal: number): { ps: number | null; eg: number | null } {
    if (components.length === 0 || weightTotal === 0) return { ps: null, eg: null };

    let weightedSum = 0;
    let hasAny = false;

    for (const comp of components) {
        const raw = scores[comp.id];
        if (raw === '' || raw === undefined || raw === null) continue;
        const val = parseFloat(raw as unknown as string);
        if (isNaN(val)) continue;
        hasAny = true;
        const pct = comp.hps > 0 ? (val / comp.hps) * 100 : 0;
        weightedSum += pct * (comp.weight / weightTotal);
    }

    if (!hasAny) return { ps: null, eg: null };

    const ps = weightedSum;
    const eg = Math.min(100, Math.max(60, ps * 0.5 + 50));
    return { ps: Math.round(ps * 100) / 100, eg: Math.round(eg * 100) / 100 };
}

export function useGradebookEntry({ blockSection, subject, quarter, components, students, weightTotal, validationStatus, validationId }: Params) {
    const breadcrumbs = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Gradebook', href: '/gradebook' },
        { title: blockSection.code, href: `/gradebook/${blockSection.id}` },
        { title: `${subject.code} ${quarter} Entry`, href: '' },
    ];

    const [localScores, setLocalScores] = useState<Record<number, Record<number, string>>>(() => {
        const init: Record<number, Record<number, string>> = {};
        for (const student of students) {
            init[student.enrollment_subject_id] = {};
            for (const comp of components) {
                const v = student.scores[comp.id];
                init[student.enrollment_subject_id][comp.id] = v === null || v === undefined ? '' : String(v);
            }
        }
        return init;
    });

    const [saving, setSaving] = useState(false);
    const [savedAt, setSavedAt] = useState<Date | null>(null);
    const [dirtyRows, setDirtyRows] = useState<Set<number>>(new Set());
    const [submitting, setSubmitting] = useState(false);
    const [finalizing, setFinalizing] = useState(false);
    const [showRejectInput, setShowRejectInput] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [rejecting, setRejecting] = useState(false);

    const isLocked = validationStatus === 'submitted' || validationStatus === 'finalized';
    const weightOk = Math.abs(weightTotal - 100) < 0.01;

    const updateScore = useCallback((esId: number, componentId: number, value: string) => {
        setLocalScores((prev) => ({ ...prev, [esId]: { ...prev[esId], [componentId]: value } }));
        setDirtyRows((prev) => new Set(prev).add(esId));
    }, []);

    const saveAll = useCallback(() => {
        setSaving(true);
        const payload: Record<number, Record<number, number | null>> = {};
        for (const [esId, compScores] of Object.entries(localScores)) {
            payload[Number(esId)] = {};
            for (const [compId, val] of Object.entries(compScores)) {
                payload[Number(esId)][Number(compId)] = val === '' ? null : parseFloat(val);
            }
        }
        router.put(
            `/gradebook/${blockSection.id}/${subject.id}/${quarter}/scores`,
            { scores: payload },
            {
                preserveScroll: true,
                onSuccess: () => { setSavedAt(new Date()); setDirtyRows(new Set()); },
                onFinish: () => setSaving(false),
            },
        );
    }, [localScores, blockSection.id, subject.id, quarter]);

    const submitForValidation = useCallback(() => {
        setSubmitting(true);
        router.post(
            `/gradebook/${blockSection.id}/${subject.id}/${quarter}/submit`,
            {},
            { preserveScroll: true, onFinish: () => setSubmitting(false) },
        );
    }, [blockSection.id, subject.id, quarter]);

    const finalizeGrades = useCallback(() => {
        if (!validationId) return;
        setFinalizing(true);
        router.post(
            `/grade-validations/${validationId}/finalize`,
            {},
            { preserveScroll: true, onFinish: () => setFinalizing(false) },
        );
    }, [validationId]);

    const rejectGrades = useCallback(() => {
        if (!validationId || !rejectReason.trim()) return;
        setRejecting(true);
        router.post(
            `/grade-validations/${validationId}/reject`,
            { rejection_reason: rejectReason },
            {
                preserveScroll: true,
                onSuccess: () => { setShowRejectInput(false); setRejectReason(''); },
                onFinish: () => setRejecting(false),
            },
        );
    }, [validationId, rejectReason]);

    const computedRows = useMemo(
        () => students.map((student) => computeGrade(localScores[student.enrollment_subject_id] ?? {}, components, weightTotal)),
        [localScores, students, components, weightTotal],
    );

    return {
        breadcrumbs,
        localScores,
        saving, savedAt,
        dirtyRows,
        submitting, finalizing,
        showRejectInput, setShowRejectInput,
        rejectReason, setRejectReason,
        rejecting,
        isLocked,
        weightOk,
        computedRows,
        updateScore,
        saveAll,
        submitForValidation,
        finalizeGrades,
        rejectGrades,
    };
}
