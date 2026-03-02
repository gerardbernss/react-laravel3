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
        Schema::create('exam_schedules', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // e.g., "Entrance Exam Batch 1"
            $table->string('exam_type')->default('Entrance Exam'); // e.g., "Entrance Exam", "Placement Test"
            $table->date('exam_date');
            $table->time('start_time');
            $table->time('end_time');
            $table->foreignId('examination_room_id')->constrained('examination_rooms')->onDelete('cascade');
            $table->integer('capacity')->nullable(); // Override room capacity if needed
            $table->text('description')->nullable();
            $table->text('instructions')->nullable(); // Exam instructions for applicants
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('exam_schedules');
    }
};
