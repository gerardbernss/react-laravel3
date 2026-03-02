## 2025-02-03 - Hoisting loop-invariant calculations in client-side filtering
**Learning:** In React components performing client-side filtering on large arrays, expensive operations like `new Date()` and `.toLowerCase()` inside the `.filter()` callback can become significant bottlenecks. Hoisting these calculations outside the loop within `useMemo` significantly improves performance.
**Action:** Always check `.filter()` and `.map()` callbacks for calculations that don't depend on the current item (e.g., search queries, filter boundaries) and hoist them.

## 2025-02-03 - Unintended package-lock.json modifications
**Learning:** Running `npm install` in an environment where `package.json` lacks a `name` field can cause `npm` to automatically add one to `package-lock.json` based on the directory name (e.g., "app"), and potentially alter peer dependency metadata.
**Action:** Always verify `package-lock.json` after running install commands and revert any unrelated structural or metadata changes before submitting.
