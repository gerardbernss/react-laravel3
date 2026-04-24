<?php

namespace Database\Seeders;

use App\Models\Schedule;
use App\Models\Subject;
use Illuminate\Database\Seeder;

class SubjectSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * Schedules are designed so no two subjects within the same
     * grade_level+semester group overlap:
     *   • MWF subjects are stacked in back-to-back 1-hour (or 1.5-hour) slots
     *   • TTh subjects fill Tuesday/Thursday slots separately
     *   • MWF and TTh days never share a day, so cross-group conflicts are
     *     impossible — MWF = Mon/Wed/Fri, TTh = Tue/Thu
     */
    public function run(): void
    {
        $subjects = [
            // ── Grade 11 · First Semester ─────────────────────────────────────
            // 8 subjects assigned to all Grade 11 sections (STEM-11A, STEM-11B,
            // ABM-11A, HUMSS-11A).  Non-conflicting time map:
            //   MWF → 7:30, 8:30, 9:30, 11:00, 13:00
            //   TTh → 7:30-9:30, 10:00-11:30, 12:00-13:00
            [
                'code' => 'ORAL-COMM',
                'name' => 'Oral Communication',
                'units' => 3,
                'type' => 'Core',
                'grade_level' => 'Grade 11',
                'semester' => 'First Semester',
                'description' => 'Development of listening, speaking, and critical thinking skills',
                'schedule' => 'MWF 7:30-8:30',
                'room' => 'Room 301',
            ],
            [
                'code' => 'GEN-MATH',
                'name' => 'General Mathematics',
                'units' => 3,
                'type' => 'Core',
                'grade_level' => 'Grade 11',
                'semester' => 'First Semester',
                'description' => 'Functions, business math, and logic',
                'schedule' => 'MWF 8:30-9:30',
                'room' => 'Room 302',
            ],
            [
                'code' => 'EARTH-SCI',
                'name' => 'Earth and Life Science',
                'units' => 3,
                'type' => 'Core',
                'grade_level' => 'Grade 11',
                'semester' => 'First Semester',
                'description' => 'Study of earth science, ecology, and biology',
                'schedule' => 'TTh 7:30-9:30',
                'room' => 'Sci Lab 1',
            ],
            [
                'code' => 'PERDEV',
                'name' => 'Personal Development',
                'units' => 3,
                'type' => 'Core',
                'grade_level' => 'Grade 11',
                'semester' => 'First Semester',
                'description' => 'Self-awareness and personal growth',
                'schedule' => 'MWF 9:30-10:30',
                'room' => 'Room 201',
            ],
            [
                'code' => 'UCSP',
                'name' => 'Understanding Culture, Society, and Politics',
                'units' => 3,
                'type' => 'Core',
                'grade_level' => 'Grade 11',
                'semester' => 'First Semester',
                'description' => 'Study of cultural, social, and political dynamics',
                'schedule' => 'TTh 10:00-11:30',
                'room' => 'Room 202',
            ],
            [
                'code' => 'PE-1',
                'name' => 'Physical Education 1',
                'units' => 2,
                'type' => 'Core',
                'grade_level' => 'Grade 11',
                'semester' => 'First Semester',
                'description' => 'Physical fitness and wellness',
                'schedule' => 'TTh 12:00-13:00',
                'room' => 'Gymnasium',
            ],
            // STEM-track specialized (Grade 11 · First Semester)
            [
                'code' => 'PRE-CALC',
                'name' => 'Pre-Calculus',
                'units' => 3,
                'type' => 'Specialized',
                'grade_level' => 'Grade 11',
                'semester' => 'First Semester',
                'description' => 'Preparation for calculus',
                'schedule' => 'MWF 11:00-12:00',
                'room' => 'Room 303',
            ],
            [
                'code' => 'GEN-BIO-1',
                'name' => 'General Biology 1',
                'units' => 3,
                'type' => 'Specialized',
                'grade_level' => 'Grade 11',
                'semester' => 'First Semester',
                'description' => 'Cell and molecular biology',
                'schedule' => 'MWF 13:00-14:00',
                'room' => 'Sci Lab 2',
            ],

            // ── Grade 11 · Second Semester ────────────────────────────────────
            // Non-conflicting time map (same pattern as First Sem):
            //   MWF → 7:30, 8:30, 9:30, 11:00, 13:00
            //   TTh → 7:30-9:30, 10:00-11:30, 12:00-13:00
            [
                'code' => 'READ-WRITE',
                'name' => 'Reading and Writing Skills',
                'units' => 3,
                'type' => 'Core',
                'grade_level' => 'Grade 11',
                'semester' => 'Second Semester',
                'description' => 'Development of reading comprehension and writing skills',
                'schedule' => 'MWF 7:30-8:30',
                'room' => 'Room 301',
            ],
            [
                'code' => 'STATS-PROB',
                'name' => 'Statistics and Probability',
                'units' => 3,
                'type' => 'Core',
                'grade_level' => 'Grade 11',
                'semester' => 'Second Semester',
                'description' => 'Basic statistics and probability concepts',
                'schedule' => 'MWF 8:30-9:30',
                'room' => 'Room 302',
            ],
            [
                'code' => 'PHYS-SCI',
                'name' => 'Physical Science',
                'units' => 3,
                'type' => 'Core',
                'grade_level' => 'Grade 11',
                'semester' => 'Second Semester',
                'description' => 'Study of chemistry and physics',
                'schedule' => 'TTh 7:30-9:30',
                'room' => 'Sci Lab 1',
            ],
            [
                'code' => 'WORLD-LIT',
                'name' => '21st Century Literature from the Philippines and the World',
                'units' => 3,
                'type' => 'Core',
                'grade_level' => 'Grade 11',
                'semester' => 'Second Semester',
                'description' => 'Study of contemporary literature',
                'schedule' => 'MWF 9:30-10:30',
                'room' => 'Room 201',
            ],
            [
                'code' => 'INTRO-PHILO',
                'name' => 'Introduction to the Philosophy of the Human Person',
                'units' => 3,
                'type' => 'Core',
                'grade_level' => 'Grade 11',
                'semester' => 'Second Semester',
                'description' => 'Basic philosophical concepts and human nature',
                'schedule' => 'TTh 10:00-11:30',
                'room' => 'Room 202',
            ],
            [
                'code' => 'PE-2',
                'name' => 'Physical Education 2',
                'units' => 2,
                'type' => 'Core',
                'grade_level' => 'Grade 11',
                'semester' => 'Second Semester',
                'description' => 'Team sports and fitness activities',
                'schedule' => 'TTh 12:00-13:00',
                'room' => 'Gymnasium',
            ],
            // STEM-track specialized (Grade 11 · Second Semester)
            [
                'code' => 'BASIC-CALC',
                'name' => 'Basic Calculus',
                'units' => 3,
                'type' => 'Specialized',
                'grade_level' => 'Grade 11',
                'semester' => 'Second Semester',
                'description' => 'Introduction to calculus',
                'schedule' => 'MWF 11:00-12:00',
                'room' => 'Room 303',
            ],
            [
                'code' => 'GEN-BIO-2',
                'name' => 'General Biology 2',
                'units' => 3,
                'type' => 'Specialized',
                'grade_level' => 'Grade 11',
                'semester' => 'Second Semester',
                'description' => 'Genetics and ecology',
                'schedule' => 'MWF 13:00-14:00',
                'room' => 'Sci Lab 2',
            ],

            // ── Grade 12 · First Semester ─────────────────────────────────────
            // Non-conflicting time map:
            //   MWF → 7:30, 8:30, 9:30, 11:00, 13:00
            //   TTh → 7:30-9:00, 10:00-11:00, 12:00-13:00
            [
                'code' => 'ENGLISH-ACAD',
                'name' => 'English for Academic and Professional Purposes',
                'units' => 3,
                'type' => 'Core',
                'grade_level' => 'Grade 12',
                'semester' => 'First Semester',
                'description' => 'Academic and professional communication skills',
                'schedule' => 'MWF 7:30-8:30',
                'room' => 'Room 401',
            ],
            [
                'code' => 'PRAC-RES-1',
                'name' => 'Practical Research 1',
                'units' => 3,
                'type' => 'Core',
                'grade_level' => 'Grade 12',
                'semester' => 'First Semester',
                'description' => 'Qualitative research methods',
                'schedule' => 'MWF 8:30-9:30',
                'room' => 'Room 402',
            ],
            [
                'code' => 'EMPOWERMENT',
                'name' => 'Empowerment Technologies',
                'units' => 3,
                'type' => 'Core',
                'grade_level' => 'Grade 12',
                'semester' => 'First Semester',
                'description' => 'ICT skills for communication and collaboration',
                'schedule' => 'TTh 7:30-9:00',
                'room' => 'Comp Lab',
            ],
            [
                'code' => 'FIL-KOMYUN',
                'name' => 'Filipino sa Piling Larangan (Akademik)',
                'units' => 3,
                'type' => 'Core',
                'grade_level' => 'Grade 12',
                'semester' => 'First Semester',
                'description' => 'Filipino language for academic purposes',
                'schedule' => 'MWF 9:30-10:30',
                'room' => 'Room 403',
            ],
            [
                'code' => 'CONTEMP-ART',
                'name' => 'Contemporary Philippine Arts from the Regions',
                'units' => 3,
                'type' => 'Core',
                'grade_level' => 'Grade 12',
                'semester' => 'First Semester',
                'description' => 'Study of Philippine regional arts',
                'schedule' => 'TTh 10:00-11:00',
                'room' => 'Room 404',
            ],
            [
                'code' => 'PE-3',
                'name' => 'Physical Education 3',
                'units' => 2,
                'type' => 'Core',
                'grade_level' => 'Grade 12',
                'semester' => 'First Semester',
                'description' => 'Individual sports and fitness',
                'schedule' => 'TTh 12:00-13:00',
                'room' => 'Gymnasium',
            ],
            // STEM-track specialized (Grade 12 · First Semester)
            [
                'code' => 'GEN-CHEM-1',
                'name' => 'General Chemistry 1',
                'units' => 3,
                'type' => 'Specialized',
                'grade_level' => 'Grade 12',
                'semester' => 'First Semester',
                'description' => 'Matter, energy, and reactions',
                'schedule' => 'MWF 11:00-12:00',
                'room' => 'Sci Lab 1',
            ],
            [
                'code' => 'GEN-PHYS-1',
                'name' => 'General Physics 1',
                'units' => 3,
                'type' => 'Specialized',
                'grade_level' => 'Grade 12',
                'semester' => 'First Semester',
                'description' => 'Mechanics and thermodynamics',
                'schedule' => 'MWF 13:00-14:00',
                'room' => 'Physics Lab',
            ],

            // ── Grade 12 · Second Semester ────────────────────────────────────
            // Non-conflicting time map:
            //   MWF → 7:30, 8:30, 11:00, 13:00
            //   TTh → 7:30-9:30, 12:00-13:00
            [
                'code' => 'PRAC-RES-2',
                'name' => 'Practical Research 2',
                'units' => 3,
                'type' => 'Core',
                'grade_level' => 'Grade 12',
                'semester' => 'Second Semester',
                'description' => 'Quantitative research methods',
                'schedule' => 'MWF 7:30-8:30',
                'room' => 'Room 401',
            ],
            [
                'code' => 'MEDIA-INFO',
                'name' => 'Media and Information Literacy',
                'units' => 3,
                'type' => 'Core',
                'grade_level' => 'Grade 12',
                'semester' => 'Second Semester',
                'description' => 'Critical analysis of media and information',
                'schedule' => 'MWF 8:30-9:30',
                'room' => 'Comp Lab',
            ],
            [
                'code' => 'INQUIRIES',
                'name' => 'Inquiries, Investigations, and Immersion',
                'units' => 3,
                'type' => 'Core',
                'grade_level' => 'Grade 12',
                'semester' => 'Second Semester',
                'description' => 'Applied research and immersion',
                'schedule' => 'TTh 7:30-9:30',
                'room' => 'Room 402',
            ],
            [
                'code' => 'PE-4',
                'name' => 'Physical Education 4',
                'units' => 2,
                'type' => 'Core',
                'grade_level' => 'Grade 12',
                'semester' => 'Second Semester',
                'description' => 'Recreation and fitness activities',
                'schedule' => 'TTh 12:00-13:00',
                'room' => 'Gymnasium',
            ],
            // STEM-track specialized (Grade 12 · Second Semester)
            [
                'code' => 'GEN-CHEM-2',
                'name' => 'General Chemistry 2',
                'units' => 3,
                'type' => 'Specialized',
                'grade_level' => 'Grade 12',
                'semester' => 'Second Semester',
                'description' => 'Thermodynamics and equilibrium',
                'schedule' => 'MWF 11:00-12:00',
                'room' => 'Sci Lab 1',
            ],
            [
                'code' => 'GEN-PHYS-2',
                'name' => 'General Physics 2',
                'units' => 3,
                'type' => 'Specialized',
                'grade_level' => 'Grade 12',
                'semester' => 'Second Semester',
                'description' => 'Electricity and magnetism',
                'schedule' => 'MWF 13:00-14:00',
                'room' => 'Physics Lab',
            ],

            // ── Grade 7 · Full Year (JHS) ─────────────────────────────────────
            // Non-conflicting time map:
            //   MWF → 7:30, 8:30, 9:30
            //   TTh → 7:30-9:30, 10:00-11:30
            [
                'code' => 'ENG-7',
                'name' => 'English 7',
                'units' => 3,
                'type' => 'Core',
                'grade_level' => 'Grade 7',
                'semester' => 'Full Year',
                'description' => 'English language arts for Grade 7',
                'schedule' => 'MWF 7:30-8:30',
                'room' => 'Room 101',
            ],
            [
                'code' => 'MATH-7',
                'name' => 'Mathematics 7',
                'units' => 3,
                'type' => 'Core',
                'grade_level' => 'Grade 7',
                'semester' => 'Full Year',
                'description' => 'Mathematics for Grade 7',
                'schedule' => 'MWF 8:30-9:30',
                'room' => 'Room 101',
            ],
            [
                'code' => 'SCI-7',
                'name' => 'Science 7',
                'units' => 3,
                'type' => 'Core',
                'grade_level' => 'Grade 7',
                'semester' => 'Full Year',
                'description' => 'Integrated science for Grade 7',
                'schedule' => 'TTh 7:30-9:30',
                'room' => 'Sci Lab 3',
            ],
            [
                'code' => 'FIL-7',
                'name' => 'Filipino 7',
                'units' => 3,
                'type' => 'Core',
                'grade_level' => 'Grade 7',
                'semester' => 'Full Year',
                'description' => 'Filipino language for Grade 7',
                'schedule' => 'MWF 9:30-10:30',
                'room' => 'Room 101',
            ],
            [
                'code' => 'AP-7',
                'name' => 'Araling Panlipunan 7',
                'units' => 3,
                'type' => 'Core',
                'grade_level' => 'Grade 7',
                'semester' => 'Full Year',
                'description' => 'Social studies for Grade 7',
                'schedule' => 'TTh 10:00-11:30',
                'room' => 'Room 101',
            ],

            // ── Grade 1 · Full Year (LES) ─────────────────────────────────────
            // Non-conflicting time map:
            //   MWF → 7:30, 8:30
            //   TTh → 7:30, 8:30
            [
                'code' => 'ENG-1',
                'name' => 'English 1',
                'units' => 3,
                'type' => 'Core',
                'grade_level' => 'Grade 1',
                'semester' => 'Full Year',
                'description' => 'Beginning reading and writing',
                'schedule' => 'MWF 7:30-8:30',
                'room' => 'Room A1',
            ],
            [
                'code' => 'MATH-1',
                'name' => 'Mathematics 1',
                'units' => 3,
                'type' => 'Core',
                'grade_level' => 'Grade 1',
                'semester' => 'Full Year',
                'description' => 'Basic numeracy and operations',
                'schedule' => 'MWF 8:30-9:30',
                'room' => 'Room A1',
            ],
            [
                'code' => 'MTB-1',
                'name' => 'Mother Tongue-Based 1',
                'units' => 3,
                'type' => 'Core',
                'grade_level' => 'Grade 1',
                'semester' => 'Full Year',
                'description' => 'Mother tongue language instruction',
                'schedule' => 'TTh 7:30-8:30',
                'room' => 'Room A1',
            ],
            [
                'code' => 'FIL-1',
                'name' => 'Filipino 1',
                'units' => 3,
                'type' => 'Core',
                'grade_level' => 'Grade 1',
                'semester' => 'Full Year',
                'description' => 'Filipino language for Grade 1',
                'schedule' => 'TTh 8:30-9:30',
                'room' => 'Room A1',
            ],
        ];

        foreach ($subjects as $data) {
            $scheduleString = $data['schedule'] ?? null;
            $room           = $data['room'] ?? null;

            $subject = Subject::updateOrCreate(
                ['code' => $data['code']],
                collect($data)->except(['schedule', 'room'])->toArray()
            );

            if ($scheduleString) {
                $parsed = $this->parseSchedule($scheduleString);
                if ($parsed['days'] && $parsed['time']) {
                    Schedule::updateOrCreate(
                        ['subject_id' => $subject->id, 'block_section_id' => null],
                        ['days' => $parsed['days'], 'time' => $parsed['time'], 'room' => $room]
                    );
                }
            }
        }

        $this->command->info('✅ Subjects seeded successfully!');
    }

    private function parseSchedule(string $s): array
    {
        // "MWF 7:30-8:30" or "TTh 7:30-9:30" → ['days' => 'MWF', 'time' => '7:30-8:30']
        preg_match('/^([A-Za-z]+)\s+(.+)$/', trim($s), $m);
        return ['days' => $m[1] ?? null, 'time' => $m[2] ?? null];
    }
}
