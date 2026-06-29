import { AppBadge } from '@/components/app-badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TablePagination } from '@/components/ui/table-pagination';
import { CARD, PAGE_PADDING, PAGE_TITLE, TABLE_HEADER_CELL, TABLE_ROW_ACTION } from '@/constants/ui';
import { formatScore, useExamResults, type ExamResult } from '@/hooks/useExamResults';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { ClipboardList, Mail, Pencil, RefreshCw, Upload, Users } from 'lucide-react';

interface Props {
    results: ExamResult[];
    passingPercentage: number;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Exam Results', href: '/exam-results' },
];

const TH_RIGHT = `${TABLE_HEADER_CELL.replace('text-left', 'text-right')}`;

function ResultBadge({ result }: { result: string | null }) {
    if (!result) return <span className="text-gray-400">—</span>;
    return <AppBadge status={result.toLowerCase()} />;
}

interface ExamResultRowProps {
    result: ExamResult;
    sendingId: number | null;
    onSendResult: (id: number) => void;
}

function ExamResultRow({ result: r, sendingId, onSendResult }: ExamResultRowProps) {
    return (
        <TableRow>
            <TableCell className="px-4 py-3 font-medium text-gray-700">{r.ranking ?? '—'}</TableCell>
            <TableCell className="px-4 py-3 font-mono text-sm">{r.applicant_number ?? '—'}</TableCell>
            <TableCell className="px-4 py-3">
                {r.last_name && r.first_name ? `${r.last_name}, ${r.first_name}` : '—'}
            </TableCell>
            <TableCell className="px-4 py-3 text-sm text-gray-600">
                {r.exam_date ?? '—'}
                {r.exam_time && <span className="ml-1 text-gray-400">{r.exam_time}</span>}
            </TableCell>
            <TableCell className="px-4 py-3 text-sm text-gray-600">{r.exam_venue ?? '—'}</TableCell>
            <TableCell className="px-4 py-3 text-right text-sm">{formatScore(r.math_score)}</TableCell>
            <TableCell className="px-4 py-3 text-right text-sm">{formatScore(r.english_score)}</TableCell>
            <TableCell className="px-4 py-3 text-right text-sm">{formatScore(r.science_score)}</TableCell>
            <TableCell className="px-4 py-3 text-right font-medium">{formatScore(r.total_score)}</TableCell>
            <TableCell className="px-4 py-3 text-right font-medium">{formatScore(r.percentage_score)}</TableCell>
            <TableCell className="px-4 py-3">
                <ResultBadge result={r.result} />
            </TableCell>
            <TableCell className="px-4 py-3">
                {r.application_status ? (
                    <span className={`inline-flex w-fit items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        r.application_status === 'Exam Passed'
                            ? 'bg-green-100 text-green-800'
                            : r.application_status === 'Exam Failed'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-700'
                    }`}>
                        {r.application_status}
                    </span>
                ) : (
                    <span className="text-xs text-gray-400">—</span>
                )}
            </TableCell>
            <TableCell className="px-4 py-3">
                <button
                    onClick={() => onSendResult(r.id)}
                    disabled={sendingId === r.id}
                    title={r.result_sent_at ? `Sent on ${new Date(r.result_sent_at).toLocaleDateString()}` : undefined}
                    className={`${TABLE_ROW_ACTION} disabled:opacity-50`}
                >
                    <Mail className="h-3 w-3" />
                    {sendingId === r.id ? 'Sending…' : r.result_sent_at ? 'Resend' : 'Send'}
                </button>
            </TableCell>
        </TableRow>
    );
}

