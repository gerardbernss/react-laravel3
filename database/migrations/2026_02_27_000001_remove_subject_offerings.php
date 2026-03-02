<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // SQLite does not support dropping FK columns via ALTER TABLE.
        // We rebuild the table without subject_offering_id.
        DB::statement('PRAGMA foreign_keys = OFF');

        DB::statement('
            CREATE TABLE student_enrollment_subjects_new (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                student_enrollment_id INTEGER NOT NULL
                    REFERENCES student_enrollments(id) ON DELETE CASCADE,
                subject_id INTEGER NOT NULL
                    REFERENCES subjects(id) ON DELETE CASCADE,
                units NUMERIC(3,1) NOT NULL DEFAULT 1.0,
                grade NUMERIC(4,2) NULL,
                grade_status VARCHAR(255) NULL,
                schedule VARCHAR(255) NULL,
                room VARCHAR(255) NULL,
                teacher VARCHAR(255) NULL,
                created_at DATETIME NULL,
                updated_at DATETIME NULL,
                UNIQUE (student_enrollment_id, subject_id)
            )
        ');

        DB::statement('
            INSERT INTO student_enrollment_subjects_new
                (id, student_enrollment_id, subject_id, units, grade, grade_status,
                 schedule, room, teacher, created_at, updated_at)
            SELECT id, student_enrollment_id, subject_id, units, grade, grade_status,
                   schedule, room, teacher, created_at, updated_at
            FROM student_enrollment_subjects
        ');

        DB::statement('DROP TABLE student_enrollment_subjects');
        DB::statement('ALTER TABLE student_enrollment_subjects_new RENAME TO student_enrollment_subjects');
        DB::statement('CREATE INDEX ses_grade_status ON student_enrollment_subjects(grade_status)');

        // Drop the entirely unused subject_offerings table
        Schema::dropIfExists('subject_offerings');

        DB::statement('PRAGMA foreign_keys = ON');
    }

    public function down(): void
    {
        DB::statement('PRAGMA foreign_keys = OFF');

        Schema::create('subject_offerings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('subject_id')->constrained()->cascadeOnDelete();
            $table->string('section_code');
            $table->string('teacher')->nullable();
            $table->string('schedule')->nullable();
            $table->string('room')->nullable();
            $table->string('school_year');
            $table->string('semester')->nullable();
            $table->integer('capacity')->default(40);
            $table->integer('current_enrollment')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::table('student_enrollment_subjects', function (Blueprint $table) {
            $table->foreignId('subject_offering_id')->nullable()->constrained('subject_offerings')->nullOnDelete();
        });

        DB::statement('PRAGMA foreign_keys = ON');
    }
};
