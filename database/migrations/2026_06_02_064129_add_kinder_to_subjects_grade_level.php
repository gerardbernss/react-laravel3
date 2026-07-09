<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // This CHECK constraint rewrite is Oracle-specific (dynamic constraint lookup via
        // PL/SQL); other drivers (e.g. sqlite in tests) don't enforce a named CHECK
        // constraint here at all, so there's nothing to drop/recreate.
        if (DB::getDriverName() !== 'oracle') {
            return;
        }

        // Oracle: find the CHECK constraint for grade_level via user_cons_columns
        // (avoids querying the LONG-typed search_condition column).
        DB::unprepared("
            DECLARE
                v_name VARCHAR2(200);
            BEGIN
                SELECT c.constraint_name INTO v_name
                FROM user_constraints c
                JOIN user_cons_columns cc ON c.constraint_name = cc.constraint_name
                WHERE c.table_name  = UPPER('subjects')
                  AND c.constraint_type = 'C'
                  AND cc.column_name    = UPPER('grade_level')
                  AND ROWNUM = 1;
                EXECUTE IMMEDIATE 'ALTER TABLE subjects DROP CONSTRAINT ' || v_name;
            EXCEPTION
                WHEN NO_DATA_FOUND THEN NULL;
            END;
        ");

        DB::statement("
            ALTER TABLE subjects ADD CONSTRAINT chk_subjects_grade_level
            CHECK (grade_level IN (
                'Kinder',
                'Grade 1','Grade 2','Grade 3','Grade 4','Grade 5','Grade 6',
                'Grade 7','Grade 8','Grade 9','Grade 10','Grade 11','Grade 12'
            ))
        ");
    }

    public function down(): void
    {
        if (DB::getDriverName() !== 'oracle') {
            return;
        }

        DB::unprepared("
            DECLARE
                v_name VARCHAR2(200);
            BEGIN
                SELECT c.constraint_name INTO v_name
                FROM user_constraints c
                JOIN user_cons_columns cc ON c.constraint_name = cc.constraint_name
                WHERE c.table_name  = UPPER('subjects')
                  AND c.constraint_type = 'C'
                  AND cc.column_name    = UPPER('grade_level')
                  AND ROWNUM = 1;
                EXECUTE IMMEDIATE 'ALTER TABLE subjects DROP CONSTRAINT ' || v_name;
            EXCEPTION
                WHEN NO_DATA_FOUND THEN NULL;
            END;
        ");

        DB::statement("
            ALTER TABLE subjects ADD CONSTRAINT chk_subjects_grade_level
            CHECK (grade_level IN (
                'Grade 1','Grade 2','Grade 3','Grade 4','Grade 5','Grade 6',
                'Grade 7','Grade 8','Grade 9','Grade 10','Grade 11','Grade 12'
            ))
        ");
    }
};
