## 2026-02-14 - Optimizing Admissions Index Data Flow
**Learning:** React `useMemo` hooks containing loops with `new Date()` calls and complex string operations can become performance bottlenecks for large datasets. Pre-calculating comparison values outside the loop significantly reduces CPU overhead.
**Action:** Always extract loop-invariant calculations (like `.toLowerCase()` or `new Date().getTime()`) outside of `.filter()` or `.map()` callbacks within `useMemo`.

## 2026-02-14 - Eloquent Model Hydration Cost
**Learning:** Fetching all columns (`*`) from multiple related tables in Laravel results in high memory usage and increased database I/O, especially when flattening data for Inertia.js props where many columns are discarded.
**Action:** Use explicit `select()` and constrained eager loading (`with(['relation:id,col1,col2'])`) to fetch only the data required by the view.
