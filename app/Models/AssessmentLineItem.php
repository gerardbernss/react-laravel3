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

    public function assessment()
    {
        return $this->belongsTo(StudentAssessment::class, 'assessment_id');
    }

    public function fee()
    {
        return $this->belongsTo(Fee::class);
    }

    /**
     * Calculate amount before saving
     */
    protected static function boot()
    {
        parent::boot();

        static::saving(function ($lineItem) {
            $lineItem->amount = $lineItem->quantity * $lineItem->unit_price;
        });
    }
}
