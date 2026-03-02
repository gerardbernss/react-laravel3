<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FeeType extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'code',
        'category',
        'is_per_unit',
        'is_required',
        'applies_to',
        'description',
        'is_active',
    ];

    protected $casts = [
        'is_per_unit' => 'boolean',
        'is_required' => 'boolean',
        'is_active' => 'boolean',
    ];

    public static $categories = [
        'tuition' => 'Tuition',
        'miscellaneous' => 'Miscellaneous',
        'laboratory' => 'Laboratory',
        'special' => 'Special',
    ];

    public static $appliesTo = [
        'all' => 'All Categories',
        'LES' => 'LES Only',
        'JHS' => 'JHS Only',
        'SHS' => 'SHS Only',
    ];

    public function rates()
    {
        return $this->hasMany(FeeRate::class);
    }

    public function lineItems()
    {
        return $this->hasMany(AssessmentLineItem::class);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeRequired($query)
    {
        return $query->where('is_required', true);
    }

    public function scopeByCategory($query, $category)
    {
        return $query->where('category', $category);
    }

    public function scopeApplicableTo($query, $studentCategory)
    {
        return $query->where(function ($q) use ($studentCategory) {
            $q->where('applies_to', 'all')
              ->orWhere('applies_to', $studentCategory);
        });
    }
}
