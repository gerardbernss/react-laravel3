<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('programs', 'vocational')) {
            return;
        }

        DB::statement('PRAGMA foreign_keys = OFF');

        DB::statement('
            CREATE TABLE programs_new (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                code        VARCHAR(20) NOT NULL UNIQUE,
                description VARCHAR(255) NOT NULL,
                school      VARCHAR(255) NOT NULL,
                is_active   TINYINT(1) NOT NULL DEFAULT 1,
                max_load    INTEGER NOT NULL DEFAULT 0,
                created_at  DATETIME,
                updated_at  DATETIME
            )
        ');

        DB::statement('
            INSERT INTO programs_new (id, code, description, school, is_active, max_load, created_at, updated_at)
            SELECT id, code, description, school, is_active, max_load, created_at, updated_at
            FROM programs
        ');

        DB::statement('DROP TABLE programs');
        DB::statement('ALTER TABLE programs_new RENAME TO programs');

        DB::statement('PRAGMA foreign_keys = ON');
    }

    public function down(): void
    {
        DB::statement('PRAGMA foreign_keys = OFF');

        DB::statement('
            CREATE TABLE programs_new (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                code        VARCHAR(20) NOT NULL UNIQUE,
                description VARCHAR(255) NOT NULL,
                school      VARCHAR(255) NOT NULL,
                vocational  TINYINT(1) NOT NULL DEFAULT 0,
                is_active   TINYINT(1) NOT NULL DEFAULT 1,
                max_load    INTEGER NOT NULL DEFAULT 0,
                created_at  DATETIME,
                updated_at  DATETIME
            )
        ');

        DB::statement('
            INSERT INTO programs_new (id, code, description, school, vocational, is_active, max_load, created_at, updated_at)
            SELECT id, code, description, school, 0, is_active, max_load, created_at, updated_at
            FROM programs
        ');

        DB::statement('DROP TABLE programs');
        DB::statement('ALTER TABLE programs_new RENAME TO programs');

        DB::statement('PRAGMA foreign_keys = ON');
    }
};
