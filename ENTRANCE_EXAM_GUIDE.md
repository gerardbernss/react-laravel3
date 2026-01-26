# Entrance Exam Management - Documentation

## Overview

The entrance exam feature provides comprehensive support for managing applicant entrance exams, including scheduling, administration, result recording, and tracking.

---

## Database Table: `entrance_exams`

### Purpose

Track all details related to entrance exam administration for new applicants, including scheduling, exam details, administration, and results.

### Table Structure

#### Scheduling Fields

- `exam_scheduled_date` - When the exam is scheduled to be held
- `exam_time` - Time the exam will be conducted
- `exam_venue` - Physical location/building where exam is held
- `exam_room_number` - Specific room/hall number
- `seat_number` - Assigned seat for the applicant

#### Status Tracking

- `exam_status` - Current status: "Scheduled", "Completed", "Cancelled", "No-show"
- `exam_completed_date` - Actual date when exam was completed

#### Score Fields

- `raw_score` - Actual marks obtained by applicant
- `total_marks` - Maximum possible marks (default: 100)
- `percentage_score` - Calculated percentage (auto-calculated)
- `passing_score` - Minimum score required to pass
- `result` - Result status: "Pass", "Fail", "Pending"

#### Detailed Scoring

- `section_scores` - JSON field for multiple exam sections (e.g., Math: 45, English: 32)
- `subject_scores` - JSON field for multiple subjects (e.g., Mathematics: 85, Science: 78)

#### Remarks & Administration

- `exam_remarks` - General remarks about the exam or result
- `invigilator_remarks` - Remarks from the exam invigilator/proctor
- `invigilator_name` - Name of person who supervised the exam

#### Document Storage

- `exam_answer_sheet_path` - Path to stored answer sheets/responses
- `exam_result_certificate_path` - Path to result certificate/document

#### Foreign Keys

- `applicant_application_info_id` - Link to application
- `applicant_personal_data_id` - Link to applicant's personal data

---

## Model: EntranceExam

### Relationships

```php
// Get the application
$entranceExam->application()  // belongsTo ApplicantApplicationInfo

// Get the applicant's personal data
$entranceExam->personalData()  // belongsTo ApplicantPersonalData

// Through Student (if available)
$student->entranceExam()  // hasOneThrough EntranceExam
```

### Query Scopes

```php
// Status-based scopes
EntranceExam::scheduled()->get()      // Get all scheduled exams
EntranceExam::completed()->get()      // Get all completed exams
EntranceExam::cancelled()->get()      // Get all cancelled exams
EntranceExam::noShow()->get()         // Get all no-show cases

// Result-based scopes
EntranceExam::passed()->get()         // Get all passing applicants
EntranceExam::failed()->get()         // Get all failing applicants
EntranceExam::pending()->get()        // Get pending results

// Date-based scopes
EntranceExam::upcoming()->get()       // Get exams scheduled in future
EntranceExam::overdue()->get()        // Get overdue uncompleted exams
```

### Methods & Helpers

#### Score Calculation

```php
// Calculate percentage from raw score
$percentage = $entranceExam->calculatePercentage();
// Returns: 78.5 (for 78.5/100)

// Determine Pass/Fail based on passing score
$result = $entranceExam->determineResult();
// Returns: "Pass" or "Fail"
```

#### Exam Completion

```php
// Mark exam as completed with scores
$entranceExam->markCompleted(
    rawScore: 85,
    totalMarks: 100,
    passingScore: 50
);
// Automatically calculates percentage and result

// Mark exam as cancelled
$entranceExam->markCancelled('Technical issues during exam');

// Mark applicant as no-show
$entranceExam->markNoShow('Applicant did not appear for exam');
```

#### Exam Timing Checks

```php
// Check if exam is within the scheduled time window
$isActive = $entranceExam->isWithinExamWindow(bufferMinutes: 15);
// Returns: true/false

// Get human-readable time until exam
$timeLeft = $entranceExam->getTimeUntilExam();
// Returns: "in 2 days" or null if exam has passed
```

#### Section/Subject Score Management

```php
// Get a specific section score
$mathScore = $entranceExam->getSectionScore('Mathematics');
// Returns: 45 (from section_scores JSON)

// Get a specific subject score
$scienceScore = $entranceExam->getSubjectScore('Science');
// Returns: 78 (from subject_scores JSON)

// Add a section score
$entranceExam->addSectionScore('Mathematics', 45);
$entranceExam->addSectionScore('English', 38);

// Add a subject score
$entranceExam->addSubjectScore('Mathematics', 85);
$entranceExam->addSubjectScore('Science', 78);
```

---

## Complete Workflow: Entrance Exam

