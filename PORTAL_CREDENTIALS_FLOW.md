# Portal Credentials & Password Email System

## Overview

This document explains the complete flow for generating and sending portal credentials to applicants via email.

## System Architecture

### Components Involved

1. **Models**
    - `PortalCredential` - Stores generated credentials
    - `ApplicantApplicationInfo` - Application records
    - `ApplicantPersonalData` - Student information

2. **Controllers**
    - `PortalCredentialController` - Handles credential generation & sending
    - `ApplicantController` - Alternative credential sending method

3. **Mail Classes**
    - `PortalPasswordMail` - Email template & logic

4. **Email Template**
    - `resources/views/emails/portal_password.blade.php` - HTML email

## Process Flow

### Step 1: Admin Creates Portal Credentials

**Route:** `POST /admissions/portal-credentials`  
**Controller:** `PortalCredentialController@store()`

```
1. Admin navigates to Portal Credentials → Create
2. Selects an applicant from the list
3. Portal username is auto-generated (e.g., john.doe123)
4. Clicks "Create Credentials"
```

### Step 2: System Generates Credentials

**In `PortalCredentialController@store()`:**

```php
// Generate unique username
$username = 'applicant.' . strtolower(Str::slug($validated['personal_name']));

// Ensure uniqueness
while (PortalCredential::where('portal_username', $username)->exists()) {
    $username = $baseUsername . $counter++;
}

// Generate random 12-character password
$temporaryPassword = Str::random(12);

// Create credential record with hashed password
$credential = PortalCredential::create([
    'applicant_personal_data_id'    => $validated['applicant_personal_data_id'],
    'applicant_application_info_id' => $validated['applicant_application_info_id'],
    'portal_username'               => $username,
    'temporary_password'            => bcrypt($temporaryPassword),
    'is_activated'                  => true,
    'credentials_generated_at'      => now(),
    'created_by'                    => Auth::id(),
]);
```

### Step 3: System Sends Email

**Immediately after credential creation:**

```php
// Send email with plain-text temporary password
Mail::to($credential->personalData->email)
    ->send(new PortalPasswordMail($credential, $temporaryPassword));

// Update credential to mark email as sent
$credential->update([
    'credentials_sent_at' => now(),
    'sent_via' => 'email',
]);
```

### Step 4: PortalPasswordMail Composition

**File:** `app/Mail/PortalPasswordMail.php`

```php
class PortalPasswordMail extends Mailable
{
    public function __construct(
        public PortalCredential $credential,
        public string $temporaryPassword
    )

    public function envelope(): Envelope
    {
        $studentName = $this->credential->personalData?->first_name . ' ' .
                      $this->credential->personalData?->last_name;

        return new Envelope(
            subject: "Your Student Portal Login Credentials - {$studentName}"
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.portal_password',
            with: [
                'credential' => $this->credential,
                'temporaryPassword' => $this->temporaryPassword,
                'studentName' => $this->credential->personalData?->first_name . ' ' .
                                $this->credential->personalData?->last_name,
                'portalUrl' => config('app.url') . '/student-portal',
            ],
        );
    }
}
```

### Step 5: Email Template Rendering

**File:** `resources/views/emails/portal_password.blade.php`

The email includes:

- Professional header with university branding
- Student's personalized greeting
- Portal username and temporary password in a secure box
- Portal URL for easy access
- Security warnings about temporary password
- Step-by-step login instructions
- Contact information for support

## Resending Credentials

### Method 1: Via Portal Credentials List

**Route:** `POST /admissions/portal-credentials/{credential}/send`  
**Controller:** `PortalCredentialController@send()`

```
1. Admin views Portal Credentials list
2. Clicks "Send" button on a credential row
3. System generates NEW temporary password
4. Email sent with new credentials
5. Updated in database
```

### Method 2: Via Portal Credentials List

**Route:** `POST /admissions/portal-credentials/{credential}/resend`  
**Controller:** `PortalCredentialController@resend()`

Same process as `send()` but tracks resend count.

### Method 3: Via Applicants List

**Route:** `POST /admissions/applicants/{id}/send-portal-password`  
**Controller:** `ApplicantController@sendPortalPassword()`

```
1. Admin views Applicants list
2. Clicks "Send Portal Password"
3. Creates credential if not exists, or updates existing
4. Generates new password
5. Sends email
```

## Database Schema

### portal_credentials table

