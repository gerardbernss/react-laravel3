import axios from 'axios';
import { useEffect, useState } from 'react';

export interface Option {
    value: string;
    label: string;
    code: string;
}

export function useRegions() {
    const [regions, setRegions] = useState<Option[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRegions = async () => {
            try {
                const response = await axios.get<any[]>('https://psgc.gitlab.io/api/regions');
                const options: Option[] = response.data.map((r) => ({
                    value: r.name,
                    label: r.name,
                    code: r.code,
                }));

                // Sort by name? Or usually regions have a specific order (Region I, II, III...).
                // PSGC API usually returns them in a standard order. Let's keep API order or sort by name?
                // Users might expect "Region I" then "Region II".
                // Let's sort by code for now or name. Name sorts "Region I", "Region II", "Region X"...
                // Let's just trust the API order or sort by name for consistency with others.
                // Actually, "National Capital Region" vs "Region I".
                // Let's sort by name.
                // options.sort((a, b) => a.label.localeCompare(b.label));
                // Actually, Region 1, 2, 3 is better.
                // Let's leave as is (API order) which is usually geographic or logical.

                setRegions(options);
            } catch (error) {
                console.error('Failed to fetch regions:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchRegions();
    }, []);

    return { regions, loading };
}
