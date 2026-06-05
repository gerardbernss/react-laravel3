<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('applicant_assessments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('applicant_id')->constrained('applicants')->cascadeOnDelete();
            $table->string('assessment_number')->unique();
            $table->string('school_year');
            $table->string('semester')->nullable();
            $table->decimal('total_tuition', 10, 2)->default(0);
            $table->decimal('total_misc_fees', 10, 2)->default(0);
            $table->decimal('total_lab_fees', 10, 2)->default(0);
            $table->decimal('total_other_fees', 10, 2)->default(0);
            $table->decimal('gross_amount', 10, 2)->default(0);
            $table->decimal('total_discounts', 10, 2)->default(0);
            $table->decimal('net_amount', 10, 2)->default(0);
            $table->decimal('minimum_amount', 10, 2)->default(0);
            $table->string('mode_of_payment')->default('cash');
            $table->string('status')->default('pending'); // pending | paid | cancelled
            $table->timestamp('generated_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('applicant_assessments');
    }
};
