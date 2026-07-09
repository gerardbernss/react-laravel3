import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { BODY_TEXT, CARD, PAGE_PADDING, PAGE_TITLE, SECTION_HEADING } from '@/constants/ui';
import { useExamResultsUpload } from '@/hooks/useExamResultsUpload';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { AlertTriangle, ArrowLeft, FileText, Upload } from 'lucide-react';

interface Conflict {
    applicant_number: string;
    name: string;
}

interface Props {
    importConflicts?: Conflict[] | null;
    importWarning?: string | null;
    hasPending?: boolean;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Exam Results', href: '/admin/exam-results' },
    { title: 'Upload', href: '/admin/exam-results/upload' },
];

const SAMPLE_HEADERS = [
    'applicant_number',
    'applicant_personal_data_id',
    'exam_date',
    'exam_time',
    'exam_venue',
    'math_score',
    'english_score',
    'science_score',
    'total_score',
    'percentage_score',
];

function downloadSample() {
    const csv = SAMPLE_HEADERS.join(',') + '\n';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'exam_results_template.csv';
    a.click();
    URL.revokeObjectURL(url);
}

export default function UploadExamResults({ importConflicts, importWarning, hasPending }: Props) {
    const { data, setData, processing, errors, inputRef, conflictOpen, confirming, handleSubmit, handleConfirm, handleCancelConflict } =
        useExamResultsUpload({ importConflicts });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Upload Exam Results" />

            <div className={PAGE_PADDING}>
                <div className="mb-6">
                    <Link href="/admin/exam-results" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900">
                        <ArrowLeft className="mr-1 h-4 w-4" />
                        Back to Exam Results
                    </Link>

                    <div className="mt-3 flex items-center gap-3">
                        <Upload className="h-7 w-7 text-primary" />
                        <h1 className={PAGE_TITLE}>Upload Exam Results</h1>
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Upload form */}
                    <div className={`${CARD} p-6`}>
                        <h2 className={`mb-4 ${SECTION_HEADING}`}>Select CSV File</h2>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <Label htmlFor="csv-file" className="mb-2 block">
                                    CSV File <span className="text-red-500">*</span>
                                </Label>

                                <div
                                    className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 px-6 py-10 transition hover:border-primary hover:bg-primary/5"
                                    onClick={() => inputRef.current?.click()}
                                >
                                    <FileText className="mb-3 h-10 w-10 text-gray-400" />
                                    {data.file ? (
                                        <p className="text-sm font-medium text-gray-900">{data.file.name}</p>
                                    ) : (
                                        <>
                                            <p className="text-sm font-medium text-gray-700">Click to choose a CSV file</p>
                                            <p className="mt-1 text-xs text-gray-400">or drag and drop here</p>
                                        </>
                                    )}
                                </div>

                                <input
                                    ref={inputRef}
                                    id="csv-file"
                                    type="file"
                                    accept=".csv,text/csv"
                                    className="hidden"
                                    onChange={(e) => setData('file', e.target.files?.[0] ?? null)}
                                />

                                {errors.file && (
                                    <p className="mt-1 text-sm text-red-600">{errors.file}</p>
                                )}
                            </div>

                            <div className="flex gap-3">
                                <Button type="submit" disabled={processing || !data.file} className="gap-2">
                                    <Upload className="h-4 w-4" />
                                    {processing ? 'Uploading…' : 'Upload Results'}
                                </Button>
                                <Button type="button" variant="outline" onClick={downloadSample} className="gap-2">
                                    <FileText className="h-4 w-4" />
                                    Download Template
                                </Button>
                            </div>
                        </form>
                    </div>

                    {/* Instructions */}
                    <div className={`${CARD} p-6`}>
                        <h2 className={`mb-4 ${SECTION_HEADING}`}>CSV Format</h2>
                        <p className={`mb-3 ${BODY_TEXT}`}>
                            The CSV file must have the following column headers in the first row (order does not matter):
                        </p>
                        <ul className="space-y-1">
                            {SAMPLE_HEADERS.map((h) => (
                                <li key={h} className="flex items-center gap-2 text-sm">
                                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                                    <code className="rounded bg-gray-100 px-1 py-0.5 text-xs">{h}</code>
                                </li>
                            ))}
                        </ul>
                        <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                            <strong>Note:</strong> Each row is matched to an applicant via{' '}
                            <code>applicant_number</code> or <code>applicant_personal_data_id</code>.
                            Rows where no matching applicant is found will be skipped.
                            Re-uploading the same applicant's result will overwrite the previous record.
                            <br />
                            <strong>Result</strong> (Passed/Failed) and <strong>ranking</strong> are
                            computed automatically by the system — do not include them in the CSV.
                        </div>
                    </div>
                </div>
            </div>

            {/* Conflict Dialog */}
            <Dialog open={conflictOpen} onOpenChange={(open) => { if (!open) handleCancelConflict(); }}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-amber-500" />
                            Duplicate Records Found
                        </DialogTitle>
                    </DialogHeader>

                    <div className="py-2 text-sm text-gray-700">
                        <p className="mb-3">
                            The following applicants already have exam results on record. Do you want to
                            overwrite them with the new data, or keep the existing records?
                        </p>

                        <ul className="mb-3 max-h-48 space-y-1 overflow-y-auto rounded-md border bg-gray-50 p-3">
                            {(importConflicts ?? []).map((c, i) => (
                                <li key={i} className="flex items-center gap-2 text-sm">
                                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                                    <span className="font-medium">{c.name}</span>
                                    {c.applicant_number && (
                                        <span className="text-xs text-gray-500">({c.applicant_number})</span>
                                    )}
                                </li>
                            ))}
                        </ul>

                        {importWarning && (
                            <p className="text-xs text-gray-500 italic">{importWarning}</p>
                        )}
                    </div>

                    <DialogFooter className="flex-col gap-2 sm:flex-row">
                        <Button variant="outline" onClick={handleCancelConflict} disabled={confirming}>
                            Cancel
                        </Button>
                        <Button variant="outline" onClick={() => handleConfirm(false)} disabled={confirming}>
                            {confirming ? 'Processing…' : 'Keep Existing'}
                        </Button>
                        <Button onClick={() => handleConfirm(true)} disabled={confirming}>
                            {confirming ? 'Processing…' : 'Overwrite All'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
