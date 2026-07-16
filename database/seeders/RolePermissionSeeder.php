<?php

namespace Database\Seeders;

use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class RolePermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create permissions
        $permissions = [
            // User permissions
            ['name' => 'View Users', 'slug' => 'view-users', 'description' => 'Can view users list'],
            ['name' => 'Create Users', 'slug' => 'create-users', 'description' => 'Can create new users'],
            ['name' => 'Update Users', 'slug' => 'update-users', 'description' => 'Can update user information'],
            ['name' => 'Delete Users', 'slug' => 'delete-users', 'description' => 'Can delete users'],
            ['name' => 'Assign Roles', 'slug' => 'assign-roles', 'description' => 'Can assign roles to users'],
            ['name' => 'Remove Roles', 'slug' => 'remove-roles', 'description' => 'Can remove roles from users'],

            // Role permissions
            ['name' => 'View Roles', 'slug' => 'view-roles', 'description' => 'Can view roles list'],
            ['name' => 'Create Roles', 'slug' => 'create-roles', 'description' => 'Can create new roles'],
            ['name' => 'Update Roles', 'slug' => 'update-roles', 'description' => 'Can update role information'],
            ['name' => 'Delete Roles', 'slug' => 'delete-roles', 'description' => 'Can delete roles'],
            ['name' => 'Assign Permissions', 'slug' => 'assign-permissions', 'description' => 'Can assign permissions to roles'],
            ['name' => 'Remove Permissions', 'slug' => 'remove-permissions', 'description' => 'Can remove permissions from roles'],

            // Permission permissions
            ['name' => 'View Permissions', 'slug' => 'view-permissions', 'description' => 'Can view permissions list'],
            ['name' => 'Create Permissions', 'slug' => 'create-permissions', 'description' => 'Can create new permissions'],
            ['name' => 'Update Permissions', 'slug' => 'update-permissions', 'description' => 'Can update permission information'],
            ['name' => 'Delete Permissions', 'slug' => 'delete-permissions', 'description' => 'Can delete permissions'],

            // System permissions
            ['name' => 'View Settings', 'slug' => 'view-settings', 'description' => 'Can view system settings'],
            ['name' => 'Manage Settings', 'slug' => 'manage-settings', 'description' => 'Can manage system settings'],

            // Grade permissions
            ['name' => 'View Grades', 'slug' => 'view-grades', 'description' => 'Can view student grades'],
            ['name' => 'Manage Grades', 'slug' => 'manage-grades', 'description' => 'Can enter and edit student grades'],

            // Attendance permissions
            ['name' => 'View Attendance', 'slug' => 'view-attendance', 'description' => 'Can view attendance records'],
            ['name' => 'Manage Attendance', 'slug' => 'manage-attendance', 'description' => 'Can mark and edit attendance'],

            // Grade validation permissions
            ['name' => 'Submit Grades', 'slug' => 'submit-grades', 'description' => 'Can submit grades for validation'],
            ['name' => 'Finalize Grades', 'slug' => 'finalize-grades', 'description' => 'Can finalize/approve submitted grades'],

            // Conduct permissions
            ['name' => 'Manage Conduct', 'slug' => 'manage-conduct', 'description' => 'Can manage conduct categories and criteria'],
            ['name' => 'Manage Conduct Grades', 'slug' => 'manage-conduct-grades', 'description' => 'Can enter conduct grades for students'],

            // Admissions permissions
            ['name' => 'Manage Exam Results', 'slug' => 'manage-exam-results', 'description' => 'Can upload and view applicant exam results'],
            ['name' => 'Manage Applications', 'slug' => 'manage-applications', 'description' => 'Can manage applicant admissions records'],
            ['name' => 'Manage Student ID Assignment', 'slug' => 'manage-student-id-assignment', 'description' => 'Can assign and email student IDs to enrolled applicants'],
            ['name' => 'Manage Portal Credentials', 'slug' => 'manage-portal-credentials', 'description' => 'Can generate, send, suspend, and reactivate student portal login credentials'],

            // Employee permissions
            ['name' => 'Manage Employees', 'slug' => 'manage-employees', 'description' => 'Can create and manage employee records'],

            // Academic structure & operations permissions (previously unprotected admin routes)
            ['name' => 'Manage Academic Structure', 'slug' => 'manage-academic-structure', 'description' => 'Can manage subjects, subject schedules, block sections, and programs'],
            ['name' => 'Manage Students', 'slug' => 'manage-students', 'description' => 'Can create, update, and withdraw student records'],
            ['name' => 'Manage Enrollment Periods', 'slug' => 'manage-enrollment-periods', 'description' => 'Can open, close, and configure enrollment periods'],
            ['name' => 'Manage Examinations', 'slug' => 'manage-examinations', 'description' => 'Can manage examination rooms, exam schedules, and applicant exam assignments'],
            ['name' => 'Manage Finance', 'slug' => 'manage-finance', 'description' => 'Can manage fees, discount types, semester periods, and student fee assessments/payments'],
            ['name' => 'Manage Announcements', 'slug' => 'manage-announcements', 'description' => 'Can create and manage announcements'],
            ['name' => 'Manage Enrollment', 'slug' => 'manage-enrollment', 'description' => 'Can access the staff enrollment dashboard and enroll, withdraw, or revert applicants'],
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['slug' => $permission['slug']], $permission);
        }

        // Create roles
        $superAdminRole = Role::firstOrCreate(['slug' => 'super-admin'], [
            'name' => 'Super Admin',
            'slug' => 'super-admin',
            'description' => 'Full system access with all permissions',
            'is_active' => true,
        ]);

        $adminRole = Role::firstOrCreate(['slug' => 'admin'], [
            'name' => 'Admin',
            'slug' => 'admin',
            'description' => 'Administrative access to manage users and roles',
            'is_active' => true,
        ]);

        $userRole = Role::firstOrCreate(['slug' => 'user'], [
            'name' => 'User',
            'slug' => 'user',
            'description' => 'Basic user access',
            'is_active' => true,
        ]);

        $facultyRole = Role::updateOrCreate(['slug' => 'faculty'], [
            'name' => 'Teacher',
            'slug' => 'faculty',
            'description' => 'Teacher - can manage grades and attendance',
            'is_active' => true,
        ]);

        // Assign all permissions to super admin
        $superAdminRole->syncPermissions(Permission::all()->pluck('id')->toArray());

        // Assign user, role, and permission management permissions to admin
        $adminPermissions = Permission::whereIn('slug', [
            'view-users', 'create-users', 'update-users', 'delete-users',
            'view-roles', 'create-roles', 'update-roles', 'delete-roles',
            'view-permissions', 'create-permissions', 'update-permissions', 'delete-permissions',
            'assign-roles', 'remove-roles', 'assign-permissions', 'remove-permissions',
        ], 'and', false)->pluck('id')->toArray();
        $adminRole->syncPermissions($adminPermissions);

        // Assign basic permissions to user role
        $userPermissions = Permission::whereIn('slug', [
            'view-users', 'view-roles', 'view-permissions',
        ], 'and', false)->pluck('id')->toArray();
        $userRole->syncPermissions($userPermissions);

        // Assign grade and attendance permissions to faculty role
        // Note: 'manage-conduct-grades' is intentionally excluded — conduct entry is admin/adviser only
        $facultyPermissions = Permission::whereIn('slug', [
            'view-grades', 'manage-grades',
            'view-attendance', 'manage-attendance',
            'submit-grades',
        ], 'and', false)->pluck('id')->toArray();
        $facultyRole->syncPermissions($facultyPermissions);

        // Give admin finalize-grades, manage-conduct, manage-conduct-grades, manage-exam-results, and admissions extras
        $adminExtraPermissions = Permission::whereIn('slug', [
            'view-grades', 'manage-grades',
            'view-attendance', 'manage-attendance',
            'finalize-grades',
            'manage-conduct',
            'manage-conduct-grades',
            'manage-exam-results',
            'manage-applications',
            'manage-student-id-assignment',
            'manage-employees',
            'manage-portal-credentials',
            'manage-academic-structure',
            'manage-students',
            'manage-enrollment-periods',
            'manage-examinations',
            'manage-finance',
            'manage-announcements',
            'manage-enrollment',
        ], 'and', false)->pluck('id')->toArray();
        $adminRole->syncPermissions(array_unique(array_merge($adminPermissions, $adminExtraPermissions)));

        // Create a super admin user
        $superAdmin = User::firstOrCreate(['email' => 'admin@example.com'], [
            'name' => 'Super Admin',
            'email' => 'admin@example.com',
            'password' => Hash::make('password'),
            'email_verified_at' => now(),
        ]);

        // Assign super admin role to the user
        if (! $superAdmin->hasRole('super-admin')) {
            $superAdmin->assignRole($superAdminRole);
        }

        // Create a regular admin user
        $admin = User::firstOrCreate(['email' => 'admin.user@example.com'], [
            'name' => 'Admin User',
            'email' => 'admin.user@example.com',
            'password' => Hash::make('password'),
            'email_verified_at' => now(),
        ]);

        // Assign admin role to the user
        if (! $admin->hasRole('admin')) {
            $admin->assignRole($adminRole);
        }

        // Create a regular user
        $user = User::firstOrCreate(['email' => 'user@example.com'], [
            'name' => 'Regular User',
            'email' => 'user@example.com',
            'password' => Hash::make('password'),
            'email_verified_at' => now(),
        ]);

        // Assign user role to the user
        if (! $user->hasRole('user')) {
            $user->assignRole($userRole);
        }

        // Create a teacher user
        $teacher = User::firstOrCreate(['email' => 'teacher@example.com'], [
            'name' => 'Teacher User',
            'email' => 'teacher@example.com',
            'password' => Hash::make('password'),
            'email_verified_at' => now(),
        ]);

        // Assign teacher (faculty) role to the user
        if (! $teacher->hasRole('faculty')) {
            $teacher->assignRole($facultyRole);
        }

        $this->command->info('Roles, permissions, and users created successfully!');
        $this->command->info('Super Admin: admin@example.com / password');
        $this->command->info('Admin User: admin.user@example.com / password');
        $this->command->info('Regular User: user@example.com / password');
        $this->command->info('Teacher: teacher@example.com / password');
    }
}
