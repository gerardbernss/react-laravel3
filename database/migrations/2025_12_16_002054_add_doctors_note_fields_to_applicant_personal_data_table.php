<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('applicant_personal_data', function (Blueprint $table) {
            $table->boolean('has_doctors_note')
                ->default(false)
                ->after('health_conditions');

            $table->string('doctors_note_file')
                ->nullable()
                ->after('has_doctors_note');

            $table->renameColumn('sex', 'gender');

        });

    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('applicant_personal_data', function (Blueprint $table) {
            Schema::table('applicant_personal_data', function (Blueprint $table) {
                $table->dropColumn(['has_doctors_note', 'doctors_note_file']);
                $table->renameColumn('gender', 'sex');

            });

        });
    }
};
