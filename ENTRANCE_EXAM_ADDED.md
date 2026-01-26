# ✅ Entrance Exam Support Added

## What's New

Added comprehensive support for entrance exams as part of the student admission assessment phase.

---

## 📁 Files Created

### 1. Migration

**File:** `database/migrations/2026_01_16_000005_create_entrance_exams_table.php`

Creates the `entrance_exams` table with support for:

- Exam scheduling (date, time, venue, seat assignment)
- Exam status tracking (Scheduled, Completed, Cancelled, No-show)
- Score recording (raw score, percentage, passing score)
- Section/subject breakdown scores (JSON)
- Document storage (answer sheets, certificates)
- Invigilator remarks and tracking

### 2. Model

**File:** `app/Models/EntranceExam.php`

Features:

- Relationships with `ApplicantApplicationInfo` and `ApplicantPersonalData`
- 8 query scopes for filtering (scheduled, completed, passed, failed, upcoming, overdue, etc.)
- 10+ helper methods for exam management
- Auto-calculation of percentages and results
- Section/subject score management
- Exam timing validation

### 3. Documentation

**File:** `ENTRANCE_EXAM_GUIDE.md`

Complete guide including:

- Table structure and field specifications
- All relationships and scopes
- Usage examples and workflows
- Integration with the assessment flow
- Best practices

### 4. Updated Models (Enhanced)

- `ApplicantApplicationInfo.php` - Added `entranceExam()` relationship
- `ApplicantPersonalData.php` - Added `entranceExam()` relationship
- `Student.php` - Added `entranceExam()` relationship (via hasOneThrough)

### 5. Updated Documentation Files

- `DATABASE_SCHEMA.md` - Added entrance_exams table documentation
- `QUICK_START.md` - Added entrance exam examples

---

## 🎯 Complete Workflow with Entrance Exams

```
APPLICATION SUBMITTED
        ↓
   ↓─── ENTRANCE EXAM ✨ NEW ───↓
   │    (Entrance exam for new applicants)
   │    ├─ Scheduled with date/time/venue
   │    ├─ Applicant takes exam
   │    ├─ Results recorded with scores
   │    └─ Pass/Fail determined
   │
   ├─ PASSED → Continue to Credentials
   │
   └─ FAILED → End or allow retake

ENTRANCE EXAM PASSED
        ↓
  OTHER ASSESSMENTS (if needed)
  ├─ Interviews
  ├─ Practical tests
  └─ Other evaluations
        ↓
 PORTAL CREDENTIALS SENT
        ↓
   STUDENT ENROLLMENT
```

---

## 📊 Database Table: `entrance_exams`

| Field                           | Type     | Purpose                                |
| ------------------------------- | -------- | -------------------------------------- |
| `id`                            | Integer  | Primary key                            |
| `applicant_application_info_id` | FK       | Link to application                    |
| `applicant_personal_data_id`    | FK       | Link to applicant                      |
| `exam_scheduled_date`           | DateTime | When exam will happen                  |
| `exam_time`                     | Time     | Time of exam (e.g., "09:00 AM")        |
| `exam_venue`                    | String   | Location/building                      |
| `exam_room_number`              | String   | Room/hall number                       |
| `seat_number`                   | String   | Assigned seat                          |
| `exam_status`                   | String   | Scheduled/Completed/Cancelled/No-show  |
| `exam_completed_date`           | DateTime | When exam was completed                |
| `raw_score`                     | Decimal  | Marks obtained                         |
| `total_marks`                   | Decimal  | Maximum marks (default: 100)           |
| `percentage_score`              | Decimal  | Auto-calculated %                      |
| `passing_score`                 | Decimal  | Required to pass                       |
| `result`                        | Enum     | Pass/Fail/Pending                      |
| `section_scores`                | JSON     | Multiple sections: {"Math": 45}        |
| `subject_scores`                | JSON     | Multiple subjects: {"Mathematics": 85} |
| `exam_remarks`                  | Text     | General remarks                        |
| `invigilator_name`              | String   | Exam proctor name                      |
| `invigilator_remarks`           | Text     | Proctor notes                          |
| `exam_answer_sheet_path`        | String   | Document path                          |
| `exam_result_certificate_path`  | String   | Document path                          |

---

## 🎓 Key Methods

### Exam Completion

```php
// Complete exam and auto-calculate result
$entranceExam->markCompleted(
    rawScore: 78,
    totalMarks: 100,
    passingScore: 50
);
// Automatically:
// - Calculates percentage (78%)
// - Determines result (Pass if ≥ 50)
// - Sets exam_status to 'Completed'
// - Records exam_completed_date
```

### Status Management

```php
$entranceExam->markCancelled('Facility closed');
$entranceExam->markNoShow('Applicant did not appear');
```

### Score Breakdown

```php
$entranceExam->addSectionScore('Reading', 35);
$entranceExam->addSectionScore('Writing', 28);

$entranceExam->addSubjectScore('Mathematics', 85);
$entranceExam->addSubjectScore('Science', 78);
```

### Exam Timing