export default function Index({ results, passingPercentage }: Props) {
    const {
        search, setSearch,
        currentPage, setCurrentPage,
        pageSize, setPageSize,
        thresholdOpen, setThresholdOpen,
        updating,
        sendAllOpen, setSendAllOpen,
        sendingId,
        sendingAll,
        thresholdForm,
        sentCount,
        unsentCount,
        filtered,
        paginated,
        handleUpdate,
        handleSendResult,
        handleSendAll,
        handleSendAllClick,
        handleSaveThreshold,
        openThresholdDialog,
    } = useExamResults(results, passingPercentage);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Exam Results" />

            <div className={PAGE_PADDING}>
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <ClipboardList className="h-7 w-7 text-primary" />
                        <div>
                            <h1 className={PAGE_TITLE}>Exam Results</h1>
                            <p className="text-sm text-gray-500">{results.length} record(s) total</p>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button
                            variant="outline"
                            className="gap-2"
                            onClick={handleUpdate}
                            disabled={updating || results.length === 0}
                        >
                            <RefreshCw className={`h-4 w-4 ${updating ? 'animate-spin' : ''}`} />
                            {updating ? 'Updating…' : 'Update Results'}
                        </Button>
                        <Button
                            variant="outline"
                            className="gap-2"
                            onClick={handleSendAllClick}
                            disabled={sendingAll || results.length === 0}
                        >
                            <Mail className="h-4 w-4" />
                            {sendingAll ? 'Sending…' : 'Send All Results'}
                        </Button>
                        <Link href="/exam-results/upload">
                            <Button className="gap-2">
                                <Upload className="h-4 w-4" />
                                Upload Results
                            </Button>
                        </Link>
                    </div>
                </div>

                <div className="mb-4 flex items-center gap-2">
                    <span className="text-sm text-gray-500">Passing threshold:</span>
                    <button
                        onClick={openThresholdDialog}
                        className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-sm font-medium text-gray-700 transition-colors hover:border-primary hover:text-primary"
                    >
                        {passingPercentage}%
                        <Pencil className="h-3 w-3" />
                    </button>
                </div>

                <div className="mb-4">
                    <Input
                        placeholder="Search by applicant number or name…"
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                        className="max-w-sm"
                    />
                </div>

                <div className={`overflow-hidden ${CARD}`}>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-gray-50">
                                    <TableHead className={TABLE_HEADER_CELL}>Rank</TableHead>
                                    <TableHead className={TABLE_HEADER_CELL}>App. No.</TableHead>
                                    <TableHead className={TABLE_HEADER_CELL}>Name</TableHead>
                                    <TableHead className={TABLE_HEADER_CELL}>Exam Date</TableHead>
                                    <TableHead className={TABLE_HEADER_CELL}>Venue</TableHead>
                                    <TableHead className={TH_RIGHT}>Math</TableHead>
                                    <TableHead className={TH_RIGHT}>English</TableHead>
                                    <TableHead className={TH_RIGHT}>Science</TableHead>
                                    <TableHead className={TH_RIGHT}>Total</TableHead>
                                    <TableHead className={TH_RIGHT}>%</TableHead>
                                    <TableHead className={TABLE_HEADER_CELL}>Result</TableHead>
                                    <TableHead className={TABLE_HEADER_CELL}>Portal Status</TableHead>
                                    <TableHead className={TABLE_HEADER_CELL}>Email</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paginated.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={13} className="py-16 text-center">
                                            <Users className="mx-auto h-10 w-10 text-gray-300" />
                                            <p className="mt-3 text-sm text-gray-400">No exam results found.</p>
                                        </TableCell>
                                    </TableRow>
                                ) : paginated.map((r) => (
                                    <ExamResultRow
                                        key={r.id}
                                        result={r}
                                        sendingId={sendingId}
                                        onSendResult={handleSendResult}
                                    />
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                    {filtered.length > 0 && (
                        <TablePagination
                            total={filtered.length}
                            pageSize={pageSize}
                            currentPage={currentPage}
                            onPageChange={setCurrentPage}
                            onPageSizeChange={(s) => { setPageSize(s); setCurrentPage(1); }}
                        />
                    )}
                </div>
            </div>

            <Dialog open={sendAllOpen} onOpenChange={setSendAllOpen}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Send All Results</DialogTitle>
                    </DialogHeader>
                    <div className="py-2 text-sm text-gray-700">
                        <p>
                            <span className="font-semibold">{sentCount}</span> applicant(s) have already received their results.
                            <br />
                            <span className="font-semibold">{unsentCount}</span> applicant(s) have not yet been notified.
                        </p>
                        <p className="mt-3">How would you like to proceed?</p>
                    </div>
                    <DialogFooter className="flex-col gap-2 sm:flex-row">
                        <Button variant="outline" onClick={() => setSendAllOpen(false)} disabled={sendingAll}>
                            Cancel
                        </Button>
                        <Button variant="outline" onClick={() => handleSendAll('new')} disabled={sendingAll || unsentCount === 0}>
                            {sendingAll ? 'Sending…' : `Send to New (${unsentCount})`}
                        </Button>
                        <Button onClick={() => handleSendAll('all')} disabled={sendingAll}>
                            {sendingAll ? 'Sending…' : `Resend to All (${results.length})`}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={thresholdOpen} onOpenChange={setThresholdOpen}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Passing Threshold</DialogTitle>
                    </DialogHeader>
                    <div className="py-2">
                        <Label htmlFor="passing-pct" className="mb-2 block text-sm">
                            Minimum percentage score to pass (0–100)
                        </Label>
                        <Input
                            id="passing-pct"
                            type="number"
                            min={0}
                            max={100}
                            step={0.01}
                            value={thresholdForm.data.passing_percentage}
                            onChange={(e) => thresholdForm.setData('passing_percentage', parseFloat(e.target.value))}
                        />
                        {thresholdForm.errors.passing_percentage && (
                            <p className="mt-1 text-sm text-red-600">{thresholdForm.errors.passing_percentage}</p>
                        )}
                        <p className="mt-2 text-xs text-gray-500">
                            This affects new uploads only. Re-upload existing results to recalculate.
                        </p>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setThresholdOpen(false)}>Cancel</Button>
                        <Button onClick={handleSaveThreshold} disabled={thresholdForm.processing}>
                            {thresholdForm.processing ? 'Saving…' : 'Save'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
