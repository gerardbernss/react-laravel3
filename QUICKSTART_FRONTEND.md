# Quick Start Guide - Admissions System Frontend

## Overview

This guide will help you quickly get the Admissions System frontend components up and running.

## Prerequisites

✅ Laravel 11+ installed and configured
✅ Node.js and npm installed
✅ Database migrations have been run
✅ All backend controllers and models are in place
✅ Routes configured in `routes/web.php`

## Files to Move

All frontend components have been created and are located in:

```
resources/js/Pages/Admissions/
```

### Component Locations:

- `EntranceExams/` - 4 components
- `PortalCredentials/` - 3 components
- `Enrollment/` - 2 components
- `Assessments/` - 3 components

## Setup Steps

### Step 1: Verify Routes are Registered

Open `routes/web.php` and ensure this line exists:

```php
require __DIR__ . '/admissions.php';
```

If not, add it before the closing of the authenticated middleware group.

### Step 2: Build Frontend Assets

```bash
# Install npm dependencies (if not already done)
npm install

# Build frontend assets
npm run dev  # for development
npm run build  # for production
```

### Step 3: Run Database Migrations

```bash
php artisan migrate
```

### Step 4: Clear Cache

```bash
php artisan cache:clear
php artisan config:clear
```

### Step 5: Start Development Server

```bash
# Start Laravel development server
php artisan serve

# In another terminal, start Vite dev server
npm run dev
```

### Step 6: Access the System

Navigate to:

- `http://localhost:8000/admissions/entrance-exams`
- `http://localhost:8000/admissions/portal-credentials`
- `http://localhost:8000/admissions/enrollment/dashboard`
- `http://localhost:8000/admissions/assessments`

## Components Overview

### Entrance Exams

**URL:** `/admissions/entrance-exams`

- **List View:** See all exams with filters
- **Create:** Schedule new exam
- **Edit:** Modify scheduled exam
- **Record Results:** Enter exam scores
- **View:** See full exam details

### Portal Credentials

**URL:** `/admissions/portal-credentials`

- **List View:** See all credentials with status
- **Create:** Generate new credential
- **View Details:** Manage individual credential
- **Actions:** Send, resend, suspend, reset password

### Enrollment

**URL:** `/admissions/enrollment/dashboard`

- **Dashboard:** Overview and student list
- **Student Details:** View enrollment info
- **Actions:** Complete enrollment, activate/deactivate portal

### Assessments

**URL:** `/admissions/assessments`

- **List View:** See all assessments
- **Create:** Record new assessment
- **Edit:** Update assessment details
- **View:** See full assessment information

## Component Files

### Entrance Exams

```
resources/js/Pages/Admissions/EntranceExams/
├── Index.jsx              # List all exams
├── Form.jsx               # Create/Edit form
├── RecordResults.jsx      # Results entry form
└── Show.jsx               # View exam details
```

**Key Routes:**

- `entrance-exams.index` - /admissions/entrance-exams
- `entrance-exams.create` - /admissions/entrance-exams/create
- `entrance-exams.show` - /admissions/entrance-exams/{id}
- `entrance-exams.recordResults` - /admissions/entrance-exams/{id}/record-results

### Portal Credentials

```
resources/js/Pages/Admissions/PortalCredentials/
├── Index.jsx              # List all credentials
├── Create.jsx             # Create form
└── Show.jsx               # View credential details
```

**Key Routes:**

- `portal-credentials.index` - /admissions/portal-credentials
- `portal-credentials.create` - /admissions/portal-credentials/create
- `portal-credentials.show` - /admissions/portal-credentials/{id}

### Enrollment

```
resources/js/Pages/Admissions/Enrollment/
├── Dashboard.jsx          # Enrollment overview
└── Show.jsx               # Student enrollment details
```

**Key Routes:**

- `enrollment.dashboard` - /admissions/enrollment/dashboard
- `enrollment.show` - /admissions/enrollment/{id}

### Assessments

```
resources/js/Pages/Admissions/Assessments/
├── Index.jsx              # List all assessments
├── Form.jsx               # Create/Edit form
└── Show.jsx               # View assessment details
```

**Key Routes:**

- `assessments.index` - /admissions/assessments
- `assessments.create` - /admissions/assessments/create
- `assessments.show` - /admissions/assessments/{id}

## Form Usage

### Creating Records

1. Navigate to the Create page (e.g., `/admissions/entrance-exams/create`)
2. Fill in all required fields (marked with asterisk)
3. Click Submit button
4. Form validation will prevent submission if errors exist
5. Success message will appear after submission
6. You'll be redirected to the detail view

### Editing Records

1. Go to the List page
2. Click "Edit" button (only shown for editable records)
3. Modify the fields
4. Click Update button
5. Changes will be saved

### Viewing Details

1. Go to the List page
2. Click "View" button to see all details
3. Click action buttons for additional operations
4. Use browser back button or "Back" link to return to list

## Common Actions

### Send Portal Credentials

1. Go to Portal Credentials list
2. Find the credential you want to send
3. Click "Send" button (if not yet sent)
4. System will email credentials to applicant

### Record Exam Results

1. Go to Entrance Exams list
2. Find the exam
3. Click "Record Results" button
4. Enter overall score and section/subject scores
5. Confirm invigilator details
6. Add remarks (optional)
7. Submit

### Complete Enrollment

1. Go to Enrollment Dashboard
2. Find the pending student
3. Click "Complete" button (for pending students only)
4. Enrollment will be finalized

### Suspend Portal Access

