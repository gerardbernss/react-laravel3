# Student Admission Flow - Database Schema Documentation

## Overview

This document describes the database tables and relationships that support the complete student admission flow:

1. **Student Admission** - Application submission and processing
2. **Evaluation/Assessment** - Assessment and screening of applicants (including Entrance Exams)
3. **Portal Credentials** - Generation and management of portal access
4. **Student Enrollment** - Portal enrollment and activation

---

## Database Tables

### 1. **applicant_personal_data**

Stores personal information of applicants.

**Key Fields:**

- `id` (Primary Key)
- `first_name`, `middle_name`, `last_name`, `suffix`
- `email`, `alt_email`, `mobile_number`
- `gender`, `citizenship`, `religion`
- `date_of_birth`, `place_of_birth`
- `present_street`, `present_brgy`, `present_city`, `present_province`, `present_zip`
- `permanent_street`, `permanent_brgy`, `permanent_city`, `permanent_province`, `permanent_zip`
- `has_sibling`, `stopped_studying`, `accelerated`, `health_conditions`
- `learner_reference_number`

**Relationships:**

- One-to-Many with `applicant_application_info`
- One-to-One with `student`
- One-to-One with `portal_credential`
- One-to-Many with `assessments`
- One-to-One with `applicant_family_background`
- One-to-Many with `applicant_siblings`

---

### 2. **applicant_application_info** ⭐ CORE TABLE

Stores application submission information.

**Key Fields:**

- `id` (Primary Key)
- `applicant_personal_data_id` (FK)
- `application_number` (Unique) - e.g., "E0001", "J0002"
- `application_date`
- `application_status` - Pending, Exam Taken, Enrolled
- `application_type` - Online, Onsite
- `year_level` - Grade 1, Grade 7, Grade 11, etc.
- `student_category` - LES (Lower Elementary), JHS (Junior High), SHS (Senior High)
- `school_year`, `semester`
- `strand` - Academic strand/track
- `classification`, `learning_mode`
- `examination_date`
- `accomplished_by_name`
- `remarks`

**Relationships:**

- Belongs-to `applicant_personal_data`
- One-to-Many with `applicant_educational_background`
- One-to-One with `applicant_documents`
- One-to-Many with `assessments` ✨
- One-to-One with `entrance_exam` ✨
- One-to-One with `portal_credential` ✨
- One-to-One with `student`
- One-to-Many with `enrollment_audit_logs` ✨
- One-to-Many with `assessments` ✨
- One-to-One with `portal_credential` ✨
- One-to-One with `student`
- One-to-Many with `enrollment_audit_logs` ✨

---

### 3. **assessments** ✨ NEW

Tracks evaluation and assessment results for applicants.

**Purpose:** Store assessment/exam results for applicant screening

**Key Fields:**

- `id` (Primary Key)
- `applicant_application_info_id` (FK)
- `applicant_personal_data_id` (FK)
- `assessment_type` - Written Exam, Interview, Practical Test, etc.
- `assessment_date` - When the assessment was conducted
- `assessment_status` - Pending, Completed, Cancelled
- `score` - Numeric score obtained
- `total_score` - Maximum possible score (default: 100)
- `result` - Pass, Fail, Pending
- `assessor_remarks` - Notes from the assessor
- `assessed_by` - Name of person who conducted assessment
- `feedback` - Feedback to applicant

**Relationships:**

- Belongs-to `applicant_application_info`
- Belongs-to `applicant_personal_data`

**Useful Scopes:**

- `pending()` - Get pending assessments
- `completed()` - Get completed assessments
- `passed()` - Get passing assessments
- `failed()` - Get failing assessments

**Helper Methods:**

- `getScorePercentageAttribute()` - Calculate percentage score

---

### 4. **portal_credentials** ✨ NEW

Manages portal access credentials for applicants/students.

**Purpose:** Track portal login credentials and access status

**Key Fields:**

