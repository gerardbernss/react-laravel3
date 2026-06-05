<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('enrollment_periods', function (Blueprint $table) {
            $table->string('type', 20)->default('applicant')->change();
        });
    }

    public function down(): void
    {
        Schema::table('enrollment_periods', function (Blueprint $table) {
            $table->enum('type', ['student', 'applicant'])->default('applicant')->change();
        });
    }
};
