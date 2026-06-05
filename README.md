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

| Guard     | Model              | Login route      | Used by               |
| --------- | ------------------ | ---------------- | --------------------- |
| `web`     | `User`             | `/login`         | Admin, Staff, Faculty |
| `student` | `PortalCredential` | `/student/login` | Enrolled students and portal applicants |

Both guards are active simultaneously. `HandleInertiaRequests::share()` resolves both guards on every request and passes the appropriate user data to the frontend.

### Role-Based Access Control (RBAC)

Roles and permissions are stored in the `roles`, `permissions`, `role_permission`, and `role_user` tables.

- `CheckRole` middleware — protects routes that require a specific role (e.g. `admin`, `faculty`)
- `CheckPermission` middleware — protects routes that require a specific permission
- `$user->hasRole('faculty')` and `$user->hasPermission('manage-students')` are available on the `User` model

### Shared Data (Every Page)

`HandleInertiaRequests::share()` injects these props into every React page automatically:

| Prop              | Description                                                     |
| ----------------- | --------------------------------------------------------------- |
| `auth.user`       | Authenticated admin/staff/faculty user with roles & permissions |
| `auth.student`    | Authenticated student (from `student` guard)                    |
| `flash.*`         | Session flash messages (success, error, info, warning)          |
| `currentSemester` | Active semester name and school year from `SemesterPeriod`      |
| `sidebarOpen`     | Sidebar cookie state                                            |
| `quote`           | Random inspirational quote (decorative)                         |

---

## Admissions Pipeline

### Application Status Flow

```
[1] Application Submitted
        |  (online form or onsite staff entry)
        v
[2] Pending
        |  (admin reviews; may send to revision)
        |─────────────────────────────────────────→ For Revision
        |  (admin approves)                               | (applicant resubmits)
        v                                                 |
[3] For Exam ←────────────────────────────────────────────
        |  (exam date, room, and schedule assigned)
        v
[4] Exam Taken
        |  (exam scores uploaded via CSV or manual entry)
        v
[5] Exam Passed / Exam Failed
        |  (failed applicants are notified and stop here)
        |  (passed applicants proceed below)
        v
[5a] Enrollment Wizard
        |  Two paths — both require a fee assessment first:
        |
        |  Portal path: applicant logs in as portal user, generates their own
        |    ApplicantAssessment (fee breakdown), then admin opens the enroll
        |    page and records the initial payment.
        |
        |  Onsite path: admin runs the enrollment wizard
        |    (EnrollmentController::processOnsiteEnrollment), which creates a
        |    Student (enrollment_status = Pending) and StudentAssessment.
        |    application_status is set back to 'Pending' at this point.
        |    The cashier records payment separately; once payment is confirmed
        |    the student record is manually activated.
        v
[5b] Payment Recorded — Admin Path (ApplicantController::enroll)
        |  (admin records the initial payment on the enroll page)
        |  (Student is always created with enrollment_status = Active immediately)
        |  (StudentAssessment.status → 'paid' / 'partial' based on amount paid)
        |  (application_status → 'Enrolled' immediately regardless of amount)
        v
[6] Enrolled
        |  (Student record exists with enrollment_status = Active)
        |  (ApplicantAssessment mirrored to StudentAssessment + StudentPayment)
        v
[7] Portal Credentials Generated (manual admin action)
        |  (PortalCredential row created at any point by admin — not automatic)
        |  (temporary password emailed; applicant can log in once activated)
        v
[8] Student Portal Active
        |  (student logs in at /student/login, changes mandatory password,
        |   views enrollment, schedule, grades, and announcements)
```

### Application Status Reference

| Status         | Meaning                                               |
| -------------- | ----------------------------------------------------- |
| `Pending`      | Submitted and awaiting admin review                   |
| `For Revision` | Admin returned the application for corrections        |
| `For Exam`     | Approved; exam schedule assigned                      |
| `Exam Taken`   | Exam administered; scores not yet uploaded            |
| `Exam Passed`  | Scores uploaded; student met the passing threshold    |
| `Exam Failed`  | Scores uploaded; student did not meet the threshold   |
| `Enrolled`     | Admin recorded payment via enroll page; `Student` created with `enrollment_status = Active` |
| `Rejected`     | Application permanently rejected by admin             |

Every status change is recorded in `enrollment_audit_logs` with the actor, timestamp, previous/new status, and IP address.

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
│   ├── Services/Admissions/          # ApplicantService (core write logic: 6-step create/update in a single transaction)
│   └── Services/Student/             # CopyApplicantDataService (mirrors ApplicantPersonalData to Student* tables on enrollment)
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

