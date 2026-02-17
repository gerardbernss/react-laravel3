<?php

namespace Tests\Feature;

use App\Models\ApplicantApplicationInfo;
use App\Models\ApplicantPersonalData;
use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ApplicantIndexTest extends TestCase
{
    use RefreshDatabase;

    public function test_applicants_index_returns_correct_data()
    {
        $this->withoutVite();
        // Create a user with necessary permissions
        $user = User::factory()->create();
        $role = Role::create(['name' => 'admin', 'slug' => 'admin']);
        $permission = Permission::create(['name' => 'manage-applications', 'slug' => 'manage-applications']);
        $role->givePermissionTo($permission);
        $user->roles()->attach($role);

        // Create some applicants
        $personalData = ApplicantPersonalData::create([
            'last_name' => 'Doe',
            'first_name' => 'John',
            'email' => 'john@example.com',
            'gender' => 'Male',
            'citizenship' => 'Filipino',
            'religion' => 'Catholic',
            'date_of_birth' => '2000-01-01',
            'place_of_birth' => 'Manila',
            'alt_email' => 'john.alt@example.com',
            'mobile_number' => '09123456789',
            'present_brgy' => 'Brgy 1',
            'present_city' => 'City 1',
            'present_province' => 'Province 1',
            'present_zip' => '1234',
            'permanent_brgy' => 'Brgy 1',
            'permanent_city' => 'City 1',
            'permanent_province' => 'Province 1',
            'permanent_zip' => '1234',
        ]);

        ApplicantApplicationInfo::forceCreate([
            'applicant_personal_data_id' => $personalData->id,
            'application_number' => 'E0001',
            'application_status' => 'Pending',
            'application_date' => now(),
            'year_level' => 'Grade 1',
            'school_year' => '2025-2026',
            'semester' => '1st',
            'student_category' => 'LES',
            'strand' => 'N/A',
            'classification' => 'New',
        ]);

        $response = $this->actingAs($user)->get('/admissions/applicants');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Admissions/Index')
            ->has('applications', 1)
            ->where('applications.0.first_name', 'John')
            ->where('applications.0.last_name', 'Doe')
            ->where('applications.0.application_number', 'E0001')
        );
    }
}
