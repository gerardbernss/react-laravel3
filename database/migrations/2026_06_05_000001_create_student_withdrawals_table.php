<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('student_withdrawals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('applicant_id')->nullable()->constrained('applicants')->nullOnDelete();
            $table->foreignId('student_id')->nullable()->constrained('students')->nullOnDelete();
            $table->foreignId('assessment_id')->nullable()->constrained('student_assessments')->nullOnDelete();
            $table->enum('withdrawal_type', ['during_enrollment', 'after_classes']);
            $table->decimal('refund_amount', 10, 2)->default(0);
            $table->text('reason')->nullable();
            $table->foreignId('processed_by')->constrained('users');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('student_withdrawals');
    }
};
