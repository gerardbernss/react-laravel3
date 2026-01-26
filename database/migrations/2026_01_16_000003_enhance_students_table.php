<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('students', function (Blueprint $table) {
            // Add new columns to track enrollment through portal and application linking

            // Link to the application info for complete traceability
            $table->unsignedBigInteger('applicant_application_info_id')->nullable()->after('applicant_personal_data_id');

                                                                                                // Status tracking
            $table->string('enrollment_status')->default('Pending')->after('enrollment_date');  // Pending, Active, Inactive, Graduated, Dropped
            $table->dateTime('portal_enrollment_date')->nullable()->after('enrollment_status'); // When student enrolled via portal

            // Portal Information
            $table->string('portal_username')->nullable()->after('portal_enrollment_date');
            $table->boolean('portal_access_active')->default(false)->after('portal_username');

            // Academic tracking
            $table->string('current_year_level')->nullable()->after('portal_access_active');
            $table->string('current_semester')->nullable()->after('current_year_level');
            $table->string('current_school_year')->nullable()->after('current_semester');

            // Additional fields
            $table->text('remarks')->nullable()->after('current_school_year');

            // Foreign Key Constraint
            $table->foreign('applicant_application_info_id')
                ->references('id')
                ->on('applicant_application_info')
                ->onDelete('cascade');

            // Indexes
            $table->index('enrollment_status');
            $table->index('portal_access_active');
            $table->index('applicant_application_info_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->dropForeign(['applicant_application_info_id']);
            $table->dropIndex(['enrollment_status']);
            $table->dropIndex(['portal_access_active']);
            $table->dropIndex(['applicant_application_info_id']);

            $table->dropColumn([
                'applicant_application_info_id',
                'enrollment_status',
                'portal_enrollment_date',
                'portal_username',
                'portal_access_active',
                'current_year_level',
                'current_semester',
                'current_school_year',
                'remarks',
            ]);
        });
    }
};
