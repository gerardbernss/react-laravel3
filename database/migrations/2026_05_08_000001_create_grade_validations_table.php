<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('grade_validations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('block_section_id')->constrained()->cascadeOnDelete();
            $table->foreignId('subject_id')->constrained()->cascadeOnDelete();
            $table->enum('grading_quarter', ['Q1', 'Q2', 'Q3', 'Q4']);
            $table->string('school_year');
            $table->enum('status', ['draft', 'submitted', 'finalized'])->default('draft');
            $table->timestamp('submitted_at')->nullable();
            $table->foreignId('submitted_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('finalized_at')->nullable();
            $table->foreignId('finalized_by')->nullable()->constrained('users')->nullOnDelete();
            $table->text('rejection_reason')->nullable();
            $table->timestamps();

            $table->unique(
                ['block_section_id', 'subject_id', 'grading_quarter', 'school_year'],
                'unique_grade_validation'
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('grade_validations');
    }
};
