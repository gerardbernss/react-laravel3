<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement('PRAGMA foreign_keys = OFF');

        DB::statement('
            CREATE TABLE applicant_exam_assignments_new (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                applicant_id INTEGER NOT NULL,
                exam_schedule_id INTEGER NOT NULL,
                status VARCHAR NOT NULL DEFAULT \'assigned\',
                notes TEXT,
                assigned_at DATETIME,
                confirmed_at DATETIME,
                created_at DATETIME,
                updated_at DATETIME,
                FOREIGN KEY (applicant_id) REFERENCES applicants(id) ON DELETE CASCADE,
                FOREIGN KEY (exam_schedule_id) REFERENCES exam_schedules(id) ON DELETE CASCADE,
                UNIQUE (applicant_id, exam_schedule_id)
            )
        ');

        DB::statement('
            INSERT INTO applicant_exam_assignments_new
                (id, applicant_id, exam_schedule_id, status, notes, assigned_at, confirmed_at, created_at, updated_at)
            SELECT
                id, applicant_id, exam_schedule_id, status, notes, assigned_at, confirmed_at, created_at, updated_at
            FROM applicant_exam_assignments
        ');

        DB::statement('DROP TABLE applicant_exam_assignments');
        DB::statement('ALTER TABLE applicant_exam_assignments_new RENAME TO applicant_exam_assignments');

        DB::statement('PRAGMA foreign_keys = ON');
    }

    public function down(): void
    {
        DB::statement('PRAGMA foreign_keys = OFF');

        DB::statement('
            CREATE TABLE applicant_exam_assignments_new (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                applicant_id INTEGER NOT NULL,
                exam_schedule_id INTEGER NOT NULL,
                seat_number VARCHAR,
                status VARCHAR NOT NULL DEFAULT \'assigned\',
                notes TEXT,
                assigned_at DATETIME,
                confirmed_at DATETIME,
                created_at DATETIME,
                updated_at DATETIME,
                FOREIGN KEY (applicant_id) REFERENCES applicants(id) ON DELETE CASCADE,
                FOREIGN KEY (exam_schedule_id) REFERENCES exam_schedules(id) ON DELETE CASCADE,
                UNIQUE (applicant_id, exam_schedule_id)
            )
        ');

        DB::statement('
            INSERT INTO applicant_exam_assignments_new
                (id, applicant_id, exam_schedule_id, status, notes, assigned_at, confirmed_at, created_at, updated_at)
            SELECT
                id, applicant_id, exam_schedule_id, status, notes, assigned_at, confirmed_at, created_at, updated_at
            FROM applicant_exam_assignments
        ');

        DB::statement('DROP TABLE applicant_exam_assignments');
        DB::statement('ALTER TABLE applicant_exam_assignments_new RENAME TO applicant_exam_assignments');

        DB::statement('PRAGMA foreign_keys = ON');
    }
};
