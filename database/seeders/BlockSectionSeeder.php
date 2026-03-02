<?php

namespace Database\Seeders;

use App\Models\BlockSection;
use App\Models\Subject;
use Illuminate\Database\Seeder;

class BlockSectionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $schoolYear = '2025-2026';

        $blockSections = [
            // Grade 11 - First Semester
            [
                'name' => 'STEM 11-A',
                'code' => 'STEM-11A-1S-2526',
                'grade_level' => 'Grade 11',
                'school_year' => $schoolYear,
                'semester' => 'First Semester',
                'adviser' => 'Dr. Maria Santos',
                'room' => 'Room 301',
                'capacity' => 40,
                'schedule' => 'MWF 7:30 AM - 12:00 PM',
            ],
            [
                'name' => 'STEM 11-B',
                'code' => 'STEM-11B-1S-2526',
                'grade_level' => 'Grade 11',
                'school_year' => $schoolYear,
                'semester' => 'First Semester',
                'adviser' => 'Prof. Juan Cruz',
                'room' => 'Room 302',
                'capacity' => 40,
                'schedule' => 'MWF 7:30 AM - 12:00 PM',
            ],
            [
                'name' => 'ABM 11-A',
                'code' => 'ABM-11A-1S-2526',
                'grade_level' => 'Grade 11',
                'school_year' => $schoolYear,
                'semester' => 'First Semester',
                'adviser' => 'Mrs. Ana Reyes',
                'room' => 'Room 201',
                'capacity' => 35,
                'schedule' => 'TTh 7:30 AM - 12:00 PM',
            ],
            [
                'name' => 'HUMSS 11-A',
                'code' => 'HUMSS-11A-1S-2526',
                'grade_level' => 'Grade 11',
                'school_year' => $schoolYear,
                'semester' => 'First Semester',
                'adviser' => 'Mr. Pedro Garcia',
                'room' => 'Room 202',
                'capacity' => 35,
                'schedule' => 'TTh 7:30 AM - 12:00 PM',
            ],

            // Grade 12 - First Semester
            [
                'name' => 'STEM 12-A',
                'code' => 'STEM-12A-1S-2526',
                'grade_level' => 'Grade 12',
                'school_year' => $schoolYear,
                'semester' => 'First Semester',
                'adviser' => 'Dr. Roberto Lim',
                'room' => 'Room 401',
                'capacity' => 40,
                'schedule' => 'MWF 7:30 AM - 12:00 PM',
            ],
            [
                'name' => 'STEM 12-B',
                'code' => 'STEM-12B-1S-2526',
                'grade_level' => 'Grade 12',
                'school_year' => $schoolYear,
                'semester' => 'First Semester',
                'adviser' => 'Dr. Elena Tan',
                'room' => 'Room 402',
                'capacity' => 40,
                'schedule' => 'MWF 7:30 AM - 12:00 PM',
            ],
            [
                'name' => 'ABM 12-A',
                'code' => 'ABM-12A-1S-2526',
                'grade_level' => 'Grade 12',
                'school_year' => $schoolYear,
                'semester' => 'First Semester',
                'adviser' => 'Mrs. Rosa Dela Cruz',
                'room' => 'Room 203',
                'capacity' => 35,
                'schedule' => 'TTh 7:30 AM - 12:00 PM',
            ],

            // Grade 7 - Full Year (JHS)
            [
                'name' => 'Grade 7 - St. Thomas',
                'code' => 'G7-THOMAS-2526',
                'grade_level' => 'Grade 7',
                'school_year' => $schoolYear,
                'semester' => 'Full Year',
                'adviser' => 'Ms. Carla Mendoza',
                'room' => 'Room 101',
                'capacity' => 45,
                'schedule' => 'Mon-Fri 7:30 AM - 4:00 PM',
            ],
            [
                'name' => 'Grade 7 - St. Peter',
                'code' => 'G7-PETER-2526',
                'grade_level' => 'Grade 7',
                'school_year' => $schoolYear,
                'semester' => 'Full Year',
                'adviser' => 'Mr. James Santos',
                'room' => 'Room 102',
                'capacity' => 45,
                'schedule' => 'Mon-Fri 7:30 AM - 4:00 PM',
            ],

            // Grade 1 - Full Year (LES)
            [
                'name' => 'Grade 1 - Hope',
                'code' => 'G1-HOPE-2526',
                'grade_level' => 'Grade 1',
                'school_year' => $schoolYear,
                'semester' => 'Full Year',
                'adviser' => 'Ms. Teresa Villanueva',
                'room' => 'Room A1',
                'capacity' => 30,
                'schedule' => 'Mon-Fri 7:30 AM - 12:00 PM',
            ],
            [
                'name' => 'Grade 1 - Faith',
                'code' => 'G1-FAITH-2526',
                'grade_level' => 'Grade 1',
                'school_year' => $schoolYear,
                'semester' => 'Full Year',
                'adviser' => 'Ms. Mary Joy Cruz',
                'room' => 'Room A2',
                'capacity' => 30,
                'schedule' => 'Mon-Fri 7:30 AM - 12:00 PM',
            ],
        ];

        foreach ($blockSections as $section) {
            BlockSection::firstOrCreate(
                ['code' => $section['code']],
                $section
            );
        }

        // Assign subjects to block sections
        $this->assignSubjectsToBlockSections();

        $this->command->info('✅ Block Sections seeded successfully!');
    }

    /**
     * Assign subjects to block sections based on grade level and semester.
     */
    private function assignSubjectsToBlockSections(): void
    {
        // Get Grade 11 First Semester subjects
        $grade11FirstSemSubjects = Subject::where('grade_level', 'Grade 11')
            ->where('semester', 'First Semester')
            ->pluck('id')
            ->toArray();

        // Get Grade 12 First Semester subjects
        $grade12FirstSemSubjects = Subject::where('grade_level', 'Grade 12')
            ->where('semester', 'First Semester')
            ->pluck('id')
            ->toArray();

        // Get Grade 7 subjects
        $grade7Subjects = Subject::where('grade_level', 'Grade 7')
            ->pluck('id')
            ->toArray();

        // Get Grade 1 subjects
        $grade1Subjects = Subject::where('grade_level', 'Grade 1')
            ->pluck('id')
            ->toArray();

        // Assign to Grade 11 sections
        $grade11Sections = BlockSection::where('grade_level', 'Grade 11')
            ->where('semester', 'First Semester')
            ->get();

        foreach ($grade11Sections as $section) {
            $section->subjects()->syncWithoutDetaching($grade11FirstSemSubjects);
        }

        // Assign to Grade 12 sections
        $grade12Sections = BlockSection::where('grade_level', 'Grade 12')
            ->where('semester', 'First Semester')
            ->get();

        foreach ($grade12Sections as $section) {
            $section->subjects()->syncWithoutDetaching($grade12FirstSemSubjects);
        }

        // Assign to Grade 7 sections
        $grade7Sections = BlockSection::where('grade_level', 'Grade 7')->get();

        foreach ($grade7Sections as $section) {
            $section->subjects()->syncWithoutDetaching($grade7Subjects);
        }

        // Assign to Grade 1 sections
        $grade1Sections = BlockSection::where('grade_level', 'Grade 1')->get();

        foreach ($grade1Sections as $section) {
            $section->subjects()->syncWithoutDetaching($grade1Subjects);
        }
    }
}
