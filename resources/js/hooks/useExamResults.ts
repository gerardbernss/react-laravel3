import { router, useForm } from '@inertiajs/react';
import { useMemo, useState } from 'react';

export interface ExamResult {
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

export function formatScore(v: string | null): string {
    return v != null ? parseFloat(v).toFixed(2) : '—';
}

export function useExamResults(results: ExamResult[], passingPercentage: number) {
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

    const handleUpdate = () => {
        setUpdating(true);
        router.post('/admin/exam-results/update-all', {}, { onFinish: () => setUpdating(false) });
    };

    const handleSendResult = (id: number) => {
        setSendingId(id);
        router.post(`/admin/exam-results/${id}/send`, {}, { onFinish: () => setSendingId(null) });
    };

    const handleSendAll = (scope: 'all' | 'new') => {
        setSendingAll(true);
        router.post('/admin/exam-results/send-all', { scope }, {
            onFinish: () => { setSendingAll(false); setSendAllOpen(false); },
        });
    };

    const handleSendAllClick = () => {
        if (results.length === 0) return;
        if (sentCount > 0) {
            setSendAllOpen(true);
        } else {
            handleSendAll('new');
        }
    };

    const handleSaveThreshold = () => {
        thresholdForm.post('/admin/exam-results/settings', {
            onSuccess: () => setThresholdOpen(false),
        });
    };

    const openThresholdDialog = () => {
        thresholdForm.setData('passing_percentage', passingPercentage);
        setThresholdOpen(true);
    };

    return {
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
    };
}
