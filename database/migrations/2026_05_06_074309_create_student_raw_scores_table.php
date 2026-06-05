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
        Schema::create('student_raw_scores', function (Blueprint $table) {
            $table->id();
            $table->foreignId('grade_component_id')->constrained()->cascadeOnDelete();
            $table->foreignId('student_enrollment_subject_id')->constrained('student_enrollment_subjects')->cascadeOnDelete();
            $table->decimal('raw_score', 8, 2)->nullable();
            $table->timestamps();

            $table->unique(['grade_component_id', 'student_enrollment_subject_id'], 'unique_raw_score');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('student_raw_scores');
    }
};
