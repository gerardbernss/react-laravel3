<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AssessmentLineItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'assessment_id',
        'fee_id',
        'description',
        'quantity',
        'unit_price',
        'amount',
    ];

    protected $casts = [
        'quantity' => 'decimal:2',
        'unit_price' => 'decimal:2',
        'amount' => 'decimal:2',
    ];

    /**
     * Get the student assessment this line item belongs to.
     */
    public function assessment()
    {
        return $this->belongsTo(StudentAssessment::class, 'assessment_id');
    }

    /**
     * Get the fee definition this line item was generated from.
     */
    public function fee()
    {
        return $this->belongsTo(Fee::class);
    }

    /**
     * Auto-compute amount = quantity × unit_price before every save.
     */
    protected static function boot()
    {
        parent::boot();

        static::saving(function ($lineItem) {
            $lineItem->amount = $lineItem->quantity * $lineItem->unit_price;
        });
    }
}
