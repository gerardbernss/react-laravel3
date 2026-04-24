<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement('PRAGMA foreign_keys = OFF');

        DB::statement('CREATE TABLE subjects_new (
            "id"          integer    NOT NULL PRIMARY KEY AUTOINCREMENT,
            "code"        varchar    NOT NULL,
            "name"        varchar    NOT NULL,
            "description" text       NULL,
            "units"       integer    NOT NULL DEFAULT 3,
            "type"        varchar    NOT NULL DEFAULT \'Core\',
            "grade_level" varchar    NULL,
            "strand"      varchar    NULL,
            "semester"    varchar    NULL,
            "user_id"     integer    NULL REFERENCES "users"("id") ON DELETE SET NULL,
            "is_active"   tinyint(1) NOT NULL DEFAULT 1,
            "created_at"  datetime   NULL,
            "updated_at"  datetime   NULL
        )');

        DB::statement('INSERT INTO subjects_new
            SELECT id, code, name, description, units, type,
                   grade_level, strand, semester, user_id, is_active,
                   created_at, updated_at
            FROM subjects');

        DB::statement('DROP TABLE subjects');
        DB::statement('ALTER TABLE subjects_new RENAME TO subjects');
        DB::statement('CREATE UNIQUE INDEX subjects_code_unique ON subjects (code)');

        DB::statement('PRAGMA foreign_keys = ON');
    }

    public function down(): void
    {
        Schema::table('subjects', function (Blueprint $table) {
            $table->string('schedule')->nullable()->after('semester');
            $table->string('room', 100)->nullable()->after('schedule');
        });
    }
};
