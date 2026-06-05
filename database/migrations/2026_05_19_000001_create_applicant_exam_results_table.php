<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('applicant_exam_results', function (Blueprint $table) {
            $table->id();
            $table->foreignId('applicant_id')->nullable()->constrained('applicants')->nullOnDelete();
            $table->foreignId('applicant_personal_data_id')->nullable()->constrained('applicant_personal_data')->nullOnDelete();
            $table->string('applicant_number')->nullable();
            $table->date('exam_date')->nullable();
            $table->string('exam_time')->nullable();
            $table->string('exam_venue')->nullable();
            $table->decimal('math_score', 8, 2)->nullable();
            $table->decimal('english_score', 8, 2)->nullable();
            $table->decimal('science_score', 8, 2)->nullable();
            $table->decimal('total_score', 8, 2)->nullable();
            $table->decimal('percentage_score', 8, 2)->nullable();
            $table->string('result')->nullable();
            $table->string('ranking')->nullable();
            $table->foreignId('uploaded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique('applicant_personal_data_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('applicant_exam_results');
    }
};
