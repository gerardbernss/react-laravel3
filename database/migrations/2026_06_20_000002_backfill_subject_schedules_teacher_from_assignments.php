<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Copies each existing per-section teacher override (subject_teacher_assignments + teachers)
     * onto the matching subject_schedules row, creating that row first — copied from the subject's
     * default schedule — if a section-specific schedule doesn't already exist for that pair.
     */
    public function up(): void
    {
        $assignments = DB::table('subject_teacher_assignments')
            ->join('teachers', 'subject_teacher_assignments.teacher_id', '=', 'teachers.teacher_id')
            ->select('subject_teacher_assignments.block_section_id', 'teachers.subject_id', 'teachers.user_id')
            ->get();

        foreach ($assignments as $assignment) {
            $schedule = DB::table('subject_schedules')
                ->where('subject_id', $assignment->subject_id)
                ->where('block_section_id', $assignment->block_section_id)
                ->first();

            if ($schedule) {
                DB::table('subject_schedules')->where('id', $schedule->id)->update([
                    'teacher_id' => $assignment->user_id,
                    'updated_at' => now(),
                ]);

                continue;
            }

            $default = DB::table('subject_schedules')
                ->where('subject_id', $assignment->subject_id)
                ->whereNull('block_section_id')
                ->first();

            DB::table('subject_schedules')->insert([
                'subject_id' => $assignment->subject_id,
                'block_section_id' => $assignment->block_section_id,
                'days' => $default->days ?? '',
                'time' => $default->time ?? '',
                'room' => $default->room ?? null,
                'code' => $default->code ?? null,
                'teacher_id' => $assignment->user_id,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    /**
     * Data backfill — not meaningfully reversible.
     */
    public function down(): void
    {
    }
};
