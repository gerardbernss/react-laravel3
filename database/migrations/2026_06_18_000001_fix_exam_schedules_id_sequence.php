<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * The exam_schedules table was seeded with explicit IDs that never advanced
     * EXAM_SCHEDULES_ID_SEQ. The sequence kept dispensing low values that already
     * existed as rows, causing ORA-00001 unique constraint violations whenever a
     * new schedule was created. Realign the sequence to start after the current
     * max ID.
     */
    public function up(): void
    {
        if (DB::getDriverName() !== 'oracle') {
            return;
        }

        $maxId = (int) DB::table('exam_schedules')->max('id');
        $nextId = $maxId + 1;

        DB::statement('DROP SEQUENCE EXAM_SCHEDULES_ID_SEQ');
        DB::statement("CREATE SEQUENCE EXAM_SCHEDULES_ID_SEQ START WITH {$nextId} INCREMENT BY 1 CACHE 20");
    }

    public function down(): void
    {
        // No-op: re-syncing a sequence is not meaningfully reversible.
    }
};
