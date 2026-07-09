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

    /**
     * Get the assessment line items generated from this fee.
     */
    public function lineItems()
    {
        return $this->hasMany(AssessmentLineItem::class);
    }

    /**
     * Scope to active fees only.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope to fees for a specific school year.
     */
    public function scopeForSchoolYear($query, string $schoolYear)
    {
        return $query->where('school_year', $schoolYear);
    }

    /**
     * Scope to fees that apply to a semester, including fees marked "Yearly" which apply to all semesters.
     */
    public function scopeForSemester($query, string $semester)
    {
        return $query->where(function ($q) use ($semester) {
            $q->where('semester', $semester)->orWhere('semester', 'Yearly');
        });
    }

    /**
     * Scope to fees that apply to a school level, including fees marked "all" which apply school-wide.
     */
    public function scopeForSchoolLevel($query, string $schoolLevel)
    {
        return $query->where(function ($q) use ($schoolLevel) {
            $q->where('school_level', 'all')->orWhere('school_level', $schoolLevel);
        });
    }
}
