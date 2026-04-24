<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement('PRAGMA foreign_keys = OFF');

        // Drop old legacy applicants table (flat schema, superseded)
        Schema::dropIfExists('applicants');

        // Rename the main table
        Schema::rename('applicant_application_info', 'applicants');

        // Rename FK column in all dependent tables
        DB::statement('ALTER TABLE applicant_educational_background RENAME COLUMN applicant_application_info_id TO applicant_id');
        DB::statement('ALTER TABLE applicant_documents RENAME COLUMN applicant_application_info_id TO applicant_id');
        DB::statement('ALTER TABLE portal_credentials RENAME COLUMN applicant_application_info_id TO applicant_id');
        DB::statement('ALTER TABLE students RENAME COLUMN applicant_application_info_id TO applicant_id');
        DB::statement('ALTER TABLE enrollment_audit_logs RENAME COLUMN applicant_application_info_id TO applicant_id');
        DB::statement('ALTER TABLE applicant_exam_assignments RENAME COLUMN applicant_application_info_id TO applicant_id');

        DB::statement('PRAGMA foreign_keys = ON');
    }

    public function down(): void
    {
        DB::statement('PRAGMA foreign_keys = OFF');

        Schema::rename('applicants', 'applicant_application_info');

        DB::statement('ALTER TABLE applicant_educational_background RENAME COLUMN applicant_id TO applicant_application_info_id');
        DB::statement('ALTER TABLE applicant_documents RENAME COLUMN applicant_id TO applicant_application_info_id');
        DB::statement('ALTER TABLE portal_credentials RENAME COLUMN applicant_id TO applicant_application_info_id');
        DB::statement('ALTER TABLE students RENAME COLUMN applicant_id TO applicant_application_info_id');
        DB::statement('ALTER TABLE enrollment_audit_logs RENAME COLUMN applicant_id TO applicant_application_info_id');
        DB::statement('ALTER TABLE applicant_exam_assignments RENAME COLUMN applicant_id TO applicant_application_info_id');

        DB::statement('PRAGMA foreign_keys = ON');
    }
};
