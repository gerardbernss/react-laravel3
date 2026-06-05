<?php

namespace Database\Seeders;

use App\Models\Schedule;
use App\Models\Subject;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class SubjectSeeder extends Seeder
{
    /**
     * Schedule design rules:
     *   MWF   = Mon / Wed / Fri
     *   TTh   = Tue / Thu
     *   Daily = Mon–Fri (elementary)
     *
     * SHS A/B/C/D variants use time offsets from the base schedule:
     *   A = +0 min   (original, 7:30 AM start)
     *   B = +120 min (9:30 AM start)
     *   C = +300 min (12:30 PM start)
     *   D = +420 min (2:30 PM start)
     */
    public function run(): void
    {
        // Oracle: sync SCHEDULES_ID_SEQ above current max ID.
        $maxId      = (int) (DB::table('subject_schedules')->max('id') ?? 0);
        $currentSeq = (int) DB::selectOne("SELECT SCHEDULES_ID_SEQ.NEXTVAL AS nv FROM DUAL")->nv;
        $diff       = ($maxId + 1) - $currentSeq;
        if ($diff > 0) {
            DB::statement("ALTER SEQUENCE SCHEDULES_ID_SEQ INCREMENT BY {$diff}");
            DB::selectOne("SELECT SCHEDULES_ID_SEQ.NEXTVAL AS nv FROM DUAL");
            DB::statement("ALTER SEQUENCE SCHEDULES_ID_SEQ INCREMENT BY 1");
        }

        // ══════════════════════════════════════════════════════════════════
        // ELEMENTARY + JHS  (unchanged — Full Year, no variants)
        // ══════════════════════════════════════════════════════════════════
        $elementaryJhs = [
            // KINDER
            ['code'=>'KG-MT',    'name'=>'Mother Tongue',                                  'units'=>3,'grade_level'=>'Kinder',   'semester'=>'Full Year','type'=>'Core','schedule'=>'Daily 07:30-08:10','room'=>'Kinder Room'],
            ['code'=>'KG-FIL',   'name'=>'Filipino',                                        'units'=>3,'grade_level'=>'Kinder',   'semester'=>'Full Year','type'=>'Core','schedule'=>'Daily 08:10-08:50','room'=>'Kinder Room'],
            ['code'=>'KG-ENG',   'name'=>'English',                                         'units'=>3,'grade_level'=>'Kinder',   'semester'=>'Full Year','type'=>'Core','schedule'=>'Daily 08:50-09:30','room'=>'Kinder Room'],
            ['code'=>'KG-MATH',  'name'=>'Mathematics',                                     'units'=>3,'grade_level'=>'Kinder',   'semester'=>'Full Year','type'=>'Core','schedule'=>'Daily 09:30-10:10','room'=>'Kinder Room'],
            ['code'=>'KG-SCI',   'name'=>'Science and Health',                              'units'=>2,'grade_level'=>'Kinder',   'semester'=>'Full Year','type'=>'Core','schedule'=>'Daily 10:20-10:50','room'=>'Kinder Room'],
            ['code'=>'KG-AP',    'name'=>'Araling Panlipunan',                              'units'=>2,'grade_level'=>'Kinder',   'semester'=>'Full Year','type'=>'Core','schedule'=>'Daily 10:50-11:20','room'=>'Kinder Room'],
            ['code'=>'KG-MAPEH', 'name'=>'MAPEH',                                           'units'=>2,'grade_level'=>'Kinder',   'semester'=>'Full Year','type'=>'Core','schedule'=>'Daily 11:20-11:50','room'=>'Gymnasium'],
            ['code'=>'KG-ESP',   'name'=>'Edukasyon sa Pagpapakatao',                       'units'=>2,'grade_level'=>'Kinder',   'semester'=>'Full Year','type'=>'Core','schedule'=>'Daily 11:50-12:20','room'=>'Kinder Room'],
            // GRADE 1
            ['code'=>'MTB-1',   'name'=>'Mother Tongue-Based 1',                            'units'=>3,'grade_level'=>'Grade 1',  'semester'=>'Full Year','type'=>'Core','schedule'=>'Daily 07:30-08:20','room'=>'Room A1'],
            ['code'=>'FIL-1',   'name'=>'Filipino 1',                                       'units'=>3,'grade_level'=>'Grade 1',  'semester'=>'Full Year','type'=>'Core','schedule'=>'Daily 08:20-09:00','room'=>'Room A1'],
            ['code'=>'ENG-1',   'name'=>'English 1',                                        'units'=>3,'grade_level'=>'Grade 1',  'semester'=>'Full Year','type'=>'Core','schedule'=>'Daily 09:00-09:40','room'=>'Room A1'],
            ['code'=>'MATH-1',  'name'=>'Mathematics 1',                                    'units'=>3,'grade_level'=>'Grade 1',  'semester'=>'Full Year','type'=>'Core','schedule'=>'Daily 09:50-10:30','room'=>'Room A1'],
            ['code'=>'AP-1',    'name'=>'Araling Panlipunan 1',                             'units'=>2,'grade_level'=>'Grade 1',  'semester'=>'Full Year','type'=>'Core','schedule'=>'Daily 10:30-11:00','room'=>'Room A1'],
            ['code'=>'MAPEH-1', 'name'=>'MAPEH 1',                                          'units'=>2,'grade_level'=>'Grade 1',  'semester'=>'Full Year','type'=>'Core','schedule'=>'Daily 11:00-11:30','room'=>'Gymnasium'],
            ['code'=>'ESP-1',   'name'=>'Edukasyon sa Pagpapakatao 1',                      'units'=>2,'grade_level'=>'Grade 1',  'semester'=>'Full Year','type'=>'Core','schedule'=>'Daily 11:30-12:00','room'=>'Room A1'],
            // GRADE 2
            ['code'=>'MTB-2',   'name'=>'Mother Tongue-Based 2',                            'units'=>3,'grade_level'=>'Grade 2',  'semester'=>'Full Year','type'=>'Core','schedule'=>'Daily 07:30-08:20','room'=>'Room A2'],
            ['code'=>'FIL-2',   'name'=>'Filipino 2',                                       'units'=>3,'grade_level'=>'Grade 2',  'semester'=>'Full Year','type'=>'Core','schedule'=>'Daily 08:20-09:00','room'=>'Room A2'],
            ['code'=>'ENG-2',   'name'=>'English 2',                                        'units'=>3,'grade_level'=>'Grade 2',  'semester'=>'Full Year','type'=>'Core','schedule'=>'Daily 09:00-09:40','room'=>'Room A2'],
            ['code'=>'MATH-2',  'name'=>'Mathematics 2',                                    'units'=>3,'grade_level'=>'Grade 2',  'semester'=>'Full Year','type'=>'Core','schedule'=>'Daily 09:50-10:30','room'=>'Room A2'],
            ['code'=>'AP-2',    'name'=>'Araling Panlipunan 2',                             'units'=>2,'grade_level'=>'Grade 2',  'semester'=>'Full Year','type'=>'Core','schedule'=>'Daily 10:30-11:00','room'=>'Room A2'],
            ['code'=>'MAPEH-2', 'name'=>'MAPEH 2',                                          'units'=>2,'grade_level'=>'Grade 2',  'semester'=>'Full Year','type'=>'Core','schedule'=>'Daily 11:00-11:30','room'=>'Gymnasium'],
            ['code'=>'ESP-2',   'name'=>'Edukasyon sa Pagpapakatao 2',                      'units'=>2,'grade_level'=>'Grade 2',  'semester'=>'Full Year','type'=>'Core','schedule'=>'Daily 11:30-12:00','room'=>'Room A2'],
            // GRADE 3
            ['code'=>'MTB-3',   'name'=>'Mother Tongue-Based 3',                            'units'=>3,'grade_level'=>'Grade 3',  'semester'=>'Full Year','type'=>'Core','schedule'=>'Daily 07:30-08:20','room'=>'Room A3'],
            ['code'=>'FIL-3',   'name'=>'Filipino 3',                                       'units'=>3,'grade_level'=>'Grade 3',  'semester'=>'Full Year','type'=>'Core','schedule'=>'Daily 08:20-09:00','room'=>'Room A3'],
            ['code'=>'ENG-3',   'name'=>'English 3',                                        'units'=>3,'grade_level'=>'Grade 3',  'semester'=>'Full Year','type'=>'Core','schedule'=>'Daily 09:00-09:40','room'=>'Room A3'],
            ['code'=>'MATH-3',  'name'=>'Mathematics 3',                                    'units'=>3,'grade_level'=>'Grade 3',  'semester'=>'Full Year','type'=>'Core','schedule'=>'Daily 09:50-10:30','room'=>'Room A3'],
            ['code'=>'SCI-3',   'name'=>'Science 3',                                        'units'=>3,'grade_level'=>'Grade 3',  'semester'=>'Full Year','type'=>'Core','schedule'=>'Daily 10:30-11:10','room'=>'Sci Lab A'],
            ['code'=>'AP-3',    'name'=>'Araling Panlipunan 3',                             'units'=>2,'grade_level'=>'Grade 3',  'semester'=>'Full Year','type'=>'Core','schedule'=>'Daily 11:10-11:40','room'=>'Room A3'],
            ['code'=>'MAPEH-3', 'name'=>'MAPEH 3',                                          'units'=>2,'grade_level'=>'Grade 3',  'semester'=>'Full Year','type'=>'Core','schedule'=>'Daily 11:40-12:10','room'=>'Gymnasium'],
            ['code'=>'ESP-3',   'name'=>'Edukasyon sa Pagpapakatao 3',                      'units'=>2,'grade_level'=>'Grade 3',  'semester'=>'Full Year','type'=>'Core','schedule'=>'Daily 12:10-12:40','room'=>'Room A3'],
            // GRADE 4
            ['code'=>'FIL-4',   'name'=>'Filipino 4',                                       'units'=>3,'grade_level'=>'Grade 4',  'semester'=>'Full Year','type'=>'Core','schedule'=>'Daily 07:30-08:20','room'=>'Room A4'],
            ['code'=>'ENG-4',   'name'=>'English 4',                                        'units'=>3,'grade_level'=>'Grade 4',  'semester'=>'Full Year','type'=>'Core','schedule'=>'Daily 08:20-09:00','room'=>'Room A4'],
            ['code'=>'MATH-4',  'name'=>'Mathematics 4',                                    'units'=>3,'grade_level'=>'Grade 4',  'semester'=>'Full Year','type'=>'Core','schedule'=>'Daily 09:00-09:40','room'=>'Room A4'],
            ['code'=>'SCI-4',   'name'=>'Science 4',                                        'units'=>3,'grade_level'=>'Grade 4',  'semester'=>'Full Year','type'=>'Core','schedule'=>'Daily 09:50-10:30','room'=>'Sci Lab A'],
            ['code'=>'AP-4',    'name'=>'Araling Panlipunan 4',                             'units'=>2,'grade_level'=>'Grade 4',  'semester'=>'Full Year','type'=>'Core','schedule'=>'Daily 10:30-11:00','room'=>'Room A4'],
            ['code'=>'MAPEH-4', 'name'=>'MAPEH 4',                                          'units'=>2,'grade_level'=>'Grade 4',  'semester'=>'Full Year','type'=>'Core','schedule'=>'Daily 11:00-11:30','room'=>'Gymnasium'],
            ['code'=>'ESP-4',   'name'=>'Edukasyon sa Pagpapakatao 4',                      'units'=>2,'grade_level'=>'Grade 4',  'semester'=>'Full Year','type'=>'Core','schedule'=>'Daily 11:30-12:00','room'=>'Room A4'],
            ['code'=>'TLE-4',   'name'=>'Edukasyong Pantahanan at Pangkabuhayan 4',         'units'=>2,'grade_level'=>'Grade 4',  'semester'=>'Full Year','type'=>'Core','schedule'=>'Daily 13:00-13:45','room'=>'TLE Room'],
            // GRADE 5
            ['code'=>'FIL-5',   'name'=>'Filipino 5',                                       'units'=>3,'grade_level'=>'Grade 5',  'semester'=>'Full Year','type'=>'Core','schedule'=>'Daily 07:30-08:20','room'=>'Room A5'],
            ['code'=>'ENG-5',   'name'=>'English 5',                                        'units'=>3,'grade_level'=>'Grade 5',  'semester'=>'Full Year','type'=>'Core','schedule'=>'Daily 08:20-09:00','room'=>'Room A5'],
            ['code'=>'MATH-5',  'name'=>'Mathematics 5',                                    'units'=>3,'grade_level'=>'Grade 5',  'semester'=>'Full Year','type'=>'Core','schedule'=>'Daily 09:00-09:40','room'=>'Room A5'],
            ['code'=>'SCI-5',   'name'=>'Science 5',                                        'units'=>3,'grade_level'=>'Grade 5',  'semester'=>'Full Year','type'=>'Core','schedule'=>'Daily 09:50-10:30','room'=>'Sci Lab A'],
            ['code'=>'AP-5',    'name'=>'Araling Panlipunan 5',                             'units'=>2,'grade_level'=>'Grade 5',  'semester'=>'Full Year','type'=>'Core','schedule'=>'Daily 10:30-11:00','room'=>'Room A5'],
            ['code'=>'MAPEH-5', 'name'=>'MAPEH 5',                                          'units'=>2,'grade_level'=>'Grade 5',  'semester'=>'Full Year','type'=>'Core','schedule'=>'Daily 11:00-11:30','room'=>'Gymnasium'],
            ['code'=>'ESP-5',   'name'=>'Edukasyon sa Pagpapakatao 5',                      'units'=>2,'grade_level'=>'Grade 5',  'semester'=>'Full Year','type'=>'Core','schedule'=>'Daily 11:30-12:00','room'=>'Room A5'],
            ['code'=>'TLE-5',   'name'=>'Edukasyong Pantahanan at Pangkabuhayan 5',         'units'=>2,'grade_level'=>'Grade 5',  'semester'=>'Full Year','type'=>'Core','schedule'=>'Daily 13:00-13:45','room'=>'TLE Room'],
            // GRADE 6
            ['code'=>'FIL-6',   'name'=>'Filipino 6',                                       'units'=>3,'grade_level'=>'Grade 6',  'semester'=>'Full Year','type'=>'Core','schedule'=>'Daily 07:30-08:20','room'=>'Room A6'],
            ['code'=>'ENG-6',   'name'=>'English 6',                                        'units'=>3,'grade_level'=>'Grade 6',  'semester'=>'Full Year','type'=>'Core','schedule'=>'Daily 08:20-09:00','room'=>'Room A6'],
            ['code'=>'MATH-6',  'name'=>'Mathematics 6',                                    'units'=>3,'grade_level'=>'Grade 6',  'semester'=>'Full Year','type'=>'Core','schedule'=>'Daily 09:00-09:40','room'=>'Room A6'],
            ['code'=>'SCI-6',   'name'=>'Science 6',                                        'units'=>3,'grade_level'=>'Grade 6',  'semester'=>'Full Year','type'=>'Core','schedule'=>'Daily 09:50-10:30','room'=>'Sci Lab A'],
            ['code'=>'AP-6',    'name'=>'Araling Panlipunan 6',                             'units'=>2,'grade_level'=>'Grade 6',  'semester'=>'Full Year','type'=>'Core','schedule'=>'Daily 10:30-11:00','room'=>'Room A6'],
            ['code'=>'MAPEH-6', 'name'=>'MAPEH 6',                                          'units'=>2,'grade_level'=>'Grade 6',  'semester'=>'Full Year','type'=>'Core','schedule'=>'Daily 11:00-11:30','room'=>'Gymnasium'],
            ['code'=>'ESP-6',   'name'=>'Edukasyon sa Pagpapakatao 6',                      'units'=>2,'grade_level'=>'Grade 6',  'semester'=>'Full Year','type'=>'Core','schedule'=>'Daily 11:30-12:00','room'=>'Room A6'],
            ['code'=>'TLE-6',   'name'=>'Edukasyong Pantahanan at Pangkabuhayan 6',         'units'=>2,'grade_level'=>'Grade 6',  'semester'=>'Full Year','type'=>'Core','schedule'=>'Daily 13:00-13:45','room'=>'TLE Room'],
            // GRADE 7
            ['code'=>'ENG-7',   'name'=>'English 7',                                        'units'=>3,'grade_level'=>'Grade 7',  'semester'=>'Full Year','type'=>'Core','schedule'=>'MWF 07:30-08:30','room'=>'Room 101'],
            ['code'=>'MATH-7',  'name'=>'Mathematics 7',                                    'units'=>3,'grade_level'=>'Grade 7',  'semester'=>'Full Year','type'=>'Core','schedule'=>'MWF 08:30-09:30','room'=>'Room 101'],
            ['code'=>'FIL-7',   'name'=>'Filipino 7',                                       'units'=>3,'grade_level'=>'Grade 7',  'semester'=>'Full Year','type'=>'Core','schedule'=>'MWF 09:30-10:30','room'=>'Room 101'],
            ['code'=>'ESP-7',   'name'=>'Edukasyon sa Pagpapakatao 7',                      'units'=>2,'grade_level'=>'Grade 7',  'semester'=>'Full Year','type'=>'Core','schedule'=>'MWF 10:30-11:30','room'=>'Room 101'],
            ['code'=>'TLE-7',   'name'=>'Technology and Livelihood Education 7',            'units'=>2,'grade_level'=>'Grade 7',  'semester'=>'Full Year','type'=>'Core','schedule'=>'MWF 11:30-12:30','room'=>'TLE Room'],
            ['code'=>'SCI-7',   'name'=>'Science 7',                                        'units'=>3,'grade_level'=>'Grade 7',  'semester'=>'Full Year','type'=>'Core','schedule'=>'TTh 07:30-09:30','room'=>'Sci Lab 3'],
            ['code'=>'AP-7',    'name'=>'Araling Panlipunan 7',                             'units'=>3,'grade_level'=>'Grade 7',  'semester'=>'Full Year','type'=>'Core','schedule'=>'TTh 09:45-11:15','room'=>'Room 101'],
            ['code'=>'MAPEH-7', 'name'=>'MAPEH 7',                                          'units'=>2,'grade_level'=>'Grade 7',  'semester'=>'Full Year','type'=>'Core','schedule'=>'TTh 11:30-12:30','room'=>'Gymnasium'],
            // GRADE 8
            ['code'=>'ENG-8',   'name'=>'English 8',                                        'units'=>3,'grade_level'=>'Grade 8',  'semester'=>'Full Year','type'=>'Core','schedule'=>'MWF 07:30-08:30','room'=>'Room 102'],
            ['code'=>'MATH-8',  'name'=>'Mathematics 8',                                    'units'=>3,'grade_level'=>'Grade 8',  'semester'=>'Full Year','type'=>'Core','schedule'=>'MWF 08:30-09:30','room'=>'Room 102'],
            ['code'=>'FIL-8',   'name'=>'Filipino 8',                                       'units'=>3,'grade_level'=>'Grade 8',  'semester'=>'Full Year','type'=>'Core','schedule'=>'MWF 09:30-10:30','room'=>'Room 102'],
            ['code'=>'ESP-8',   'name'=>'Edukasyon sa Pagpapakatao 8',                      'units'=>2,'grade_level'=>'Grade 8',  'semester'=>'Full Year','type'=>'Core','schedule'=>'MWF 10:30-11:30','room'=>'Room 102'],
            ['code'=>'TLE-8',   'name'=>'Technology and Livelihood Education 8',            'units'=>2,'grade_level'=>'Grade 8',  'semester'=>'Full Year','type'=>'Core','schedule'=>'MWF 11:30-12:30','room'=>'TLE Room'],
            ['code'=>'SCI-8',   'name'=>'Science 8',                                        'units'=>3,'grade_level'=>'Grade 8',  'semester'=>'Full Year','type'=>'Core','schedule'=>'TTh 07:30-09:30','room'=>'Sci Lab 3'],
            ['code'=>'AP-8',    'name'=>'Araling Panlipunan 8',                             'units'=>3,'grade_level'=>'Grade 8',  'semester'=>'Full Year','type'=>'Core','schedule'=>'TTh 09:45-11:15','room'=>'Room 102'],
            ['code'=>'MAPEH-8', 'name'=>'MAPEH 8',                                          'units'=>2,'grade_level'=>'Grade 8',  'semester'=>'Full Year','type'=>'Core','schedule'=>'TTh 11:30-12:30','room'=>'Gymnasium'],
            // GRADE 9
            ['code'=>'ENG-9',   'name'=>'English 9',                                        'units'=>3,'grade_level'=>'Grade 9',  'semester'=>'Full Year','type'=>'Core','schedule'=>'MWF 07:30-08:30','room'=>'Room 103'],
            ['code'=>'MATH-9',  'name'=>'Mathematics 9',                                    'units'=>3,'grade_level'=>'Grade 9',  'semester'=>'Full Year','type'=>'Core','schedule'=>'MWF 08:30-09:30','room'=>'Room 103'],
            ['code'=>'FIL-9',   'name'=>'Filipino 9',                                       'units'=>3,'grade_level'=>'Grade 9',  'semester'=>'Full Year','type'=>'Core','schedule'=>'MWF 09:30-10:30','room'=>'Room 103'],
            ['code'=>'ESP-9',   'name'=>'Edukasyon sa Pagpapakatao 9',                      'units'=>2,'grade_level'=>'Grade 9',  'semester'=>'Full Year','type'=>'Core','schedule'=>'MWF 10:30-11:30','room'=>'Room 103'],
            ['code'=>'TLE-9',   'name'=>'Technology and Livelihood Education 9',            'units'=>2,'grade_level'=>'Grade 9',  'semester'=>'Full Year','type'=>'Core','schedule'=>'MWF 11:30-12:30','room'=>'TLE Room'],
            ['code'=>'SCI-9',   'name'=>'Science 9',                                        'units'=>3,'grade_level'=>'Grade 9',  'semester'=>'Full Year','type'=>'Core','schedule'=>'TTh 07:30-09:30','room'=>'Sci Lab 3'],
            ['code'=>'AP-9',    'name'=>'Araling Panlipunan 9',                             'units'=>3,'grade_level'=>'Grade 9',  'semester'=>'Full Year','type'=>'Core','schedule'=>'TTh 09:45-11:15','room'=>'Room 103'],
            ['code'=>'MAPEH-9', 'name'=>'MAPEH 9',                                          'units'=>2,'grade_level'=>'Grade 9',  'semester'=>'Full Year','type'=>'Core','schedule'=>'TTh 11:30-12:30','room'=>'Gymnasium'],
            // GRADE 10
            ['code'=>'ENG-10',   'name'=>'English 10',                                      'units'=>3,'grade_level'=>'Grade 10', 'semester'=>'Full Year','type'=>'Core','schedule'=>'MWF 07:30-08:30','room'=>'Room 104'],
            ['code'=>'MATH-10',  'name'=>'Mathematics 10',                                  'units'=>3,'grade_level'=>'Grade 10', 'semester'=>'Full Year','type'=>'Core','schedule'=>'MWF 08:30-09:30','room'=>'Room 104'],
            ['code'=>'FIL-10',   'name'=>'Filipino 10',                                     'units'=>3,'grade_level'=>'Grade 10', 'semester'=>'Full Year','type'=>'Core','schedule'=>'MWF 09:30-10:30','room'=>'Room 104'],
            ['code'=>'ESP-10',   'name'=>'Edukasyon sa Pagpapakatao 10',                    'units'=>2,'grade_level'=>'Grade 10', 'semester'=>'Full Year','type'=>'Core','schedule'=>'MWF 10:30-11:30','room'=>'Room 104'],
            ['code'=>'TLE-10',   'name'=>'Technology and Livelihood Education 10',          'units'=>2,'grade_level'=>'Grade 10', 'semester'=>'Full Year','type'=>'Core','schedule'=>'MWF 11:30-12:30','room'=>'TLE Room'],
            ['code'=>'SCI-10',   'name'=>'Science 10',                                      'units'=>3,'grade_level'=>'Grade 10', 'semester'=>'Full Year','type'=>'Core','schedule'=>'TTh 07:30-09:30','room'=>'Sci Lab 3'],
            ['code'=>'AP-10',    'name'=>'Araling Panlipunan 10',                           'units'=>3,'grade_level'=>'Grade 10', 'semester'=>'Full Year','type'=>'Core','schedule'=>'TTh 09:45-11:15','room'=>'Room 104'],
            ['code'=>'MAPEH-10', 'name'=>'MAPEH 10',                                        'units'=>2,'grade_level'=>'Grade 10', 'semester'=>'Full Year','type'=>'Core','schedule'=>'TTh 11:30-12:30','room'=>'Gymnasium'],
        ];

        foreach ($elementaryJhs as $data) {
            $this->seedSubject($data);
        }

        // Create A/B/C/D variants for all Elementary + JHS subjects
        foreach ($elementaryJhs as $data) {
            foreach (['A' => 0, 'B' => 120, 'C' => 300, 'D' => 420] as $suffix => $offset) {
                $this->seedSubject(array_merge($data, [
                    'code'     => $data['code'] . '-' . $suffix,
                    'schedule' => $this->shiftSchedule($data['schedule'], $offset),
                ]));
            }
        }

        // ══════════════════════════════════════════════════════════════════
        // SHS BASE SUBJECTS  (original + newly added missing ones)
        // These base records are kept for reference. Section assignments use
        // the A/B/C/D variants below.
        // ══════════════════════════════════════════════════════════════════
        $shs = [

            // ── GRADE 11 · FIRST SEMESTER · Core ────────────────────────
            ['code'=>'ORAL-COMM',    'name'=>'Oral Communication in Context',                                          'units'=>3,'grade_level'=>'Grade 11','semester'=>'First Semester', 'type'=>'Core',        'schedule'=>'MWF 07:30-08:30','room'=>'Room 301'],
            ['code'=>'KOMYUN-11',    'name'=>'Komunikasyon at Pananaliksik sa Wika at Kulturang Pilipino',             'units'=>3,'grade_level'=>'Grade 11','semester'=>'First Semester', 'type'=>'Core',        'schedule'=>'TTh 07:30-09:00','room'=>'Room 302'],
            ['code'=>'GEN-MATH',     'name'=>'General Mathematics',                                                    'units'=>3,'grade_level'=>'Grade 11','semester'=>'First Semester', 'type'=>'Core',        'schedule'=>'MWF 08:30-09:30','room'=>'Room 301'],
            ['code'=>'EARTH-SCI',    'name'=>'Earth and Life Science',                                                 'units'=>3,'grade_level'=>'Grade 11','semester'=>'First Semester', 'type'=>'Core',        'schedule'=>'TTh 09:15-11:15','room'=>'Sci Lab 1'],
            ['code'=>'PERDEV',       'name'=>'Personal Development',                                                   'units'=>3,'grade_level'=>'Grade 11','semester'=>'First Semester', 'type'=>'Core',        'schedule'=>'MWF 09:30-10:30','room'=>'Room 303'],
            ['code'=>'UCSP',         'name'=>'Understanding Culture, Society, and Politics',                           'units'=>3,'grade_level'=>'Grade 11','semester'=>'First Semester', 'type'=>'Core',        'schedule'=>'MWF 10:30-11:30','room'=>'Room 304'],
            ['code'=>'CONTEMP-ARTS', 'name'=>'Contemporary Philippine Arts from the Regions',                         'units'=>3,'grade_level'=>'Grade 11','semester'=>'First Semester', 'type'=>'Core',        'schedule'=>'TTh 11:30-13:00','room'=>'Room 305'],
            ['code'=>'PE-1',         'name'=>'Physical Education and Health 1',                                        'units'=>2,'grade_level'=>'Grade 11','semester'=>'First Semester', 'type'=>'Core',        'schedule'=>'MWF 11:30-12:30','room'=>'Gymnasium'],
            // STEM
            ['code'=>'PRE-CALC',     'name'=>'Pre-Calculus',                                                           'units'=>3,'grade_level'=>'Grade 11','semester'=>'First Semester', 'type'=>'Specialized','strand'=>'Science, Technology, Engineering and Mathematics','schedule'=>'MWF 13:00-14:00','room'=>'Room 306'],
            ['code'=>'GEN-BIO-1',    'name'=>'General Biology 1',                                                      'units'=>3,'grade_level'=>'Grade 11','semester'=>'First Semester', 'type'=>'Specialized','strand'=>'Science, Technology, Engineering and Mathematics','schedule'=>'TTh 13:00-14:30','room'=>'Sci Lab 2'],
            ['code'=>'DRRR-11',      'name'=>'Disaster Readiness and Risk Reduction',                                  'units'=>3,'grade_level'=>'Grade 11','semester'=>'First Semester', 'type'=>'Specialized','strand'=>'Science, Technology, Engineering and Mathematics','schedule'=>'MWF 14:00-15:00','room'=>'Room 306'],
            // ABM
            ['code'=>'BUS-MATH',     'name'=>'Business Mathematics',                                                   'units'=>3,'grade_level'=>'Grade 11','semester'=>'First Semester', 'type'=>'Specialized','strand'=>'Accountancy, Business and Management', 'schedule'=>'MWF 13:00-14:00','room'=>'Room 307'],
            ['code'=>'FABM-1',       'name'=>'Fundamentals of Accountancy, Business and Management 1',                 'units'=>3,'grade_level'=>'Grade 11','semester'=>'First Semester', 'type'=>'Specialized','strand'=>'Accountancy, Business and Management', 'schedule'=>'TTh 13:00-14:30','room'=>'Room 307'],
            ['code'=>'BUS-ETH-11',   'name'=>'Business Ethics and Social Responsibility',                              'units'=>3,'grade_level'=>'Grade 11','semester'=>'First Semester', 'type'=>'Specialized','strand'=>'Accountancy, Business and Management', 'schedule'=>'MWF 14:00-15:00','room'=>'Room 307'],
            // HUMSS
            ['code'=>'DIASS',        'name'=>'Disciplines and Ideas in the Social Sciences',                           'units'=>3,'grade_level'=>'Grade 11','semester'=>'First Semester', 'type'=>'Specialized','strand'=>'Humanities and Social Sciences','schedule'=>'MWF 13:00-14:00','room'=>'Room 308'],
            ['code'=>'DISS',         'name'=>'Disciplines and Ideas in Applied Social Sciences',                       'units'=>3,'grade_level'=>'Grade 11','semester'=>'First Semester', 'type'=>'Specialized','strand'=>'Humanities and Social Sciences','schedule'=>'TTh 13:00-14:30','room'=>'Room 308'],
            ['code'=>'INTRO-LING',   'name'=>'Introduction to Linguistics',                                            'units'=>3,'grade_level'=>'Grade 11','semester'=>'First Semester', 'type'=>'Specialized','strand'=>'Humanities and Social Sciences','schedule'=>'MWF 14:00-15:00','room'=>'Room 308'],

            // ── GRADE 11 · SECOND SEMESTER · Core ───────────────────────
            ['code'=>'READ-WRITE',   'name'=>'Reading and Writing Skills',                                             'units'=>3,'grade_level'=>'Grade 11','semester'=>'Second Semester','type'=>'Core',        'schedule'=>'MWF 07:30-08:30','room'=>'Room 301'],
            ['code'=>'PAGBASA-11',   'name'=>"Pagbasa at Pagsusuri ng Iba't Ibang Teksto Tungo sa Pananaliksik",       'units'=>3,'grade_level'=>'Grade 11','semester'=>'Second Semester','type'=>'Core',        'schedule'=>'TTh 07:30-09:00','room'=>'Room 302'],
            ['code'=>'STATS-PROB',   'name'=>'Statistics and Probability',                                             'units'=>3,'grade_level'=>'Grade 11','semester'=>'Second Semester','type'=>'Core',        'schedule'=>'MWF 08:30-09:30','room'=>'Room 301'],
            ['code'=>'PHYS-SCI',     'name'=>'Physical Science',                                                       'units'=>3,'grade_level'=>'Grade 11','semester'=>'Second Semester','type'=>'Core',        'schedule'=>'TTh 09:15-11:15','room'=>'Sci Lab 1'],
            ['code'=>'WORLD-LIT',    'name'=>'21st Century Literature from the Philippines and the World',             'units'=>3,'grade_level'=>'Grade 11','semester'=>'Second Semester','type'=>'Core',        'schedule'=>'MWF 09:30-10:30','room'=>'Room 303'],
            ['code'=>'INTRO-PHILO',  'name'=>'Introduction to the Philosophy of the Human Person',                    'units'=>3,'grade_level'=>'Grade 11','semester'=>'Second Semester','type'=>'Core',        'schedule'=>'MWF 10:30-11:30','room'=>'Room 304'],
            ['code'=>'PE-2',         'name'=>'Physical Education and Health 2',                                        'units'=>2,'grade_level'=>'Grade 11','semester'=>'Second Semester','type'=>'Core',        'schedule'=>'MWF 11:30-12:30','room'=>'Gymnasium'],
            // STEM
            ['code'=>'BASIC-CALC',   'name'=>'Basic Calculus',                                                         'units'=>3,'grade_level'=>'Grade 11','semester'=>'Second Semester','type'=>'Specialized','strand'=>'Science, Technology, Engineering and Mathematics','schedule'=>'MWF 13:00-14:00','room'=>'Room 306'],
            ['code'=>'GEN-BIO-2',    'name'=>'General Biology 2',                                                      'units'=>3,'grade_level'=>'Grade 11','semester'=>'Second Semester','type'=>'Specialized','strand'=>'Science, Technology, Engineering and Mathematics','schedule'=>'TTh 13:00-14:30','room'=>'Sci Lab 2'],
            ['code'=>'RDL-1',        'name'=>'Research in Daily Life 1',                                               'units'=>3,'grade_level'=>'Grade 11','semester'=>'Second Semester','type'=>'Specialized','strand'=>'Science, Technology, Engineering and Mathematics','schedule'=>'MWF 14:00-15:00','room'=>'Room 306'],
            // ABM
            ['code'=>'ORG-MGMT',     'name'=>'Organization and Management',                                            'units'=>3,'grade_level'=>'Grade 11','semester'=>'Second Semester','type'=>'Specialized','strand'=>'Accountancy, Business and Management', 'schedule'=>'MWF 13:00-14:00','room'=>'Room 307'],
            ['code'=>'FABM-2',       'name'=>'Fundamentals of Accountancy, Business and Management 2',                 'units'=>3,'grade_level'=>'Grade 11','semester'=>'Second Semester','type'=>'Specialized','strand'=>'Accountancy, Business and Management', 'schedule'=>'TTh 13:00-14:30','room'=>'Room 307'],
            ['code'=>'BUS-LAW',      'name'=>'Business Law and Regulation',                                            'units'=>3,'grade_level'=>'Grade 11','semester'=>'Second Semester','type'=>'Specialized','strand'=>'Accountancy, Business and Management', 'schedule'=>'MWF 14:00-15:00','room'=>'Room 307'],
            // HUMSS
            ['code'=>'CREATIVE-WR',  'name'=>'Creative Writing / Malikhaing Pagsulat',                                'units'=>3,'grade_level'=>'Grade 11','semester'=>'Second Semester','type'=>'Specialized','strand'=>'Humanities and Social Sciences','schedule'=>'MWF 13:00-14:00','room'=>'Room 308'],
            ['code'=>'WORLD-REL',    'name'=>'Introduction to World Religions and Belief Systems',                     'units'=>3,'grade_level'=>'Grade 11','semester'=>'Second Semester','type'=>'Specialized','strand'=>'Humanities and Social Sciences','schedule'=>'TTh 13:00-14:30','room'=>'Room 308'],
            ['code'=>'PANITIKAN-11', 'name'=>'Panitikan (Philippine Literature in Filipino)',                          'units'=>3,'grade_level'=>'Grade 11','semester'=>'Second Semester','type'=>'Specialized','strand'=>'Humanities and Social Sciences','schedule'=>'MWF 14:00-15:00','room'=>'Room 308'],

            // ── GRADE 12 · FIRST SEMESTER · Core ────────────────────────
            ['code'=>'ENGLISH-ACAD', 'name'=>'English for Academic and Professional Purposes',                         'units'=>3,'grade_level'=>'Grade 12','semester'=>'First Semester', 'type'=>'Core',        'schedule'=>'MWF 07:30-08:30','room'=>'Room 401'],
            ['code'=>'FIL-KOMYUN',   'name'=>'Filipino sa Piling Larangan (Akademik)',                                 'units'=>3,'grade_level'=>'Grade 12','semester'=>'First Semester', 'type'=>'Core',        'schedule'=>'TTh 07:30-09:00','room'=>'Room 402'],
            ['code'=>'PRAC-RES-1',   'name'=>'Practical Research 1',                                                   'units'=>3,'grade_level'=>'Grade 12','semester'=>'First Semester', 'type'=>'Core',        'schedule'=>'MWF 08:30-09:30','room'=>'Room 401'],
            ['code'=>'EMPOWERMENT',  'name'=>'Empowerment Technologies',                                               'units'=>3,'grade_level'=>'Grade 12','semester'=>'First Semester', 'type'=>'Core',        'schedule'=>'TTh 09:15-11:15','room'=>'Comp Lab'],
            ['code'=>'CONTEMP-ART',  'name'=>'Contemporary Philippine Arts from the Regions',                         'units'=>3,'grade_level'=>'Grade 12','semester'=>'First Semester', 'type'=>'Core',        'schedule'=>'MWF 09:30-10:30','room'=>'Room 403'],
            ['code'=>'PE-3',         'name'=>'Physical Education and Health 3',                                        'units'=>2,'grade_level'=>'Grade 12','semester'=>'First Semester', 'type'=>'Core',        'schedule'=>'MWF 10:30-11:30','room'=>'Gymnasium'],
            // STEM
            ['code'=>'GEN-CHEM-1',   'name'=>'General Chemistry 1',                                                    'units'=>3,'grade_level'=>'Grade 12','semester'=>'First Semester', 'type'=>'Specialized','strand'=>'Science, Technology, Engineering and Mathematics','schedule'=>'MWF 11:30-12:30','room'=>'Sci Lab 1'],
            ['code'=>'GEN-PHYS-1',   'name'=>'General Physics 1',                                                      'units'=>3,'grade_level'=>'Grade 12','semester'=>'First Semester', 'type'=>'Specialized','strand'=>'Science, Technology, Engineering and Mathematics','schedule'=>'TTh 11:30-13:00','room'=>'Physics Lab'],
            ['code'=>'RDL-2',        'name'=>'Research in Daily Life 2',                                               'units'=>3,'grade_level'=>'Grade 12','semester'=>'First Semester', 'type'=>'Specialized','strand'=>'Science, Technology, Engineering and Mathematics','schedule'=>'MWF 13:00-14:00','room'=>'Room 406'],
            // ABM
            ['code'=>'BUS-FIN',      'name'=>'Business Finance',                                                       'units'=>3,'grade_level'=>'Grade 12','semester'=>'First Semester', 'type'=>'Specialized','strand'=>'Accountancy, Business and Management', 'schedule'=>'MWF 11:30-12:30','room'=>'Room 404'],
            ['code'=>'APPLIED-EC',   'name'=>'Applied Economics',                                                      'units'=>3,'grade_level'=>'Grade 12','semester'=>'First Semester', 'type'=>'Specialized','strand'=>'Accountancy, Business and Management', 'schedule'=>'TTh 11:30-13:00','room'=>'Room 404'],
            ['code'=>'TAXATION-12',  'name'=>'Income Taxation and Business Laws',                                      'units'=>3,'grade_level'=>'Grade 12','semester'=>'First Semester', 'type'=>'Specialized','strand'=>'Accountancy, Business and Management', 'schedule'=>'MWF 13:00-14:00','room'=>'Room 404'],
            // HUMSS
            ['code'=>'TRENDS-NET',   'name'=>'Trends, Networks, and Critical Thinking in the 21st Century',           'units'=>3,'grade_level'=>'Grade 12','semester'=>'First Semester', 'type'=>'Specialized','strand'=>'Humanities and Social Sciences','schedule'=>'MWF 11:30-12:30','room'=>'Room 405'],
            ['code'=>'PHL-POL',      'name'=>'Philippine Politics and Governance',                                     'units'=>3,'grade_level'=>'Grade 12','semester'=>'First Semester', 'type'=>'Specialized','strand'=>'Humanities and Social Sciences','schedule'=>'TTh 11:30-13:00','room'=>'Room 405'],
            ['code'=>'RIZAL-12',     'name'=>'Rizal and the Emergence of Philippine Nationhood',                       'units'=>3,'grade_level'=>'Grade 12','semester'=>'First Semester', 'type'=>'Specialized','strand'=>'Humanities and Social Sciences','schedule'=>'MWF 13:00-14:00','room'=>'Room 405'],

            // ── GRADE 12 · SECOND SEMESTER · Core ───────────────────────
            ['code'=>'PRAC-RES-2',   'name'=>'Practical Research 2',                                                   'units'=>3,'grade_level'=>'Grade 12','semester'=>'Second Semester','type'=>'Core',        'schedule'=>'MWF 07:30-08:30','room'=>'Room 401'],
            ['code'=>'MEDIA-INFO',   'name'=>'Media and Information Literacy',                                         'units'=>3,'grade_level'=>'Grade 12','semester'=>'Second Semester','type'=>'Core',        'schedule'=>'MWF 08:30-09:30','room'=>'Comp Lab'],
            ['code'=>'INQUIRIES',    'name'=>'Inquiries, Investigations, and Immersion',                               'units'=>3,'grade_level'=>'Grade 12','semester'=>'Second Semester','type'=>'Core',        'schedule'=>'TTh 07:30-09:30','room'=>'Room 402'],
            ['code'=>'ENTREP',       'name'=>'Entrepreneurship',                                                       'units'=>3,'grade_level'=>'Grade 12','semester'=>'Second Semester','type'=>'Core',        'schedule'=>'MWF 09:30-10:30','room'=>'Room 403'],
            ['code'=>'PE-4',         'name'=>'Physical Education and Health 4',                                        'units'=>2,'grade_level'=>'Grade 12','semester'=>'Second Semester','type'=>'Core',        'schedule'=>'MWF 10:30-11:30','room'=>'Gymnasium'],
            // STEM
            ['code'=>'GEN-CHEM-2',   'name'=>'General Chemistry 2',                                                    'units'=>3,'grade_level'=>'Grade 12','semester'=>'Second Semester','type'=>'Specialized','strand'=>'Science, Technology, Engineering and Mathematics','schedule'=>'MWF 11:30-12:30','room'=>'Sci Lab 1'],
            ['code'=>'GEN-PHYS-2',   'name'=>'General Physics 2',                                                      'units'=>3,'grade_level'=>'Grade 12','semester'=>'Second Semester','type'=>'Specialized','strand'=>'Science, Technology, Engineering and Mathematics','schedule'=>'TTh 09:45-11:15','room'=>'Physics Lab'],
            ['code'=>'WORK-IMM-STEM','name'=>'Work Immersion (STEM)',                                                  'units'=>3,'grade_level'=>'Grade 12','semester'=>'Second Semester','type'=>'Specialized','strand'=>'Science, Technology, Engineering and Mathematics','schedule'=>'MWF 13:00-14:00','room'=>'Sci Lab 1'],
            // ABM
            ['code'=>'PRIN-MKT',     'name'=>'Principles of Marketing',                                                'units'=>3,'grade_level'=>'Grade 12','semester'=>'Second Semester','type'=>'Specialized','strand'=>'Accountancy, Business and Management', 'schedule'=>'MWF 11:30-12:30','room'=>'Room 404'],
            ['code'=>'WORK-IMM',     'name'=>'Work Immersion',                                                         'units'=>3,'grade_level'=>'Grade 12','semester'=>'Second Semester','type'=>'Specialized','strand'=>'Accountancy, Business and Management', 'schedule'=>'TTh 09:45-11:15','room'=>'Room 404'],
            ['code'=>'BPFS-12',      'name'=>'Business Plan and Feasibility Study',                                    'units'=>3,'grade_level'=>'Grade 12','semester'=>'Second Semester','type'=>'Specialized','strand'=>'Accountancy, Business and Management', 'schedule'=>'MWF 13:00-14:00','room'=>'Room 404'],
            // HUMSS
            ['code'=>'COMM-ENG',     'name'=>'Community Engagement, Solidarity, and Citizenship',                     'units'=>3,'grade_level'=>'Grade 12','semester'=>'Second Semester','type'=>'Specialized','strand'=>'Humanities and Social Sciences','schedule'=>'MWF 11:30-12:30','room'=>'Room 405'],
            ['code'=>'MEDIA-ADV',    'name'=>'Media Advocacy',                                                         'units'=>3,'grade_level'=>'Grade 12','semester'=>'Second Semester','type'=>'Specialized','strand'=>'Humanities and Social Sciences','schedule'=>'TTh 09:45-11:15','room'=>'Room 405'],
            ['code'=>'WORK-IMM-HUMSS','name'=>'Work Immersion (HUMSS)',                                                'units'=>3,'grade_level'=>'Grade 12','semester'=>'Second Semester','type'=>'Specialized','strand'=>'Humanities and Social Sciences','schedule'=>'MWF 13:00-14:00','room'=>'Room 405'],
        ];

        // Seed base SHS subjects
        foreach ($shs as $data) {
            $this->seedSubject($data);
        }

        // Create A / B / C / D schedule variants for every SHS subject.
        // Offsets: A=+0 min, B=+120 min, C=+300 min, D=+420 min
        foreach ($shs as $data) {
            foreach (['A' => 0, 'B' => 120, 'C' => 300, 'D' => 420] as $suffix => $offset) {
                $this->seedSubject(array_merge($data, [
                    'code'     => $data['code'] . '-' . $suffix,
                    'schedule' => $this->shiftSchedule($data['schedule'], $offset),
                ]));
            }
        }

        $ejCount  = count($elementaryJhs);
        $shsCount = count($shs);
        $this->command->info("✅ Subjects seeded: {$ejCount} E+JHS base · " . ($ejCount * 4) . " E+JHS variants · {$shsCount} SHS base · " . ($shsCount * 4) . ' SHS variants (A/B/C/D).');
    }

    // ── Helpers ────────────────────────────────────────────────────────────

    private function seedSubject(array $data): void
    {
        $subject = Subject::updateOrCreate(
            ['code' => $data['code']],
            [
                'name'        => $data['name'],
                'description' => null,
                'units'       => $data['units'],
                'type'        => $data['type'],
                'grade_level' => $data['grade_level'],
                'semester'    => $data['semester'],
                'strand'      => $data['strand'] ?? null,
                'is_active'   => true,
                'user_id'     => null,
            ]
        );

        $scheduleString = $data['schedule'] ?? null;
        $room           = $data['room'] ?? null;

        if ($scheduleString) {
            $parsed = $this->parseSchedule($scheduleString);
            if ($parsed['days'] && $parsed['time']) {
                $existing = Schedule::where('subject_id', $subject->id)
                    ->whereNull('block_section_id')
                    ->first();

                if ($existing) {
                    $existing->update(['days' => $parsed['days'], 'time' => $parsed['time'], 'room' => $room]);
                } else {
                    Schedule::create([
                        'subject_id'       => $subject->id,
                        'block_section_id' => null,
                        'days'             => $parsed['days'],
                        'time'             => $parsed['time'],
                        'room'             => $room,
                    ]);
                }
            }
        }
    }

    private function shiftSchedule(string $schedule, int $minuteOffset): string
    {
        preg_match('/^(\S+)\s+(\d{2}:\d{2})-(\d{2}:\d{2})$/', trim($schedule), $m);
        if (! $m) {
            return $schedule;
        }
        return $m[1] . ' ' . $this->addMinutes($m[2], $minuteOffset) . '-' . $this->addMinutes($m[3], $minuteOffset);
    }

    private function addMinutes(string $time, int $minutes): string
    {
        [$h, $min] = explode(':', $time);
        $total = (int) $h * 60 + (int) $min + $minutes;
        return sprintf('%02d:%02d', intdiv($total, 60) % 24, $total % 60);
    }

    private function parseSchedule(string $s): array
    {
        preg_match('/^([A-Za-z]+)\s+(.+)$/', trim($s), $m);
        return ['days' => $m[1] ?? null, 'time' => $m[2] ?? null];
    }
}
