<?php
namespace App\Enums;

enum ApplicationStatus: string {
    case Pending     = 'Pending';
    case ForExam     = 'For Exam';
    case ForRevision = 'For Revision';
    case Enrolled    = 'Enrolled';
    case Rejected    = 'Rejected';
    case Approved    = 'Approved';
}
