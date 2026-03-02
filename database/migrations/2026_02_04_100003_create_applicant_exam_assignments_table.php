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
        Schema::create('applicant_exam_assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('applicant_application_info_id')->constrained('applicant_application_info')->onDelete('cascade');
            $table->foreignId('exam_schedule_id')->constrained('exam_schedules')->onDelete('cascade');
            $table->string('seat_number')->nullable();
            $table->enum('status', ['assigned', 'confirmed', 'attended', 'absent', 'cancelled'])->default('assigned');
            $table->text('notes')->nullable();
            $table->timestamp('assigned_at')->nullable();
            $table->timestamp('confirmed_at')->nullable();
            $table->timestamps();

            $table->unique(['applicant_application_info_id', 'exam_schedule_id'], 'applicant_exam_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('applicant_exam_assignments');
    }
};
