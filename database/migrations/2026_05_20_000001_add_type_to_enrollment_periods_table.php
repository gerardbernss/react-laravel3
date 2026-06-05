<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('enrollment_periods', function (Blueprint $table) {
            $table->enum('type', ['student', 'applicant'])->default('applicant')->after('semester');

            $table->dropUnique(['school_year', 'semester']);
            $table->unique(['school_year', 'semester', 'type']);
        });
    }

    public function down(): void
    {
        Schema::table('enrollment_periods', function (Blueprint $table) {
            $table->dropUnique(['school_year', 'semester', 'type']);
            $table->dropColumn('type');
            $table->unique(['school_year', 'semester']);
        });
    }
};
