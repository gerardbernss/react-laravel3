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
        Schema::create('applicant_application_info', function (Blueprint $table) {
            $table->id();

            $table->unsignedBigInteger('applicant_personal_data_id');

            //new field
            $table->string('application_number', 20)->unique();

            $table->string('application_status');
            $table->string('application_date');
            $table->string('year_level');
            $table->string('school_year');
            $table->string('semester');
            $table->string('student_category'); //LES, JHS, or SHS
            $table->string('strand');
            $table->string('classification');
            $table->string('learning_mode')->nullable();
            $table->string('accomplished_by_name')->nullable();

            //new fields
            $table->string('examination_date')->nullable();
            $table->enum('application_type', ['Online', 'Onsite'])->default('Online');
            $table->string('remarks')->nullable();

            $table->timestamps();

            $table->foreign('applicant_personal_data_id')
                ->references('id')
                ->on('applicant_personal_data')
                ->onDelete('cascade');

        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('applicant_application_info');
    }
};
