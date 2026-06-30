# CLAUDE.md

This file must be read at the start of every Claude Code session working in this repository. It defines the stack, folder structure, conventions, and safety rules that all changes must follow.

## Stack

- Laravel (PHP) backend
- Inertia.js as the glue layer (no separate REST/JSON API for the SPA)
- React for the frontend
- Oracle Database

## Folder structure — what goes where

Backend:
- `app/Http/Controllers` — thin controllers only. HTTP request in, response out. No validation, no business logic, no raw queries.
- `app/Services` — business logic, orchestration, calculations, multi-step workflows.
- `app/Repositories` — all database queries, including any raw SQL.
- `app/Http/Requests` — form validation (Form Requests). Controllers never validate inline.
- `app/Http/Resources` — response formatting for anything sent to Inertia.

Frontend:
- `resources/js/pages` — Inertia page components, mirroring Laravel route groups.
- `resources/js/components` — reusable UI components.
- `resources/js/hooks` — custom React hooks.

## Conventions

### Laravel (backend)
- Controllers are thin — only handle HTTP request/response.
- Business logic goes in `app/Services`.
- Database queries go in `app/Repositories`.
- Use Form Requests for all validation, never validate in controllers.
- Controllers pass plain arrays from Services directly to `Inertia::render()` — no Resource classes.
- Method names follow Laravel convention: `index`, `show`, `store`, `update`, `destroy`.
- Always use `DB::transaction()` for multi-step writes.
- Use Eloquent relationships instead of raw Oracle SQL wherever possible.

### React (frontend)
- Components: PascalCase filenames and function names.
- Hooks: camelCase, prefixed with `use` (e.g. `useUserForm`).
- Pages (Inertia): stored in `resources/js/pages`, mirroring Laravel route groups.
- Shared components: stored in `resources/js/components`.
- Extract any logic longer than 10 lines from JSX into a custom hook.
- No business logic inside components — hooks only.
- Props: destructure at the top of every component.

### General
- `const` by default, `let` when needed, never `var`.
- `async`/`await` only, no `.then()`.
- No commented-out dead code — delete it.
- No unused imports.

## Data flow

```
Laravel Controller → Inertia::render() → React Page Component (as props)
```

Controller delegates to a Service for logic and a Repository for data access, then passes the result array directly to `Inertia::render()`. The React Page Component under `resources/js/pages` receives that payload as props and renders it — it does not fetch or compute business data itself.

## Oracle-specific rules

- Use Eloquent or the query builder — raw SQL only as a last resort.
- Raw SQL must live inside a Repository class, never in a Controller, Service, or Model.
- Use `FETCH FIRST n ROWS ONLY` instead of `LIMIT`.
- Always use Carbon for date handling.
- Always use `DB::transaction()` for multi-step writes.

## Safety rules for Claude Code

- Always work on the `refactor/codebase-cleanup` branch.
- Never run `php artisan migrate` without explicit user approval.
- Never switch to the `main` branch.
- Never merge or push without explicit user approval.
- Make changes one file at a time.
- Wait for "next" before continuing to the next file.
