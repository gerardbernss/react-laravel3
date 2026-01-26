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
        Schema::create('assessments', function (Blueprint $table) {
            $table->id();

            // Foreign Keys
            $table->unsignedBigInteger('applicant_application_info_id');
            $table->unsignedBigInteger('applicant_personal_data_id');

                                               // Assessment Details
            $table->string('assessment_type'); // e.g., 'Written Exam', 'Interview', 'Practical Test'
            $table->dateTime('assessment_date')->nullable();
            $table->string('assessment_status')->default('Pending'); // Pending, Completed, Cancelled

            // Scores and Results
            $table->decimal('score', 5, 2)->nullable();
            $table->decimal('total_score', 5, 2)->default(100);
            $table->text('assessor_remarks')->nullable();
            $table->string('assessed_by')->nullable(); // Name of assessor

            // Additional fields
            $table->text('feedback')->nullable();
            $table->enum('result', ['Pass', 'Fail', 'Pending'])->default('Pending');

            $table->timestamps();

            // Foreign Key Constraints
            $table->foreign('applicant_application_info_id')
                ->references('id')
                ->on('applicant_application_info')
                ->onDelete('cascade');

            $table->foreign('applicant_personal_data_id')
                ->references('id')
                ->on('applicant_personal_data')
                ->onDelete('cascade');

            // Indexes
            $table->index('applicant_application_info_id');
            $table->index('applicant_personal_data_id');
            $table->index('assessment_status');
            $table->index('assessment_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('assessments');
    }
};
