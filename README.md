# School Admissions & Enrollment Management System

A full-stack web application for managing the complete student admissions and enrollment pipeline — from online/onsite application submission through entrance examination, portal credential generation, and final student enrollment. Built with Laravel 12, React 19, and Inertia.js.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Laravel 12 (PHP 8.2+) |
| Frontend | React 19 + TypeScript |
| Bridge | Inertia.js 2.0 (no separate API needed) |
| Styling | Tailwind CSS 4.0 + shadcn/ui |
| Build | Vite 7 |
| Auth (admin) | Laravel session guard + Google OAuth (Socialite) |
| Auth (student) | Separate `student` guard via `PortalCredential` model |
| Database | SQLite (development) / MySQL (production) |
| RBAC | Custom Role/Permission implementation |
| Email | Laravel Mail (SMTP/log driver) |

---

## Features

### Admissions Pipeline
- Online and onsite application forms for three school levels: **LES** (Lower Elementary), **JHS** (Junior High School), **SHS** (Senior High School)
- Full applicant profile: personal data, family background, siblings, educational history, document uploads
- Application status progression: `Pending → For Exam → Exam Taken → Enrolled`
- Entrance exam scheduling and room assignment
- Portal credential generation and email delivery
- Enrollment audit log tracking every status change with IP address

### Admin & Staff
- Dashboard with admissions pipeline overview, status/category breakdowns, and block section capacity
- Applicant CRUD with full detail view and document management
- Applicant email actions: send confirmation, final result, or portal credentials
- Block section and subject management
- Grade sheet entry and attendance tracking per subject/section
- Fee, discount, and student financial assessment management
- User, role, and permission management
- Announcement broadcasting

### Faculty Dashboard
- Personal class list (subject + section pairs)
- Attendance taking per class per day
- Grade progress tracking per class

### Student Portal
- Login via portal credentials (username + auto-generated password)
- Password change on first login; account locks after 5 failed attempts
- View enrollment, schedule, grades, attendance, and announcements
- Download forms

### Authentication
- Admin/staff/faculty: email + password, or Google OAuth (optional domain restriction)
- Email verification required for new accounts
- Password reset via email for both admin and student guards

---

## Prerequisites

- PHP 8.2 or higher
- Composer 2.x
- Node.js 18+ and npm
- SQLite (default) or MySQL 8+ / PostgreSQL

---

## Installation & Setup

```bash
# 1. Clone the repository
git clone <repo-url>
cd laravel-inertia-react/react-laravel

# 2. Install PHP dependencies
composer install

# 3. Install JavaScript dependencies
npm install

# 4. Copy and configure environment
cp .env.example .env
php artisan key:generate

# 5. Configure your database in .env (SQLite is used by default)
#    For SQLite, ensure database/database.db exists:
touch database/database.db

# 6. Run database migrations
php artisan migrate

# 7. Seed initial data (roles, permissions, fee types, exam rooms, etc.)
php artisan db:seed

# 8. Link storage for file uploads
php artisan storage:link

# 9. Start the development servers (in separate terminals)
php artisan serve        # Laravel backend at http://localhost:8000
npm run dev              # Vite frontend with HMR
```

---

## Environment Variables

```env
# Application
APP_NAME="School Admissions System"
APP_ENV=local
APP_DEBUG=true
APP_URL=http://localhost:8000

# Database — SQLite (default)
DB_CONNECTION=sqlite
# DB_DATABASE=/absolute/path/to/database.db

# Database — MySQL (production)
# DB_CONNECTION=mysql
# DB_HOST=127.0.0.1
# DB_PORT=3306
# DB_DATABASE=admissions
# DB_USERNAME=root
# DB_PASSWORD=

# Mail
MAIL_MAILER=log                          # Use 'smtp' in production
MAIL_HOST=smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USERNAME=
MAIL_PASSWORD=
MAIL_FROM_ADDRESS="no-reply@school.edu"
MAIL_FROM_NAME="${APP_NAME}"

# Google OAuth (optional — leave blank to disable)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI="${APP_URL}/auth/google/callback"
GOOGLE_ALLOWED_DOMAINS=               # Restrict login to a domain, e.g. "school.edu"
```

---

## Architecture Overview

### How Inertia.js Works Here

Inertia replaces the traditional API layer. The flow for every page request is:

```
Browser request
  → Laravel Router (routes/web.php)
    → Controller method
      → Inertia::render('PageName', [...props])
        → React page component receives props as regular JS objects
          → React renders the page (full SSR-friendly, no client-side data fetching needed)
```

On navigation, Inertia intercepts the link click and sends an XHR request. The server returns only the new page component name and props as JSON — no full page reload.

### Dual Authentication Guards

The app uses two completely separate authentication contexts:

| Guard | Model | Login route | Used by |
|---|---|---|---|
| `web` | `User` | `/login` | Admin, Staff, Faculty |
| `student` | `PortalCredential` | `/student-login` | Enrolled students |

Both guards are active simultaneously. `HandleInertiaRequests::share()` resolves both guards on every request and passes the appropriate user data to the frontend.

### Role-Based Access Control (RBAC)

Roles and permissions are stored in the `roles`, `permissions`, `role_permission`, and `role_user` tables.

- `CheckRole` middleware — protects routes that require a specific role (e.g. `admin`, `faculty`)
- `CheckPermission` middleware — protects routes that require a specific permission
- `$user->hasRole('faculty')` and `$user->hasPermission('manage-students')` are available on the `User` model

### Shared Data (Every Page)

`HandleInertiaRequests::share()` injects these props into every React page automatically:

