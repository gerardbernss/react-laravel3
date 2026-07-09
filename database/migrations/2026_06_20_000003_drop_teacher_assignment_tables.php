<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * The teacher-assignment role of these tables has been fully replaced by
     * subject_schedules.teacher_id (see the two preceding migrations). Data was
     * already backfilled, so this only needs to drop the now-unused tables.
     */
    public function up(): void
    {
        Schema::dropIfExists('subject_teacher_assignments');
        Schema::dropIfExists('teachers');
    }

    /**
     * Restores the table structure only — data is not recoverable (see the backfill migration's down()).
     */
    public function down(): void
    {
        Schema::create('teachers', function (Blueprint $table) {
            $table->id('teacher_id');
            $table->foreignId('subject_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['subject_id', 'user_id']);
        });

        Schema::create('subject_teacher_assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('teacher_id')->constrained('teachers', 'teacher_id')->cascadeOnDelete();
            $table->foreignId('block_section_id')->constrained()->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['teacher_id', 'block_section_id']);
        });
    }
};
