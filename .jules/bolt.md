## 2026-02-04 - Optimizing List Filtering in React
**Learning:** For list filtering in React components, pre-calculating loop-invariant values (e.g., lowercase search queries and date timestamps for range comparison) outside the `.filter()` callback significantly reduces the per-item processing overhead. Additionally, hoisting static data structures like table column definitions outside the component prevents them from being recreated on every render, ensuring stable references for child components.
**Action:** Always look for redundant computations inside `.filter()` or `.map()` loops and hoist them outside the loop or component.

## 2026-02-04 - Corrupted package-lock.json on npm install
**Learning:** Running `npm install` in this environment can result in massive, unrelated changes to `package-lock.json`, including project renaming and peer dependency modifications. This can be seen as a regression during code review.
**Action:** Always verify `package-lock.json` changes after `npm install` and revert them if they are unrelated to the task.
