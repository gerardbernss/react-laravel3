# Student Admission Flow - Implementation Guide

## 📋 Complete Database Setup Added

This guide walks through the complete student admission workflow and how each new table fits into the process.

---

## 🎯 The Complete Flow

### Phase 1: Student Admission ✅ (Existing)

**Tables involved:** `applicant_personal_data`, `applicant_application_info`

```
Admin/Student submits application
    ↓
ApplicantPersonalData created/updated with:
  - Personal info (name, email, contact, address)
  - Medical info (health conditions, doctors notes)
    ↓
ApplicantApplicationInfo created with:
  - Application status = "Pending"
  - Year level, school year, semester, strand
  - Application number auto-generated
    ↓
Supporting records created:
  - FamilyBackground (parents/guardians)
  - Siblings info
  - EducationalBackground (previous schools)
  - Documents (COE, birth cert, report cards)
```

---

### Phase 2: Evaluation & Assessment ✨ NEW

**New table:** `assessments`

```
Admin schedules assessment
    ↓
Assessment record created:
  - assessment_type: "Written Exam", "Interview", etc.
  - assessment_date: When exam will be held
  - assessment_status: "Pending"
    ↓
Applicant takes assessment
    ↓
Assessment results recorded:
  - score: Actual marks obtained
  - result: "Pass" or "Fail"
  - assessed_by: Name of assessor
  - feedback: Comments/feedback
  - assessment_status: "Completed"
    ↓
ApplicantApplicationInfo updated:
  - application_status: "Exam Taken"
  - examination_date: Date exam was held
```

**Key Models & Methods:**

```php
// Create assessment
$assessment = Assessment::create([
    'applicant_application_info_id' => $app->id,
    'applicant_personal_data_id' => $app->applicant_personal_data_id,
    'assessment_type' => 'Written Exam',
    'assessment_date' => now(),
    'assessment_status' => 'Completed',
    'score' => 85,
    'total_score' => 100,
    'result' => 'Pass',
    'assessed_by' => 'John Doe',
]);

// Query assessments
$passedAssessments = Assessment::passed()->get();
$completedAssessments = Assessment::completed()->get();
$scorePercentage = $assessment->score_percentage; // 85%
```

---

### Phase 3: Portal Credentials Generation ✨ NEW

**New table:** `portal_credentials`

```
Admin approves applicants for enrollment
    ↓
For each approved applicant:
  ├─ PortalCredential record created:
  │   - username: Generated from last name
  │   - temporary_password: Random secure password
  │   - credentials_generated_at: Now
  │   - access_status: "Active"
  │
  └─ Credentials sent to applicant:
      - credentials_sent_at: Now
      - sent_via: "Email" (or SMS)
      - Email contains: username + temporary password
```

**Key Models & Methods:**

```php
// Generate credentials
$credential = PortalCredential::create([
    'applicant_personal_data_id' => $personalData->id,
    'applicant_application_info_id' => $application->id,
    'username' => 'applicant.lastname',
    'temporary_password' => $credential->generateTemporaryPassword(),
    'access_status' => 'Active',
    'created_by' => auth()->user()->name,
]);

// Send credentials
$credential->markCredentialsSent('Email');

// Query status
$sentCredentials = PortalCredential::credentialsSent()->get();
$activeCredentials = PortalCredential::active()->get();
```

---

### Phase 4: Student Portal Enrollment ✨ NEW

**Tables involved:** `students` (enhanced), `portal_credentials`, `enrollment_audit_logs`

```
Applicant receives portal credentials
    ↓
Applicant logs into portal
    ↓
PortalCredential updated:
  - first_login_at: Now (if first time)
  - last_login_at: Now
  - login_attempts: 0
    ↓
Portal enrollment form completed
    ↓
System creates/updates Student record:
  - applicant_personal_data_id: Linked
  - applicant_application_info_id: Linked
  - enrollment_status: "Active"
  - enrollment_date: Now
  - portal_enrollment_date: Now
  - portal_username: From credentials
  - portal_access_active: true
  - current_year_level: From application
  - current_semester: From application
  - current_school_year: From application
    ↓
PortalCredential updated:
  - password_changed: true (if user changed password)
  - access_status: "Active"
    ↓
ApplicantApplicationInfo updated:
  - application_status: "Enrolled"
    ↓
EnrollmentAuditLog entries created for each action:
  - Action: "Portal Access Granted"
  - Action: "Portal Password Changed"
  - Action: "Enrollment Completed"
  - Action: "Status Updated" (with before/after)
    ↓
Student account is now ACTIVE
```

