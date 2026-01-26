# Quick Start Guide - Database Setup

## What Was Added

Complete database support for the student admission flow with 4 new tables and 3 enhanced models.

```
Admission → Assessment → Portal Credentials → Student Enrollment
   ↓            ↓              ↓                    ↓
existing    NEW tables:    NEW table:         enhanced
            assessments    portal_credentials  students
            (tracks exam   (manages login)    (added portal
             results)                        enrollment fields)
```

---

## 📦 Files Added

### Migrations (4 new)

```
database/migrations/
├── 2026_01_16_000001_create_assessments_table.php
├── 2026_01_16_000002_create_portal_credentials_table.php
├── 2026_01_16_000003_enhance_students_table.php
└── 2026_01_16_000004_create_enrollment_audit_logs_table.php
```

### Models (3 new + 4 enhanced)

```
app/Models/
├── Assessment.php (NEW)
├── PortalCredential.php (NEW)
├── EnrollmentAuditLog.php (NEW)
├── Student.php (ENHANCED - relationships + methods)
├── ApplicantApplicationInfo.php (ENHANCED - relationships)
└── ApplicantPersonalData.php (ENHANCED - relationships)
```

### Documentation (3 files)

```
├── DATABASE_SCHEMA.md (Detailed reference)
├── SETUP_SUMMARY.md (What was added)
├── IMPLEMENTATION_GUIDE.md (How to use with examples)
└── QUICK_START.md (This file)
```

---

## 🚀 Running the Setup

### Step 1: Run Migrations

```bash
cd react-laravel
php artisan migrate
```

This creates 5 new tables:

- `assessments` - Track exam/assessment results
- `portal_credentials` - Manage portal login credentials
- `enrollment_audit_logs` - Audit trail for enrollment
- `entrance_exams` - Track entrance exam details ✨ NEW
- Adds columns to `students` table

### Step 2: Verify Installation

```bash
php artisan tinker

# Check tables exist
>>> Schema::hasTable('assessments')
>>> Schema::hasTable('portal_credentials')
>>> Schema::hasTable('enrollment_audit_logs')
>>> Schema::hasTable('entrance_exams')
```

---

## 📖 The Flow Explained

### 1️⃣ Admission (Existing)

Applicant submits application → Creates `applicant_personal_data` and `applicant_application_info`

### 2️⃣ Assessment (NEW)

- Admin schedules exam
- Student takes exam
- Admin records results in `assessments` table
- Application status updated to "Exam Taken"

### 3️⃣ Portal Credentials (NEW)

- Admin approves applicants
- System generates credentials in `portal_credentials` table
- Email sent with username + temporary password

### 4️⃣ Portal Enrollment (ENHANCED)

- Student logs in using credentials
- Completes enrollment form
- System creates `student` record with portal activation
- `enrollment_audit_logs` tracks every step
- Student now has Active enrollment

---

## 💡 Key Models & Quick Usage

### EntranceExam Model (NEW) ✨

```php
use App\Models\EntranceExam;

// Create and schedule entrance exam
$entranceExam = EntranceExam::create([
    'applicant_application_info_id' => $appId,
    'applicant_personal_data_id' => $personalDataId,
    'exam_scheduled_date' => '2026-02-20 09:00:00',
    'exam_venue' => 'Main Campus Building A',
    'exam_room_number' => 'Room 204',
    'seat_number' => 'A-15',
    'passing_score' => 50,
]);

// Record exam results
$entranceExam->markCompleted(
    rawScore: 78,
    totalMarks: 100,
    passingScore: 50
);
// Auto-calculates percentage and Pass/Fail

// Query entrance exams
EntranceExam::scheduled()->get();     // Get scheduled
EntranceExam::completed()->get();     // Get completed
EntranceExam::passed()->get();        // Get passed
EntranceExam::upcoming()->get();      // Get future
```

### Assessment Model

```php
use App\Models\Assessment;

// Create an assessment (interview, other tests)
Assessment::create([
    'applicant_application_info_id' => $appId,
    'assessment_type' => 'Interview',
    'assessment_date' => now(),
    'score' => 85,
    'result' => 'Pass',
    'assessed_by' => 'Dr. Smith',
]);

// Query assessments
Assessment::passed()->get();        // Get all passed
Assessment::pending()->get();       // Get pending
$assessment->score_percentage;      // Get 85%
```

### PortalCredential Model

```php
use App\Models\PortalCredential;

// Generate credentials
$cred = PortalCredential::create([
    'applicant_personal_data_id' => $personalDataId,
    'username' => 'john.doe',
    'temporary_password' => 'TempPass123!@#',
    'access_status' => 'Active',
]);

// Send credentials
$cred->markCredentialsSent('Email');

// On login
$cred->recordLogin();  // Updates login times

// Track security
$cred->incrementLoginAttempts();  // Auto-suspends after 5 fails

// Query
PortalCredential::active()->count();
PortalCredential::suspended()->get();
```

### Student Model (Enhanced)

