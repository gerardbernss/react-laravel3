<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Find the unique constraint on (school_year, semester, type) by catalog lookup
        // rather than a hardcoded name, since Oracle generates names differently on fresh installs.
        $result = DB::selectOne("
            SELECT c.constraint_name
            FROM user_constraints c
            JOIN user_cons_columns cc ON c.constraint_name = cc.constraint_name
            WHERE c.table_name = 'ENROLLMENT_PERIODS'
              AND c.constraint_type = 'U'
            GROUP BY c.constraint_name
            HAVING COUNT(*) = 3
               AND SUM(CASE WHEN cc.column_name IN ('SCHOOL_YEAR', 'SEMESTER', 'TYPE') THEN 1 ELSE 0 END) = 3
        ");

        if ($result) {
            DB::statement("ALTER TABLE \"ENROLLMENT_PERIODS\" DROP CONSTRAINT \"{$result->constraint_name}\"");
        }
    }

    public function down(): void
    {
        Schema::table('enrollment_periods', function (Blueprint $table) {
            $table->unique(['school_year', 'semester', 'type']);
        });
    }
};
