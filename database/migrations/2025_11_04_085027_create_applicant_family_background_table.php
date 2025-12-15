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
        Schema::create('applicant_family_background', function (Blueprint $table) {
            $table->id();

            $table->unsignedBigInteger('applicant_personal_data_id')->nullable();

            // Father
            $table->string('father_lname');
            $table->string('father_fname');
            $table->string('father_mname');
            $table->string('father_living');
            $table->string('father_citizenship')->nullable();
            $table->string('father_religion')->nullable();
            $table->string('father_highest_educ')->nullable();
            $table->string('father_occupation')->nullable();
            $table->decimal('father_income', 10, 2)->nullable();
            $table->string('father_business_emp')->nullable();
            $table->string('father_business_address')->nullable();
            $table->string('father_contact_no')->nullable();
            $table->string('father_email')->nullable();
            $table->boolean('father_slu_employee')->default(false);
            $table->string('father_slu_dept')->nullable();

            // Mother
            $table->string('mother_lname');
            $table->string('mother_fname');
            $table->string('mother_mname');
            $table->boolean('mother_living')->nullable();
            $table->string('mother_citizenship')->nullable();
            $table->string('mother_religion')->nullable();
            $table->string('mother_highest_educ')->nullable();
            $table->string('mother_occupation')->nullable();
            $table->decimal('mother_income', 10, 2)->nullable();
            $table->string('mother_business_emp')->nullable();
            $table->string('mother_business_address')->nullable();
            $table->string('mother_contact_no')->nullable();
            $table->string('mother_email')->nullable();
            $table->boolean('mother_slu_employee')->default(false);
            $table->string('mother_slu_dept')->nullable();

            // Guardian
            $table->string('guardian_lname');
            $table->string('guardian_fname');
            $table->string('guardian_mname');
            $table->string('guardian_relationship')->nullable();
            $table->string('guardian_citizenship')->nullable();
            $table->string('guardian_religion')->nullable();
            $table->string('guardian_highest_educ')->nullable();
            $table->string('guardian_occupation')->nullable();
            $table->decimal('guardian_income', 10, 2)->nullable();
            $table->string('guardian_business_emp')->nullable();
            $table->string('guardian_business_address')->nullable();
            $table->string('guardian_contact_no');
            $table->string('guardian_email')->nullable();
            $table->boolean('guardian_slu_employee')->nullable();
            $table->string('guardian_slu_dept')->nullable();

            // Emergency contact
            $table->string('emergency_contact_name')->nullable();
            $table->string('emergency_relationship')->nullable();
            $table->string('emergency_email')->nullable();
            $table->string('emergency_home_phone')->nullable();
            $table->string('emergency_mobile_phone');

            $table->timestamps();

            $table->foreign('applicant_personal_data_id')->references('id')->on('applicant_personal_data')->onDelete('cascade');

        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('applicant_family_background');
    }
};
