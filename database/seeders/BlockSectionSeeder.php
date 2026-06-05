<?php

namespace Database\Seeders;

use App\Models\BlockSection;
use App\Models\StudentEnrollment;
use App\Models\Subject;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class BlockSectionSeeder extends Seeder
{
    /**
     * Creates 4 block sections (A/B/C/D) for every Grade 11 and Grade 12
     * strand × semester combination (STEM, ABM, HUMSS × 1st + 2nd Semester).
     *
     * Each section is assigned the matching A/B/C/D schedule variants of its
     * grade-level core subjects plus its strand-specific subjects.
     *
     * Existing block_section_subject assignments and student block-section
     * links are cleared first.
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

        // 4. Create sections and assign subjects
        $schoolYear = '2025-2026';
        $letters    = ['A', 'B', 'C', 'D'];

        $totalSections = 0;
        $totalSubjects = 0;

        // ── Kinder + Elementary (Grade 1-6) + JHS (Grade 7-10) ──────────
        // No strand, Full Year semester, 4 sections each
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
            foreach ($letters as $letter) {
                $sectionCode = "{$gradeCode}-{$letter}-2526";
                $sectionName = "{$gradeName} - Section {$letter}";

                $section = BlockSection::create([
                    'name'        => $sectionName,
                    'code'        => $sectionCode,
                    'grade_level' => $gradeName,
                    'strand'      => null,
                    'school_year' => $schoolYear,
                    'semester'    => 'Full Year',
                    'adviser'     => null,
                    'room'        => null,
                    'capacity'    => 40,
                    'is_active'   => true,
                ]);

                $subjectIds = Subject::where('grade_level', $gradeName)
                    ->where('code', 'LIKE', '%-' . $letter)
                    ->pluck('id');

                $section->subjects()->attach($subjectIds);

                $totalSections++;
                $totalSubjects += $subjectIds->count();
            }
        }

        // ── SHS (Grade 11-12): strands × 1st + 2nd Semester ─────────────
        // Keys = full name stored in DB; values = short abbreviation for codes
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
                    foreach ($letters as $letter) {
                        $sectionCode = "{$strandAbbr}-{$gradeNum}{$letter}-{$semCode}-2526";
                        $sectionName = "{$strandAbbr} {$gradeNum}-{$letter}";

                        $section = BlockSection::create([
                            'name'        => $sectionName,
                            'code'        => $sectionCode,
                            'grade_level' => $gradeName,
                            'strand'      => $strandName,
                            'school_year' => $schoolYear,
                            'semester'    => $semName,
                            'adviser'     => null,
                            'room'        => null,
                            'capacity'    => 40,
                            'is_active'   => true,
                        ]);

                        $coreIds = Subject::where('grade_level', $gradeName)
                            ->where('semester', $semName)
                            ->whereNull('strand')
                            ->where('code', 'LIKE', '%-' . $letter)
                            ->pluck('id');

                        $strandIds = Subject::where('grade_level', $gradeName)
                            ->where('semester', $semName)
                            ->where('strand', $strandName)
                            ->where('code', 'LIKE', '%-' . $letter)
                            ->pluck('id');

                        $allIds = $coreIds->merge($strandIds)->unique();
                        $section->subjects()->attach($allIds);

                        $totalSections++;
                        $totalSubjects += $allIds->count();
                    }
                }
            }
        }

        $this->command->info("✅ Block sections seeded: {$totalSections} sections, {$totalSubjects} total subject assignments.");
    }
}