1. Go to Portal Credentials list or detail page
2. Click "Suspend" button
3. Applicant will no longer be able to log in
4. Click "Reactivate" to restore access

## Troubleshooting

### Components Not Showing

**Issue:** Pages show blank or 404 error
**Solution:**

1. Verify routes/admissions.php is properly registered
2. Check that migrations have been run
3. Clear cache: `php artisan cache:clear`
4. Restart development server

### Form Won't Submit

**Issue:** Form submission fails or doesn't work
**Solution:**

1. Check browser console for JavaScript errors
2. Verify form field names match backend expectations
3. Check validation rules in Form Request classes
4. Ensure all required fields are filled

### Styles Look Wrong

**Issue:** Components don't look styled correctly
**Solution:**

1. Run `npm run dev` to rebuild assets
2. Clear browser cache
3. Check that Tailwind CSS is properly configured
4. Verify no CSS class conflicts

### Database Errors

**Issue:** Database-related errors on page load
**Solution:**

1. Run migrations: `php artisan migrate`
2. Check database connection in .env file
3. Verify migrations completed successfully
4. Check Laravel logs in `storage/logs/`

## Testing the System

### Manual Testing Workflow

1. **Entrance Exam:**
    - Create new exam for an applicant
    - View exam details
    - Record results with scores
    - Verify pass/fail determination

2. **Assessment:**
    - Create new assessment
    - View assessment details
    - Edit assessment information
    - Delete assessment

3. **Portal Credentials:**
    - Create new credential
    - Send credentials
    - View credential details
    - Suspend and reactivate access

4. **Enrollment:**
    - View enrollment dashboard
    - View student details
    - Complete enrollment
    - Activate/deactivate portal access

## API Integration

Each component makes requests to these endpoints:

**Entrance Exams:**

```
GET    /admissions/entrance-exams
POST   /admissions/entrance-exams
GET    /admissions/entrance-exams/{id}
PUT    /admissions/entrance-exams/{id}
DELETE /admissions/entrance-exams/{id}
POST   /admissions/entrance-exams/{id}/record-results
```

**Portal Credentials:**

```
GET    /admissions/portal-credentials
POST   /admissions/portal-credentials
GET    /admissions/portal-credentials/{id}
POST   /admissions/portal-credentials/{id}/send
POST   /admissions/portal-credentials/{id}/suspend
POST   /admissions/portal-credentials/{id}/reactivate
POST   /admissions/portal-credentials/{id}/reset-password
```

**Enrollment:**

```
GET    /admissions/enrollment/dashboard
GET    /admissions/enrollment/{id}
POST   /admissions/enrollment/{id}/complete
POST   /admissions/enrollment/{id}/activate
POST   /admissions/enrollment/{id}/deactivate
```

**Assessments:**

```
GET    /admissions/assessments
POST   /admissions/assessments
GET    /admissions/assessments/{id}
PUT    /admissions/assessments/{id}
DELETE /admissions/assessments/{id}
```

## Customization

### Changing Colors/Styling

All components use Tailwind CSS. To customize:

1. Open the component file
2. Look for Tailwind class names (e.g., `bg-indigo-600`, `text-green-600`)
3. Modify classes directly in JSX
4. Colors are standardized:
    - Primary: `indigo-*`
    - Success: `green-*`
    - Warning: `yellow-*`
    - Danger: `red-*`
    - Info: `blue-*`

### Adding New Fields

To add new fields to a form:

1. Open the component Form.jsx file
2. Add field to `useForm` data object:

    ```javascript
    const { data, setData, ... } = useForm({
      // ... existing fields
      new_field: ''
    });
    ```

3. Add input element in JSX:

    ```javascript
    <InputLabel htmlFor="new_field" value="New Field" />
    <TextInput
      id="new_field"
      value={data.new_field}
      onChange={(e) => setData('new_field', e.target.value)}
    />
    <InputError message={errors.new_field} />
    ```

4. Update backend Form Request class with validation
5. Test the form

### Modifying List Filters

To change or add filters in Index pages:

1. Add filter state variable:

    ```javascript
    const [filterName, setFilterName] = useState(filters.filterName || '');
    ```

2. Add filter input to form
3. Update handleSearch function to include new filter:

    ```javascript
    router.get(route('model.index'), {
        search,
        newFilter: filterName,
    });
    ```

4. Update backend controller to filter by this parameter

## Environment Configuration

Ensure your `.env` file has:

```
APP_NAME=Laravel
APP_ENV=local
APP_KEY=base64:...
APP_DEBUG=true
APP_URL=http://localhost:8000

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=laravel
DB_USERNAME=root
DB_PASSWORD=

MAIL_MAILER=smtp
MAIL_HOST=smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USERNAME=...
MAIL_PASSWORD=...
MAIL_FROM_ADDRESS=...
MAIL_FROM_NAME="Admissions"
```

## Support

For detailed information, see:

- `FRONTEND_COMPONENTS.md` - Component documentation
- `IMPLEMENTATION_GUIDE.md` - System overview
- `DATABASE_SCHEMA.md` - Database structure
- `PROJECT_COMPLETION_SUMMARY.md` - Project status

## Next Steps

1. ✅ Components are ready to use
2. ⏳ Configure email service for notifications
3. ⏳ Add user feedback/toast notifications
4. ⏳ Implement tests
5. ⏳ Deploy to production

---

**Quick Links:**

- [Entrance Exams](/admissions/entrance-exams)
- [Portal Credentials](/admissions/portal-credentials)
- [Enrollment Dashboard](/admissions/enrollment/dashboard)
- [Assessments](/admissions/assessments)

**Status:** Ready for Integration ✅
