import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TablePagination } from '@/components/ui/table-pagination';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { ClipboardList, Mail, Pencil, RefreshCw, Send, Upload, Users } from 'lucide-react';
import { useMemo, useState } from 'react';

interface ExamResult {
    id: number;
    applicant_number: string | null;
    applicant_personal_data_id: number | null;
    first_name: string | null;
    last_name: string | null;
    exam_date: string | null;
    exam_time: string | null;
    exam_venue: string | null;
    math_score: string | null;
    english_score: string | null;
    science_score: string | null;
    total_score: string | null;
    percentage_score: string | null;
    result: string | null;
    ranking: string | null;
    result_sent_at: string | null;
    application_status: string | null;
}

interface Props {
    results: ExamResult[];
    passingPercentage: number;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Exam Results', href: '/exam-results' },
];

function ResultBadge({ result }: { result: string | null }) {
    if (!result) return <span className="text-gray-400">—</span>;
    if (result.toLowerCase() === 'passed') {
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Passed</Badge>;
    }
    return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Failed</Badge>;
}

export default function Index({ results, passingPercentage }: Props) {
    const [search, setSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    const [thresholdOpen, setThresholdOpen] = useState(false);
    const [updating, setUpdating] = useState(false);
    const [sendAllOpen, setSendAllOpen] = useState(false);
    const [sendingId, setSendingId] = useState<number | null>(null);
    const [sendingAll, setSendingAll] = useState(false);

    const thresholdForm = useForm({ passing_percentage: passingPercentage });

    const sentCount = useMemo(() => results.filter((r) => r.result_sent_at).length, [results]);
    const unsentCount = results.length - sentCount;

    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        if (!q) return results;
        return results.filter(
            (r) =>
                r.applicant_number?.toLowerCase().includes(q) ||
                r.first_name?.toLowerCase().includes(q) ||
                r.last_name?.toLowerCase().includes(q),
        );
    }, [results, search]);

    const paginated = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filtered.slice(start, start + pageSize);
    }, [filtered, currentPage, pageSize]);

    const formatScore = (v: string | null) => (v != null ? parseFloat(v).toFixed(2) : '—');

    const handleUpdate = () => {
        setUpdating(true);
        router.post('/exam-results/update-all', {}, {
            onFinish: () => setUpdating(false),
        });
    };

    const handleSendResult = (id: number) => {
        setSendingId(id);
        router.post(`/exam-results/${id}/send`, {}, {
            onFinish: () => setSendingId(null),
        });
    };

    const handleSendAll = (scope: 'all' | 'new') => {
        setSendingAll(true);
        router.post('/exam-results/send-all', { scope }, {
            onFinish: () => { setSendingAll(false); setSendAllOpen(false); },
        });
    };

    const handleSaveThreshold = () => {
        thresholdForm.post('/exam-results/settings', {
            onSuccess: () => setThresholdOpen(false),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Exam Results" />

            <div className="p-6 md:p-10">
                {/* Header */}
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <ClipboardList className="h-7 w-7 text-primary" />
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Exam Results</h1>
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
                            onClick={() => {
                                if (results.length === 0) return;
                                if (sentCount > 0) {
                                    setSendAllOpen(true);
                                } else {
                                    handleSendAll('new');
                                }
                            }}
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

                {/* Passing threshold chip */}
                <div className="mb-4 flex items-center gap-2">
                    <span className="text-sm text-gray-500">Passing threshold:</span>
                    <button
                        onClick={() => {
                            thresholdForm.setData('passing_percentage', passingPercentage);
                            setThresholdOpen(true);
                        }}
                        className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-sm font-medium text-gray-700 transition-colors hover:border-primary hover:text-primary"
                    >
                        {passingPercentage}%
                        <Pencil className="h-3 w-3" />
                    </button>
                </div>

                {/* Search */}
                <div className="mb-4">
                    <Input
                        placeholder="Search by applicant number or name…"
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                        className="max-w-sm"
                    />
                </div>

                {/* Table */}
                <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-gray-50">
                                    <TableHead className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-500">Rank</TableHead>
                                    <TableHead className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-500">App. No.</TableHead>
                                    <TableHead className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-500">Name</TableHead>
                                    <TableHead className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-500">Exam Date</TableHead>
                                    <TableHead className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-500">Venue</TableHead>
                                    <TableHead className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Math</TableHead>
                                    <TableHead className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">English</TableHead>
                                    <TableHead className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Science</TableHead>
                                    <TableHead className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Total</TableHead>
                                    <TableHead className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">%</TableHead>
                                    <TableHead className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-500">Result</TableHead>
                                    <TableHead className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-500">Portal Status</TableHead>
                                    <TableHead className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-500">Email</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paginated.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={13} className="py-16 text-center">
                                            <Users className="mx-auto h-10 w-10 text-gray-300" />
                                            <p className="mt-3 text-sm text-gray-400">No exam results found.</p>
                                        </TableCell>
                                    </TableRow>
                                )}
                                {paginated.map((r) => (
                                    <TableRow key={r.id}>
                                        <TableCell className="px-4 py-3 font-medium text-gray-700">{r.ranking ?? '—'}</TableCell>
                                        <TableCell className="px-4 py-3 font-mono text-sm">{r.applicant_number ?? '—'}</TableCell>
                                        <TableCell className="px-4 py-3">
                                            {r.last_name && r.first_name ? `${r.last_name}, ${r.first_name}` : '—'}
                                        </TableCell>
                                        <TableCell className="px-4 py-3 text-sm text-gray-600">
                                            {r.exam_date ?? '—'}
                                            {r.exam_time ? <span className="ml-1 text-gray-400">{r.exam_time}</span> : null}
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
                                            {r.result_sent_at ? (
                                                <button
                                                    onClick={() => handleSendResult(r.id)}
                                                    disabled={sendingId === r.id}
                                                    title={`Sent on ${new Date(r.result_sent_at!).toLocaleDateString()}`}
                                                    className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs hover:bg-muted disabled:opacity-50"
                                                >
                                                    <Mail className="h-3 w-3" />
                                                    {sendingId === r.id ? 'Sending…' : 'Resend'}
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handleSendResult(r.id)}
                                                    disabled={sendingId === r.id}
                                                    className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs hover:bg-muted disabled:opacity-50"
                                                >
                                                    <Mail className="h-3 w-3" />
                                                    {sendingId === r.id ? 'Sending…' : 'Send'}
                                                </button>
                                            )}
                                        </TableCell>
                                    </TableRow>
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

            {/* Send All Dialog — shown when some already sent */}
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
                        <Button
                            variant="outline"
                            onClick={() => handleSendAll('new')}
                            disabled={sendingAll || unsentCount === 0}
                        >
                            {sendingAll ? 'Sending…' : `Send to New (${unsentCount})`}
                        </Button>
                        <Button onClick={() => handleSendAll('all')} disabled={sendingAll}>
                            {sendingAll ? 'Sending…' : `Resend to All (${results.length})`}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Passing Threshold Dialog */}
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
