<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('applicant_family_background', function (Blueprint $table) {
            $table->foreignId('father_employee_id')->nullable()->constrained('employees')->nullOnDelete();
            $table->foreignId('mother_employee_id')->nullable()->constrained('employees')->nullOnDelete();
            $table->foreignId('guardian_employee_id')->nullable()->constrained('employees')->nullOnDelete();
        });

        Schema::table('student_family_background', function (Blueprint $table) {
            $table->foreignId('father_employee_id')->nullable()->constrained('employees')->nullOnDelete();
            $table->foreignId('mother_employee_id')->nullable()->constrained('employees')->nullOnDelete();
            $table->foreignId('guardian_employee_id')->nullable()->constrained('employees')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('applicant_family_background', function (Blueprint $table) {
            $table->dropForeign(['father_employee_id']);
            $table->dropForeign(['mother_employee_id']);
            $table->dropForeign(['guardian_employee_id']);
            $table->dropColumn(['father_employee_id', 'mother_employee_id', 'guardian_employee_id']);
        });

        Schema::table('student_family_background', function (Blueprint $table) {
            $table->dropForeign(['father_employee_id']);
            $table->dropForeign(['mother_employee_id']);
            $table->dropForeign(['guardian_employee_id']);
            $table->dropColumn(['father_employee_id', 'mother_employee_id', 'guardian_employee_id']);
        });
    }
};
