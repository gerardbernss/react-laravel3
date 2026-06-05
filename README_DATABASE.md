# Database Schema Reference

A self-contained reference for the database schema, model relationships, and common data-access patterns used in this system. For the fee/payment subsystem see [README_FEES.md](README_FEES.md).

---

## Quick Start

```bash
# Run all migrations
php artisan migrate

# Seed initial data (roles, permissions, fees, programs, exam rooms, semester periods)
php artisan db:seed

# Verify key tables exist (Laravel tinker)
php artisan tinker
>>> Schema::hasTable('applicants')          // true
>>> Schema::hasTable('portal_credentials')  // true
>>> Schema::hasTable('enrollment_audit_logs') // true
>>> Schema::hasTable('student_assessments') // true
```

---

## Schema Overview

### Domain Groups

```
AUTHENTICATION
  users                          Admin / staff / faculty accounts
  portal_credentials             Student portal login credentials (separate guard)
  roles, permissions             RBAC definitions
  role_permission, role_user     Pivot tables

ADMISSIONS PIPELINE
  applicant_personal_data        Shared master record — one per person
  applicants                     One application per person per school year
  applicant_family_background    Parent / guardian details
  applicant_siblings             Sibling records (used for sibling discount)
  applicant_educational_background   Prior schooling history
  applicant_documents            Uploaded file paths (birth cert, report card, etc.)
  applicant_exam_assignments     Links applicant → exam schedule + room
  applicant_exam_results         Uploaded exam scores (Math / English / Science)
  applicant_assessments          Pre-enrollment fee billing record

STUDENT ENROLLMENT
  students                       Enrolled student master record
  student_enrollments            One row per student per semester
  student_enrollment_subjects    Subjects in a given enrollment
  student_personal_data          Copy of applicant personal data (mutable after enrollment)
  student_family_background      Copy of applicant family data
  student_siblings               Copy of sibling data
  student_documents              Copy of document file paths
  student_assessments            Billing record for each enrolled semester
  student_payments               Individual payment transactions
  student_raw_scores             Raw exam / quiz scores per subject

ACADEMIC STRUCTURE
  programs                       Academic programs (STEM, ABM, GAS, etc.)
  block_sections                 Class sections with grade level and max capacity
  subjects                       Course definitions; each links to a faculty User
  schedules                      Class schedule entries per subject per section
  attendance                     Daily attendance per student per subject
  grade_components               Quiz / exam components per subject per quarter
  grade_validations              Grade submission and approval workflow
  conduct_categories             Conduct grading categories
  conduct_criteria               Individual criteria within a category
  conduct_grades                 Per-student conduct grades

FINANCE
  fees                           Fee type definitions with category and rate
  discount_types                 Discount type definitions with stacking rules
  assessment_discounts           Discounts applied to a specific assessment
  assessment_line_items          Individual fee line items on an assessment

SYSTEM
  semester_periods               School year and semester configuration
  enrollment_periods             Open/close windows for applications and enrollment
  examination_rooms              Exam venue definitions
  exam_schedules                 Exam date/time slots
  announcements                  Broadcast announcements to portal users
  enrollment_audit_logs          Immutable audit trail for all status changes
  app_settings                   Key-value system configuration (e.g. passing %)
```

---

## Core Relationships

### Admissions: Person → Applications

One physical person may submit multiple applications (e.g. re-applicant across school years). The **master identity** is `applicant_personal_data`; each **application** is a separate `applicants` row linked to it.

```
applicant_personal_data (1)
  ├── applicants (many)                 — one per school year / category
  ├── applicant_family_background (1)
  ├── applicant_siblings (many)
  └── portal_credentials (1)           — the student's login credential
```

### Application → Exam → Enrollment

```
applicants (1)
  ├── applicant_educational_background (many)
  ├── applicant_documents (1)
  ├── applicant_exam_assignments (1)   — exam room + schedule
  ├── applicant_exam_results (1)       — uploaded scores
  └── applicant_assessments (1)        — pre-enrollment billing

  On status → 'Enrolled':
  └── students (1)                     — created by enroll() or CopyApplicantDataService
        ├── student_enrollments (many)
        └── portal_credentials         — shared via applicant_personal_data_id
```

### Student → Enrollment → Subjects

