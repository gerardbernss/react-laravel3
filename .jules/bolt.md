## 2024-07-25 - Unreliable Git Merge Diff Tool

**Learning:** The `replace_with_git_merge_diff` tool can be unreliable, sometimes failing to apply patches correctly or introducing unrelated changes, which complicates code reviews and can break builds. Multiple attempts were needed to apply a simple `useMemo` hook, with the tool failing to add the necessary import.

**Action:** For critical or precise file modifications, a more reliable pattern is to:
1. Read the file's content into memory using `read_file`.
2. Manipulate the content as a string to ensure it's exactly correct.
3. Overwrite the original file with the corrected content using `write_file`.
This avoids ambiguity and ensures the final state of the file is exactly as intended.