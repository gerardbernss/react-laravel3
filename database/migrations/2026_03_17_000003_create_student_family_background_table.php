<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('student_family_background', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_personal_data_id')->constrained('student_personal_data')->onDelete('cascade');

            // Father
            $table->string('father_lname')->nullable();
            $table->string('father_fname')->nullable();
            $table->string('father_mname')->nullable();
            $table->string('father_living')->nullable();
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
            $table->string('mother_lname')->nullable();
            $table->string('mother_fname')->nullable();
            $table->string('mother_mname')->nullable();
            $table->string('mother_living')->nullable();
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
            $table->string('guardian_lname')->nullable();
            $table->string('guardian_fname')->nullable();
            $table->string('guardian_mname')->nullable();
            $table->string('guardian_relationship')->nullable();
            $table->string('guardian_citizenship')->nullable();
            $table->string('guardian_religion')->nullable();
            $table->string('guardian_highest_educ')->nullable();
            $table->string('guardian_occupation')->nullable();
            $table->decimal('guardian_income', 10, 2)->nullable();
            $table->string('guardian_business_emp')->nullable();
            $table->string('guardian_business_address')->nullable();
            $table->string('guardian_contact_no')->nullable();
            $table->string('guardian_email')->nullable();
            $table->boolean('guardian_slu_employee')->nullable();
            $table->string('guardian_slu_dept')->nullable();

            // Emergency contact
            $table->string('emergency_contact_name')->nullable();
            $table->string('emergency_relationship')->nullable();
            $table->string('emergency_email')->nullable();
            $table->string('emergency_home_phone')->nullable();
            $table->string('emergency_mobile_phone')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('student_family_background');
    }
};
