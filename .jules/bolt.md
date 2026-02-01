## 2025-05-22 - Optimizing list filtering in React

**Learning:** In React components that render large lists, performing expensive operations like `new Date()` and `toLowerCase()` inside a `.filter()` or `.map()` callback can lead to significant performance bottlenecks as the list grows. Pre-calculating these loop-invariant values outside the loop (but inside `useMemo`) drastically reduces the computation per item.

**Action:** Always inspect filter and map loops for invariant calculations. Move string normalization and date object creation outside of loops whenever possible.
