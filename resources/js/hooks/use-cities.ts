import axios from 'axios';
import { useEffect, useState } from 'react';
import { Option } from './use-provinces';

export function useCities(provinceCode?: string) {
    const [cities, setCities] = useState<Option[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!provinceCode) {
            setCities([]);
            return;
        }

        const fetchCities = async () => {
            setLoading(true);
            try {
                let url = '';
                if (provinceCode === '130000000') {
                    // NCR
                    url = 'https://psgc.gitlab.io/api/regions/130000000/cities-municipalities';
                } else {
                    url = `https://psgc.gitlab.io/api/provinces/${provinceCode}/cities-municipalities`;
                }

                const response = await axios.get<any[]>(url);
                const options: Option[] = response.data.map((c) => ({
                    value: c.name,
                    label: c.name,
                    code: c.code,
                }));

                options.sort((a, b) => a.label.localeCompare(b.label));
                setCities(options);
            } catch (error) {
                console.error('Failed to fetch cities:', error);
                setCities([]);
            } finally {
                setLoading(false);
            }
        };

        fetchCities();
    }, [provinceCode]);

    return { cities, loading };
}
