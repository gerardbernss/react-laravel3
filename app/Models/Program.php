<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Program extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'description',
        'school',
        'vocational',
        'is_active',
        'max_load',
    ];

    protected $casts = [
        'vocational' => 'boolean',
        'is_active'  => 'boolean',
        'max_load'   => 'integer',
    ];

    public static $schools = [

        'Laboratory Elementary School' => 'Laboratory Elementary School',
        'Junior High School'           => 'Junior High School',
        'Senior High School'           => 'Senior High School',
    ];

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeBySchool($query, $school)
    {
        return $query->where('school', $school);
    }
}
