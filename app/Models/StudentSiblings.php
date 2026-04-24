<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StudentSiblings extends Model
{
    use HasFactory;

    protected $table = 'student_siblings';

    protected $fillable = [
        'student_personal_data_id',
        'sibling_full_name',
        'sibling_grade_level',
        'sibling_id_number',
    ];

    public function studentPersonalData(): BelongsTo
    {
        return $this->belongsTo(StudentPersonalData::class, 'student_personal_data_id');
    }
}
