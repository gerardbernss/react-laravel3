<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Clean slate — remove all existing fee rates
        DB::table('fee_rates')->delete();

        Schema::table('fee_rates', function (Blueprint $table) {
            $table->dropUnique('fee_rates_unique');
            $table->dropColumn('student_category');
        });

        Schema::table('fee_rates', function (Blueprint $table) {
            $table->enum('grade_level', [
                'all',
                'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6',
                'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12',
            ])->default('all')->after('semester');

            $table->unique(['fee_type_id', 'school_year', 'semester', 'grade_level']);
        });
    }

    public function down(): void
    {
        DB::table('fee_rates')->delete();

        Schema::table('fee_rates', function (Blueprint $table) {
            $table->dropUnique(['fee_type_id', 'school_year', 'semester', 'grade_level']);
            $table->dropColumn('grade_level');
        });

        Schema::table('fee_rates', function (Blueprint $table) {
            $table->enum('student_category', ['all', 'LES', 'JHS', 'SHS'])->default('all')->after('semester');
            $table->unique(['fee_type_id', 'school_year', 'semester', 'student_category']);
        });
    }
};
