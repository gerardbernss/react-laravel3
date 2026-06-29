import { useState } from 'react';

export function useDashboard() {
    const [openIds, setOpenIds] = useState<Set<number>>(new Set());

    const toggleAnnouncement = (id: number) => {
        setOpenIds((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const formatDate = (dateStr: string | null): string => {
        if (!dateStr) return 'N/A';
        return new Date(dateStr).toLocaleDateString('en-PH', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    return { openIds, toggleAnnouncement, formatDate };
}
