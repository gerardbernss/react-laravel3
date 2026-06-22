<?php
namespace App\Enums;

enum ApplicationStatus: string {
    case Pending     = 'Pending';
    case ForExam     = 'For Exam';
    case ExamTaken   = 'Exam Taken';
    case ExamPassed  = 'Exam Passed';
    case PendingEnrollment = 'Pending Enrollment';
    case ExamFailed  = 'Exam Failed';
    case ForRevision = 'For Revision';
    case Enrolled    = 'Enrolled';
    case Rejected    = 'Rejected';
    case Approved    = 'Approved';
}
