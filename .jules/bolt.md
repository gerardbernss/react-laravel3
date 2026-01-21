## 2024-07-25 - Unintended package-lock.json modifications

**Learning:** Running `npm install` can sometimes modify `package-lock.json` in unexpected ways, such as changing the project name. This is a side-effect that is not related to the primary task of installing dependencies and can introduce breaking changes.

**Action:** After running `npm install`, I must always check the status of `package-lock.json` to ensure that no unintended changes have been made. If the file has been modified, I will revert it to its original state before committing my changes.