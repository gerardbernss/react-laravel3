<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('applicants', function (Blueprint $table) {
            $table->id();

            // Application Information
            $table->date('application_date');
            $table->string('prio_no')->nullable();
            $table->string('business_unit')->nullable();
            $table->string('campus_site');
            $table->string('entry_class');
            $table->string('stud_batch');
            $table->string('semester');
            $table->string('schedule_pref')->nullable();
            $table->string('pchoice1')->nullable();
            $table->string('pchoice2')->nullable();
            $table->string('pchoice3')->nullable();
            $table->string('curr_code');
            $table->string('year_level');

            // Personal Information
            $table->string('lrn')->unique();
            $table->string('first_name');
            $table->string('middle_name');
            $table->string('last_name');
            $table->string('suffix')->nullable();
            $table->string('gender');
            $table->string('citizenship');
            $table->string('religion');
            $table->date('date_of_birth');
            $table->string('place_of_birth')->nullable();
            $table->string('civil_status');
            $table->string('birth_order')->nullable();
            $table->string('mother_tongue')->nullable();
            $table->string('ethnicity')->nullable();

            // Contact Information
            $table->string('phone');
            $table->string('email')->unique();
            $table->string('street')->nullable();
            $table->string('brgy');
            $table->string('city');
            $table->string('state');
            $table->string('zip_code');
            $table->string('father_name');
            $table->string('father_number');
            $table->string('mother_name');
            $table->string('mother_number');
            $table->string('emergency_contact_name');
            $table->string('emergency_contact_number');

            // Other Information
            $table->string('financial_source')->nullable();
            $table->date('exam_schedule');

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('applicants');
    }
};