**Key Models & Methods:**

```php
// Student portal login
$credential = PortalCredential::where('username', $username)->first();
if ($credential) {
    $credential->recordLogin();  // Updates first_login_at, last_login_at, resets attempts
}

// Create/activate student from application
$student = Student::firstOrCreate(
    ['applicant_personal_data_id' => $personalData->id],
    [
        'applicant_application_info_id' => $application->id,
        'enrollment_date' => now(),
        'enrollment_status' => 'Active',
        'portal_access_active' => true,
    ]
);

// Activate portal access
$student->activatePortalAccess();

// Complete enrollment
$student->completeEnrollment();

// Log action to audit trail
EnrollmentAuditLog::logAction(
    $student,
    'Enrollment Completed',
    'Active',
    'Pending',
    'Student successfully enrolled',
    auth()->user()->name,
    request()->ip(),
    $application
);

// Query students
$activeStudents = Student::active()->get();
$portalActiveStudents = Student::portalAccessActive()->get();
```

---

## 📊 Data Model Visualization

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│  applicant_personal_data                                               │
│  ├── Basic Info (name, DOB, gender, etc.)                              │
│  ├── Contact (email, phone, address)                                   │
│  ├── Medical (health conditions, doctors notes)                        │
│  │                                                                      │
│  ├──→ applicant_family_background (1)                                  │
│  ├──→ applicant_siblings (Many)                                        │
│  ├──→ portal_credential (1) ✨                                         │
│  ├──→ assessment (Many) ✨                                             │
│  ├──→ student (1)                                                      │
│  │                                                                      │
│  └──→ applicant_application_info (Many)                                │
│       ├── Application status tracking                                  │
│       ├── Year level, strand, category                                 │
│       ├── School year, semester                                        │
│       │                                                                 │
│       ├──→ applicant_educational_background (Many)                     │
│       ├──→ applicant_documents (1)                                     │
│       ├──→ assessment (Many) ✨                                        │
│       ├──→ portal_credential (1) ✨                                    │
│       ├──→ enrollment_audit_logs (Many) ✨                             │
│       │                                                                 │
│       └──→ student (1)                                                 │
│            ├── Enrollment status tracking                              │
│            ├── Portal access info                                      │
│            ├── Current academics (year level, semester, school year)   │
│            └──→ enrollment_audit_logs (Many) ✨                        │
│                                                                         │
│  ✨ = New tables added for this implementation                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🔑 Key Database Features

### 1. Assessment Tracking

- Multiple assessments per applicant (exams, interviews, practicals)
- Score tracking with percentage calculation
- Pass/Fail result management
- Assessor feedback and remarks

### 2. Portal Credential Management

- Secure username generation
- Temporary password generation with required complexity
- Access status management (Active/Inactive/Suspended)
- Automatic suspension after 5 failed login attempts
- Password change tracking

### 3. Login Security

- First login tracking (for forcing password change flows)
- Last login tracking
- Failed login attempt counter
- Automatic suspension when attempts exceed threshold
- Session tracking capability

### 4. Student Enrollment Management

- Separate portal enrollment date from initial admission
- Portal access status tracking
- Current academic info storage
- Enrollment status tracking (Pending/Active/Inactive/Graduated/Dropped)

### 5. Complete Audit Trail

- Timestamp for every action
- User who performed the action
- IP address of the action
- Before/after status tracking
- Action description for context
- Easy querying and reporting

---

## 🛠️ Practical Usage Examples

### Recording an Exam Assessment

```php
use App\Models\Assessment;

// Admin enters exam results
$assessment = Assessment::create([
    'applicant_application_info_id' => $application->id,
    'applicant_personal_data_id' => $application->applicant_personal_data_id,
    'assessment_type' => 'Written Exam',
    'assessment_date' => Carbon::parse('2026-02-15'),
    'assessment_status' => 'Completed',
    'score' => 78.5,
    'total_score' => 100,
    'result' => $assessment->score_percentage >= 70 ? 'Pass' : 'Fail',
    'assessed_by' => 'Dr. Smith',
    'assessor_remarks' => 'Good performance in Math, needs improvement in Science',
    'feedback' => 'Overall satisfactory. Proceed to enrollment phase.',
]);

// Update application status
$application->update([
    'application_status' => 'Exam Taken',
    'examination_date' => now(),
]);
```

