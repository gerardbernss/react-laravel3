import axios from 'axios';
import { useEffect, useState } from 'react';

export interface Option {
    value: string;
    label: string;
    code: string;
}

export function useProvinces(regionCode?: string) {
    const [provinces, setProvinces] = useState<Option[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!regionCode) {
            setProvinces([]);
            return;
        }

        // Special handling for NCR (National Capital Region)
        if (regionCode === '130000000') {
            setProvinces([
                {
                    value: 'Metro Manila',
                    label: 'Metro Manila',
                    code: '130000000', // We reuse the region code or a dummy code.
                                     // useCities expects '130000000' to fetch cities from region endpoint.
                },
            ]);
            return;
        }

        const fetchProvinces = async () => {
            setLoading(true);
            try {
                const response = await axios.get<any[]>(`https://psgc.gitlab.io/api/regions/${regionCode}/provinces`);
                const options: Option[] = response.data.map((p) => ({
                    value: p.name,
                    label: p.name,
                    code: p.code,
                }));

                options.sort((a, b) => a.label.localeCompare(b.label));
                setProvinces(options);
            } catch (error) {
                console.error('Failed to fetch provinces:', error);
                setProvinces([]);
            } finally {
                setLoading(false);
            }
        };

        fetchProvinces();
    }, [regionCode]);

    return { provinces, loading };
}