- `id` (Primary Key)
- `applicant_personal_data_id` (FK, Unique)
- `applicant_application_info_id` (FK, Nullable)
- `username` (Unique) - Portal login username
- `temporary_password` - Initial temporary password
- `password_changed` - Boolean flag if user changed password
- `access_status` - Active, Inactive, Suspended
- `credentials_generated_at` - When credentials were created
- `credentials_sent_at` - When credentials were sent to applicant
- `sent_via` - Email, SMS, Both
- `first_login_at` - First portal login timestamp
- `last_login_at` - Last portal login timestamp
- `login_attempts` - Failed login attempt counter
- `remarks`
- `created_by` - Admin who created the credentials

**Relationships:**

- Belongs-to `applicant_personal_data`
- Belongs-to `applicant_application_info` (nullable)
- Has-one `student` (through personal data)

**Useful Scopes:**

- `active()` - Active credentials
- `inactive()` - Inactive credentials
- `suspended()` - Suspended credentials
- `credentialsSent()` - Credentials have been sent
- `passwordChanged()` - User changed their password
- `hasLogged()` - User has logged in

**Helper Methods:**

- `generateTemporaryPassword($length)` - Generate random password
- `markCredentialsSent($via)` - Mark credentials as sent
- `recordLogin()` - Record successful login
- `incrementLoginAttempts()` - Increment failed attempts (auto-suspends after 5)

---

### 5. **students** (Enhanced) 🔄 MODIFIED

Represents enrolled students with portal access.

**New Fields Added:**

- `applicant_application_info_id` (FK) - Link to application
- `enrollment_status` - Pending, Active, Inactive, Graduated, Dropped
- `portal_enrollment_date` - When student enrolled via portal
- `portal_username` - Synced from portal credentials
- `portal_access_active` - Boolean for portal access status
- `current_year_level` - Current grade level
- `current_semester` - Current semester
- `current_school_year` - Current academic year
- `remarks`

**Original Fields (Preserved):**

- `id` (Primary Key)
- `student_id_number` - Unique student ID
- `applicant_personal_data_id` (FK)
- `enrollment_date` - Initial enrollment date
- `timestamps`

**Relationships:**

- Belongs-to `applicant_personal_data`
- Belongs-to `applicant_application_info`
- One-to-One with `portal_credential`
- One-to-Many with `enrollment_audit_logs` ✨
- Has-Many through relationship with `assessments`

**Useful Scopes:**

- `active()` - Active enrollment status
- `pending()` - Pending enrollment status
- `inactive()` - Inactive enrollment status
- `portalAccessActive()` - Portal access is active

**Helper Methods:**

- `activatePortalAccess()` - Enable portal access and set enrollment date
- `deactivatePortalAccess()` - Disable portal access
- `completeEnrollment()` - Mark student as Active

---

### 6. **enrollment_audit_logs** ✨ NEW

Tracks all enrollment status changes and actions for audit trail.

**Purpose:** Maintain audit trail of enrollment process

**Key Fields:**

- `id` (Primary Key)
- `student_id` (FK)
- `applicant_application_info_id` (FK, Nullable)
- `action` - Type of action: "Credentials Sent", "Portal Access Granted", "Enrollment Completed", "Status Updated", etc.
- `previous_status` - Status before action
- `new_status` - Status after action
- `description` - Additional details
- `performed_by` - Admin or system user who performed action
- `ip_address` - IP address of the action
- `created_at`, `updated_at`

**Relationships:**

- Belongs-to `student`
- Belongs-to `applicant_application_info` (nullable)

**Useful Scopes:**

- `byAction($action)` - Filter by action type
- `byStudent($studentId)` - Filter by student
- `recent($days)` - Get recent logs (default 30 days)

**Static Methods:**

- `logAction()` - Easy method to log an action with all details

---

### 7. **entrance_exams** ✨ NEW

Tracks entrance exam details, administration, and results for applicants.

**Purpose:** Manage entrance exam scheduling, administration, and result recording specifically for new applicants

**Key Fields:**

- `id` (Primary Key)
- `applicant_application_info_id` (FK)
- `applicant_personal_data_id` (FK)

**Scheduling Fields:**

