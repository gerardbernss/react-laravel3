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
        Schema::create('student_enrollments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained()->onDelete('cascade');
            $table->foreignId('block_section_id')->nullable()->constrained()->onDelete('set null');
            $table->string('school_year');              // e.g., "2025-2026"
            $table->string('semester');                 // First, Second, Summer
            $table->string('year_level');               // Grade 7, Grade 11, etc.
            $table->string('student_category');         // JHS, SHS, LES
            $table->date('enrollment_date');
            $table->string('status')->default('Enrolled'); // Enrolled, Completed, Dropped, Incomplete
            $table->decimal('gwa', 4, 2)->nullable();   // General Weighted Average
            $table->integer('total_units')->default(0);
            $table->integer('units_earned')->default(0);
            $table->text('remarks')->nullable();
            $table->timestamps();

            // Ensure one enrollment per student per semester
            $table->unique(['student_id', 'school_year', 'semester']);
            $table->index(['school_year', 'semester']);
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('student_enrollments');
    }
};
