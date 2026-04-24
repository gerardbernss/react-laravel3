<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Fee extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'code',
        'category',
        'is_per_unit',
        'is_required',
        'school_level',
        'school_year',
        'semester',
        'amount',
        'description',
        'effective_date',
        'is_active',
    ];

    protected $casts = [
        'is_per_unit'    => 'boolean',
        'is_required'    => 'boolean',
        'is_active'      => 'boolean',
        'amount'         => 'decimal:2',
        'effective_date' => 'date',
    ];

    public static $categories = [
        'tuition'       => 'Tuition',
        'miscellaneous' => 'Miscellaneous',
        'laboratory'    => 'Laboratory',
        'special'       => 'Special',
    ];

    public static $schoolLevels = [
        'all' => 'All Levels',
        'LES' => 'LES',
        'JHS' => 'JHS',
        'SHS' => 'SHS',
    ];

    public static $semesters = [
        '1st Semester' => '1st Semester',
        '2nd Semester' => '2nd Semester',
        'Summer'       => 'Summer',
        'Yearly'       => 'Yearly',
    ];

    public function lineItems()
    {
        return $this->hasMany(AssessmentLineItem::class);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeForSchoolYear($query, string $schoolYear)
    {
        return $query->where('school_year', $schoolYear);
    }

    public function scopeForSemester($query, string $semester)
    {
        return $query->where(function ($q) use ($semester) {
            $q->where('semester', $semester)->orWhere('semester', 'Yearly');
        });
    }

    public function scopeForSchoolLevel($query, string $schoolLevel)
    {
        return $query->where(function ($q) use ($schoolLevel) {
            $q->where('school_level', 'all')->orWhere('school_level', $schoolLevel);
        });
    }
}
