<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * The 2026_05_20_000002 migration widened `type` from
     * enum('student','applicant') to string(20), but on Oracle that
     * change() left the original enum-backed CHECK constraint in place,
     * so inserting type = 'application' fails with ORA-02290.
     */
    public function up(): void
    {
        if (Schema::getConnection()->getDriverName() !== 'oracle') {
            return;
        }

        // search_condition is a LONG column, which Oracle won't allow inside a
        // WHERE clause (even wrapped in a function), so filter in PHP instead.
        $constraints = DB::select("
            SELECT constraint_name, search_condition
            FROM user_constraints
            WHERE table_name = 'ENROLLMENT_PERIODS'
              AND constraint_type = 'C'
        ");

        foreach ($constraints as $constraint) {
            $condition = strtoupper($constraint->search_condition);

            if (str_contains($condition, "'STUDENT'")
                && str_contains($condition, "'APPLICANT'")
                && !str_contains($condition, 'APPLICATION')) {
                DB::statement('ALTER TABLE enrollment_periods DROP CONSTRAINT '.$constraint->constraint_name);
            }
        }
    }

    public function down(): void
    {
        // Intentionally not restored — it was a stale constraint blocking valid data.
    }
};
