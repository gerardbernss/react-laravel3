# Bolt's Performance Journal

## 2026-02-18 - Optimized Applicant Listing
**Learning:** Defining static data structures like columns inside the render scope of a React component causes them to be recreated on every render, which can lead to unnecessary re-renders in children. Additionally, performing date parsing inside a `.filter()` loop is O(n) redundant work. In the backend, fetching full models when only a few columns are needed increases memory usage and data transfer.
**Action:** Move static definitions outside the component, pre-parse loop-invariant values, and use constrained eager loading with specific column selection in Eloquent.
