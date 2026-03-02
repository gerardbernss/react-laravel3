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
        Schema::table('applicant_siblings', function (Blueprint $table) {
            $table->foreignId('linked_student_id')->nullable()->constrained('students')->nullOnDelete();
            $table->boolean('is_enrolled_sibling')->default(false);
            $table->foreignId('verified_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('verified_at')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('applicant_siblings', function (Blueprint $table) {
            $table->dropForeign(['linked_student_id']);
            $table->dropForeign(['verified_by']);
            $table->dropColumn(['linked_student_id', 'is_enrolled_sibling', 'verified_by', 'verified_at']);
        });
    }
};
