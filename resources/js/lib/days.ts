export const DAY_OPTIONS = [
    { code: 'M', fullName: 'Monday' },
    { code: 'T', fullName: 'Tuesday' },
    { code: 'W', fullName: 'Wednesday' },
    { code: 'Th', fullName: 'Thursday' },
    { code: 'F', fullName: 'Friday' },
];

export const WEEKDAY_CODES = DAY_OPTIONS.map((d) => d.code);

/** Parses a stored days string ("MWF", "TTh", "Daily", legacy "MTWTHF", etc.) into an ordered list of day codes. */
export function parseDays(days: string): string[] {
    if (days.trim().toLowerCase() === 'daily') {
        return [...WEEKDAY_CODES];
    }

    const selected: string[] = [];
    let i = 0;
    while (i < days.length) {
        if (days.slice(i, i + 2).toLowerCase() === 'th') {
            selected.push('Th');
            i += 2;
        } else if ('MTWF'.includes(days[i].toUpperCase())) {
            selected.push(days[i].toUpperCase());
            i += 1;
        } else {
            i += 1;
        }
    }
    return selected;
}
