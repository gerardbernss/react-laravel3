<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StudentPayment extends Model
{
    use HasFactory;

    protected $fillable = [
        'assessment_id',
        'amount_paid',
        'payment_method',
        'reference_number',
        'payment_date',
        'notes',
        'processed_by',
    ];

    protected $casts = [
        'amount_paid'  => 'decimal:2',
        'payment_date' => 'date',
    ];

    public static $paymentMethods = [
        'cash'          => 'Cash',
        'check'         => 'Check',
        'bank_transfer' => 'Bank Transfer',
        'gcash'         => 'GCash',
        'maya'          => 'Maya',
    ];

    public function assessment()
    {
        return $this->belongsTo(StudentAssessment::class, 'assessment_id');
    }

    public function processedBy()
    {
        return $this->belongsTo(User::class, 'processed_by');
    }
}
