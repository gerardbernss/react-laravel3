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
        Schema::create('block_sections', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('code')->unique();
            $table->enum('grade_level', ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12']);
            $table->string('school_year');
            $table->enum('semester', ['First Semester', 'Second Semester', 'Summer', 'Full Year'])->nullable();
            $table->string('adviser')->nullable();
            $table->string('room')->nullable();
            $table->integer('capacity')->default(40);
            $table->integer('current_enrollment')->default(0);
            $table->text('schedule')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // Pivot table for block sections and subjects
        Schema::create('block_section_subject', function (Blueprint $table) {
            $table->id();
            $table->foreignId('block_section_id')->constrained()->onDelete('cascade');
            $table->foreignId('subject_id')->constrained()->onDelete('cascade');
            $table->string('teacher')->nullable();
            $table->string('schedule')->nullable();
            $table->string('room')->nullable();
            $table->timestamps();

            $table->unique(['block_section_id', 'subject_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('block_section_subject');
        Schema::dropIfExists('block_sections');
    }
};
