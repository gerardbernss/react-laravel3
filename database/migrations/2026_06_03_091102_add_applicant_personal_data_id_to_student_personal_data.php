<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Add applicant_personal_data_id as a reliable unique FK
        Schema::table('student_personal_data', function (Blueprint $table) {
            $table->unsignedBigInteger('applicant_personal_data_id')->nullable()->unique()->after('id');
        });

        // 2. Make email nullable — use raw SQL to avoid Doctrine DBAL issues on Oracle
        if (DB::getDriverName() === 'oracle') {
            DB::statement('ALTER TABLE student_personal_data MODIFY email NULL');
        } else {
            Schema::table('student_personal_data', function (Blueprint $table) {
                $table->string('email')->nullable()->change();
            });
        }
    }

    public function down(): void
    {
        if (DB::getDriverName() === 'oracle') {
            DB::statement('ALTER TABLE student_personal_data MODIFY email NOT NULL');
        } else {
            Schema::table('student_personal_data', function (Blueprint $table) {
                $table->string('email')->nullable(false)->change();
            });
        }

        Schema::table('student_personal_data', function (Blueprint $table) {
            $table->dropUnique(['applicant_personal_data_id']);
            $table->dropColumn('applicant_personal_data_id');
        });
    }
};
