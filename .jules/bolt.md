# Bolt's Performance Journal ⚡

## 2025-05-23 - Static Reference Stability
**Learning:** Defining static data structures (like the `columns` array in `Index.tsx`) inside the component's render scope causes them to be recreated on every render. While React's reconciliation handles this, it leads to unnecessary memory allocations and can break `memo` optimizations in child components that receive these as props.
**Action:** Always move static, non-reactive data structures outside of the component definition or wrap them in `useMemo` if they depend on props/state.

## 2025-05-23 - Loop-Invariant Optimization in useMemo
**Learning:** Performing expensive operations like `new Date()` or `.toLowerCase()` on the same values repeatedly inside a `.filter()` or `.map()` callback within `useMemo` is a significant bottleneck, especially as the list size grows.
**Action:** Pre-calculate all loop-invariant values (e.g., date timestamps for range comparison, lowercased search queries) once at the start of the `useMemo` block, before the iteration begins.
