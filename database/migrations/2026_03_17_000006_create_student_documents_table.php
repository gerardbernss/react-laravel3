<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('student_documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_personal_data_id')
                ->constrained('student_personal_data')
                ->onDelete('cascade');
            $table->string('certificate_of_enrollment')->nullable();
            $table->string('birth_certificate')->nullable();
            $table->string('latest_report_card_front')->nullable();
            $table->string('latest_report_card_back')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('student_documents');
    }
};
