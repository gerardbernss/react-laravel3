# Admissions System - Frontend Components Documentation

## Overview

This document provides comprehensive guidance for the React/Inertia.js frontend components used in the Student Admissions System.

## Project Structure

```
resources/js/Pages/Admissions/
├── EntranceExams/
│   ├── Index.jsx          # List all entrance exams with filters
│   ├── Form.jsx           # Create/Edit entrance exam
│   ├── RecordResults.jsx  # Record exam results and scores
│   └── Show.jsx           # View entrance exam details
├── PortalCredentials/
│   ├── Index.jsx          # List all portal credentials
│   ├── Create.jsx         # Create new portal credential
│   └── Show.jsx           # View credential details and manage access
├── Enrollment/
│   ├── Dashboard.jsx      # Enrollment overview and student list
│   └── Show.jsx           # View student enrollment details
└── Assessments/
    ├── Index.jsx          # List all assessments
    ├── Form.jsx           # Create/Edit assessment
    └── Show.jsx           # View assessment details
```

## Component Details

### 1. Entrance Exams Management

#### EntranceExams/Index.jsx

**Purpose:** Display list of entrance exams with filtering and management options

**Features:**

- List all entrance exams with pagination
- Filter by:
    - Applicant name/email (search)
    - Exam status (scheduled, in-progress, completed, cancelled)
    - Student category (SHS, JHS, LES)
- View exam details
- Record exam results
- Edit scheduled exams
- Cancel exams

**Props Expected:**

```javascript
{
  auth: { user: User },
  exams: {
    data: Array<EntranceExam>,
    links: Array<Link>  // Pagination links
  },
  filters: {
    search?: string,
    status?: string,
    category?: string
  }
}
```

#### EntranceExams/Form.jsx

**Purpose:** Schedule a new entrance exam or edit existing exam details

**Features:**

- Select applicant from dropdown
- Set exam date (future dates only)
- Set exam time
- Assign venue, room, and seat
- Configure scoring (total marks, passing score)
- Add optional exam instructions

**Props Expected:**

```javascript
{
  auth: { user: User },
  exam?: EntranceExam,  // Optional, for editing
  applicants: Array<Applicant>
}
```

**Key Logic:**

- Validation ensures exam date is in the future
- Pre-fills data when editing (applicant field disabled)
- Form resets on successful submission

#### EntranceExams/RecordResults.jsx

**Purpose:** Record detailed exam results including scores and invigilator details

**Features:**

- Display applicant and exam information
- Record overall score
- Add section scores (English, Mathematics, etc.)
- Add subject scores (Filipino, Science, etc.)
- Record invigilator details (name, signature)
- Auto-calculate percentage and pass/fail status
- Add optional remarks

**Props Expected:**

```javascript
{
  auth: { user: User },
  exam: EntranceExam
}
```

**Score Structure:**

```javascript
{
  raw_score: number,
  total_marks: number,
  passing_score: number,
  percentage: calculated,
  section_scores: {
    section_1: { name: string, score: number, total: number },
    // ...
  },
  subject_scores: {
    subject_1: { name: string, score: number, total: number },
    // ...
  }
}
```

#### EntranceExams/Show.jsx

**Purpose:** Display comprehensive exam details and results

**Features:**

- Show applicant information
- Display exam schedule details
- Show exam configuration
- Display results if available:
    - Overall score and percentage
    - Section-wise scores
    - Subject-wise scores
    - Invigilator information
    - Remarks
- Action buttons (Edit, Record Results)

**Props Expected:**

```javascript
{
  auth: { user: User },
  exam: EntranceExam (with relationships loaded)
}
```

---

### 2. Portal Credentials Management

#### PortalCredentials/Index.jsx

**Purpose:** Manage applicant portal access credentials

**Features:**

- List all portal credentials with status indicators
- Filter by:
    - Applicant name/email/username (search)
    - Access status (active, inactive, suspended)
- Quick actions:
    - Send credentials (first-time)
    - Resend credentials
    - Suspend/Reactivate access
    - View details
- Display login attempt tracking
- Show credential sent date

**Props Expected:**

```javascript
{
  auth: { user: User },
  credentials: {
    data: Array<PortalCredential>,
    links: Array<Link>
  },
  filters: {
    search?: string,
    status?: string
  }
}
```

**Status Indicators:**

- Active: Green badge
- Inactive: Yellow badge
- Suspended: Red badge

#### PortalCredentials/Create.jsx

**Purpose:** Create new portal credentials for an applicant

**Features:**

- Select applicant from dropdown
- Display applicant summary (email, category, phone)
- Generate or manually enter portal username
- Auto-generate button creates username from applicant name
- Shows informational notices about temporary passwords

