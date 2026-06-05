<?php
namespace App\Mail\Admissions;

use App\Models\PortalCredential;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ResendPortalPasswordMail extends Mailable
{
    use Queueable, SerializesModels;

    public PortalCredential $credential;
    public string $temporaryPassword;

    public function __construct(PortalCredential $credential, string $temporaryPassword)
    {
        $this->credential        = $credential;
        $this->temporaryPassword = $temporaryPassword;
    }

    public function envelope(): Envelope
    {
        $studentName = $this->credential->personalData?->first_name . ' ' . $this->credential->personalData?->last_name;

        return new Envelope(
            subject: "Resend: Your Student Portal Password - {$studentName}",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.resend_portal_password',
            with: [
                'credential'        => $this->credential,
                'temporaryPassword' => $this->temporaryPassword,
                'studentName'       => $this->credential->personalData?->first_name . ' ' . $this->credential->personalData?->last_name,
                'portalUrl'         => config('app.url') . '/student-portal',
            ],
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
