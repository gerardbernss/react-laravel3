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
            ->select('subject_teacher_assignments.id', 'subject_teacher_assignments.block_section_id', 'teachers.subject_id', 'teachers.user_id')
            ->orderBy('subject_teacher_assignments.id')
            ->get();

        // Track (subject_id, block_section_id) pairs already assigned in this run so a
        // second, conflicting assignment (two different teachers for the same subject +
        // section) is reported instead of silently overwriting the first one.
        $claimed = [];

        DB::transaction(function () use ($assignments, &$claimed) {
            foreach ($assignments as $assignment) {
                $pairKey = $assignment->subject_id.':'.$assignment->block_section_id;

                if (isset($claimed[$pairKey]) && $claimed[$pairKey] !== $assignment->user_id) {
                    $this->command?->warn(
                        "subject_teacher_assignments: subject_id={$assignment->subject_id} block_section_id={$assignment->block_section_id} ".
                        "has conflicting teachers (user_id={$claimed[$pairKey]} kept, user_id={$assignment->user_id} skipped)."
                    );

                    continue;
                }

                $claimed[$pairKey] = $assignment->user_id;

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

                if (! $default) {
                    $this->command?->warn(
                        "subject_teacher_assignments: subject_id={$assignment->subject_id} has no default schedule to copy ".
                        "for block_section_id={$assignment->block_section_id}; skipping (no schedule row created)."
                    );

                    continue;
                }

                DB::table('subject_schedules')->insert([
                    'subject_id' => $assignment->subject_id,
                    'block_section_id' => $assignment->block_section_id,
                    'days' => $default->days,
                    'time' => $default->time,
                    'room' => $default->room,
                    'code' => $default->code ?? null,
                    'teacher_id' => $assignment->user_id,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        });
    }

    /**
     * Data backfill — not meaningfully reversible.
     */
    public function down(): void
    {
    }
};
