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
        Schema::create('students', function (Blueprint $table) {
            $table->id();

            // Basic student info
            $table->string('student_id_number', 20)->nullable()->unique();
            $table->string('enrollment_date');

            $table->unsignedBigInteger('applicant_personal_data_id')->unique();

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
        Schema::dropIfExists('students');
    }
};
