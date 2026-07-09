<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * The fees table was seeded with explicit IDs that never advanced FEES_ID_SEQ.
     * The sequence kept dispensing low values that already existed as rows, causing
     * ORA-00001 unique constraint violations whenever a new fee was created (e.g. via
     * "Copy Fees to New Year"). Realign the sequence to start after the current max ID.
     */
    public function up(): void
    {
        if (DB::getDriverName() !== 'oracle') {
            return;
        }

        $maxId = (int) DB::table('fees')->max('id');
        $nextId = $maxId + 1;

        DB::statement('DROP SEQUENCE FEES_ID_SEQ');
        DB::statement("CREATE SEQUENCE FEES_ID_SEQ START WITH {$nextId} INCREMENT BY 1 CACHE 20");
    }

    public function down(): void
    {
        // No-op: re-syncing a sequence is not meaningfully reversible.
    }
};