**Props Expected:**

```javascript
{
  auth: { user: User },
  applicants: Array<Applicant>
}
```

**Validation Rules:**

- Username must be unique
- Username allows alphanumeric characters and dots only
- Applicant selection is required

#### PortalCredentials/Show.jsx

**Purpose:** Manage detailed portal credential settings

**Features:**

- Display applicant and credential information
- Show portal access status
- Track login activity:
    - Last login date
    - Failed login attempts counter
    - Lock notification if attempts >= 3
- Password management:
    - Reset password (generates new temp password)
    - Send initial credentials
    - Resend credentials
- Access control:
    - Suspend access
    - Reactivate suspended access
- Display credential sent date

**Props Expected:**

```javascript
{
  auth: { user: User },
  credential: PortalCredential
}
```

**Key Logic:**

- Shows suspension status alert if suspended
- Enables/disables actions based on current state
- Tracks and displays login attempts
- Confirms actions before execution

---

### 3. Enrollment Management

#### Enrollment/Dashboard.jsx

**Purpose:** Overview of student enrollment status and management

**Features:**

- Statistics cards showing:
    - Total students
    - Enrolled count
    - Pending count
    - Link to reports
- Search and filter students by:
    - Name/email
    - Enrollment status (enrolled, pending, rejected)
- Student list with details:
    - Portal username
    - Category
    - Enrollment status
    - Enrollment date
    - Portal access status
- Quick actions:
    - View details
    - Complete enrollment (for pending)
    - Deactivate portal access (for active)

**Props Expected:**

```javascript
{
  auth: { user: User },
  students: {
    data: Array<Student>,
    links: Array<Link>
  },
  filters: {
    search?: string,
    status?: string
  }
}
```

#### Enrollment/Show.jsx

**Purpose:** Detailed student enrollment and portal management

**Features:**

- Display student information
- Show enrollment status and details:
    - Current status
    - Enrollment date
    - Category
    - Year level
- Portal access management:
    - Username
    - Access status
    - Enrollment date
- Academic information:
    - School year
    - Semester
    - Year level
- Quick actions:
    - Complete enrollment
    - Activate portal access
    - Deactivate portal access
- Enrollment history/audit log (if available)

**Props Expected:**

```javascript
{
  auth: { user: User },
  student: Student,
  auditLogs?: Array<AuditLog>
}
```

---

### 4. Assessment Management

#### Assessments/Index.jsx

**Purpose:** Track all applicant assessments (interviews, tests, etc.)

**Features:**

- List all assessments with pagination
- Filter by:
    - Applicant name/email
    - Assessment type (interview, practical, written, performance, other)
    - Status (completed, pending, failed)
- Display assessment details:
    - Assessment type
    - Date
    - Status
    - Score and percentage
- Action buttons:
    - View details
    - Edit assessment
    - Delete assessment

**Props Expected:**

```javascript
{
  auth: { user: User },
  assessments: {
    data: Array<Assessment>,
    links: Array<Link>
  },
  filters: {
    search?: string,
    type?: string,
    status?: string
  }
}
```

#### Assessments/Form.jsx

**Purpose:** Create or edit assessment records

**Features:**

- Select applicant
- Choose assessment type:
    - Interview
    - Practical Test
    - Written Test
    - Performance Test
    - Other
- Set assessment date (past dates only)
- Record score and total score
- Auto-calculate percentage
- Enter assessor name
- Add remarks (optional)
- Add feedback (optional)

**Props Expected:**

```javascript
{
  auth: { user: User },
  assessment?: Assessment,  // Optional, for editing
  applicants: Array<Applicant>
}
```

**Validation:**

- Assessment date cannot be in future
- Score cannot exceed total score
- Assessor name optional but recommended

#### Assessments/Show.jsx

**Purpose:** Display assessment details and results

**Features:**

- Show applicant information
- Display assessment details
- Show score results:
    - Raw score
    - Total score
    - Percentage
    - Pass/fail status
- Display remarks (if any)
- Display feedback (if any)
- Show creation/update timestamps
- Action buttons (Edit, Back)

**Props Expected:**

```javascript
{
  auth: { user: User },
  assessment: Assessment
}
```

---

## Component Usage Guidelines

### Shared Components Used

All components utilize these common Inertia.js and custom components:

```javascript
import Authenticated from '@/Layouts/AuthenticatedLayout';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import DangerButton from '@/Components/DangerButton';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import { Badge, StatusBadge } from '@/Components/Badge';
import Table from '@/Components/Table';
import Pagination from '@/Components/Pagination';
import Modal from '@/Components/Modal';
```

### Form Handling

All form components use Inertia's `useForm` hook:

