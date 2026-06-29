import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { BODY_TEXT, CARD, SECTION_HEADING } from '@/constants/ui';
import { type BlockSectionData, type GradeComponent, type StudentRow, type SubjectData, useGradebookEntry } from '@/hooks/useGradebookEntry';
import AppLayout from '@/layouts/app-layout';
import { Head, Link } from '@inertiajs/react';
import { AlertCircle, ArrowLeft, CheckCircle, Printer, Save, Settings, XCircle } from 'lucide-react';

interface Props {
    blockSection: BlockSectionData;
    subject: SubjectData;
    quarter: string;
    components: GradeComponent[];
    students: StudentRow[];
    weightTotal: number;
    validationStatus: 'draft' | 'submitted' | 'finalized';
    validationId: number | null;
    canSubmit: boolean;
    canFinalize: boolean;
}

export default function GradebookEntry({ blockSection, subject, quarter, components, students, weightTotal, validationStatus, validationId, canSubmit, canFinalize }: Props) {
    const {
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
    } = useGradebookEntry({ blockSection, subject, quarter, components, students, weightTotal, validationStatus, validationId });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Score Entry — ${subject.code} ${quarter}`} />

            <div className="flex h-full flex-col">
                <div className="sticky top-0 z-10 border-b bg-white px-6 py-3 shadow-sm">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <Link href={`/gradebook/${blockSection.id}`} className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700">
                                <ArrowLeft className="mr-1 h-4 w-4" />
                                Back
                            </Link>
                            <div>
                                <span className="font-semibold text-gray-900">
                                    {subject.code} — {quarter}
                                </span>
                                <span className="ml-2 text-sm text-gray-500">
                                    {blockSection.code} · {blockSection.school_year}
                                </span>
                            </div>
                            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">{quarter}</span>
                        </div>

                        <div className="flex items-center gap-3">
                            {dirtyRows.size > 0 && !isLocked && (
                                <span className="text-xs text-amber-600">
                                    {dirtyRows.size} unsaved row{dirtyRows.size !== 1 ? 's' : ''}
                                </span>
                            )}
                            {savedAt && dirtyRows.size === 0 && !isLocked && (
                                <span className="flex items-center gap-1 text-xs text-green-600">
                                    <CheckCircle className="h-3 w-3" />
                                    Saved {savedAt.toLocaleTimeString()}
                                </span>
                            )}
                            {validationStatus === 'submitted' && (
                                <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-semibold text-yellow-800">Submitted</span>
                            )}
                            {validationStatus === 'finalized' && (
                                <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-800">Finalized</span>
                            )}

                            {!isLocked && (
                                <Link href={`/gradebook/${blockSection.id}/${subject.id}/${quarter}/components`}>
                                    <Button variant="outline" size="sm">
                                        <Settings className="mr-1 h-4 w-4" />
                                        Components
                                    </Button>
                                </Link>
                            )}
                            {!isLocked && (
                                <Button onClick={saveAll} disabled={saving || dirtyRows.size === 0} size="sm">
                                    <Save className="mr-1 h-4 w-4" />
                                    {saving ? 'Saving…' : 'Save All'}
                                </Button>
                            )}
                            {canSubmit && validationStatus === 'draft' && (
                                <Button
                                    onClick={submitForValidation}
                                    disabled={submitting}
                                    size="sm"
                                    variant="outline"
                                    className="border-blue-400 text-blue-700 hover:bg-blue-50"
                                >
                                    {submitting ? 'Submitting…' : 'Submit for Validation'}
                                </Button>
                            )}
                            {canFinalize && validationStatus === 'submitted' && validationId && (
                                <>
                                    <Button onClick={finalizeGrades} disabled={finalizing} size="sm" className="bg-green-600 text-white hover:bg-green-700">
                                        <CheckCircle className="mr-1 h-3.5 w-3.5" />
                                        {finalizing ? 'Finalizing…' : 'Finalize'}
                                    </Button>
                                    <Button
                                        onClick={() => setShowRejectInput((v) => !v)}
                                        size="sm"
                                        variant="outline"
                                        className="border-red-400 text-red-600 hover:bg-red-50"
                                    >
                                        <XCircle className="mr-1 h-3.5 w-3.5" />
                                        Reject
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>

                    {isLocked && (
                        <div className="mt-2 flex items-center gap-2 rounded bg-blue-50 px-2 py-1 text-xs text-blue-700">
                            <AlertCircle className="h-3 w-3" />
                            {validationStatus === 'finalized'
                                ? 'Grades are finalized and locked. No further edits allowed.'
                                : 'Grades have been submitted for validation. Editing is disabled until rejected.'}
                        </div>
                    )}
                    {!weightOk && !isLocked && (
                        <div className="mt-2 flex items-center gap-2 text-xs text-amber-700">
                            <AlertCircle className="h-3 w-3" />
                            Component weights sum to {weightTotal.toFixed(2)}% — grades may be inaccurate until they sum to 100%.
                        </div>
                    )}
                </div>

                <div className="flex-1 overflow-auto p-6">
                    {components.length === 0 ? (
                        <div className={`${CARD} p-12 text-center`}>
                            <Settings className="mx-auto h-12 w-12 text-gray-400" />
                            <h3 className={`mt-4 ${SECTION_HEADING}`}>No components set up yet</h3>
                            <p className={`mt-2 ${BODY_TEXT}`}>
                                Define grading components (Written Work, Performance Task, Quarterly Assessment) before entering scores.
                            </p>
                            <Link href={`/gradebook/${blockSection.id}/${subject.id}/${quarter}/components`} className="mt-4 inline-block">
                                <Button>Set Up Components →</Button>
                            </Link>
                        </div>
                    ) : students.length === 0 ? (
                        <div className={`${CARD} p-12 text-center`}>
                            <h3 className={SECTION_HEADING}>No students enrolled in this subject</h3>
                        </div>
                    ) : (
                        <div className={`overflow-hidden ${CARD}`}>
                            <div className="max-h-[70vh] overflow-x-auto overflow-y-auto">
                                <table className="w-full text-sm">
                                    <thead className="sticky top-0 z-10 bg-gray-50">
                                        <tr>
                                            <th className="sticky left-0 z-10 min-w-[200px] whitespace-nowrap bg-gray-50 px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 shadow-[2px_0_4px_rgba(0,0,0,0.06)]">
                                                Student
                                            </th>
                                            <th className="min-w-[70px] px-3 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500" title="Absences">
                                                Abs
                                            </th>
                                            <th className="min-w-[70px] px-3 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500" title="Tardies">
                                                Tardy
                                            </th>
                                            {components.map((comp) => (
                                                <th key={comp.id} className="min-w-[110px] px-3 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                                                    <div>{comp.name}</div>
                                                    <div className="font-normal normal-case text-gray-400">
                                                        HPS: {comp.hps} · {comp.weight}%
                                                    </div>
                                                </th>
                                            ))}
                                            <th className="min-w-[80px] px-3 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">PS%</th>
                                            <th className="min-w-[80px] px-3 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">Grade (EG)</th>
                                            <th className="min-w-[80px] px-3 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">Remarks</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {students.map((student, idx) => {
                                            const isDirty = dirtyRows.has(student.enrollment_subject_id);
                                            const { ps, eg } = computedRows[idx];
                                            const passed = eg !== null && eg >= 75;

                                            return (
                                                <tr
                                                    key={student.enrollment_subject_id}
                                                    className={`transition-colors ${isDirty ? 'bg-amber-50' : 'hover:bg-gray-50'}`}
                                                >
                                                    <td className="sticky left-0 z-10 bg-inherit px-3 py-2 shadow-[2px_0_4px_rgba(0,0,0,0.06)]">
                                                        <div className="whitespace-nowrap font-medium text-gray-900">
                                                            {student.last_name}, {student.first_name}
                                                            {student.middle_name && ` ${student.middle_name.charAt(0)}.`}
                                                        </div>
                                                        <div className="font-mono text-xs text-gray-400">{student.student_id_number ?? '—'}</div>
                                                        <a
                                                            href={`/reports/report-card/${student.enrollment_id}`}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="mt-0.5 inline-flex items-center gap-1 text-xs text-gray-400 hover:text-blue-600"
                                                            title="Print report card"
                                                        >
                                                            <Printer className="h-3 w-3" />
                                                            Print
                                                        </a>
                                                    </td>

                                                    <td className={`px-3 py-2 text-center text-sm font-medium ${student.absences >= 6 ? 'text-red-600' : student.absences >= 3 ? 'text-amber-600' : 'text-gray-600'}`}>
                                                        {student.absences}
                                                    </td>
                                                    <td className={`px-3 py-2 text-center text-sm font-medium ${student.tardies >= 3 ? 'text-amber-600' : 'text-gray-600'}`}>
                                                        {student.tardies}
                                                    </td>

                                                    {components.map((comp) => {
                                                        const val = localScores[student.enrollment_subject_id]?.[comp.id] ?? '';
                                                        const numVal = parseFloat(val);
                                                        const overHps = !isNaN(numVal) && numVal > comp.hps;
                                                        return (
                                                            <td key={comp.id} className="px-2 py-1 text-center">
                                                                <input
                                                                    type="number"
                                                                    min={0}
                                                                    max={comp.hps}
                                                                    step="0.01"
                                                                    value={val}
                                                                    disabled={isLocked}
                                                                    onChange={(e) => updateScore(student.enrollment_subject_id, comp.id, e.target.value)}
                                                                    className={`w-20 rounded border px-2 py-1 text-center text-sm focus:outline-none focus:ring-1 focus:ring-blue-400 ${isLocked ? 'cursor-not-allowed border-gray-200 bg-gray-50 text-gray-500' : overHps ? 'border-red-400 bg-red-50 text-red-700' : 'border-gray-300 bg-white text-gray-900'}`}
                                                                    placeholder="—"
                                                                />
                                                                {overHps && <div className="text-xs text-red-500">max {comp.hps}</div>}
                                                            </td>
                                                        );
                                                    })}

                                                    <td className="px-3 py-2 text-center font-mono text-sm text-gray-700">
                                                        {ps !== null ? `${ps.toFixed(2)}%` : '—'}
                                                    </td>
                                                    <td className={`px-3 py-2 text-center font-semibold ${eg !== null ? (passed ? 'text-green-700' : 'text-red-600') : 'text-gray-400'}`}>
                                                        {eg !== null ? eg.toFixed(2) : '—'}
                                                    </td>
                                                    <td className="px-3 py-2 text-center">
                                                        {eg !== null ? (
                                                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${passed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                                {passed ? 'Passed' : 'Failed'}
                                                            </span>
                                                        ) : (
                                                            <span className="text-xs text-gray-400">—</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <Dialog
                open={showRejectInput}
                onOpenChange={(open) => {
                    if (!open) { setShowRejectInput(false); setRejectReason(''); }
                }}
            >
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Reject Grade Submission</DialogTitle>
                    </DialogHeader>
                    <textarea
                        className="mt-2 w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-red-400"
                        rows={4}
                        placeholder="Reason for rejection…"
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        autoFocus
                    />
                    <DialogFooter>
                        <Button variant="outline" onClick={() => { setShowRejectInput(false); setRejectReason(''); }}>
                            Cancel
                        </Button>
                        <Button onClick={rejectGrades} disabled={rejecting || !rejectReason.trim()} className="bg-red-600 text-white hover:bg-red-700">
                            {rejecting ? 'Rejecting…' : 'Confirm Reject'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