```
┌────────────────────────────────────────────────────────────┐
│              ENTRANCE EXAM WORKFLOW                        │
└────────────────────────────────────────────────────────────┘

PHASE 1: EXAM SCHEDULING
├─ Admin reviews pending applications
├─ Creates entrance exam record for qualified applicants
├─ Sets exam date, time, venue, seat number
├─ Exam status: "Scheduled"
└─ Applicants notified of exam details

PHASE 2: EXAM ADMINISTRATION
├─ Exam date arrives
├─ Applicant checks in
├─ Verified: exam_status = "Scheduled"
│  and exam_scheduled_date is now/soon
├─ Exam conducted under supervision
├─ Invigilator monitors and notes remarks
└─ Answer sheets collected

PHASE 3: RESULT RECORDING
├─ Exam papers evaluated
├─ Marks entered:
│  ├─ raw_score (actual marks)
│  ├─ section_scores (if applicable)
│  └─ subject_scores (if applicable)
├─ markCompleted() method called:
│  ├─ percentage_score auto-calculated
│  ├─ result determined (Pass/Fail)
│  └─ exam_status set to "Completed"
└─ Invigilator remarks recorded

PHASE 4: RESULT NOTIFICATION
├─ Applicant informed of result
├─ Pass → Proceed to portal credentials
├─ Fail → Can retake (if allowed) or end process
└─ Result certificate generated and stored
```

---

## Usage Examples

### Create & Schedule Entrance Exam

```php
use App\Models\EntranceExam;
use Carbon\Carbon;

// Create entrance exam for an applicant
$entranceExam = EntranceExam::create([
    'applicant_application_info_id' => $application->id,
    'applicant_personal_data_id' => $application->applicant_personal_data_id,
    'exam_scheduled_date' => Carbon::parse('2026-02-20 09:00:00'),
    'exam_time' => '09:00 AM',
    'exam_venue' => 'Main Campus Building A',
    'exam_room_number' => 'Room 204',
    'seat_number' => 'A-15',
    'exam_status' => 'Scheduled',
    'passing_score' => 50,
]);
```

### Record Exam Results

```php
// Method 1: Using markCompleted()
$entranceExam->markCompleted(
    rawScore: 78,
    totalMarks: 100,
    passingScore: 50
);
// Automatically calculates percentage (78%) and result (Pass)

// Method 2: Manual entry with section scores
$entranceExam->markCompleted(78, 100, 50);

// Add section-wise scores
$entranceExam->addSectionScore('Reading', 35)
    ->addSectionScore('Writing', 28)
    ->addSectionScore('Listening', 15);

// Add subject-wise scores (if applicable)
$entranceExam->addSubjectScore('English', 78)
    ->addSubjectScore('Mathematics', 82)
    ->addSubjectScore('General Knowledge', 65);

// Add invigilator remarks
$entranceExam->update([
    'invigilator_name' => 'Ms. Sarah Johnson',
    'invigilator_remarks' => 'Well-behaved applicant. No irregularities noted.',
]);
```

### Query & Filter Exams

```php
// Get all scheduled exams
$scheduledExams = EntranceExam::scheduled()->get();

// Get all passed applicants
$passedApplicants = EntranceExam::passed()->get();

// Get upcoming exams
$upcomingExams = EntranceExam::upcoming()
    ->orderBy('exam_scheduled_date')
    ->get();

// Get failed applicants from last month
$failedLastMonth = EntranceExam::failed()
    ->whereBetween('exam_completed_date', [
        now()->subMonth(),
        now()
    ])
    ->get();

// Get applicants with no-show status
$noShows = EntranceExam::noShow()->get();

// Get overdue exams (scheduled but not completed)
$overdueExams = EntranceExam::overdue()->get();

// Get exam results with scores above 80%
$highScorers = EntranceExam::completed()
    ->where('percentage_score', '>=', 80)
    ->get();
```

### Check Exam Timing

```php
// Check if exam is happening now (within 15 minute window)
if ($entranceExam->isWithinExamWindow()) {
    // Start exam
}

// Get time until exam in human-readable format
$timeUntilExam = $entranceExam->getTimeUntilExam();
// Output: "in 2 days" or "in 4 hours" or null

// Check if exam has passed
if ($entranceExam->exam_scheduled_date < now()) {
    // Exam has passed
}
```

### Update Application Status Based on Exam Result

```php
use App\Models\EntranceExam;

// When exam result is recorded
$entranceExam->markCompleted(rawScore: 75, totalMarks: 100);

// Update the application based on result
$application = $entranceExam->application;

if ($entranceExam->result === 'Pass') {
    // Applicant passed - proceed to next phase
    $application->update([
        'application_status' => 'Exam Taken',
        'examination_date' => now(),
    ]);

    // Next: Send portal credentials

} else if ($entranceExam->result === 'Fail') {
    // Applicant failed
    $application->update([
        'remarks' => 'Failed entrance exam. Score: ' . $entranceExam->percentage_score . '%',
    ]);

    // Next: Notify applicant of failure and options
}
```

