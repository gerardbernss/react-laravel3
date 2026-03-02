<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FeeRate extends Model
{
    use HasFactory;

    protected $fillable = [
        'fee_type_id',
        'school_year',
        'semester',
        'student_category',
        'amount',
        'effective_date',
        'is_active',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'effective_date' => 'date',
        'is_active' => 'boolean',
    ];

    public static $semesters = [
        '1st Semester' => '1st Semester',
        '2nd Semester' => '2nd Semester',
        'Summer' => 'Summer',
        'Yearly' => 'Yearly',
    ];

    public static $studentCategories = [
        'all' => 'All Categories',
        'LES' => 'LES',
        'JHS' => 'JHS',
        'SHS' => 'SHS',
    ];

    public function feeType()
    {
        return $this->belongsTo(FeeType::class);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeForSchoolYear($query, $schoolYear)
    {
        return $query->where('school_year', $schoolYear);
    }

    public function scopeForSemester($query, $semester)
    {
        return $query->where(function ($q) use ($semester) {
            $q->where('semester', $semester)
              ->orWhere('semester', 'Yearly');
        });
    }

    public function scopeForCategory($query, $studentCategory)
    {
        return $query->where(function ($q) use ($studentCategory) {
            $q->where('student_category', 'all')
              ->orWhere('student_category', $studentCategory);
        });
    }

    /**
     * Get the applicable rate for a specific context
     */
    public static function getRate($feeTypeId, $schoolYear, $semester, $studentCategory)
    {
        return static::where('fee_type_id', $feeTypeId)
            ->where('school_year', $schoolYear)
            ->forSemester($semester)
            ->forCategory($studentCategory)
            ->active()
            ->orderByRaw("CASE WHEN student_category = ? THEN 0 ELSE 1 END", [$studentCategory])
            ->orderByRaw("CASE WHEN semester = ? THEN 0 ELSE 1 END", [$semester])
            ->first();
    }
}