```
students (1)
  ├── student_personal_data (1)        — editable copy of applicant_personal_data
  ├── student_family_background (1)
  ├── student_siblings (many)
  ├── student_documents (1)
  ├── portal_credentials (1)           — linked via applicant_personal_data_id
  ├── enrollment_audit_logs (many)
  └── student_enrollments (many)
        ├── student_enrollment_subjects (many)
        │     └── subjects (1)
        │           └── users (1)      — faculty
        ├── block_sections (1)
        └── student_assessments (1)
              └── student_payments (many)
```

---

## Key Models

### `Applicant`

| Field | Type | Notes |
|-------|------|-------|
| `applicant_personal_data_id` | FK | Points to the master identity record |
| `application_status` | string | State machine — see status reference below |
| `application_number` | string | `E####` (Elementary) or `H####` (High School) |
| `student_category` | string | `LES`, `JHS`, or `SHS` |
| `school_year` | string | e.g. `2025-2026` |
| `semester` | string | `First Semester`, `Second Semester`, `Summer` |

**Application Status Reference:**

| Status | Description |
|--------|-------------|
| `Pending` | Submitted; awaiting admin review |
| `For Revision` | Returned for corrections |
| `For Exam` | Approved; exam assigned |
| `Exam Taken` | Exam administered |
| `Exam Passed` | Met the passing threshold |
| `Exam Failed` | Did not meet the threshold |
| `Enrolled` | Student record created |
| `Rejected` | Permanently rejected |

---

### `ApplicantPersonalData`

The shared identity record. One person → one row here, but potentially many `Applicant` rows (one per application year).

**Important:** `health_conditions` is cast to `array` (stored as JSON). The application form may submit `null` items; use `formatHealthConditions()` in `ApplicationController` before saving.

---

### `PortalCredential`

Implements Laravel's `Authenticatable` contract via a custom `student` guard (configured in `config/auth.php`). This model is the login credential for the student portal — completely separate from the `User` (admin) model.

| Field | Type | Notes |
|-------|------|-------|
| `applicant_personal_data_id` | FK | Links credential to the person's identity |
| `applicant_id` | FK | Links credential to the specific application |
| `username` | string | Set to the applicant's email address |
| `temporary_password` | string | Bcrypt hash; plain text is only ever sent by email, never stored |
| `password_changed` | bool | `false` until the student sets their own password on first login |
| `is_activated` | bool | Set to `true` when the student successfully logs in for the first time |
| `access_status` | string | `Active` or `Suspended`; admin-controlled |
| `login_attempts` | int | Incremented on failed login; auto-suspends after 5 consecutive failures |
| `access_suspended_at` | timestamp | Set when `login_attempts >= 5`; cleared on reactivation |
| `credentials_sent_at` | timestamp | Last time credentials were emailed |
| `sent_via` | string | Delivery channel (`email`) |

**Authentication flow:**
1. Student visits `/student/login` → `StudentLoginController`
2. Guard `student` checks `portal_credentials` table (not `users`)
3. After first login, student is redirected to change-password page until `password_changed = true`
4. Account locks after 5 failed attempts; admin must reactivate via portal-credentials admin page

---

### `Student`

Created when an applicant is enrolled. Links back to `applicant_personal_data` (the shared identity) and to the specific `Applicant` application row.

| Field | Type | Notes |
|-------|------|-------|
| `applicant_personal_data_id` | FK | Identity record |
| `applicant_id` | FK | The application that led to enrollment |
| `student_personal_data_id` | FK | Editable student-side copy of personal data |
| `enrollment_status` | string | `Active`, `Pending`, or `Inactive` |
| `current_year_level` | string | Updates each new enrollment |
| `current_semester` | string | Updates each new enrollment |

**Enrollment Status Reference:**

| Status | Meaning |
|--------|---------|
| `Pending` | Assessment created; minimum payment not yet reached |
| `Active` | Minimum payment paid; enrollment confirmed |
| `Inactive` | Dropped or deactivated by admin |

---

### `StudentAssessment`

The billing record for one student for one semester. Created automatically when `EnrollmentController::processOnsiteEnrollment()` runs or mirrored from `ApplicantAssessment` during `ApplicantController::enroll()`.

