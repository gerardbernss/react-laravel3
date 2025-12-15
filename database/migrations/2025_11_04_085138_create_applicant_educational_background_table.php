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
        Schema::create('applicant_educational_background', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('applicant_application_info_id');

            $table->string('school_name');
            $table->string('school_address');
            $table->string('from_grade')->nullable();
            $table->string('to_grade')->nullable();
            $table->year('from_year')->nullable();
            $table->year('to_year')->nullable();
            $table->string('honors_awards')->nullable();
            $table->decimal('general_average', 5, 2)->nullable();
            $table->integer('class_rank')->nullable();
            $table->integer('class_size')->nullable();

            $table->timestamps();

            $table->foreign('applicant_application_info_id')->references('id')->on('applicant_application_info')->onDelete('cascade');

        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('applicant_educational_background');
    }
};
