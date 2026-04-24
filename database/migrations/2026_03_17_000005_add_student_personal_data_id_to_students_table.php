<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->foreignId('student_personal_data_id')
                ->nullable()
                ->after('applicant_personal_data_id')
                ->constrained('student_personal_data')
                ->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->dropForeign(['student_personal_data_id']);
            $table->dropColumn('student_personal_data_id');
        });
    }
};