### Generating and Sending Portal Credentials

```php
use App\Models\PortalCredential;

// Generate credentials for approved applicants
foreach ($approvedApplications as $application) {
    $credential = PortalCredential::create([
        'applicant_personal_data_id' => $application->personalData->id,
        'applicant_application_info_id' => $application->id,
        'username' => 'applicant.' . strtolower($application->personalData->last_name),
        'temporary_password' => (new PortalCredential())->generateTemporaryPassword(),
        'access_status' => 'Active',
        'created_by' => auth()->user()->name,
    ]);

    // Send via email
    Mail::to($application->personalData->email)->send(
        new PortalCredentialsMail($credential)
    );

    // Mark as sent
    $credential->markCredentialsSent('Email');
}
```

### Processing Student Portal Enrollment

```php
use App\Models\Student, App\Models\EnrollmentAuditLog;

// When student completes enrollment
$credential = PortalCredential::where('username', $username)->first();

// Record login
if ($credential) {
    $credential->recordLogin();
}

// Create/update student record
$application = $credential->application;
$student = Student::updateOrCreate(
    ['applicant_personal_data_id' => $credential->applicant_personal_data_id],
    [
        'applicant_application_info_id' => $application->id,
        'enrollment_status' => 'Active',
        'enrollment_date' => now(),
        'portal_enrollment_date' => now(),
        'portal_username' => $credential->username,
        'portal_access_active' => true,
        'current_year_level' => $application->year_level,
        'current_semester' => $application->semester,
        'current_school_year' => $application->school_year,
    ]
);

// Log key actions
EnrollmentAuditLog::logAction(
    $student,
    'Portal Access Granted',
    null,
    null,
    'Portal access activated for student enrollment',
    auth()->user()->name,
    request()->ip(),
    $application
);

EnrollmentAuditLog::logAction(
    $student,
    'Enrollment Completed',
    'Active',
    'Pending',
    'Student successfully enrolled through portal',
    'System',
    request()->ip(),
    $application
);
```

### Querying and Reporting

```php
// Get all pending assessments
$pendingAssessments = Assessment::pending()->get();

// Get assessments for specific applicant
$assessments = $application->assessments()->orderBy('assessment_date')->get();

// Get students with active portal access
$activeStudents = Student::portalAccessActive()->get();

// Get enrollment audit trail for a student
$auditLog = $student->auditLogs()->recent(7)->get(); // Last 7 days

// Find suspended portal accounts
$suspended = PortalCredential::suspended()->get();

// Get students who haven't logged in
$neverLogged = PortalCredential::whereNull('first_login_at')->get();

// Get recent enrollments
$newEnrollments = Student::where('portal_enrollment_date', '>=', now()->subDays(30))->get();
```

---

## ✅ Migration Checklist

Before going live, run these commands:

```bash
# 1. Create migrations (already done)
# Migrations are ready in: database/migrations/

# 2. Run migrations to create tables
php artisan migrate

# 3. Verify tables were created
php artisan tinker
>>> DB::table('assessments')->count();
>>> DB::table('portal_credentials')->count();
>>> DB::table('enrollment_audit_logs')->count();

# 4. Test models
>>> $assessment = Assessment::first();
>>> $assessment->application;  # Should work

# 5. Test scopes
>>> Assessment::passed()->count();
>>> PortalCredential::active()->count();
```

---

## 📝 Documentation Files

- **DATABASE_SCHEMA.md** - Detailed table descriptions and relationships
- **SETUP_SUMMARY.md** - Summary of what was added
- **This file** - Implementation guide and usage examples

---

## 🎓 Next Steps

1. **Create Controllers** for managing assessments and portal credentials
2. **Create Views/Components** for admin interface
3. **Add Routes** for new features
4. **Create Notifications** for sending credentials and results
5. **Add Tests** for new functionality
6. **Implement Portal Frontend** for student enrollment

---

## 📞 Support

All new models include:

- ✅ Full relationships
- ✅ Useful scopes for filtering
- ✅ Helper methods for common actions
- ✅ Type hints for IDE autocomplete
- ✅ Inline documentation

Refer to model files for detailed method signatures and examples.
