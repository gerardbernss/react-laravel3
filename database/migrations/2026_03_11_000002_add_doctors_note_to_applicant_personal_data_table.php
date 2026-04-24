<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('applicant_personal_data', function (Blueprint $table) {
            if (!Schema::hasColumn('applicant_personal_data', 'has_doctors_note')) {
                $table->boolean('has_doctors_note')->default(false)->after('health_conditions');
            }
            if (!Schema::hasColumn('applicant_personal_data', 'doctors_note_file')) {
                $table->string('doctors_note_file')->nullable()->after('has_doctors_note');
            }
        });
    }

    public function down(): void
    {
        Schema::table('applicant_personal_data', function (Blueprint $table) {
            $cols = array_filter(
                ['has_doctors_note', 'doctors_note_file'],
                fn($col) => Schema::hasColumn('applicant_personal_data', $col)
            );
            if ($cols) {
                $table->dropColumn(array_values($cols));
            }
        });
    }
};
