<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AssessmentDiscount extends Model
{
    use HasFactory;

    protected $fillable = [
        'assessment_id',
        'discount_type_id',
        'description',
        'base_amount',
        'discount_amount',
        'verified_by',
        'verified_at',
    ];

    protected $casts = [
        'base_amount' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'verified_at' => 'datetime',
    ];

    public function assessment()
    {
        return $this->belongsTo(StudentAssessment::class, 'assessment_id');
    }

    public function discountType()
    {
        return $this->belongsTo(DiscountType::class);
    }

    public function verifiedBy()
    {
        return $this->belongsTo(User::class, 'verified_by');
    }

    public function scopeVerified($query)
    {
        return $query->whereNotNull('verified_at');
    }

    public function scopePending($query)
    {
        return $query->whereNull('verified_at');
    }
}
