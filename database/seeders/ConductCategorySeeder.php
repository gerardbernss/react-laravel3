<?php

namespace Database\Seeders;

use App\Models\ConductCategory;
use Illuminate\Database\Seeder;

class ConductCategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            [
                'name'        => 'Personal Development',
                'description' => 'Self-management and personal growth indicators',
                'order'       => 1,
                'criteria' => [
                    ['name' => 'Punctuality',        'description' => 'Arrives on time and meets deadlines', 'max_score' => 100, 'order' => 1],
                    ['name' => 'Grooming & Hygiene', 'description' => 'Maintains proper uniform and personal hygiene', 'max_score' => 100, 'order' => 2],
                    ['name' => 'Self-Discipline',    'description' => 'Follows rules without requiring constant reminders', 'max_score' => 100, 'order' => 3],
                ],
            ],
            [
                'name'        => 'Social Skills',
                'description' => 'Interaction and cooperation with peers and teachers',
                'order'       => 2,
                'criteria' => [
                    ['name' => 'Respect for Authority', 'description' => 'Shows respect to teachers and school staff', 'max_score' => 100, 'order' => 1],
                    ['name' => 'Cooperation',           'description' => 'Works well with classmates in group activities', 'max_score' => 100, 'order' => 2],
                    ['name' => 'Courtesy & Politeness', 'description' => 'Uses polite language and considerate behavior', 'max_score' => 100, 'order' => 3],
                ],
            ],
            [
                'name'        => 'Academic Attitude',
                'description' => 'Engagement and responsibility toward learning',
                'order'       => 3,
                'criteria' => [
                    ['name' => 'Participation in Class',  'description' => 'Actively engages in discussions and activities', 'max_score' => 100, 'order' => 1],
                    ['name' => 'Submission of Work',      'description' => 'Submits assignments and projects on time', 'max_score' => 100, 'order' => 2],
                    ['name' => 'Honesty & Integrity',     'description' => 'Demonstrates academic honesty in all tasks', 'max_score' => 100, 'order' => 3],
                ],
            ],
            [
                'name'        => 'Citizenship',
                'description' => 'Contribution to the school community and environment',
                'order'       => 4,
                'criteria' => [
                    ['name' => 'Care for School Property', 'description' => 'Handles school facilities and equipment with care', 'max_score' => 100, 'order' => 1],
                    ['name' => 'Environmental Awareness',  'description' => 'Practices cleanliness and proper waste disposal', 'max_score' => 100, 'order' => 2],
                    ['name' => 'Community Involvement',    'description' => 'Participates in school programs and activities', 'max_score' => 100, 'order' => 3],
                ],
            ],
        ];

        foreach ($categories as $catData) {
            $criteria = $catData['criteria'];
            unset($catData['criteria']);

            $category = ConductCategory::firstOrCreate(
                ['name' => $catData['name']],
                $catData + ['is_active' => true]
            );

            foreach ($criteria as $c) {
                $category->criteria()->firstOrCreate(
                    ['name' => $c['name']],
                    $c
                );
            }
        }
    }
}
