<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // SQLite does not support dropping columns directly when they exist in the table schema.
        // We rebuild the table without the schedule column.
        DB::statement('PRAGMA foreign_keys = OFF');
        DB::statement('CREATE TABLE subjects_new AS SELECT id, code, name, description, units, type, grade_level, strand, semester, is_active, created_at, updated_at FROM subjects');
        DB::statement('DROP TABLE subjects');
        DB::statement('ALTER TABLE subjects_new RENAME TO subjects');
        DB::statement('PRAGMA foreign_keys = ON');
    }

    public function down(): void
    {
        Schema::table('subjects', function (Blueprint $table) {
            $table->string('schedule')->nullable()->after('semester');
        });
    }
};
