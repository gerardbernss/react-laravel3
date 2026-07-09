import { type SharedData } from '@/types';
import { usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';

interface CategoryBreakdown {
    category: string;
    count: number;
}

/** Track the left-column height via ResizeObserver for layout sync and compute the total applicant category count. */
export function useAdminDashboard(categoryBreakdown: CategoryBreakdown[]) {
    const { currentSemester } = usePage<SharedData>().props;

    const leftColRef = useRef<HTMLDivElement>(null);
    const [leftColHeight, setLeftColHeight] = useState<number | undefined>();

    useEffect(() => {
        const el = leftColRef.current;
        if (!el) return;
        const ro = new ResizeObserver(() => setLeftColHeight(el.offsetHeight));
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    const totalCategory = categoryBreakdown.reduce((sum, item) => sum + Number(item.count), 0);

    return { currentSemester, leftColRef, leftColHeight, totalCategory };
}