| Prop | Description |
|---|---|
| `auth.user` | Authenticated admin/staff/faculty user with roles & permissions |
| `auth.student` | Authenticated student (from `student` guard) |
| `flash.*` | Session flash messages (success, error, info, warning) |
| `currentSemester` | Active semester name and school year from `SemesterPeriod` |
| `sidebarOpen` | Sidebar cookie state |
| `quote` | Random inspirational quote (decorative) |

---

## Admissions Pipeline

```
[1] Application Submitted
        |  (online form or staff onsite entry)
        v
[2] Pending
        |  (admin reviews application)
        v
[3] For Exam
        |  (exam date assigned via ExamSchedule + ExaminationRoom)
        v
[4] Exam Taken
        |  (assessment/score recorded)
        v
[5] Enrolled
        |  (triggers Student record creation)
        v
[6] Portal Credentials Generated
        |  (PortalCredential row created, email sent with temp password)
        v
[7] Student Portal Active
        |  (student logs in, changes password, views enrollment)
```

Every status change is recorded in `enrollment_audit_logs` with the user, timestamp, previous/new status, and IP address.

---

## Directory Structure

```
react-laravel/
├── app/
│   ├── Enums/                        # ApplicationStatus, StudentCategory
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── Admin/                # DashboardController, StudentsController, GradesController, ...
│   │   │   ├── Admissions/           # ApplicantController, ApplicationController, EnrollmentController, PortalCredentialController
│   │   │   ├── Auth/                 # Login, Register, Google OAuth, Student login, Password reset
│   │   │   └── Student/              # StudentPortalController, StudentIDController
│   │   ├── Middleware/               # HandleInertiaRequests, CheckRole, CheckPermission, PreventBackHistory
│   │   └── Requests/                 # Form validation (Admissions, Auth, Settings)
│   ├── Mail/Admissions/              # EmailConfirmationMail, FinalResultMail, PortalCredentialsMail, PortalPasswordMail
│   ├── Models/                       # 35+ Eloquent models
│   ├── Notifications/                # EmailVerificationNotification, StudentResetPasswordNotification
│   └── Services/Admissions/          # ApplicantService (core write logic)
│
├── database/
│   ├── migrations/                   # 66+ migration files
│   └── seeders/                      # Roles, fees, programs, exam rooms, semester periods
│
├── resources/js/
│   ├── pages/
│   │   ├── Admin/                    # User, role, permission management pages
│   │   ├── Admissions/               # Applicant list, detail, edit, enrollment dashboard
│   │   ├── Applications/             # Public-facing SHS/JHS/LES application forms
│   │   ├── Student/                  # Student portal pages
│   │   └── auth/ + settings/         # Auth and settings pages
│   ├── layouts/                      # AppLayout (admin), StudentLayout, AuthLayout
│   ├── components/                   # Shared UI components (sidebar, file upload, selects, ...)
│   ├── hooks/                        # useAuth, useAppearance, location selectors
│   └── types/                        # TypeScript interfaces (SharedData, User, BreadcrumbItem, ...)
│
└── routes/
    ├── web.php                       # Admin + public routes
    ├── admissions.php                # Admissions CRUD routes
    ├── student.php                   # Student portal routes
    └── auth.php                      # Auth routes (login, register, Google, student login)
```

---

## Key Models & Relationships

| Model | Table | Key Relationships |
|---|---|---|
| `User` | `users` | `hasMany roles` via pivot; Google OAuth fields |
| `Applicant` | `applicants` | `belongsTo ApplicantPersonalData`; `hasOne Assessment`; `hasOne PortalCredential` |
| `ApplicantPersonalData` | `applicant_personal_data` | `hasMany Applicant`; `hasOne ApplicantFamilyBackground`; `hasMany ApplicantSiblings` |
| `ApplicantDocuments` | `applicant_documents` | `belongsTo Applicant` |
| `ApplicantEducationalBackground` | `applicant_educational_background` | `belongsTo Applicant` |
| `PortalCredential` | `portal_credentials` | Implements `Authenticatable`; `belongsTo Applicant`; linked to `Student` |
| `Student` | `students` | `belongsTo ApplicantPersonalData`; `hasMany StudentEnrollment` |
| `StudentEnrollment` | `student_enrollments` | `belongsTo Student`; `belongsTo BlockSection`; `hasMany StudentEnrollmentSubject` |
| `BlockSection` | `block_sections` | `belongsToMany Subject` via `StudentEnrollmentSubject` |
| `Subject` | `subjects` | `belongsTo User` (faculty); `belongsToMany BlockSection` |
| `Attendance` | `attendances` | `belongsTo Subject`; `belongsTo StudentEnrollment` |
| `SemesterPeriod` | `semester_periods` | Static methods `getCurrentSemester()`, `getCurrentSchoolYear()` |

---

## Route Files Summary

| File | Prefix | Description |
|---|---|---|
| `routes/web.php` | `/` | Welcome, dashboard, admin pages (students, subjects, sections, fees, announcements, grades, attendance) |
| `routes/admissions.php` | `/admissions` | Applicant CRUD, portal credentials, enrollment management, exam assignments |
| `routes/student.php` | `/student` | Student portal (dashboard, enrollment, schedule, grades, attendance, profile) |
| `routes/auth.php` | `/` | Login, register, Google OAuth, email verification, password reset (admin + student) |

---

## Running Tests

```bash
# Run all tests
php artisan test

# Run a specific test file
php artisan test --filter ExampleTest

# Run with coverage (requires Xdebug or PCOV)
php artisan test --coverage
```

---

## License

This project is proprietary software. All rights reserved.
