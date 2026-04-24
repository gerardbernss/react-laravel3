<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('student_assessments', function (Blueprint $table) {
            $table->dropColumn('payment_plan');
            $table->renameColumn('intended_payment_method', 'mode_of_payment');
        });
    }

    public function down(): void
    {
        Schema::table('student_assessments', function (Blueprint $table) {
            $table->enum('payment_plan', ['full', 'installment'])->default('full')->nullable();
            $table->renameColumn('mode_of_payment', 'intended_payment_method');
        });
    }
};
