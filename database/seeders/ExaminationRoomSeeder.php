<?php

namespace Database\Seeders;

use App\Models\ExaminationRoom;
use Illuminate\Database\Seeder;

class ExaminationRoomSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $rooms = [
            // Main Building
            [
                'name' => 'Room 101',
                'building' => 'Main Building',
                'floor' => '1st Floor',
                'capacity' => 40,
                'is_active' => true,
            ],
            [
                'name' => 'Room 102',
                'building' => 'Main Building',
                'floor' => '1st Floor',
                'capacity' => 40,
                'is_active' => true,
            ],
            [
                'name' => 'Room 201',
                'building' => 'Main Building',
                'floor' => '2nd Floor',
                'capacity' => 35,
                'is_active' => true,
            ],
            [
                'name' => 'Room 202',
                'building' => 'Main Building',
                'floor' => '2nd Floor',
                'capacity' => 35,
                'is_active' => true,
            ],
            [
                'name' => 'Room 301',
                'building' => 'Main Building',
                'floor' => '3rd Floor',
                'capacity' => 50,
                'is_active' => true,
            ],

            // Science Building
            [
                'name' => 'Science Lab A',
                'building' => 'Science Building',
                'floor' => '1st Floor',
                'capacity' => 30,
                'is_active' => true,
            ],
            [
                'name' => 'Science Lab B',
                'building' => 'Science Building',
                'floor' => '1st Floor',
                'capacity' => 30,
                'is_active' => true,
            ],
            [
                'name' => 'Lecture Hall 1',
                'building' => 'Science Building',
                'floor' => '2nd Floor',
                'capacity' => 100,
                'is_active' => true,
            ],

            // Gymnasium
            [
                'name' => 'Gymnasium Hall',
                'building' => 'Gymnasium',
                'floor' => 'Ground Floor',
                'capacity' => 200,
                'is_active' => true,
            ],

            // Library Building
            [
                'name' => 'Library AVR',
                'building' => 'Library Building',
                'floor' => '3rd Floor',
                'capacity' => 60,
                'is_active' => true,
            ],

            // Elementary Building
            [
                'name' => 'Elementary Room A1',
                'building' => 'Elementary Building',
                'floor' => '1st Floor',
                'capacity' => 30,
                'is_active' => true,
            ],
            [
                'name' => 'Elementary Room A2',
                'building' => 'Elementary Building',
                'floor' => '1st Floor',
                'capacity' => 30,
                'is_active' => true,
            ],
        ];

        foreach ($rooms as $room) {
            ExaminationRoom::firstOrCreate(
                ['name' => $room['name'], 'building' => $room['building']],
                $room
            );
        }

        $this->command->info('✅ Examination Rooms seeded successfully!');
    }
}
