<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('student_personal_data', function (Blueprint $table) {
            $table->id();

            // Personal info
            $table->string('last_name');
            $table->string('first_name');
            $table->string('middle_name')->nullable();
            $table->string('suffix')->nullable();
            $table->string('learner_reference_number')->nullable();

            $table->enum('gender', ['Male', 'Female', 'Other']);
            $table->string('citizenship');
            $table->string('religion');
            $table->date('date_of_birth');
            $table->string('place_of_birth')->nullable();
            $table->boolean('has_sibling')->default(false);

            // Contact info
            $table->string('email')->unique();
            $table->string('alt_email')->nullable();
            $table->string('mobile_number')->nullable();

            // Addresses
            $table->text('present_street')->nullable();
            $table->text('present_brgy')->nullable();
            $table->text('present_city')->nullable();
            $table->text('present_province')->nullable();
            $table->text('present_zip')->nullable();
            $table->text('permanent_street')->nullable();
            $table->text('permanent_brgy')->nullable();
            $table->text('permanent_city')->nullable();
            $table->text('permanent_province')->nullable();
            $table->text('permanent_zip')->nullable();

            // Questions
            $table->string('stopped_studying')->nullable();
            $table->string('accelerated')->nullable();
            $table->json('health_conditions')->nullable();
            $table->boolean('has_doctors_note')->default(false);
            $table->string('doctors_note_file')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('student_personal_data');
    }
};
