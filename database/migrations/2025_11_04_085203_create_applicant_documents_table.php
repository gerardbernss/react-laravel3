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
        Schema::create('applicant_documents', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('applicant_application_info_id')->nullable();

            $table->string('certificate_of_enrollment')->nullable();
            $table->string('birth_certificate')->nullable();
            $table->string('latest_report_card_front')->nullable();
            $table->string('latest_report_card_back')->nullable();
            $table->timestamps();

            $table->foreign('applicant_application_info_id')->references('id')->on('applicant_application_info')->onDelete('set null');

        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('applicant_documents');
    }
};
