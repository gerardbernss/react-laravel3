import { type SemesterPeriod } from '@/hooks/useSemesterPeriods';
import { useForm } from '@inertiajs/react';

interface Params {
    period: SemesterPeriod;
    onCancel: () => void;
}

export function useSemesterPeriodEdit({ period, onCancel }: Params) {
    const { data, setData, put, processing, errors } = useForm({
        start_month: period.start_month,
        end_month: period.end_month,
        is_active: period.is_active,
    });

    const submit = () => {
        put(`/admin/semester-periods/${period.id}`, { onSuccess: onCancel });
    };

    return { data, setData, processing, errors, submit };
}
