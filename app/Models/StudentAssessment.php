<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StudentAssessment extends Model
{
    use HasFactory;

    protected $fillable = [
        'student_id',
        'assessment_number',
        'school_year',
        'semester',
        'total_tuition',
        'total_misc_fees',
        'total_lab_fees',
        'total_other_fees',
        'gross_amount',
        'total_discounts',
        'net_amount',
        'status',
        'generated_at',
        'finalized_at',
        'finalized_by',
        'remarks',
    ];

    protected $casts = [
        'total_tuition' => 'decimal:2',
        'total_misc_fees' => 'decimal:2',
        'total_lab_fees' => 'decimal:2',
        'total_other_fees' => 'decimal:2',
        'gross_amount' => 'decimal:2',
        'total_discounts' => 'decimal:2',
        'net_amount' => 'decimal:2',
        'generated_at' => 'datetime',
        'finalized_at' => 'datetime',
    ];

    public static $statuses = [
        'draft' => 'Draft',
        'finalized' => 'Finalized',
        'paid' => 'Paid',
        'partial' => 'Partial Payment',
        'cancelled' => 'Cancelled',
    ];

    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    public function lineItems()
    {
        return $this->hasMany(AssessmentLineItem::class, 'assessment_id');
    }

    public function discounts()
    {
        return $this->hasMany(AssessmentDiscount::class, 'assessment_id');
    }

    public function finalizedBy()
    {
        return $this->belongsTo(User::class, 'finalized_by');
    }

    public function scopeDraft($query)
    {
        return $query->where('status', 'draft');
    }

    public function scopeFinalized($query)
    {
        return $query->where('status', 'finalized');
    }

    public function scopeForSchoolYear($query, $schoolYear)
    {
        return $query->where('school_year', $schoolYear);
    }

    /**
     * Generate unique assessment number
     */
    public static function generateAssessmentNumber($schoolYear)
    {
        $prefix = 'ASS-' . str_replace('-', '', $schoolYear) . '-';
        $lastAssessment = static::where('assessment_number', 'like', $prefix . '%')
            ->orderBy('assessment_number', 'desc')
            ->first();

        if ($lastAssessment) {
            $lastNumber = (int) substr($lastAssessment->assessment_number, -5);
            $newNumber = $lastNumber + 1;
        } else {
            $newNumber = 1;
        }

        return $prefix . str_pad($newNumber, 5, '0', STR_PAD_LEFT);
    }

    /**
     * Recalculate totals from line items and discounts
     */
    public function recalculateTotals()
    {
        $this->total_tuition = $this->lineItems()
            ->whereHas('feeType', fn($q) => $q->where('category', 'tuition'))
            ->sum('amount');

        $this->total_misc_fees = $this->lineItems()
            ->whereHas('feeType', fn($q) => $q->where('category', 'miscellaneous'))
            ->sum('amount');

        $this->total_lab_fees = $this->lineItems()
            ->whereHas('feeType', fn($q) => $q->where('category', 'laboratory'))
            ->sum('amount');

        $this->total_other_fees = $this->lineItems()
            ->whereHas('feeType', fn($q) => $q->where('category', 'special'))
            ->sum('amount');

        $this->gross_amount = $this->total_tuition + $this->total_misc_fees +
                              $this->total_lab_fees + $this->total_other_fees;

        $this->total_discounts = $this->discounts()->sum('discount_amount');

        $this->net_amount = $this->gross_amount - $this->total_discounts;

        $this->save();
    }
}
