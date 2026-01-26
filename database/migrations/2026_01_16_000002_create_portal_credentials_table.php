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
        Schema::create('portal_credentials', function (Blueprint $table) {
            $table->id();

            // Foreign Keys
            $table->unsignedBigInteger('applicant_personal_data_id')->unique();
            $table->unsignedBigInteger('applicant_application_info_id')->nullable();

            // Portal Access Information
            $table->string('username')->unique();
            $table->string('temporary_password');                // Initial temporary password
            $table->boolean('password_changed')->default(false); // Flag to track if user changed password
            $table->string('access_status')->default('Active');  // Active, Inactive, Suspended

            // Credential Generation/Send Information
            $table->dateTime('credentials_sent_at')->nullable();
            $table->dateTime('credentials_generated_at')->nullable();
            $table->string('sent_via')->nullable(); // Email, SMS, Both

            // Portal Access Tracking
            $table->dateTime('first_login_at')->nullable();
            $table->dateTime('last_login_at')->nullable();
            $table->integer('login_attempts')->default(0);

            // Additional Information
            $table->text('remarks')->nullable();
            $table->string('created_by')->nullable(); // Admin who created credentials

            $table->timestamps();

            // Foreign Key Constraints
            $table->foreign('applicant_personal_data_id')
                ->references('id')
                ->on('applicant_personal_data')
                ->onDelete('cascade');

            $table->foreign('applicant_application_info_id')
                ->references('id')
                ->on('applicant_application_info')
                ->onDelete('set null');

            // Indexes
            $table->index('applicant_personal_data_id');
            $table->index('username');
            $table->index('access_status');
            $table->index('credentials_sent_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('portal_credentials');
    }
};
