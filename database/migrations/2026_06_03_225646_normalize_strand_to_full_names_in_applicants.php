<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Normalize applicants.strand to consistent full names (no short code).
     *
     * Handles every previous format:
     *   Short code only:          "STEM"
     *   Full name + parentheses:  "Science, Technology, Engineering and Mathematics (STEM)"
     *   Full name only (varied):  "Science, Technology, Engineering, and Mathematics"
     */
    public function up(): void
    {
        $map = [
            'STEM'  => 'Science, Technology, Engineering and Mathematics',
            'ABM'   => 'Accountancy, Business and Management',
            'HUMSS' => 'Humanities and Social Sciences',
        ];

        // 1. Short codes
        foreach ($map as $code => $fullName) {
            DB::table('applicants')->where('strand', $code)->update(['strand' => $fullName]);
        }

        // 2. Full names with parenthesised code
        DB::table('applicants')->where('strand', 'like', '%(STEM)%')->update(['strand' => $map['STEM']]);
        DB::table('applicants')->where('strand', 'like', '%(ABM)%')->update(['strand'  => $map['ABM']]);
        DB::table('applicants')->where('strand', 'like', '%(HUMSS)%')->update(['strand' => $map['HUMSS']]);

        // 3. Any remaining full-name variants (Oxford comma differences, etc.)
        DB::table('applicants')
            ->where('strand', 'like', '%Engineering%')
            ->where('strand', '!=', $map['STEM'])
            ->update(['strand' => $map['STEM']]);

        DB::table('applicants')
            ->where('strand', 'like', '%Accountancy%')
            ->where('strand', '!=', $map['ABM'])
            ->update(['strand' => $map['ABM']]);

        DB::table('applicants')
            ->where('strand', 'like', '%Humanities%')
            ->where('strand', '!=', $map['HUMSS'])
            ->update(['strand' => $map['HUMSS']]);
    }

    public function down(): void
    {
        // Not reversible — no-op.
    }
};
