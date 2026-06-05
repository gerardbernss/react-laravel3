<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Normalize applicants.strand to short codes (STEM / ABM / HUMSS).
     *
     * Previous forms stored full names:
     *   Public form:  "Science, Technology, Engineering and Mathematics (STEM)"
     *   Admin form:   "Science, Technology, Engineering, and Mathematics"
     *
     * All three SHS strands are now stored as STEM, ABM, or HUMSS.
     * LES/JHS values are left unchanged.
     */
    public function up(): void
    {
        // Records stored with parenthesised acronym (public form)
        DB::table('applicants')->where('strand', 'like', '%(STEM)%')->update(['strand' => 'STEM']);
        DB::table('applicants')->where('strand', 'like', '%(ABM)%')->update(['strand' => 'ABM']);
        DB::table('applicants')->where('strand', 'like', '%(HUMSS)%')->update(['strand' => 'HUMSS']);

        // Records stored as full name only (admin form)
        DB::table('applicants')
            ->where('strand', 'like', '%Engineering%')
            ->whereNotIn('strand', ['STEM'])
            ->update(['strand' => 'STEM']);

        DB::table('applicants')
            ->where('strand', 'like', '%Accountancy%')
            ->whereNotIn('strand', ['ABM'])
            ->update(['strand' => 'ABM']);

        DB::table('applicants')
            ->where('strand', 'like', '%Humanities%')
            ->whereNotIn('strand', ['HUMSS'])
            ->update(['strand' => 'HUMSS']);
    }

    public function down(): void
    {
        // Short codes cannot be reliably reversed to full names — no-op.
    }
};
