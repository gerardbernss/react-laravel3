## 2026-02-16 - Optimization Pattern: Static Config Hoisting
**Learning:** Defining static data structures (like table columns) inside a React component's render scope causes them to be recreated on every render, leading to unnecessary memory allocation and potentially unstable references for child components.
**Action:** Always move static configuration objects or arrays outside of the component definition or memoize them with `useMemo` if they depend on props/state.

## 2026-02-16 - Database Seeding with Fillable Constraints
**Learning:** Data seeding for `ApplicantApplicationInfo` failed because several columns like `school_year` have `NOT NULL` constraints in the database but are missing from the model's `$fillable` array.
**Action:** Use `forceCreate()` or ensure all required columns are added to `$fillable` when creating test data.
