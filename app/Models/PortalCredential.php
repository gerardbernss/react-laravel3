<?php

namespace App\Models;

use Illuminate\Auth\Passwords\CanResetPassword;
use Illuminate\Contracts\Auth\CanResetPassword as CanResetPasswordContract;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

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
        'applicant_application_info_id',
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
    ];

    protected $casts = [
        'password_changed'         => 'boolean',
        'credentials_sent_at'      => 'datetime',
        'credentials_generated_at' => 'datetime',
        'first_login_at'           => 'datetime',
        'last_login_at'            => 'datetime',
    ];

    /**
     * Relationships
     */
    public function personalData()
    {
        return $this->belongsTo(ApplicantPersonalData::class, 'applicant_personal_data_id');
    }

    public function application()
    {
        return $this->belongsTo(ApplicantApplicationInfo::class, 'applicant_application_info_id');
    }

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
     * Scopes
     */
    public function scopeActive($query)
    {
        return $query->where('access_status', 'Active');
    }

    public function scopeInactive($query)
    {
        return $query->where('access_status', 'Inactive');
    }

    public function scopeSuspended($query)
    {
        return $query->where('access_status', 'Suspended');
    }

    public function scopeCredentialsSent($query)
    {
        return $query->whereNotNull('credentials_sent_at');
    }

    public function scopePasswordChanged($query)
    {
        return $query->where('password_changed', true);
    }

    public function scopeHasLogged($query)
    {
        return $query->whereNotNull('first_login_at');
    }

    /**
     * Methods
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

    public function markCredentialsSent($via = 'Email')
    {
        $this->update([
            'credentials_sent_at' => now(),
            'sent_via'            => $via,
        ]);
    }

    public function recordLogin()
    {
        if (is_null($this->first_login_at)) {
            $this->first_login_at = now();
        }
        $this->last_login_at  = now();
        $this->login_attempts = 0;
        $this->save();
    }

    public function incrementLoginAttempts()
    {
        $this->increment('login_attempts');

        if ($this->login_attempts >= 5) {
            $this->access_status = 'Suspended';
            $this->save();
        }
    }
}
