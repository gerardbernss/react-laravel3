import axios from 'axios';
import { useEffect, useState } from 'react';

type Country = {
    name: {
        common: string;
        official: string;
    };
    demonyms?: {
        eng?: {
            f: string;
            m: string;
        };
    };
};

export type CitizenshipOption = {
    value: string; // The demonym (e.g., "Filipino")
    label: string; // The demonym (e.g., "Filipino")
    countryName: string; // The country name (e.g., "Philippines")
};

export function useCitizenships() {
    const [citizenships, setCitizenships] = useState<CitizenshipOption[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCountries = async () => {
            try {
                // Using restcountries.com to get demonyms
                const response = await axios.get<Country[]>('https://restcountries.com/v3.1/all?fields=name,demonyms');

                const options: CitizenshipOption[] = [];
                const seen = new Set<string>();

                response.data.forEach((country) => {
                    const demonym = country.demonyms?.eng?.m;
                    if (demonym) {
                        // Split by comma if multiple demonyms are present (e.g. "Antiguan, Barbudan")
                        const parts = demonym.split(',').map(s => s.trim());
                        parts.forEach(d => {
                             if (d && !seen.has(d)) {
                                seen.add(d);
                                options.push({
                                    value: d,
                                    label: d,
                                    countryName: country.name.common
                                });
                            }
                        });
                    }
                });

                // Sort alphabetically
                options.sort((a, b) => a.label.localeCompare(b.label));

                // Ensure "Filipino" is in the list if not present (it should be, but just in case)
                // and maybe prioritize it?
                // For now just sorting alphabetically is standard.

                setCitizenships(options);
            } catch (error) {
                console.error('Failed to fetch citizenships:', error);
                // Fallback or empty list
            } finally {
                setLoading(false);
            }
        };

        fetchCountries();
    }, []);

    return { citizenships, loading };
}
