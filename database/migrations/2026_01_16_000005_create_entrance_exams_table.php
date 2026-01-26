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
        Schema::create('entrance_exams', function (Blueprint $table) {
            $table->id();

            // Foreign Keys
            $table->unsignedBigInteger('applicant_application_info_id');
            $table->unsignedBigInteger('applicant_personal_data_id');

            // Exam Schedule Information
            $table->dateTime('exam_scheduled_date')->nullable();
            $table->time('exam_time')->nullable();
            $table->string('exam_venue')->nullable();
            $table->string('exam_room_number')->nullable();
            $table->string('seat_number')->nullable();

                                                                 // Exam Status
            $table->string('exam_status')->default('Scheduled'); // Scheduled, Completed, Cancelled, No-show
            $table->dateTime('exam_completed_date')->nullable();

            // Exam Results
            $table->decimal('raw_score', 5, 2)->nullable();
            $table->decimal('total_marks', 5, 2)->default(100);
            $table->decimal('percentage_score', 5, 2)->nullable();
            $table->enum('result', ['Pass', 'Fail', 'Pending'])->default('Pending');

                                                        // Section/Subject Scores (if applicable)
            $table->json('section_scores')->nullable(); // For multiple sections: {"Math": 25, "English": 30}
            $table->json('subject_scores')->nullable(); // For multiple subjects: {"Mathematics": 85, "Science": 78}

            // Additional Details
            $table->decimal('passing_score', 5, 2)->nullable();
            $table->text('exam_remarks')->nullable();
            $table->text('invigilator_remarks')->nullable();
            $table->string('invigilator_name')->nullable();

            // Document Upload
            $table->string('exam_answer_sheet_path')->nullable();
            $table->string('exam_result_certificate_path')->nullable();

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
            $table->index('exam_status');
            $table->index('exam_scheduled_date');
            $table->index('result');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('entrance_exams');
    }
};
