<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('applicant_application_info', function (Blueprint $table) {
            $table->string('student_id_number')->nullable()->unique()->after('examination_date');
        });
    }

    public function down(): void
    {
        Schema::table('applicant_application_info', function (Blueprint $table) {
            $table->dropColumn('student_id_number');
        });
    }
};
