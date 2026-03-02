<?php

namespace Database\Seeders;

use App\Models\ExamSchedule;
use App\Models\ExaminationRoom;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class ExamScheduleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get room IDs
        $room101 = ExaminationRoom::where('name', 'Room 101')->first();
        $room102 = ExaminationRoom::where('name', 'Room 102')->first();
        $room201 = ExaminationRoom::where('name', 'Room 201')->first();
        $room301 = ExaminationRoom::where('name', 'Room 301')->first();
        $lectureHall = ExaminationRoom::where('name', 'Lecture Hall 1')->first();
        $gymnasium = ExaminationRoom::where('name', 'Gymnasium Hall')->first();
        $elemRoomA1 = ExaminationRoom::where('name', 'Elementary Room A1')->first();
        $elemRoomA2 = ExaminationRoom::where('name', 'Elementary Room A2')->first();

        // Schedule dates (upcoming weeks)
        $week1Saturday = Carbon::now()->next(Carbon::SATURDAY);
        $week2Saturday = Carbon::now()->next(Carbon::SATURDAY)->addWeek();
        $week3Saturday = Carbon::now()->next(Carbon::SATURDAY)->addWeeks(2);

        $schedules = [
            // Week 1 - SHS Entrance Exam (Saturday Morning)
            [
                'name' => 'SHS Entrance Exam - Batch 1',
                'exam_type' => 'SHS',
                'exam_date' => $week1Saturday->format('Y-m-d'),
                'start_time' => '08:00:00',
                'end_time' => '11:00:00',
                'examination_room_id' => $room301?->id,
                'is_active' => true,
            ],
            [
                'name' => 'SHS Entrance Exam - Batch 2',
                'exam_type' => 'SHS',
                'exam_date' => $week1Saturday->format('Y-m-d'),
                'start_time' => '13:00:00',
                'end_time' => '16:00:00',
                'examination_room_id' => $room301?->id,
                'is_active' => true,
            ],

            // Week 1 - JHS Entrance Exam (Saturday)
            [
                'name' => 'JHS Entrance Exam - Batch 1',
                'exam_type' => 'JHS',
                'exam_date' => $week1Saturday->format('Y-m-d'),
                'start_time' => '08:00:00',
                'end_time' => '11:00:00',
                'examination_room_id' => $room101?->id,
                'is_active' => true,
            ],
            [
                'name' => 'JHS Entrance Exam - Batch 2',
                'exam_type' => 'JHS',
                'exam_date' => $week1Saturday->format('Y-m-d'),
                'start_time' => '08:00:00',
                'end_time' => '11:00:00',
                'examination_room_id' => $room102?->id,
                'is_active' => true,
            ],

            // Week 1 - LES Assessment (Saturday)
            [
                'name' => 'LES Assessment - Batch 1',
                'exam_type' => 'LES',
                'exam_date' => $week1Saturday->format('Y-m-d'),
                'start_time' => '09:00:00',
                'end_time' => '11:00:00',
                'examination_room_id' => $elemRoomA1?->id,
                'is_active' => true,
            ],
            [
                'name' => 'LES Assessment - Batch 2',
                'exam_type' => 'LES',
                'exam_date' => $week1Saturday->format('Y-m-d'),
                'start_time' => '09:00:00',
                'end_time' => '11:00:00',
                'examination_room_id' => $elemRoomA2?->id,
                'is_active' => true,
            ],

            // Week 2 - Mass Testing in Gymnasium
            [
                'name' => 'SHS Mass Testing - All Strands',
                'exam_type' => 'SHS',
                'exam_date' => $week2Saturday->format('Y-m-d'),
                'start_time' => '08:00:00',
                'end_time' => '12:00:00',
                'examination_room_id' => $gymnasium?->id,
                'is_active' => true,
            ],
            [
                'name' => 'JHS Mass Testing',
                'exam_type' => 'JHS',
                'exam_date' => $week2Saturday->format('Y-m-d'),
                'start_time' => '13:00:00',
                'end_time' => '16:00:00',
                'examination_room_id' => $gymnasium?->id,
                'is_active' => true,
            ],

            // Week 2 - Additional rooms
            [
                'name' => 'SHS Entrance Exam - Lecture Hall',
                'exam_type' => 'SHS',
                'exam_date' => $week2Saturday->format('Y-m-d'),
                'start_time' => '08:00:00',
                'end_time' => '11:00:00',
                'examination_room_id' => $lectureHall?->id,
                'is_active' => true,
            ],

            // Week 3 - Regular Testing
            [
                'name' => 'SHS Entrance Exam - Week 3 Batch 1',
                'exam_type' => 'SHS',
                'exam_date' => $week3Saturday->format('Y-m-d'),
                'start_time' => '08:00:00',
                'end_time' => '11:00:00',
                'examination_room_id' => $room201?->id,
                'is_active' => true,
            ],
            [
                'name' => 'SHS Entrance Exam - Week 3 Batch 2',
                'exam_type' => 'SHS',
                'exam_date' => $week3Saturday->format('Y-m-d'),
                'start_time' => '13:00:00',
                'end_time' => '16:00:00',
                'examination_room_id' => $room201?->id,
                'is_active' => true,
            ],
            [
                'name' => 'JHS Entrance Exam - Week 3',
                'exam_type' => 'JHS',
                'exam_date' => $week3Saturday->format('Y-m-d'),
                'start_time' => '08:00:00',
                'end_time' => '11:00:00',
                'examination_room_id' => $room101?->id,
                'is_active' => true,
            ],
            [
                'name' => 'LES Assessment - Week 3',
                'exam_type' => 'LES',
                'exam_date' => $week3Saturday->format('Y-m-d'),
                'start_time' => '09:00:00',
                'end_time' => '11:00:00',
                'examination_room_id' => $elemRoomA1?->id,
                'is_active' => true,
            ],
        ];

        foreach ($schedules as $schedule) {
            // Only create if room exists
            if ($schedule['examination_room_id']) {
                ExamSchedule::firstOrCreate(
                    [
                        'name' => $schedule['name'],
                        'exam_date' => $schedule['exam_date'],
                    ],
                    $schedule
                );
            }
        }

        $this->command->info('✅ Exam Schedules seeded successfully!');
    }
}