```php
use App\Models\Student;

// Create/activate student
$student = Student::create([
    'applicant_personal_data_id' => $personalDataId,
    'applicant_application_info_id' => $appId,
    'enrollment_status' => 'Active',
    'portal_access_active' => true,
]);

// Use helper methods
$student->activatePortalAccess();
$student->deactivatePortalAccess();
$student->completeEnrollment();

// Query
Student::active()->count();
Student::portalAccessActive()->get();

// Access relationships
$student->application;          // Link to application
$student->portalCredential;     // Link to credentials
$student->auditLogs;            // Enrollment audit trail
$student->assessments;          // All assessments
```

### EnrollmentAuditLog Model

```php
use App\Models\EnrollmentAuditLog;

// Log an action (easy method)
EnrollmentAuditLog::logAction(
    $student,
    'Portal Access Granted',
    'Active',      // new status
    'Pending',     // old status
    'System activated portal access',
    auth()->user()->name,
    request()->ip(),
    $application
);

// Query
$student->auditLogs()->get();
$student->auditLogs()->recent(7)->get();  // Last 7 days
EnrollmentAuditLog::byStudent($studentId)->get();
```

---

## 🎯 Common Tasks

### Record Exam Results

```php
$assessment = Assessment::create([
    'applicant_application_info_id' => $application->id,
    'assessment_type' => 'Written Exam',
    'assessment_date' => now(),
    'score' => $score,
    'result' => $score >= 75 ? 'Pass' : 'Fail',
    'assessed_by' => 'Dr. John',
]);

$application->update(['application_status' => 'Exam Taken']);
```

### Send Portal Credentials

```php
$cred = PortalCredential::create([
    'applicant_personal_data_id' => $personalData->id,
    'username' => strtolower($personalData->last_name),
    'temporary_password' => (new PortalCredential())->generateTemporaryPassword(),
    'created_by' => auth()->user()->name,
]);

$cred->markCredentialsSent('Email');

// In your email: $cred->username, $cred->temporary_password
```

### Complete Student Enrollment

```php
$student = Student::updateOrCreate(
    ['applicant_personal_data_id' => $personalData->id],
    [
        'applicant_application_info_id' => $application->id,
        'enrollment_status' => 'Active',
        'portal_access_active' => true,
    ]
);

$application->update(['application_status' => 'Enrolled']);

EnrollmentAuditLog::logAction(
    $student, 'Enrollment Completed', 'Active', 'Pending',
    'Student enrolled', auth()->user()->name, request()->ip(), $application
);
```

### Handle Portal Login

```php
$cred = PortalCredential::where('username', $username)->first();

if ($cred && Hash::check($password, $hashedPassword)) {
    $cred->recordLogin();  // Updates login times and resets attempts
} else {
    $cred->incrementLoginAttempts();  // Increment and check for suspension
}
```

---

## 📊 Database Tables Overview

| Table                   | Purpose                       | Key Feature                          |
| ----------------------- | ----------------------------- | ------------------------------------ |
| `assessments`           | Track exam/assessment results | Multiple assessments per applicant   |
| `portal_credentials`    | Manage portal login           | Auto-suspend after 5 failed attempts |
| `students` (enhanced)   | Student enrollment tracking   | Portal activation & status tracking  |
| `enrollment_audit_logs` | Complete audit trail          | Track every enrollment action        |

---

## ✅ Verification Checklist

After running migrations:

- [ ] Run `php artisan migrate` successfully
- [ ] Check `assessments` table exists: `Schema::hasTable('assessments')`
- [ ] Check `portal_credentials` table exists
- [ ] Check `enrollment_audit_logs` table exists
- [ ] Check `students` table has new columns
- [ ] Models load correctly in tinker
- [ ] Relationships work: `$application->assessments`

---

## 📚 Documentation Structure

1. **QUICK_START.md** ← You are here
    - Overview and quick tasks
2. **DATABASE_SCHEMA.md**
    - Detailed table descriptions
    - All fields and relationships
    - Usage examples
3. **IMPLEMENTATION_GUIDE.md**
    - Complete flow diagram
    - Code examples for each phase
    - Practical usage patterns
4. **SETUP_SUMMARY.md**
    - Files that were created
    - Migration instructions

---

## 🆘 Troubleshooting

**Q: Migration fails**

- Ensure you're in the `react-laravel` directory
- Check `.env` database credentials
- Try: `php artisan migrate --force`

**Q: Models not found**

- Run composer autoload: `composer dump-autoload`
- Models are in `app/Models/`

**Q: Relationships not working**

- Verify migrations ran: `php artisan migrate:status`
- Check foreign keys exist in database

**Q: Need help?**

- Check `DATABASE_SCHEMA.md` for full reference
- See `IMPLEMENTATION_GUIDE.md` for examples
- Models have inline documentation

---

## 🎓 Next Steps

1. Create controllers for Assessment and PortalCredential management
2. Add routes for new endpoints
3. Create views for admin interface
4. Implement email notifications
5. Build portal frontend for students
6. Add validation and authorization

---

**Ready to use!** Run migrations and start building your features.
