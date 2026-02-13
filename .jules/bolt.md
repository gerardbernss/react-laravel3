## 2026-02-13 - Optimizing List Performance in Laravel/React
**Learning:** Large lists filtered on the client side can suffer from significant performance degradation if expensive operations (like `new Date()` or `setHours()`) are performed inside the `.filter()` or `.map()` callbacks. Additionally, fetching all columns from the database when only a few are needed increases memory usage and data transfer size.

**Action:** Always pre-calculate loop-invariant values outside of iteration callbacks in `useMemo`. Use selective column loading (`select()`) and constrained eager loading in Laravel controllers to fetch only necessary data for index views.
