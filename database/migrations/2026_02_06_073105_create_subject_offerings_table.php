<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('subject_offerings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('subject_id')->constrained('subjects')->onDelete('cascade');
            $table->string('section_code'); // e.g., GENMATH-A, GENMATH-B
            $table->string('teacher')->nullable();
            $table->string('schedule')->nullable(); // e.g., MWF 8:00-9:00 AM
            $table->string('room')->nullable();
            $table->string('school_year'); // e.g., 2025-2026
            $table->string('semester')->nullable(); // 1st Semester, 2nd Semester
            $table->integer('capacity')->default(40);
            $table->integer('current_enrollment')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            // Unique constraint: same section code can't exist twice for the same subject in same school year
            $table->unique(['subject_id', 'section_code', 'school_year'], 'subject_offering_unique');
        });

        // Remove schedule column from subjects table since it's now in subject_offerings
        Schema::table('subjects', function (Blueprint $table) {
            $table->dropColumn('schedule');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Add schedule column back to subjects
        Schema::table('subjects', function (Blueprint $table) {
            $table->string('schedule')->nullable()->after('semester');
        });

        Schema::dropIfExists('subject_offerings');
    }
};