- `exam_scheduled_date` - When exam is scheduled
- `exam_time` - Time of exam (e.g., "09:00 AM")
- `exam_venue` - Physical location/building
- `exam_room_number` - Specific room/hall
- `seat_number` - Assigned seat for applicant

**Status Fields:**

- `exam_status` - Scheduled, Completed, Cancelled, No-show
- `exam_completed_date` - When exam was actually conducted

**Score Fields:**

- `raw_score` - Marks obtained (0-100 typically)
- `total_marks` - Maximum possible (default: 100)
- `percentage_score` - Auto-calculated percentage
- `passing_score` - Minimum required to pass
- `result` - Pass, Fail, or Pending

**Detailed Scoring:**

- `section_scores` - JSON: Multiple sections e.g., {"Math": 45, "English": 35}
- `subject_scores` - JSON: Multiple subjects e.g., {"Mathematics": 85}

**Administration:**

- `invigilator_name` - Exam proctor's name
- `invigilator_remarks` - Notes from exam supervisor
- `exam_remarks` - General remarks about exam

**Documents:**

- `exam_answer_sheet_path` - Stored answer sheets
- `exam_result_certificate_path` - Result certificate

**Relationships:**

- Belongs-to `applicant_application_info`
- Belongs-to `applicant_personal_data`

**Useful Scopes:**

- `scheduled()` - Get scheduled exams
- `completed()` - Get completed exams
- `passed()` - Get passing applicants
- `failed()` - Get failing applicants
- `upcoming()` - Get future exams
- `overdue()` - Get uncompleted past exams

**Helper Methods:**

- `calculatePercentage()` - Calculate % from raw score
- `determineResult()` - Auto-determine Pass/Fail
- `markCompleted($score, $total, $passingScore)` - Complete exam
- `markCancelled($reason)` - Cancel exam
- `markNoShow($reason)` - Mark as no-show
- `isWithinExamWindow()` - Check if exam is happening now
- `getTimeUntilExam()` - Get time remaining
- `getSectionScore($name)` - Get specific section score
- `addSectionScore($name, $score)` - Add section score

**Refer to [ENTRANCE_EXAM_GUIDE.md](ENTRANCE_EXAM_GUIDE.md) for complete documentation**

---

## Related Tables (Pre-existing)

### applicant_family_background

- Stores parent/guardian information
- FK: `applicant_personal_data_id`

### applicant_siblings

- Stores sibling information
- FK: `applicant_personal_data_id`

### applicant_educational_background

- Stores school history
- FK: `applicant_application_info_id`

### applicant_documents

- Stores uploaded documents (COE, birth certificate, report cards)
- FK: `applicant_application_info_id`

---

## Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                    STUDENT ADMISSION FLOW                           │
└─────────────────────────────────────────────────────────────────────┘

1. ADMISSION PHASE
   ├─ User submits application
   ├─ Create/Update applicant_personal_data
   ├─ Create applicant_application_info (status: "Pending")
   ├─ Add applicant_family_background
   ├─ Add applicant_siblings (if any)
   ├─ Add applicant_educational_background
   └─ Upload applicant_documents

2. EVALUATION/ASSESSMENT PHASE
   ├─ Create assessment record(s)
   ├─ Set assessment_type, assessment_date, assessed_by
   ├─ Update assessment_status to "Completed"
   ├─ Set score and result (Pass/Fail)
   ├─ Update applicant_application_info.application_status → "Exam Taken"
   └─ Update applicant_application_info.examination_date

3. PORTAL CREDENTIAL PHASE
   ├─ Generate portal_credential record
   ├─ Create username and temporary_password
   ├─ Set credentials_generated_at
   ├─ Send credentials via email (credentials_sent_at)
   ├─ Set sent_via = "Email"
   ├─ Log action in enrollment_audit_logs
   └─ Applicant receives credentials

