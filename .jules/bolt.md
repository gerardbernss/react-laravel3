## 2024-02-02 - Hoisting Filter computations
**Learning:** This codebase frequently uses manual frontend filtering with complex operations (e.g., date parsing) inside the filter loop. These can be hoisted to improve O(N) performance.
**Action:** Always check `useMemo` hooks containing `.filter()` or `.map()` for loop-invariant computations that can be moved outside the loop.
