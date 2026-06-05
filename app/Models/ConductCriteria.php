<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ConductCriteria extends Model
{
    protected $table = 'conduct_criteria';

    protected $fillable = ['conduct_category_id', 'name', 'description', 'max_score', 'order'];

    protected $casts = [
        'max_score' => 'float',
        'order' => 'integer',
    ];

    public function category(): BelongsTo
    {
        return $this->belongsTo(ConductCategory::class, 'conduct_category_id');
    }

    public function grades(): HasMany
    {
        return $this->hasMany(ConductGrade::class);
    }
}
