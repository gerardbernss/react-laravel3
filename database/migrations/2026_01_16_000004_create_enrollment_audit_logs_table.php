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
        Schema::create('enrollment_audit_logs', function (Blueprint $table) {
            $table->id();

            // Foreign Keys
            $table->unsignedBigInteger('student_id');
            $table->unsignedBigInteger('applicant_application_info_id')->nullable();

                                      // Audit Information
            $table->string('action'); // e.g., 'Credentials Sent', 'Portal Access Granted', 'Enrollment Completed', 'Status Updated'
            $table->string('previous_status')->nullable();
            $table->string('new_status')->nullable();
            $table->text('description')->nullable();

                                                        // User Information
            $table->string('performed_by')->nullable(); // Admin or system user
            $table->string('ip_address')->nullable();

            $table->timestamps();

            // Foreign Key Constraints
            $table->foreign('student_id')
                ->references('id')
                ->on('students')
                ->onDelete('cascade');

            $table->foreign('applicant_application_info_id')
                ->references('id')
                ->on('applicant_application_info')
                ->onDelete('set null');

            // Indexes
            $table->index('student_id');
            $table->index('action');
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('enrollment_audit_logs');
    }
};
