<?php

namespace App\Models;

use Illuminate\Auth\Passwords\CanResetPassword;
use Illuminate\Contracts\Auth\CanResetPassword as CanResetPasswordContract;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

/**
 * The login credential for a student's portal access.
 *
 * This model implements Laravel's Authenticatable contract under the 'student'
 * guard (configured in config/auth.php). It is completely separate from the
 * User model (admin guard). A PortalCredential is created when an admin sends
 * portal credentials to an enrolled applicant.
 *
 * Authentication flow:
 *   1. Student visits /student/login → StudentLoginController
 *   2. Laravel checks portal_credentials table via the 'student' guard
 *   3. getAuthPassword() returns temporary_password (bcrypt hash)
 *   4. On first login, password_changed is false → redirect to change-password
 *   5. After changing password, password_changed is set to true
 *   6. login_attempts increments on failure; suspends automatically at >= 5
 *   7. Admin can reactivate via PortalCredentialController::reactivate()
 *
 * The username is always set to the applicant's email address.
 * Plain-text passwords are never stored — only the bcrypt hash.
 *
 * access_status field values:
 *   'Active'    — credential is usable
 *   'Suspended' — auto-suspended (≥5 failed attempts) or manually suspended by admin
 *
 * The student() relationship traverses through ApplicantPersonalData because
 * Student and PortalCredential both point to applicant_personal_data_id.
 */
class PortalCredential extends Authenticatable implements CanResetPasswordContract
{
    use HasFactory, Notifiable, CanResetPassword;

    /**
     * The column used for authentication password.
     */
    public function getAuthPassword()
    {
        return $this->temporary_password;
    }

    /**
     * Get the email address for password reset.
     * Uses the email from the related personal data.
     */
    public function getEmailForPasswordReset(): string
    {
        return $this->personalData?->email ?? $this->username;
    }

    /**
     * Route notifications for the mail channel.
     */
    public function routeNotificationForMail($notification = null): string
    {
        return $this->getEmailForPasswordReset();
    }

    protected $fillable = [
        'applicant_personal_data_id',
        'applicant_id',
        'username',
        'temporary_password',
        'password_changed',
        'access_status',
        'credentials_sent_at',
        'credentials_generated_at',
        'sent_via',
        'first_login_at',
        'last_login_at',
        'login_attempts',
        'remarks',
        'created_by',
        'remember_token',
    ];

    protected $casts = [
        'password_changed'         => 'boolean',
        'credentials_sent_at'      => 'datetime',
        'credentials_generated_at' => 'datetime',
        'first_login_at'           => 'datetime',
        'last_login_at'            => 'datetime',
    ];

    /**
     * Get the applicant personal data record that anchors this credential's identity.
     */
    public function personalData()
    {
        return $this->belongsTo(ApplicantPersonalData::class, 'applicant_personal_data_id');
    }

    /**
     * Get the applicant record this credential was issued for.
     */
    public function application()
    {
        return $this->belongsTo(Applicant::class, 'applicant_id');
    }

    /**
     * Get the enrolled student record linked through the shared applicant_personal_data_id.
     */
    public function student()
    {
        return $this->hasOneThrough(
            Student::class,
            ApplicantPersonalData::class,
            'id',
            'applicant_personal_data_id',
            'applicant_personal_data_id',
            'id'
        );
    }

    /**
     * Scope to active credentials only.
     */
    public function scopeActive($query)
    {
        return $query->where('access_status', 'Active');
    }

    /**
     * Scope to inactive credentials.
     */
    public function scopeInactive($query)
    {
        return $query->where('access_status', 'Inactive');
    }

    /**
     * Scope to suspended credentials (auto-suspended after 5 failed login attempts or manually suspended).
     */
    public function scopeSuspended($query)
    {
        return $query->where('access_status', 'Suspended');
    }

    /**
     * Scope to credentials where the login email has been sent to the applicant.
     */
    public function scopeCredentialsSent($query)
    {
        return $query->whereNotNull('credentials_sent_at');
    }

    /**
     * Scope to credentials where the applicant has already changed their temporary password.
     */
    public function scopePasswordChanged($query)
    {
        return $query->where('password_changed', true);
    }

    /**
     * Scope to credentials where the applicant has logged in at least once.
     */
    public function scopeHasLogged($query)
    {
        return $query->whereNotNull('first_login_at');
    }

    /**
     * Generate a random temporary password using a mixed alphanumeric and symbol charset.
     */
    public function generateTemporaryPassword($length = 12)
    {
        $characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
        $password   = '';
        $charLength = strlen($characters);

        for ($i = 0; $i < $length; $i++) {
            $password .= $characters[random_int(0, $charLength - 1)];
        }

        return $password;
    }

    /**
     * Record that credentials were sent and update the delivery channel.
     */
    public function markCredentialsSent($via = 'Email')
    {
        $this->update([
            'credentials_sent_at' => now(),
            'sent_via'            => $via,
        ]);
    }

    /**
     * Record a successful login, updating timestamps and resetting the failed-attempt counter.
     */
    public function recordLogin()
    {
        if (is_null($this->first_login_at)) {
            $this->first_login_at = now();
        }
        $this->last_login_at  = now();
        $this->login_attempts = 0;
        $this->save();
    }

    /**
     * Increment the failed login counter and auto-suspend the credential when it reaches 5 attempts.
     */
    public function incrementLoginAttempts()
    {
        $this->increment('login_attempts');

        if ($this->login_attempts >= 5) {
            $this->access_status = 'Suspended';
            $this->save();
        }
    }
}
