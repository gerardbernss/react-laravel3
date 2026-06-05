<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $this->dropGradeLevelConstraints();

        $values = "'Kinder','Grade 1','Grade 2','Grade 3','Grade 4','Grade 5',"
                . "'Grade 6','Grade 7','Grade 8','Grade 9','Grade 10','Grade 11','Grade 12'";

        DB::statement("ALTER TABLE BLOCK_SECTIONS ADD CONSTRAINT block_sections_gl_chk CHECK (GRADE_LEVEL IN ({$values}))");
    }

    public function down(): void
    {
        $this->dropGradeLevelConstraints();

        $values = "'Grade 1','Grade 2','Grade 3','Grade 4','Grade 5','Grade 6',"
                . "'Grade 7','Grade 8','Grade 9','Grade 10','Grade 11','Grade 12'";

        DB::statement("ALTER TABLE BLOCK_SECTIONS ADD CONSTRAINT block_sections_gl_chk CHECK (GRADE_LEVEL IN ({$values}))");
    }

    private function dropGradeLevelConstraints(): void
    {
        // user_cons_columns maps check constraints to columns without LONG issues
        $rows = DB::select("
            SELECT c.constraint_name
            FROM   user_constraints c
            JOIN   user_cons_columns cc
                   ON  cc.constraint_name = c.constraint_name
            WHERE  c.table_name   = 'BLOCK_SECTIONS'
            AND    c.constraint_type = 'C'
            AND    cc.column_name = 'GRADE_LEVEL'
        ");

        foreach ($rows as $row) {
            $name = $row->CONSTRAINT_NAME ?? $row->constraint_name;
            try {
                DB::statement("ALTER TABLE BLOCK_SECTIONS DROP CONSTRAINT \"{$name}\"");
            } catch (\Exception $e) {
                // already gone
            }
        }
    }
};
