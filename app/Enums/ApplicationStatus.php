<?php
namespace App\Enums;

enum ApplicationStatus: string {
    case Pending  = 'Pending';
    case Enrolled = 'Enrolled';
    case Rejected = 'Rejected';
    case Approved = 'Approved';
}