| Model                            | Table                              | Key Relationships                                                                    |
| -------------------------------- | ---------------------------------- | ------------------------------------------------------------------------------------ |
| `User`                           | `users`                            | `hasMany roles` via pivot; Google OAuth fields                                       |
| `Applicant`                      | `applicants`                       | `belongsTo ApplicantPersonalData`; `hasOne Assessment`; `hasOne PortalCredential`    |
| `ApplicantPersonalData`          | `applicant_personal_data`          | `hasMany Applicant`; `hasOne ApplicantFamilyBackground`; `hasMany ApplicantSiblings` |
| `ApplicantDocuments`             | `applicant_documents`              | `belongsTo Applicant`                                                                |
| `ApplicantEducationalBackground` | `applicant_educational_background` | `belongsTo Applicant`                                                                |
| `PortalCredential`               | `portal_credentials`               | Implements `Authenticatable`; `belongsTo Applicant`; linked to `Student`             |
| `Student`                        | `students`                         | `belongsTo ApplicantPersonalData`; `hasMany StudentEnrollment`                       |
| `StudentEnrollment`              | `student_enrollments`              | `belongsTo Student`; `belongsTo BlockSection`; `hasMany StudentEnrollmentSubject`    |
| `BlockSection`                   | `block_sections`                   | `belongsToMany Subject` via `StudentEnrollmentSubject`                               |
| `Subject`                        | `subjects`                         | `belongsTo User` (faculty); `belongsToMany BlockSection`                             |
| `Attendance`                     | `attendances`                      | `belongsTo Subject`; `belongsTo StudentEnrollment`                                   |
| `SemesterPeriod`                 | `semester_periods`                 | Static methods `getCurrentSemester()`, `getCurrentSchoolYear()`                      |

---

## Route Files Summary

| File                    | Prefix        | Description                                                                                             |
| ----------------------- | ------------- | ------------------------------------------------------------------------------------------------------- |
| `routes/web.php`        | `/`           | Welcome, dashboard, admin pages (students, subjects, sections, fees, announcements, grades, attendance) |
| `routes/admissions.php` | `/admissions` | Applicant CRUD, portal credentials, enrollment management, exam assignments                             |
| `routes/student.php`    | `/student`    | Student portal (dashboard, enrollment, schedule, grades, attendance, profile)                           |
| `routes/auth.php`       | `/`           | Login, register, Google OAuth, email verification, password reset (admin + student)                     |

---

## Permission Matrix

Routes are protected by the `permission` middleware alias (`CheckPermission`). Below is a summary of the key permissions and the routes they guard.

| Permission slug                | Protected routes                                              |
| ------------------------------ | ------------------------------------------------------------- |
| `manage-applications`          | Applicant CRUD, evaluate, enroll, email actions               |
| `manage-student-id-assignment` | Student ID assignment and email                               |
| `manage-portal-credentials`    | Portal credential generation, send, suspend, reactivate       |
| `manage-exam-results`          | CSV import, rankings, send results, update applicant statuses |
| `view-users`                   | User list and edit page                                       |
| `create-users`                 | Create user form and store                                    |
| `update-users`                 | User update                                                   |
| `delete-users`                 | User delete                                                   |
| `assign-roles`                 | Assign / remove roles from users                              |
| `view-roles`                   | Role list and detail                                          |
| `create-roles`                 | Role creation                                                 |
| `update-roles`                 | Role update                                                   |
| `delete-roles`                 | Role delete                                                   |
| `assign-permissions`           | Assign / remove permissions from roles                        |
| `view-permissions`             | Permission list and detail                                    |
| `create-permissions`           | Permission creation                                           |
| `update-permissions`           | Permission update                                             |
| `delete-permissions`           | Permission delete                                             |
| `view-grades`                  | Gradebook, my-students, grade validations, report exports     |
| `manage-grades`                | Grade component CRUD, score save                              |
| `submit-grades`                | Submit grades for validation                                  |
| `finalize-grades`              | Finalize or reject submitted grades                           |
| `manage-conduct`               | Conduct category and criteria CRUD                            |
| `manage-conduct-grades`        | Save conduct grades                                           |
| `view-attendance`              | Attendance views                                              |
| `manage-attendance`            | Record attendance                                             |

Permissions are seeded by `database/seeders/PermissionSeeder.php` and are assignable to roles via the admin UI.

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
