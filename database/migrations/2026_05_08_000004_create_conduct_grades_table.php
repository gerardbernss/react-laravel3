<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('conduct_grades', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_enrollment_id')->constrained()->cascadeOnDelete();
            $table->foreignId('conduct_criteria_id')->constrained('conduct_criteria')->cascadeOnDelete();
            $table->enum('grading_quarter', ['Q1', 'Q2', 'Q3', 'Q4']);
            $table->decimal('score', 5, 2)->nullable();
            $table->foreignId('recorded_by')->constrained('users');
            $table->timestamps();

            $table->unique(
                ['student_enrollment_id', 'conduct_criteria_id', 'grading_quarter'],
                'unique_conduct_grade'
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('conduct_grades');
    }
};