4. PORTAL ENROLLMENT PHASE (Student-Side)
   ├─ Applicant logs in to portal
   │  ├─ Portal records first_login_at (if first)
   │  ├─ Records last_login_at
   │  └─ Updates login_attempts = 0
   │
   ├─ Applicant completes enrollment form
   ├─ System creates student record
   │  ├─ student_id_number is generated/assigned
   │  ├─ applicant_personal_data_id is linked
   │  ├─ applicant_application_info_id is linked
   │  ├─ enrollment_status = "Active"
   │  └─ portal_access_active = true
   │
   ├─ Update portal_credential
   │  ├─ password_changed = true (if user changed password)
   │  ├─ access_status = "Active"
   │  └─ portal_enrollment_date = now()
   │
   ├─ Update applicant_application_info
   │  ├─ application_status = "Enrolled"
   │  └─ school_year, semester, year_level finalized
   │
   └─ Log all actions to enrollment_audit_logs
      ├─ "Portal Access Granted"
      ├─ "Portal Password Changed"
      ├─ "Enrollment Completed"
      └─ "Status Updated" (Pending → Active)
```

---

## Usage Examples

### Recording an Assessment

```php
$assessment = Assessment::create([
    'applicant_application_info_id' => $application->id,
    'applicant_personal_data_id' => $application->applicant_personal_data_id,
    'assessment_type' => 'Written Exam',
    'assessment_date' => now(),
    'assessment_status' => 'Completed',
    'score' => 85,
    'total_score' => 100,
    'result' => 'Pass',
    'assessed_by' => 'John Doe',
    'feedback' => 'Good performance',
]);
```

### Creating Portal Credentials

```php
$credential = PortalCredential::create([
    'applicant_personal_data_id' => $personalData->id,
    'applicant_application_info_id' => $application->id,
    'username' => 'applicant.' . strtolower($personalData->last_name),
    'temporary_password' => PortalCredential::generateTemporaryPassword(),
    'access_status' => 'Active',
    'created_by' => auth()->user()->name,
]);

// Send credentials
$credential->markCredentialsSent('Email');
```

### Recording Login

```php
$credential = PortalCredential::where('username', $username)->first();
$credential->recordLogin();
```

### Creating Student from Application

```php
if ($application->application_status === 'Enrolled') {
    $student = Student::firstOrCreate(
        ['applicant_personal_data_id' => $application->applicant_personal_data_id],
        [
            'applicant_application_info_id' => $application->id,
            'enrollment_date' => now(),
            'enrollment_status' => 'Active',
            'portal_access_active' => true,
            'student_id_number' => generateStudentId(),
        ]
    );

    // Log the enrollment
    EnrollmentAuditLog::logAction(
        $student,
        'Enrollment Completed',
        'Active',
        'Pending',
        'Student successfully enrolled through portal',
        auth()->user()->name,
        request()->ip(),
        $application
    );
}
```

---

## Migration Instructions

To run all migrations:

```bash
php artisan migrate
```

The migrations will be executed in this order:

1. Pre-existing migrations
2. `2026_01_16_000001_create_assessments_table.php`
3. `2026_01_16_000002_create_portal_credentials_table.php`
4. `2026_01_16_000003_enhance_students_table.php`
5. `2026_01_16_000004_create_enrollment_audit_logs_table.php`

---

## Key Design Decisions

1. **Assessment Table**: Separate table to track multiple assessments per application (exams, interviews, etc.)

2. **Portal Credentials**: Dedicated table for portal access management, separate from Student record for flexibility

3. **Audit Logs**: Complete audit trail for compliance and tracking enrollment process

4. **Student Enhancement**: Added fields to track portal enrollment distinct from initial admission

5. **Dual FK Relationships**: Many new tables have both `applicant_application_info_id` and `applicant_personal_data_id` for complete traceability

---

## Indexes for Performance

All new tables include strategic indexes on:

- Foreign keys (for joins)
- Status fields (for filtering)
- Date fields (for range queries)
- Unique fields (for lookups)

---

## Notes

- ✨ = Newly created as part of this implementation
- 🔄 = Modified from existing structure
- All foreign keys use cascading delete where appropriate
- All timestamps are automatically managed by Laravel
