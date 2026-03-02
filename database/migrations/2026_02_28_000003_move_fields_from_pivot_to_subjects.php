<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Add schedule, room, user_id (faculty) to subjects table
        Schema::table('subjects', function (Blueprint $table) {
            $table->string('schedule')->nullable()->after('semester');
            $table->string('room')->nullable()->after('schedule');
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete()->after('room');
        });

        // Rebuild block_section_subject without teacher/schedule/room/user_id
        // SQLite does not support dropping columns, so we rebuild the table
        DB::statement('PRAGMA foreign_keys = OFF');
        DB::statement('CREATE TABLE block_section_subject_new AS SELECT id, block_section_id, subject_id, created_at, updated_at FROM block_section_subject');
        DB::statement('DROP TABLE block_section_subject');
        DB::statement('ALTER TABLE block_section_subject_new RENAME TO block_section_subject');
        DB::statement('PRAGMA foreign_keys = ON');
    }

    public function down(): void
    {
        // Remove added columns from subjects
        Schema::table('subjects', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
            $table->dropColumn(['schedule', 'room', 'user_id']);
        });

        // Restore teacher/schedule/room/user_id to block_section_subject
        Schema::table('block_section_subject', function (Blueprint $table) {
            $table->string('teacher')->nullable();
            $table->string('schedule')->nullable();
            $table->string('room')->nullable();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
        });
    }
};
