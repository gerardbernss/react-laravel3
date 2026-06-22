import { CITIZENSHIPS, type CitizenshipOption } from '@/data/citizenships';

export type { CitizenshipOption };

export function useCitizenships() {
    return { citizenships: CITIZENSHIPS, loading: false };
}
