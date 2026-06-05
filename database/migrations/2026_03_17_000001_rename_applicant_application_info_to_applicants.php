<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() === 'sqlite') {
            DB::statement('PRAGMA foreign_keys = OFF');
        }

        Schema::dropIfExists('applicants');
        Schema::rename('applicant_application_info', 'applicants');

        DB::statement('ALTER TABLE applicant_educational_background RENAME COLUMN applicant_application_info_id TO applicant_id');
        DB::statement('ALTER TABLE applicant_documents RENAME COLUMN applicant_application_info_id TO applicant_id');
        DB::statement('ALTER TABLE portal_credentials RENAME COLUMN applicant_application_info_id TO applicant_id');
        DB::statement('ALTER TABLE students RENAME COLUMN applicant_application_info_id TO applicant_id');
        DB::statement('ALTER TABLE enrollment_audit_logs RENAME COLUMN applicant_application_info_id TO applicant_id');
        DB::statement('ALTER TABLE applicant_exam_assignments RENAME COLUMN applicant_application_info_id TO applicant_id');

        if (DB::getDriverName() === 'sqlite') {
            DB::statement('PRAGMA foreign_keys = ON');
        }
    }

    public function down(): void
    {
        if (DB::getDriverName() === 'sqlite') {
            DB::statement('PRAGMA foreign_keys = OFF');
        }

        Schema::rename('applicants', 'applicant_application_info');

        DB::statement('ALTER TABLE applicant_educational_background RENAME COLUMN applicant_id TO applicant_application_info_id');
        DB::statement('ALTER TABLE applicant_documents RENAME COLUMN applicant_id TO applicant_application_info_id');
        DB::statement('ALTER TABLE portal_credentials RENAME COLUMN applicant_id TO applicant_application_info_id');
        DB::statement('ALTER TABLE students RENAME COLUMN applicant_id TO applicant_application_info_id');
        DB::statement('ALTER TABLE enrollment_audit_logs RENAME COLUMN applicant_id TO applicant_application_info_id');
        DB::statement('ALTER TABLE applicant_exam_assignments RENAME COLUMN applicant_id TO applicant_application_info_id');

        if (DB::getDriverName() === 'sqlite') {
            DB::statement('PRAGMA foreign_keys = ON');
        }
    }
};
