<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Rebuild the subjects table with a proper INTEGER PRIMARY KEY declaration.
     *
     * Migration 000002 used "CREATE TABLE ... AS SELECT" which strips the
     * PRIMARY KEY constraint from id, causing "foreign key mismatch" errors
     * on any table (e.g. attendances) that references subjects.id.
     */
    public function up(): void
    {
        DB::statement('PRAGMA foreign_keys = OFF');

        DB::statement('CREATE TABLE subjects_rebuilt (
            "id"          integer  NOT NULL PRIMARY KEY AUTOINCREMENT,
            "code"        varchar  NOT NULL,
            "name"        varchar  NOT NULL,
            "description" text     NULL,
            "units"       integer  NOT NULL DEFAULT 3,
            "type"        varchar  NOT NULL DEFAULT \'Core\',
            "grade_level" varchar  NULL,
            "strand"      varchar  NULL,
            "semester"    varchar  NULL,
            "schedule"    varchar  NULL,
            "room"        varchar  NULL,
            "user_id"     integer  NULL REFERENCES "users"("id") ON DELETE SET NULL,
            "is_active"   tinyint(1) NOT NULL DEFAULT 1,
            "created_at"  datetime NULL,
            "updated_at"  datetime NULL
        )');

        DB::statement('INSERT INTO subjects_rebuilt
            SELECT id, code, name, description, units, type, grade_level, strand,
                   semester, schedule, room, user_id, is_active, created_at, updated_at
            FROM subjects');

        DB::statement('DROP TABLE subjects');
        DB::statement('ALTER TABLE subjects_rebuilt RENAME TO subjects');

        // Restore the unique index that was dropped by the CTAS rebuild
        DB::statement('CREATE UNIQUE INDEX subjects_code_unique ON subjects (code)');

        DB::statement('PRAGMA foreign_keys = ON');
    }

    public function down(): void
    {
        // No rollback — this is a structural fix only
    }
};
