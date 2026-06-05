<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::rename('schedules', 'subject_schedules');
    }

    public function down(): void
    {
        Schema::rename('subject_schedules', 'schedules');
    }
};
