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
        Schema::create('fee_rates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('fee_type_id')->constrained('fee_types')->onDelete('cascade');
            $table->string('school_year', 20);
            $table->enum('semester', ['1st Semester', '2nd Semester', 'Summer', 'Yearly'])->default('Yearly');
            $table->enum('student_category', ['all', 'LES', 'JHS', 'SHS'])->default('all');
            $table->decimal('amount', 10, 2);
            $table->date('effective_date')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            // Ensure unique rate per fee type, school year, semester, and category
            $table->unique(['fee_type_id', 'school_year', 'semester', 'student_category'], 'fee_rates_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('fee_rates');
    }
};