```javascript
const { data, setData, post, put, processing, errors } = useForm({
    // Form fields
});

const handleSubmit = (e) => {
    e.preventDefault();
    if (isEditing) {
        put(route('name.update', id));
    } else {
        post(route('name.store'));
    }
};
```

### Navigation

All navigation uses `Link` and `router` from `@inertiajs/react`:

```javascript
import { Link, router } from '@inertiajs/react';

// Navigation
<Link href={route('route.name')}>Link Text</Link>;

// Programmatic navigation
router.get(route('name'), { params });
router.post(route('name'), data);
router.delete(route('name', id));
```

### Error Handling

Form errors are displayed using `InputError` components:

```javascript
<InputError message={errors.fieldName} />
```

### Confirmation Dialogs

For destructive actions, use confirm():

```javascript
if (confirm('Are you sure?')) {
    router.delete(route('name', id));
}
```

---

## Route Mapping

### Entrance Exams Routes

- `entrance-exams.index` → List exams
- `entrance-exams.create` → Create form
- `entrance-exams.store` → Store (POST)
- `entrance-exams.show` → Show details
- `entrance-exams.edit` → Edit form
- `entrance-exams.update` → Update (PUT)
- `entrance-exams.recordResults` → Record results page
- `entrance-exams.storeResults` → Store results (POST)
- `entrance-exams.cancel` → Cancel exam
- `entrance-exams.noShow` → Mark no-show

### Portal Credentials Routes

- `portal-credentials.index` → List credentials
- `portal-credentials.create` → Create form
- `portal-credentials.store` → Store (POST)
- `portal-credentials.show` → Show details
- `portal-credentials.send` → Send credentials
- `portal-credentials.resend` → Resend credentials
- `portal-credentials.suspend` → Suspend access
- `portal-credentials.reactivate` → Reactivate access
- `portal-credentials.resetPassword` → Reset password

### Enrollment Routes

- `enrollment.dashboard` → Main dashboard
- `enrollment.show` → Student details
- `enrollment.activatePortal` → Activate access
- `enrollment.deactivatePortal` → Deactivate access
- `enrollment.complete` → Complete enrollment
- `enrollment.auditLog` → View audit log
- `enrollment.report` → View reports

### Assessment Routes

- `assessments.index` → List assessments
- `assessments.create` → Create form
- `assessments.store` → Store (POST)
- `assessments.show` → Show details
- `assessments.edit` → Edit form
- `assessments.update` → Update (PUT)
- `assessments.destroy` → Delete

---

## Styling Notes

- All components use Tailwind CSS classes
- Responsive design using `grid-cols-1 md:grid-cols-*`
- Color scheme:
    - Primary: Indigo (indigo-600)
    - Success: Green (green-600)
    - Warning: Yellow/Amber (yellow-600, amber-600)
    - Danger: Red (red-600)
    - Info: Blue (blue-600)
- Status badges use specific colors for quick visual identification

---

## Best Practices

1. **Always confirm destructive actions** before proceeding
2. **Use proper error handling** with InputError components
3. **Disable buttons during form submission** using `disabled={processing}`
4. **Provide visual feedback** with status badges
5. **Use descriptive button labels** that indicate action
6. **Group related information** in separate card sections
7. **Implement search and filter** for list pages
8. **Show pagination** for large datasets
9. **Include breadcrumbs or back buttons** for navigation
10. **Display loading states** during async operations

---

## Future Enhancements

1. **Export to PDF** - Export assessment/exam reports
2. **Bulk Operations** - Bulk send credentials, bulk status updates
3. **Email Templates** - Customizable email notifications
4. **Analytics Dashboard** - Visual reports and statistics
5. **Advanced Filtering** - Date range filters, multi-select filters
6. **Batch Import** - Import applicants and schedules
7. **Calendar View** - Calendar-based exam scheduling
8. **Mobile Optimization** - Enhanced mobile UI

---

## Troubleshooting

### Common Issues

1. **Form submission not working**
    - Check route names in Laravel routes file
    - Verify CSRF token is present
    - Check form validation rules

2. **Components not rendering**
    - Ensure all props are passed correctly
    - Check if Authenticated layout is imported
    - Verify Inertia.js is configured

3. **Styles not applying**
    - Ensure Tailwind CSS is properly configured
    - Check className syntax (no spaces in class names)
    - Clear browser cache

4. **Navigation not working**
    - Verify route names match Laravel routes
    - Check for typos in route() calls
    - Ensure Link component is imported from @inertiajs/react

---

## Support

For issues or questions about these components, refer to:

- [Inertia.js Documentation](https://inertiajs.com)
- [Tailwind CSS Documentation](https://tailwindcss.com)
- [Laravel Documentation](https://laravel.com/docs)
