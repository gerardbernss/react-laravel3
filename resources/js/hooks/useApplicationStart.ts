import { router, usePage } from '@inertiajs/react';
import { useState } from 'react';

export function useApplicationStart() {
    const { applicationPeriodOpen } = usePage<{ applicationPeriodOpen: boolean }>().props;
    const [selectedType, setSelectedType] = useState('');

    const handleProceed = () => {
        if (selectedType) {
            router.visit(`/applications/apply-${selectedType}`);
        }
    };

    return { applicationPeriodOpen, selectedType, setSelectedType, handleProceed };
}
