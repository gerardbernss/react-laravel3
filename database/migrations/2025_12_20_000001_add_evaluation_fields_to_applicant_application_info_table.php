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
        Schema::table('applicant_application_info', function (Blueprint $table) {
            $table->enum('evaluation_status', ['Pending', 'Passed', 'Failed', 'Waitlisted'])->default('Pending')->after('examination_date');
            $table->string('exam_score')->nullable()->after('evaluation_status');
            $table->text('interview_remarks')->nullable()->after('exam_score');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('applicant_application_info', function (Blueprint $table) {
            $table->dropColumn(['evaluation_status', 'exam_score', 'interview_remarks']);
        });
    }
};
