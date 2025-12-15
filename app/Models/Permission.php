<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Permission extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'description',
    ];

    /**
     * Get the roles that have this permission.
     */
    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Role::class);
    }

    /**
     * Get the total number of users who have this permission through their roles.
     */
    public function getTotalUsersCountAttribute(): int
    {
        return $this->roles()
            ->withCount('users')
            ->get()
            ->sum('users_count');
    }
}
