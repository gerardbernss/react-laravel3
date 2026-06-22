<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Oracle maps time() to DATE, so start_time/end_time are DATE columns.
        // We need VARCHAR2 to store plain HH:MM strings.
        // Oracle requires an indirect rename because columns have existing data.
        DB::statement('ALTER TABLE exam_schedules ADD (start_time_new VARCHAR2(8))');
        DB::statement('ALTER TABLE exam_schedules ADD (end_time_new VARCHAR2(8))');

        DB::statement("UPDATE exam_schedules SET start_time_new = TO_CHAR(start_time, 'HH24:MI'), end_time_new = TO_CHAR(end_time, 'HH24:MI')");

        DB::statement('ALTER TABLE exam_schedules DROP COLUMN start_time');
        DB::statement('ALTER TABLE exam_schedules DROP COLUMN end_time');

        DB::statement('ALTER TABLE exam_schedules RENAME COLUMN start_time_new TO start_time');
        DB::statement('ALTER TABLE exam_schedules RENAME COLUMN end_time_new TO end_time');
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE exam_schedules ADD (start_time_old DATE)');
        DB::statement('ALTER TABLE exam_schedules ADD (end_time_old DATE)');

        DB::statement("UPDATE exam_schedules SET start_time_old = TO_DATE('1970-01-01 ' || start_time, 'YYYY-MM-DD HH24:MI'), end_time_old = TO_DATE('1970-01-01 ' || end_time, 'YYYY-MM-DD HH24:MI')");

        DB::statement('ALTER TABLE exam_schedules DROP COLUMN start_time');
        DB::statement('ALTER TABLE exam_schedules DROP COLUMN end_time');

        DB::statement('ALTER TABLE exam_schedules RENAME COLUMN start_time_old TO start_time');
        DB::statement('ALTER TABLE exam_schedules RENAME COLUMN end_time_old TO end_time');
    }
};
