import axios from 'axios';
import { useEffect, useState } from 'react';
import { Option } from './use-provinces';

export function useBarangays(cityCode?: string) {
    const [barangays, setBarangays] = useState<Option[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!cityCode) {
            setBarangays([]);
            return;
        }

        const fetchBarangays = async () => {
            setLoading(true);
            try {
                const response = await axios.get<any[]>(`https://psgc.gitlab.io/api/cities-municipalities/${cityCode}/barangays`);
                const options: Option[] = response.data.map((b) => ({
                    value: b.name,
                    label: b.name,
                    code: b.code,
                }));

                options.sort((a, b) => a.label.localeCompare(b.label));
                setBarangays(options);
            } catch (error) {
                console.error('Failed to fetch barangays:', error);
                setBarangays([]);
            } finally {
                setLoading(false);
            }
        };

        fetchBarangays();
    }, [cityCode]);

    return { barangays, loading };
}
