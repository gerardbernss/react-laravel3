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
        Schema::create('grade_components', function (Blueprint $table) {
            $table->id();
            $table->foreignId('subject_id')->constrained()->cascadeOnDelete();
            $table->foreignId('block_section_id')->constrained()->cascadeOnDelete();
            $table->enum('grading_quarter', ['Q1', 'Q2', 'Q3', 'Q4']);
            $table->string('name');
            $table->decimal('hps', 8, 2);
            $table->decimal('weight', 5, 2)->comment('Percentage weight of final grade (0-100)');
            $table->unsignedSmallInteger('order')->default(0);
            $table->string('school_year');
            $table->foreignId('created_by')->constrained('users');
            $table->timestamps();

            $table->unique(['subject_id', 'block_section_id', 'grading_quarter', 'name'], 'unique_component');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('grade_components');
    }
};
