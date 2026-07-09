import { CITIZENSHIPS, type CitizenshipOption } from '@/data/citizenships';

export type { CitizenshipOption };

/** Return the static list of citizenship options. */
export function useCitizenships() {
    return { citizenships: CITIZENSHIPS, loading: false };
}
