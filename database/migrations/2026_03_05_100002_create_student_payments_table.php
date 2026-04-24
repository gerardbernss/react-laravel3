<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('student_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('assessment_id')->constrained('student_assessments')->onDelete('cascade');
            $table->decimal('amount_paid', 10, 2);
            $table->enum('payment_method', ['cash', 'check', 'bank_transfer', 'gcash', 'maya'])->default('cash');
            $table->string('reference_number', 100)->nullable();
            $table->date('payment_date');
            $table->text('notes')->nullable();
            $table->foreignId('processed_by')->constrained('users');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('student_payments');
    }
};
