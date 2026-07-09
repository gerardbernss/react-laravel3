I'm working on a Laravel + Inertia.js + React + Oracle Database project.
Apply ALL of these conventions to any code you write or edit:

STACK

- Laravel (PHP) backend, Inertia.js as the glue layer (no separate REST/JSON API)
- React frontend, Oracle Database

FOLDER STRUCTURE

- app/Http/Controllers — thin controllers only
- app/Services — business logic, orchestration, calculations
- app/Repositories — all database queries, including raw SQL
- app/Http/Requests — form validation (Form Requests)
- app/Http/Resources — response formatting for anything sent to Inertia
- resources/js/pages — Inertia page components (mirrors Laravel route groups)
- resources/js/components — reusable UI components
- resources/js/hooks — custom React hooks

LARAVEL CONVENTIONS

- Controllers are thin — only handle HTTP request/response, nothing else
- Business logic → app/Services
- Database queries → app/Repositories
- Form Requests for ALL validation — never validate inline in a controller
- Controllers pass plain arrays from Services directly to Inertia::render()
  — do NOT use Resource classes
- Method names follow Laravel convention: index, show, store, update, destroy
- Always DB::transaction() for multi-step writes
- Use Eloquent relationships instead of raw Oracle SQL wherever possible

REACT CONVENTIONS

- Components: PascalCase filenames and function names
- Hooks: camelCase, prefixed with "use" (e.g. useUserForm)
- Pages go in resources/js/pages, shared components in resources/js/components
- Extract any logic longer than 10 lines from JSX into a custom hook
- No business logic inside components — hooks only
- Destructure all props at the top of every component

GENERAL

- const by default, let when needed, never var
- async/await only, never .then()
- No commented-out dead code — delete it
- No unused imports

DATA FLOW
Laravel Controller → Service (logic) + Repository (data) → plain array
→ Inertia::render() → React Page Component (resources/js/pages) receives as props

ORACLE-SPECIFIC RULES

- Use Eloquent or query builder — raw SQL only as last resort
- Raw SQL must live inside a Repository class only, never in
  Controller, Service, or Model
- Use FETCH FIRST n ROWS ONLY instead of LIMIT
- Always use Carbon for date handling
- Always DB::transaction() for multi-step writes

Confirm you understand these conventions before I give you my task.
