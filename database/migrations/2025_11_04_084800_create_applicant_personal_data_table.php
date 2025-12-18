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
        Schema::create('applicant_personal_data', function (Blueprint $table) {
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
            $table->string('place_of_birth');
            $table->boolean('has_sibling')->default(false);

                                               // Contact info
            $table->string('email')->unique(); //unique identifier
            $table->string('alt_email');
            $table->string('mobile_number');

            // Addresses
            $table->text('present_street')->nullable();
            $table->text('present_brgy');
            $table->text('present_city');
            $table->text('present_province');
            $table->text('present_zip');
            $table->text('permanent_street')->nullable();
            $table->text('permanent_brgy');
            $table->text('permanent_city');
            $table->text('permanent_province');
            $table->text('permanent_zip');

            //Questions
            $table->string('stopped_studying')->nullable();
            $table->string('accelerated')->nullable();
            $table->json('health_conditions')->nullable();

            $table->timestamps();

        });
    }

    public function down(): void
    {
        Schema::dropIfExists('applicant_personal_data');
    }
};
