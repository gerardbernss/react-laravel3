import axios from 'axios';
import { useEffect, useState } from 'react';

export interface Option {
    value: string;
    label: string;
    code: string;
}

export function useProvinces() {
    const [provinces, setProvinces] = useState<Option[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProvinces = async () => {
            try {
                const response = await axios.get<any[]>('https://psgc.gitlab.io/api/provinces');
                const options: Option[] = response.data.map((p) => ({
                    value: p.name,
                    label: p.name,
                    code: p.code,
                }));

                // Add Metro Manila manually as it is a Region but treated as Province in forms
                options.push({
                    value: 'Metro Manila',
                    label: 'Metro Manila',
                    code: '130000000', // NCR Region Code
                });

                options.sort((a, b) => a.label.localeCompare(b.label));
                setProvinces(options);
            } catch (error) {
                console.error('Failed to fetch provinces:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchProvinces();
    }, []);

    return { provinces, loading };
}