```sql
- id (primary key)
- applicant_personal_data_id (foreign key)
- applicant_application_info_id (foreign key)
- portal_username (unique string)
- temporary_password (hashed bcrypt)
- is_activated (boolean, default: true)
- credentials_generated_at (timestamp)
- credentials_sent_at (timestamp, nullable)
- sent_via (string - 'email')
- access_suspended_at (timestamp, nullable)
- failed_login_attempts (integer, default: 0)
- resent_count (integer, default: 0)
- created_by (user id)
```

## Email Configuration

### .env Settings

```dotenv
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=rebelblack11@gmail.com
MAIL_PASSWORD="iyso nkwk mgcd ahjb"
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=rebelblack11@gmail.com
MAIL_FROM_NAME="Saint Louis University - Admissions"
```

### config/mail.php

Default mailer is set to `smtp`:

```php
'default' => env('MAIL_MAILER', 'smtp'),
```

## Security Features

1. **Password Hashing**
    - Passwords are bcrypt hashed in database
    - Plain password only sent in email

2. **Unique Username**
    - Auto-generated with validation
    - Prevents collisions

3. **Activation Tracking**
    - Records when credentials generated
    - Records when sent
    - Tracks resend count

4. **Temporary Password Policy**
    - 12-character random string
    - Students MUST change on first login
    - Email contains security notices

5. **Error Handling**
    - Email failures logged but don't block creation
    - Try-catch blocks prevent crashes
    - User gets informative error messages

## Frontend Components

### Portal Credentials Pages

1. **Index** (`/admissions/portal-credentials`)
    - List all credentials
    - Filter by status
    - Search by name
    - Send/Resend buttons
    - Suspend/Reactivate options

2. **Create** (`/admissions/portal-credentials/create`)
    - Select applicant dropdown
    - Auto-generate username
    - Show applicant summary
    - Create button submits form

3. **Show** (`/admissions/portal-credentials/{id}`)
    - Display credential details
    - Show when sent
    - Resend button
    - Back to list button

## Testing the Flow

### Manual Testing

1. Access Portal Credentials Create page
2. Select an applicant with valid email
3. Click "Create Credentials"
4. Check applicant's email for password
5. Verify credentials_sent_at timestamp in database

### Using Tinker

```bash
php artisan tinker

# Create test credential manually
$credential = \App\Models\PortalCredential::create([
    'applicant_personal_data_id' => 1,
    'applicant_application_info_id' => 1,
    'portal_username' => 'test.user',
    'temporary_password' => bcrypt('testpass123'),
    'is_activated' => true,
    'created_by' => 1,
]);

# Send email
\Illuminate\Support\Facades\Mail::to('student@example.com')
    ->send(new \App\Mail\PortalPasswordMail($credential, 'testpass123'));
```

## Troubleshooting

### Email Not Sending

1. **Check .env credentials**

    ```bash
    php artisan config:cache
    ```

2. **Verify Gmail App Password**
    - Use 16-character app-specific password
    - Not your regular Gmail password

3. **Enable Less Secure Apps** (if applicable)
    - Gmail account settings
    - Security section

4. **Check Logs**
    ```bash
    tail -f storage/logs/laravel.log
    ```

### Invalid Email Address

- Verify `applicant_personal_data.email` exists
- Check email format is valid
- Ensure no SQL errors in query

### Duplicate Username

- System auto-increments with numbers
- Check database for existing usernames
- Reset counter if needed

## Future Enhancements

1. **Queue Jobs**
    - Use `Mail::queue()` for async sending
    - Reduces response time

2. **Email Templates**
    - Multiple language versions
    - Customizable institution details

3. **Password Policies**
    - Set custom password length
    - Require special characters
    - Auto-expiry after X days

4. **Audit Trail**
    - Log all credential actions
    - Track who sent what when

5. **Bulk Operations**
    - Create credentials for multiple applicants
    - Batch email sending

6. **Student Portal**
    - Login with credentials
    - Force password change
    - View application status

## Related Files

- `app/Http/Controllers/PortalCredentialController.php`
- `app/Http/Controllers/ApplicantController.php`
- `app/Mail/PortalPasswordMail.php`
- `app/Models/PortalCredential.php`
- `resources/views/emails/portal_password.blade.php`
- `resources/js/Pages/Admissions/PortalCredentials/Create.jsx`
- `resources/js/Pages/Admissions/PortalCredentials/Index.jsx`
- `database/migrations/*portal_credentials*`
- `.env` (Mail configuration)
- `config/mail.php` (Mail settings)

## Support

For issues or questions about the portal credentials system:

1. Check the logs: `storage/logs/laravel.log`
2. Review email configuration in `.env`
3. Verify database migrations ran successfully
4. Test mail configuration with Tinker
