<?php
namespace App\Mail;

use App\Models\PortalCredential;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class PortalCredentialsMail extends Mailable
{
    use Queueable, SerializesModels;

    public PortalCredential $credential;
    public string $temporaryPassword;

    /**
     * Create a new message instance.
     */
    public function __construct(PortalCredential $credential, string $temporaryPassword)
    {
        $this->credential        = $credential;
        $this->temporaryPassword = $temporaryPassword;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        $studentName = $this->credential->personalData?->first_name . ' ' . $this->credential->personalData?->last_name;

        return new Envelope(
            subject: "Student Portal Credentials - {$studentName}",
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.portal_credentials',
            with: [
                'credential'        => $this->credential,
                'temporaryPassword' => $this->temporaryPassword,
                'studentName'       => $this->credential->personalData?->first_name . ' ' . $this->credential->personalData?->last_name,
                'portalUrl'         => config('app.url') . '/student-portal',
            ],
        );
    }

    /**
     * Get the attachments for the message.
     */
    public function attachments(): array
    {
        return [];
    }
}
