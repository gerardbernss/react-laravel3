<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ConductCategory extends Model
{
    protected $fillable = ['name', 'description', 'order', 'is_active'];

    protected $casts = [
        'is_active' => 'boolean',
        'order' => 'integer',
    ];

    public function criteria(): HasMany
    {
        return $this->hasMany(ConductCriteria::class)->orderBy('order');
    }
}
