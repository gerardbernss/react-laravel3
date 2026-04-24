<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('student_assessments', function (Blueprint $table) {
            $table->enum('payment_plan', ['full', 'installment'])->default('full')->after('net_amount');
            $table->decimal('minimum_amount', 10, 2)->nullable()->after('payment_plan');
        });
    }

    public function down(): void
    {
        Schema::table('student_assessments', function (Blueprint $table) {
            $table->dropColumn(['payment_plan', 'minimum_amount']);
        });
    }
};