| Field | Type | Notes |
|-------|------|-------|
| `assessment_number` | string | Auto-generated, e.g. `ASS-20252026-00001` |
| `gross_amount` | decimal | Total before discounts |
| `total_discounts` | decimal | Sum of all verified discounts |
| `net_amount` | decimal | Amount owed (`gross - discounts`) |
| `minimum_amount` | decimal | Minimum to activate enrollment (30% for installment) |
| `status` | string | `draft`, `finalized`, `partial`, `paid`, `cancelled` |

---

### `EnrollmentAuditLog`

An append-only record of every status change on an `Applicant` or `Student`. Never update or delete these rows.

| Field | Notes |
|-------|-------|
| `applicant_id` | The applicant whose status changed |
| `action` | Human-readable description of the action |
| `previous_status` | Status before the change |
| `new_status` | Status after the change |
| `performed_by` | Name of the user who made the change |
| `ip_address` | IP of the request that triggered the change |

---

## Common Patterns

### Creating an Applicant (admin onsite)

```php
// Inject ApplicantService and call createApplicant — wraps all 6 steps in one transaction
$applicant = $applicantService->createApplicant($request->validated(), $request);
```

### Enrolling an Applicant

```php
// ApplicantController::enroll() — runs inside DB::transaction()
Student::create([...]);                           // create student record
StudentAssessment::create([...]);                 // mirror assessment
StudentPayment::create([...]);                    // record initial payment
$applicant->update(['application_status' => 'Enrolled']);
app(CopyApplicantDataService::class)->execute($student); // copy personal data
```

### Generating Portal Credentials

```php
$temporaryPassword = Str::random(12);
PortalCredential::create([
    'applicant_personal_data_id' => $personalData->id,
    'applicant_id'               => $applicant->id,
    'username'                   => $personalData->email,
    'temporary_password'         => bcrypt($temporaryPassword), // never store plain text
    'credentials_generated_at'   => now(),
]);
Mail::to($personalData->email)->send(new PortalPasswordMail($credential, $temporaryPassword));
```

### Checking Enrollment Period

```php
// In controllers and HandleInertiaRequests
EnrollmentPeriod::hasOpenApplicationPeriod()   // online application form open?
EnrollmentPeriod::hasOpenApplicantPeriod()     // admin enrollment window open?
EnrollmentPeriod::hasOpenStudentPeriod()       // student self-enrollment open?
```

### Getting the Current Semester

```php
SemesterPeriod::getCurrentSemester()    // e.g. "First Semester"
SemesterPeriod::getCurrentSchoolYear()  // e.g. "2025-2026"
```

---

## Migration List (chronological)

Migrations are in `database/migrations/`. Key migration groups:

| Group | Purpose |
|-------|---------|
| `create_users_table` | Admin/staff/faculty accounts |
| `create_roles_*/create_permissions_*` | RBAC tables and pivot |
| `create_applicant_*` | Full applicant data schema |
| `create_portal_credentials_table` | Student login credentials |
| `create_students_table` + `enhance_students_*` | Student enrollment |
| `create_student_*` | Student sub-tables (enrollments, subjects, assessments, payments) |
| `create_semester_periods_*` | School calendar |
| `create_enrollment_periods_*` | Application/enrollment windows |
| `create_examination_rooms_*` + `create_exam_schedules_*` | Exam logistics |
| `create_fees_*` + `create_discount_types_*` | Fee management |
| `create_enrollment_audit_logs_*` | Audit trail |
| `create_block_sections_*` + `create_subjects_*` | Academic structure |
| `create_grade_*` + `create_attendance_*` | Grading and attendance |
| `create_announcements_*` | Announcements broadcast |

---

## Seeders

| Seeder | Seeds |
|--------|-------|
| `RoleSeeder` | `super-admin`, `admin`, `registrar`, `faculty`, `cashier`, `base` roles |
| `PermissionSeeder` | All permission slugs and role assignments |
| `FeeSeeder` | Sample fee types and rates for 2025-2026 |
| `ProgramSeeder` | LES, JHS, SHS programs and strand codes |
| `ExaminationRoomSeeder` | Sample exam rooms |
| `SemesterPeriodSeeder` | Default semester periods |
| `DatabaseSeeder` | Orchestrates all the above |