```php
// Check if exam is happening now
if ($entranceExam->isWithinExamWindow()) {
    // Start exam
}

// Get time until exam
$timeLeft = $entranceExam->getTimeUntilExam();
// Returns: "in 2 days"
```

### Calculations

```php
$percentage = $entranceExam->calculatePercentage();
// Returns: 78.5

$result = $entranceExam->determineResult();
// Returns: "Pass" or "Fail"
```

---

## 📚 Query Examples

### Find All Scheduled Exams

```php
$scheduled = EntranceExam::scheduled()
    ->orderBy('exam_scheduled_date')
    ->get();
```

### Find Passing Applicants

```php
$passed = EntranceExam::passed()->get();

// With scores above 80%
$highScorers = EntranceExam::passed()
    ->where('percentage_score', '>=', 80)
    ->get();
```

### Find Failed Applicants

```php
$failed = EntranceExam::failed()->get();
```

### Find Upcoming Exams

```php
$upcoming = EntranceExam::upcoming()
    ->orderBy('exam_scheduled_date')
    ->get();
```

### Find Overdue Exams

```php
$overdue = EntranceExam::overdue()->get();
// Scheduled but not completed
```

### Generate Reports

```php
$totalExams = EntranceExam::completed()->count();
$passRate = EntranceExam::passed()->count() / $totalExams * 100;
$avgScore = EntranceExam::completed()->average('percentage_score');
```

---

## 🔄 Integration Points

### With Application Flow

```php
// When applicant passes entrance exam
$entranceExam->markCompleted(78, 100, 50);

if ($entranceExam->result === 'Pass') {
    // Update application status
    $entranceExam->application->update([
        'application_status' => 'Exam Taken',
        'examination_date' => now(),
    ]);

    // Proceed to portal credentials phase
    // PortalCredential::create(...)
}
```

### With Student Record

```php
// Access entrance exam through student
$student = Student::find($id);
$entranceExam = $student->entranceExam;

// Check entrance exam result
if ($entranceExam && $entranceExam->result === 'Pass') {
    // Continue enrollment
}
```

### With Application Info

```php
// Get entrance exam for application
$application = ApplicantApplicationInfo::find($id);
$entranceExam = $application->entranceExam;

if ($entranceExam) {
    echo "Exam Status: " . $entranceExam->exam_status;
    echo "Result: " . $entranceExam->result;
    echo "Score: " . $entranceExam->percentage_score . "%";
}
```

---

## 🚀 Usage Workflow

### Step 1: Create Entrance Exam

```php
$entranceExam = EntranceExam::create([
    'applicant_application_info_id' => $application->id,
    'applicant_personal_data_id' => $application->applicant_personal_data_id,
    'exam_scheduled_date' => Carbon::parse('2026-02-20 09:00:00'),
    'exam_venue' => 'Main Campus',
    'exam_room_number' => '204',
    'seat_number' => 'A-15',
    'passing_score' => 50,
]);
```

### Step 2: Notify Applicant

```php
// Send email with exam details
Mail::to($personalData->email)->send(
    new EntranceExamScheduledMail($entranceExam)
);
```

### Step 3: Conduct Exam

```php
// On exam day, verify applicant can take exam
if ($entranceExam->isWithinExamWindow()) {
    // Start exam
}
```

### Step 4: Record Results

```php
// After exam evaluation
$entranceExam->markCompleted(
    rawScore: 78,
    totalMarks: 100,
    passingScore: 50
);

// Add invigilator remarks
$entranceExam->update([
    'invigilator_name' => 'Ms. Sarah',
    'invigilator_remarks' => 'Well-behaved applicant',
]);
```

### Step 5: Notify Applicant

```php
// Notify result
if ($entranceExam->result === 'Pass') {
    Mail::to($personalData->email)->send(
        new EntranceExamPassedMail($entranceExam)
    );
} else {
    Mail::to($personalData->email)->send(
        new EntranceExamFailedMail($entranceExam)
    );
}
```

---

## ✅ Running the Migration

```bash
php artisan migrate
```

Verify:

```bash
php artisan tinker
>>> Schema::hasTable('entrance_exams')
>>> true

>>> $exam = App\Models\EntranceExam::create([...])
>>> $exam->save()
```

---

## 📖 Documentation

For detailed information, see:

- **[ENTRANCE_EXAM_GUIDE.md](ENTRANCE_EXAM_GUIDE.md)** - Complete reference
- **[DATABASE_SCHEMA.md](DATABASE_SCHEMA.md#7-entrance_exams)** - Table specs
- **[QUICK_START.md](QUICK_START.md)** - Quick examples

---

## Summary

✅ Added `entrance_exams` table for new applicant entrance exams
✅ Created `EntranceExam` model with comprehensive features
✅ 8 query scopes for easy filtering
✅ 10+ helper methods for exam management
✅ Auto-calculation of scores and results
✅ Section/subject score breakdown support
✅ Complete audit trail with invigilator tracking
✅ Document storage for answer sheets and certificates
✅ Integrated with existing application flow
✅ Updated all documentation

**Ready to use! Run `php artisan migrate`** 🚀
