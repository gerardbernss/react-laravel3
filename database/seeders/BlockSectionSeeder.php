<?php

namespace Database\Seeders;

use App\Models\BlockSection;
use App\Models\Schedule;
use App\Models\StudentEnrollment;
use App\Models\Subject;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class BlockSectionSeeder extends Seeder
{
    /**
     * Creates 4 block sections (A/B/C/D) for every grade level and SHS
     * strand × semester combination. Each section is assigned the base subjects
     * for its grade level, and a per-section schedule row is created in
     * subject_schedules with the variant code (A/B/C/D) and time-shifted
     * schedule (offsets: A=+0, B=+120, C=+300, D=+420 minutes).
     */
    public function run(): void
    {
        // 1. Detach all existing subject assignments from every block section
        DB::table('block_section_subject')->delete();

        // 2. Remove block-section assignments from student enrollments
        StudentEnrollment::whereNotNull('block_section_id')
            ->update(['block_section_id' => null]);

        // 3. Delete all existing block sections
        BlockSection::query()->delete();

        // 4. Build a schedule lookup map keyed by subject code
        $scheduleMap = [];
        foreach (SubjectSeeder::elementaryJhsData() as $d) {
            $scheduleMap[$d['code']] = ['schedule' => $d['schedule'], 'room' => $d['room'] ?? null];
        }
        foreach (SubjectSeeder::shsData() as $d) {
            $scheduleMap[$d['code']] = ['schedule' => $d['schedule'], 'room' => $d['room'] ?? null];
        }

        $offsets = ['A' => 0, 'B' => 120, 'C' => 300, 'D' => 420];

        $schoolYear    = '2025-2026';
        $letters       = ['A', 'B', 'C', 'D'];
        $totalSections = 0;
        $totalSubjects = 0;

        // ── Kinder + Elementary (Grade 1-6) + JHS (Grade 7-10) ──────────
        $lowerGrades = [
            'Kinder'   => 'KG',
            'Grade 1'  => 'G1',
            'Grade 2'  => 'G2',
            'Grade 3'  => 'G3',
            'Grade 4'  => 'G4',
            'Grade 5'  => 'G5',
            'Grade 6'  => 'G6',
            'Grade 7'  => 'G7',
            'Grade 8'  => 'G8',
            'Grade 9'  => 'G9',
            'Grade 10' => 'G10',
        ];

        foreach ($lowerGrades as $gradeName => $gradeCode) {
            $gradeSubjects = Subject::where('grade_level', $gradeName)->get();

            foreach ($letters as $letter) {
                $section = BlockSection::create([
                    'name'        => "{$gradeName} - Section {$letter}",
                    'code'        => "{$gradeCode}-{$letter}-2526",
                    'grade_level' => $gradeName,
                    'strand'      => null,
                    'school_year' => $schoolYear,
                    'semester'    => 'Full Year',
                    'adviser'     => null,
                    'room'        => null,
                    'capacity'    => 40,
                    'is_active'   => true,
                ]);

                $section->subjects()->attach($gradeSubjects->pluck('id'));

                foreach ($gradeSubjects as $subject) {
                    $base = $scheduleMap[$subject->code] ?? null;
                    if (! $base || ! $base['schedule']) continue;

                    $shifted = SubjectSeeder::shiftSchedule($base['schedule'], $offsets[$letter]);
                    $parsed  = SubjectSeeder::parseSchedule($shifted);

                    Schedule::updateOrCreate(
                        ['subject_id' => $subject->id, 'block_section_id' => $section->id],
                        ['days' => $parsed['days'], 'time' => $parsed['time'], 'room' => $base['room'], 'code' => $letter]
                    );
                }

                $totalSections++;
                $totalSubjects += $gradeSubjects->count();
            }
        }

        // ── SHS (Grade 11-12): strands × 1st + 2nd Semester ─────────────
        $strands = [
            'Science, Technology, Engineering and Mathematics' => 'STEM',
            'Accountancy, Business and Management'             => 'ABM',
            'Humanities and Social Sciences'                   => 'HUMSS',
        ];
        $shsGrades = ['Grade 11' => '11', 'Grade 12' => '12'];
        $semesters = ['First Semester' => '1S', 'Second Semester' => '2S'];

        foreach ($shsGrades as $gradeName => $gradeNum) {
            foreach ($strands as $strandName => $strandAbbr) {
                foreach ($semesters as $semName => $semCode) {
                    $coreSubjects   = Subject::where('grade_level', $gradeName)
                        ->where('semester', $semName)
                        ->whereNull('strand')
                        ->get();

                    $strandSubjects = Subject::where('grade_level', $gradeName)
                        ->where('semester', $semName)
                        ->where('strand', $strandName)
                        ->get();

                    $allSubjects = $coreSubjects->merge($strandSubjects)->unique('id');

                    foreach ($letters as $letter) {
                        $section = BlockSection::create([
                            'name'        => "{$strandAbbr} {$gradeNum}-{$letter}",
                            'code'        => "{$strandAbbr}-{$gradeNum}{$letter}-{$semCode}-2526",
                            'grade_level' => $gradeName,
                            'strand'      => $strandName,
                            'school_year' => $schoolYear,
                            'semester'    => $semName,
                            'adviser'     => null,
                            'room'        => null,
                            'capacity'    => 40,
                            'is_active'   => true,
                        ]);

                        $section->subjects()->attach($allSubjects->pluck('id'));

                        foreach ($allSubjects as $subject) {
                            $base = $scheduleMap[$subject->code] ?? null;
                            if (! $base || ! $base['schedule']) continue;

                            $shifted = SubjectSeeder::shiftSchedule($base['schedule'], $offsets[$letter]);
                            $parsed  = SubjectSeeder::parseSchedule($shifted);

                            Schedule::updateOrCreate(
                                ['subject_id' => $subject->id, 'block_section_id' => $section->id],
                                ['days' => $parsed['days'], 'time' => $parsed['time'], 'room' => $base['room'], 'code' => $letter]
                            );
                        }

                        $totalSections++;
                        $totalSubjects += $allSubjects->count();
                    }
                }
            }
        }

        $this->command->info("Block sections seeded: {$totalSections} sections, {$totalSubjects} total subject assignments.");
    }
}
