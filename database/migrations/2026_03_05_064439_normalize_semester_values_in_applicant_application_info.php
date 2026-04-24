<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('applicant_application_info')
            ->where('semester', '1st Semester')
            ->update(['semester' => 'First Semester']);

        DB::table('applicant_application_info')
            ->where('semester', '2nd Semester')
            ->update(['semester' => 'Second Semester']);
    }

    public function down(): void
    {
        DB::table('applicant_application_info')
            ->where('semester', 'First Semester')
            ->update(['semester' => '1st Semester']);

        DB::table('applicant_application_info')
            ->where('semester', 'Second Semester')
            ->update(['semester' => '2nd Semester']);
    }
};
