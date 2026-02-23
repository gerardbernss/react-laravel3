## 2026-02-23 - Join-based flattening in list views
**Learning:** In a Laravel/Inertia stack, using Eloquent's `with()` and then `map()` to flatten data for a list view is a performance anti-pattern for large datasets. It causes high CPU and memory overhead due to model hydration and redundant array creation in PHP.
**Action:** Use database joins (`join()`) and specific column selection (`select()`) to fetch and flatten data in a single SQL query. This is significantly faster and more memory-efficient while still maintaining compatibility with frontend expectations.

## 2026-02-23 - Stable references for static data in React
**Learning:** Defining static data structures like table column definitions inside a React component body causes them to be recreated on every render, which can lead to unnecessary re-renders of child components that receive them as props.
**Action:** Define static data structures outside the component's render scope to ensure stable references across renders.
