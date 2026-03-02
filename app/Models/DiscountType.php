<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DiscountType extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'code',
        'discount_type',
        'value',
        'applies_to',
        'requires_verification',
        'is_stackable',
        'max_discount_cap',
        'description',
        'is_active',
    ];

    protected $casts = [
        'value' => 'decimal:2',
        'max_discount_cap' => 'decimal:2',
        'requires_verification' => 'boolean',
        'is_stackable' => 'boolean',
        'is_active' => 'boolean',
    ];

    public static $discountTypes = [
        'percentage' => 'Percentage',
        'fixed_amount' => 'Fixed Amount',
    ];

    public static $appliesTo = [
        'tuition_only' => 'Tuition Only',
        'all_fees' => 'All Fees',
        'miscellaneous_only' => 'Miscellaneous Only',
    ];

    public function assessmentDiscounts()
    {
        return $this->hasMany(AssessmentDiscount::class);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeStackable($query)
    {
        return $query->where('is_stackable', true);
    }

    /**
     * Calculate discount amount based on base amount
     */
    public function calculateDiscount($baseAmount)
    {
        if ($this->discount_type === 'percentage') {
            $discount = $baseAmount * ($this->value / 100);
        } else {
            $discount = $this->value;
        }

        // Apply cap if set
        if ($this->max_discount_cap && $discount > $this->max_discount_cap) {
            $discount = $this->max_discount_cap;
        }

        return round($discount, 2);
    }

    /**
     * Get formatted value display
     */
    public function getFormattedValueAttribute()
    {
        if ($this->discount_type === 'percentage') {
            return $this->value . '%';
        }
        return '₱' . number_format($this->value, 2);
    }
}
