import { router, useForm } from '@inertiajs/react';
import { type FormEvent, useEffect, useRef, useState } from 'react';

interface Conflict {
    applicant_number: string;
    name: string;
}

interface Params {
    importConflicts?: Conflict[] | null;
}

export function useExamResultsUpload({ importConflicts }: Params) {
    const { data, setData, post, processing, errors } = useForm<{ file: File | null }>({ file: null });
    const inputRef = useRef<HTMLInputElement>(null);
    const [conflictOpen, setConflictOpen] = useState(false);
    const [confirming, setConfirming] = useState(false);

    useEffect(() => {
        if (importConflicts && importConflicts.length > 0) {
            setConflictOpen(true);
        }
    }, [importConflicts]);

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        post('/exam-results/upload', { forceFormData: true });
    };

    const handleConfirm = (overwrite: boolean) => {
        setConfirming(true);
        router.post('/exam-results/upload/confirm', { overwrite }, {
            onFinish: () => setConfirming(false),
        });
    };

    const handleCancelConflict = () => {
        setConflictOpen(false);
        router.get('/exam-results/upload');
    };

    return { data, setData, processing, errors, inputRef, conflictOpen, confirming, handleSubmit, handleConfirm, handleCancelConflict };
}