### Generate Exam Reports

```php
// Get entrance exam statistics
$totalExams = EntranceExam::completed()->count();
$passedCount = EntranceExam::passed()->count();
$failedCount = EntranceExam::failed()->count();
$passRate = ($passedCount / $totalExams) * 100;

// Get average score
$avgScore = EntranceExam::completed()
    ->average('percentage_score');

// Get section-wise statistics
$exams = EntranceExam::completed()->get();

foreach ($exams as $exam) {
    if ($exam->section_scores) {
        foreach ($exam->section_scores as $section => $score) {
            // Process section scores
        }
    }
}

// Applicant with highest score
$topApplicant = EntranceExam::passed()
    ->orderByDesc('percentage_score')
    ->first();

// Students by score range
$excellent = EntranceExam::passed()
    ->whereBetween('percentage_score', [90, 100])->count();
$good = EntranceExam::passed()
    ->whereBetween('percentage_score', [75, 89])->count();
$satisfactory = EntranceExam::passed()
    ->whereBetween('percentage_score', [50, 74])->count();
```

### Manage Exam Cancellations/No-shows

```php
// Cancel an exam
$entranceExam->markCancelled('Facility closed due to technical issues');

// Mark as no-show
$entranceExam->markNoShow('Applicant absent despite confirmation');

// Reschedule exam
$entranceExam->update([
    'exam_status' => 'Scheduled',
    'exam_scheduled_date' => Carbon::parse('2026-03-05 10:00:00'),
    'exam_venue' => 'Alternative venue',
    'exam_remarks' => 'Rescheduled due to original cancellation',
]);
```

---

## Integration with Assessment Flow

The entrance exam is part of the broader assessment system:

```
Assessment Table (Generic)
├── Used for: Interviews, practical tests, other assessments
└── Type: Flexible, multiple per applicant

EntranceExam Table (Specific)
├── Used for: Entrance exam specifically
├── Features: Venue, seat assignment, sections, subjects
└── Scope: One per applicant (typically)

Relationship:
- EntranceExam is a more detailed, specific assessment
- Can exist alongside generic assessments
- Application status changes based on exam results
```

---

## Field Specifications

### exam_status Options

```
Scheduled    - Exam has been scheduled, waiting to happen
Completed    - Exam has been conducted and marked
Cancelled    - Exam was cancelled (facility, admin reason)
No-show      - Applicant did not appear for scheduled exam
```

### result Options

```
Pass         - Applicant scored at or above passing score
Fail         - Applicant scored below passing score
Pending      - Exam result not yet recorded/determined
```

### Score Fields

All score fields use `decimal(5, 2)` format allowing for:

- Integer scores: 50, 75, 100
- Decimal scores: 78.50, 89.75, 95.25
- Percentages: 78.50, 92.75

### JSON Fields (Array Storage)

#### section_scores

```json
{
    "Reading": 35,
    "Writing": 28,
    "Listening": 15,
    "Speaking": 22
}
```

#### subject_scores

```json
{
    "Mathematics": 85,
    "Science": 78,
    "English": 88,
    "General Knowledge": 72
}
```

---

## Best Practices

1. **Always use markCompleted()** instead of manually updating exam_status
    - Ensures percentage and result are correctly calculated
    - Maintains data integrity

2. **Store document paths** for audit trail
    - Keep exam answer sheets
    - Store result certificates
    - Enable dispute resolution

3. **Use scopes for queries** for consistency
    - Instead of: `where('exam_status', 'Scheduled')`
    - Use: `scheduled()`

4. **Record invigilator details** for accountability
    - Name and remarks
    - Helps in case of disputes

5. **Set passing_score explicitly**
    - Don't rely on defaults
    - Different exams may have different passing scores

6. **Use section/subject scores** for detailed feedback
    - Helps applicants understand strengths/weaknesses
    - Useful for admission committees

7. **Maintain audit trail**
    - Record all exam status changes in enrollment_audit_logs
    - Use timestamp fields for tracking

---

## Related Models

- **ApplicantApplicationInfo** - Parent application record
- **ApplicantPersonalData** - Applicant's personal details
- **Student** - (Post-enrollment) access via hasOneThrough
- **Assessment** - Generic assessment records for other evaluations

---

## Database Performance

All critical fields are indexed:

- `applicant_application_info_id` - For quick application lookup
- `applicant_personal_data_id` - For quick applicant lookup
- `exam_status` - For filtering by status
- `exam_scheduled_date` - For date range queries
- `result` - For result-based filtering

---

## Migration Information

Migration file: `2026_01_16_000005_create_entrance_exams_table.php`

Run migrations to create the table:

```bash
php artisan migrate
```

Verify:

```bash
php artisan tinker
>>> Schema::hasTable('entrance_exams')
>>> true
```
