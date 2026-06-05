<?php

namespace App\Mail\Admissions;

use App\Models\ApplicantExamResult;
use App\Models\ApplicantPersonalData;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ExamResultMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public ApplicantExamResult $examResult,
        public ApplicantPersonalData $personalData
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: 'Your Exam Results');
    }

    public function content(): Content
    {
        return new Content(view: 'emails.exam_result');
    }
}
