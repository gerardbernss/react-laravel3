<?php

namespace Database\Seeders;

use App\Models\BlockSection;
use App\Models\GradeComponent;
use App\Models\User;
use Illuminate\Database\Seeder;

class GradeComponentSeeder extends Seeder
{
    public function run(): void
    {
        $adminId = User::first()?->id ?? 1;

        // DepEd K-12 standard component sets by subject type
        // Written Work 25% | Performance Task 50% | Quarterly Assessment 25%
        $componentTemplates = [
            'default' => [
                ['name' => 'Written Work 1',          'hps' => 20,  'weight' => 5],
                ['name' => 'Written Work 2',          'hps' => 20,  'weight' => 5],
                ['name' => 'Written Work 3',          'hps' => 20,  'weight' => 5],
                ['name' => 'Written Work 4',          'hps' => 20,  'weight' => 5],
                ['name' => 'Written Work 5',          'hps' => 20,  'weight' => 5],
                ['name' => 'Performance Task 1',      'hps' => 50,  'weight' => 15],
                ['name' => 'Performance Task 2',      'hps' => 50,  'weight' => 15],
                ['name' => 'Performance Task 3',      'hps' => 50,  'weight' => 20],
                ['name' => 'Quarterly Assessment',    'hps' => 100, 'weight' => 25],
            ],
            'pe' => [
                ['name' => 'Written Work 1',          'hps' => 30,  'weight' => 10],
                ['name' => 'Written Work 2',          'hps' => 30,  'weight' => 15],
                ['name' => 'Performance Task 1',      'hps' => 50,  'weight' => 20],
                ['name' => 'Performance Task 2',      'hps' => 50,  'weight' => 30],
                ['name' => 'Quarterly Assessment',    'hps' => 100, 'weight' => 25],
            ],
        ];

        $sections = BlockSection::with('subjects')->get();
        $quarters = ['Q1', 'Q2', 'Q3', 'Q4'];

        foreach ($sections as $section) {
            foreach ($section->subjects as $subject) {
                $template = strtoupper($subject->code) === 'PE-1'
                    ? $componentTemplates['pe']
                    : $componentTemplates['default'];

                foreach ($quarters as $quarter) {
                    // Skip if already seeded
                    $exists = GradeComponent::where('subject_id', $subject->id)
                        ->where('block_section_id', $section->id)
                        ->where('grading_quarter', $quarter)
                        ->exists();

                    if ($exists) {
                        continue;
                    }

                    foreach ($template as $order => $comp) {
                        GradeComponent::create([
                            'subject_id'       => $subject->id,
                            'block_section_id' => $section->id,
                            'grading_quarter'  => $quarter,
                            'name'             => $comp['name'],
                            'hps'              => $comp['hps'],
                            'weight'           => $comp['weight'],
                            'order'            => $order + 1,
                            'school_year'      => $section->school_year,
                            'created_by'       => $adminId,
                        ]);
                    }
                }
            }
        }

        $this->command->info('Grade components seeded for ' . $sections->count() . ' sections.');
    }
}
