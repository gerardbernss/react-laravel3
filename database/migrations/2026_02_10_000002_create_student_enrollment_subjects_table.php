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
        Schema::create('student_enrollment_subjects', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_enrollment_id')->constrained()->onDelete('cascade');
            $table->foreignId('subject_id')->constrained()->onDelete('cascade');
            $table->foreignId('subject_offering_id')->nullable()->constrained()->onDelete('set null');
            $table->decimal('units', 3, 1)->default(1.0);
            $table->decimal('grade', 4, 2)->nullable();    // Final grade (e.g., 1.00, 2.50, 5.00)
            $table->string('grade_status')->nullable();    // Passed, Failed, INC, DRP, W
            $table->string('schedule')->nullable();        // e.g., "MWF 8:00-9:00"
            $table->string('room')->nullable();            // e.g., "Room 101"
            $table->string('teacher')->nullable();         // Instructor name
            $table->timestamps();

            // Ensure a subject can only be enrolled once per enrollment
            $table->unique(['student_enrollment_id', 'subject_id']);
            $table->index('grade_status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('student_enrollment_subjects');
    }
};
