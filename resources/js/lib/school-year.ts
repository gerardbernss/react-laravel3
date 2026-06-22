export function getSchoolYearOptions(): string[] {
    const now = new Date();
    const startYear = now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1;
    return Array.from({ length: 6 }, (_, i) => `${startYear + i}-${startYear + i + 1}`);
}
