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
        Schema::create('applicant_siblings', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('applicant_personal_data_id');

            $table->string('sibling_full_name')->nullable();
            $table->string('sibling_grade_level')->nullable();
            $table->string('sibling_id_number')->nullable();

            $table->timestamps();

            $table->foreign('applicant_personal_data_id')->references('id')->on('applicant_personal_data')->onDelete('cascade');

        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('applicant_siblings');
    }
};
