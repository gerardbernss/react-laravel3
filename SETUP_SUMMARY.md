# Database Setup Summary

## Overview

Added complete database tables and models to support the student admission flow:

- **Student Admission** → **Evaluation/Assessment** → **Portal Credentials** → **Student Enrollment**

## Files Created

### 1. Migration Files (in `database/migrations/`)

#### `2026_01_16_000001_create_assessments_table.php`

- **Table:** `assessments`
- **Purpose:** Track evaluation and assessment results
- **Key Fields:**
    - Assessment type (Written Exam, Interview, Practical Test)
    - Assessment date and status
    - Score, total score, and result (Pass/Fail)
    - Assessor remarks and feedback
    - Links to both application and personal data

#### `2026_01_16_000002_create_portal_credentials_table.php`

- **Table:** `portal_credentials`
- **Purpose:** Manage portal login credentials and access
- **Key Fields:**
    - Username and temporary password
    - Password change tracking
    - Access status (Active, Inactive, Suspended)
    - Credential send tracking (date and method)
    - Login tracking (first login, last login, login attempts)
    - Auto-suspension after 5 failed login attempts

#### `2026_01_16_000003_enhance_students_table.php`

- **Modified Table:** `students`
- **Purpose:** Add portal enrollment tracking to student records
- **New Fields:**
    - `applicant_application_info_id` - Link to application
    - `enrollment_status` - Pending, Active, Inactive, Graduated, Dropped
    - `portal_enrollment_date` - When enrolled through portal
    - `portal_username` - Synced from portal credentials
    - `portal_access_active` - Boolean for portal status
    - `current_year_level`, `current_semester`, `current_school_year`
    - `remarks`

#### `2026_01_16_000004_create_enrollment_audit_logs_table.php`

- **Table:** `enrollment_audit_logs`
- **Purpose:** Maintain complete audit trail of enrollment process
- **Key Fields:**
    - Action type and description
    - Previous and new status
    - Performed by (admin/system user)
    - IP address for security

---

### 2. Model Files (in `app/Models/`)

#### `Assessment.php`

- Relationships with `ApplicantApplicationInfo` and `ApplicantPersonalData`
- Scopes: `pending()`, `completed()`, `passed()`, `failed()`
- Helper: `getScorePercentageAttribute()` for percentage calculation
- Assessment type: Written Exam, Interview, Practical Test, etc.

#### `PortalCredential.php`

- Relationships with personal data, application, and student
- Scopes: `active()`, `inactive()`, `suspended()`, `credentialsSent()`, `passwordChanged()`, `hasLogged()`
- Methods:
    - `generateTemporaryPassword()` - Generate random password
    - `markCredentialsSent()` - Mark credentials as sent
    - `recordLogin()` - Record successful login
    - `incrementLoginAttempts()` - Track failed attempts (auto-suspend after 5)

#### `EnrollmentAuditLog.php`

- Relationships with Student and Application
- Scopes: `byAction()`, `byStudent()`, `recent()`
- Static method: `logAction()` - Easy action logging
- Used for tracking all enrollment milestones

#### Enhanced `Student.php`

- Updated fillable array for all new fields
- New relationships:
    - `application()` - Link to application
    - `portalCredential()` - Portal access info
    - `auditLogs()` - Enrollment audit trail
    - `assessments()` - Through relationship
- New scopes: `active()`, `pending()`, `inactive()`, `portalAccessActive()`
- Helper methods:
    - `activatePortalAccess()` - Enable portal
    - `deactivatePortalAccess()` - Disable portal
    - `completeEnrollment()` - Mark as Active

#### Enhanced `ApplicantApplicationInfo.php`

- New relationships:
    - `assessments()` - Student assessments
    - `portalCredential()` - Portal credentials
    - `student()` - Enrolled student
    - `auditLogs()` - Enrollment logs
- New scopes: `enrolled()`, `pending()`, `examTaken()`

#### Enhanced `ApplicantPersonalData.php`

- New relationships:
    - `portalCredential()` - Portal access
    - `assessments()` - Assessment records

---

### 3. Documentation

#### `DATABASE_SCHEMA.md`

Complete database schema documentation including:

- Table descriptions and relationships
- Field definitions and purposes
- Useful scopes and helper methods
- Complete flow diagram
- Usage examples
- Migration instructions
- Design decisions and notes

---

## Database Relationships

```
applicant_personal_data (1) ─────── (Many) applicant_application_info
        │                                           │
        │                                           ├─── (Many) assessments
        │                                           ├─── (1) portal_credential
        │                                           └─── (1) student
        │
        ├─── (1) portal_credential
        ├─── (1) applicant_family_background
        ├─── (Many) applicant_siblings
        ├─── (1) student
        └─── (Many) assessments

student (1) ─────── (Many) enrollment_audit_logs
    │
    └─── (1) portal_credential (through personal_data)
```

---

## Running the Migrations

To apply all new migrations to your database:

```bash
cd react-laravel
php artisan migrate
```

The migrations will create all necessary tables and add columns to existing tables in the correct order.

---

## Next Steps (Optional)

1. Create Controllers for Assessment management:

    ```bash
    php artisan make:controller AssessmentController --resource
    php artisan make:controller PortalCredentialController --resource
    php artisan make:controller EnrollmentAuditController
    ```

2. Create Request validation classes:

    ```bash
    php artisan make:request StoreAssessmentRequest
    php artisan make:request StorePortalCredentialRequest
    ```

3. Add Routes in `routes/api.php` or `routes/web.php`

4. Create Notifications/Mails for:
    - Sending portal credentials
    - Assessment results
    - Enrollment confirmation

---

## Key Features Implemented

✅ **Assessment Tracking** - Multiple assessments per applicant with scores and feedback  
✅ **Portal Credentials** - Secure credential management with password tracking  
✅ **Access Control** - Active/Inactive/Suspended status with auto-suspension  
✅ **Enrollment Portal** - Student can enroll through portal with status tracking  
✅ **Audit Trail** - Complete audit logs for compliance and troubleshooting  
✅ **Login Tracking** - First/last login tracking with failed attempt counting  
✅ **Data Integrity** - Foreign keys with cascading deletes  
✅ **Performance** - Strategic indexes on all lookup and filtering fields

---

## Questions or Issues?

Refer to `DATABASE_SCHEMA.md` for:

- Detailed field descriptions
- Usage examples and code snippets
- Complete flow diagram
- Scope and method documentation
